# FLUXEER

## 1. Visão geral da arquitetura

O Fluxeer é um SaaS multi-tenant de cobrança, gestão de recebíveis, comunicação com clientes e acompanhamento operacional. A base técnica é um monólito Next.js com App Router, Server Components, Client Components, Server Actions e Route Handlers. A arquitetura real está espalhada principalmente entre `src/app/**`, `src/actions/**`, `src/lib/**`, `src/services/**`, `auth.ts`, `auth.config.ts` e `prisma/schema.prisma`.

### Tipo de sistema

- SaaS B2B multi-tenant para cobrança e recuperação de recebíveis.
- Monólito web com backend embutido no runtime do Next.js.
- Banco relacional PostgreSQL acessado por Prisma.
- Integrações externas para autenticação, billing e mensageria.

### Fluxo macro do app

- O usuário autentica via credenciais ou Google em `auth.ts` e `auth.config.ts`.
- A sessão JWT é enriquecida com `user.id`, `tenantId`, `role`, `isSuperAdmin` e `mfaEnabled` em `auth.ts`.
- As páginas protegidas do dashboard passam por `middleware.ts`, `src/app/(dashboard)/layout.tsx` e `src/lib/safe-auth.ts`.
- As telas do App Router chamam Server Actions diretamente, por exemplo `src/app/(dashboard)/cobrancas/page.tsx` chamando `src/actions/invoices.ts`.
- As Server Actions leem ou escrevem no PostgreSQL via `src/lib/prisma.ts` e `prisma/schema.prisma`.
- As integrações máquina-a-máquina entram por Route Handlers em `src/app/api/**`.
- Eventos assíncronos de entrega e billing retornam ao app por webhooks em `src/app/api/webhooks/**`.

### App Router, SSR, Server Actions, APIs, webhooks, jobs, auth e billing

- O App Router organiza áreas de auth em `src/app/(auth)/**`, dashboard em `src/app/(dashboard)/**`, onboarding em `src/app/onboarding/**` e superadmin em `src/app/superadmin/**`.
- O padrão predominante é server-first: páginas como `src/app/(dashboard)/page.tsx`, `src/app/(dashboard)/clientes/page.tsx` e `src/app/(dashboard)/planos/page.tsx` buscam dados no servidor e entregam para componentes client.
- Client Components chamam Server Actions diretamente para mutações e refetchs. Exemplos claros estão em `src/app/(dashboard)/cobrancas/ReceivablesClient.tsx`, `src/app/(dashboard)/comunicacoes/CommunicationsClient.tsx` e `src/app/(dashboard)/configuracoes/TeamClient.tsx`.
- As APIs públicas ou internas ficam em `src/app/api/**`. Os principais papéis são:
- `src/app/api/auth/[...nextauth]/route.ts`: endpoint oficial do Auth.js, incluindo o fluxo correto de `signIn('google')`.
- `src/app/api/activate/route.ts`: ativação de conta por token.
- `src/app/api/forecast/route.ts`, `src/app/api/reports/route.ts`, `src/app/api/risk-score/route.ts`: APIs para consumo programático de relatórios e análises.
- `src/app/api/cron/route.ts` e `src/app/api/send-queue/route.ts`: endpoints internos para rotinas operacionais protegidas por segredo.
- `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/resend/route.ts`, `src/app/api/webhooks/whatsapp/route.ts`: sincronização de eventos externos.
- O billing é modelado no próprio `Tenant` em `prisma/schema.prisma` e orquestrado por `src/lib/billing/stripe.ts`, `src/lib/billing/plans.ts`, `src/lib/billing/limits.ts` e `src/actions/billing.ts`.
- A autenticação usa Auth.js v5 beta em `auth.ts`, com provider de credenciais, Google OAuth e um provider especial `activation-token` para ativação de conta.
- MFA TOTP é tratado em `src/actions/mfa.actions.ts`, com segredo criptografado por `src/lib/crypto.ts`.

### Como o multi-tenant funciona

- O tenant é a unidade de isolamento principal, modelado em `Tenant` e relacionado a usuários por `TenantUser` em `prisma/schema.prisma`.
- Quase todas as entidades de domínio carregam `tenantId`: `Customer`, `Invoice`, `BillingFlow`, `Communication`, `CommunicationLog`, `PaymentPromise`, `Task`, `ActivityLog`, `MessageQueue`.
- O `tenantId` entra na sessão JWT em `auth.ts` e é exigido por helpers como `src/lib/safe-auth.ts` e `src/lib/permissions.ts`.
- O padrão dominante de isolamento é filtrar por `tenantId` nas queries. Exemplos: `src/actions/customers.ts`, `src/actions/invoices.ts`, `src/actions/history.ts`, `src/actions/tasks.ts`.
- Há testes explícitos de isolamento em `src/lib/__tests__/multi-tenant-isolation.test.ts`.

### Como o front conversa com o backend

- Fluxo predominante: página server renderiza, chama Server Action, entrega props iniciais a um Client Component, e o Client Component segue chamando Server Actions para filtros e mutações.
- Exemplos:
- `src/app/(dashboard)/cobrancas/page.tsx` chama `getFilteredInvoices()` e entrega dados para `ReceivablesClient.tsx`.
- `src/app/(dashboard)/planos/page.tsx` monta o snapshot de billing no servidor e passa para `PlanosClient.tsx`.
- `src/app/(dashboard)/comunicacoes/CommunicationsClient.tsx` usa `getCommunicationLogs`, `markLogSent`, `markLogSkipped` e `triggerCollectionLogs` diretamente.
- Fluxo secundário: APIs REST internas para integração ou consumo externo, como `GET /api/reports`, `GET /api/forecast` e `GET /api/risk-score`.

### Como o banco participa

- O banco é a fonte de verdade operacional e não apenas persistência passiva.
- O PostgreSQL guarda domínio, auth complementar, billing, auditoria, rate limit distribuído, fila de mensagens e idempotência de webhook.
- Exemplos diretos:
- `RateLimit` implementa rate limiting multi-instância em `src/lib/api-rate-limiter.ts`.
- `MessageQueue` e `Communication` sustentam fila e status de entrega em `src/lib/queue.ts`.
- `StripeEvent` garante idempotência de webhook em `src/app/api/webhooks/stripe/route.ts`.
- `ActivityLog` guarda trilha de auditoria em `src/lib/audit.ts`.

### Como serviços externos entram na arquitetura

- Google OAuth entra pelo provider `Google` em `auth.ts`.
- Stripe entra por `src/lib/stripe.ts`, `src/lib/billing/stripe.ts`, `src/actions/billing.ts` e webhook em `src/app/api/webhooks/stripe/route.ts`.
- Resend entra por `src/lib/messaging/email.ts` e webhook em `src/app/api/webhooks/resend/route.ts`.
- WhatsApp entra por `src/lib/messaging/whatsapp.ts` e webhook em `src/app/api/webhooks/whatsapp/route.ts`.
- A verificação do webhook da Resend usa Svix via `src/lib/webhookVerify.ts`.
- Não existe fila externa dedicada encontrada no código. O app usa a tabela `MessageQueue` como fila persistida.

### Observações arquiteturais importantes

- Existem dois fluxos de comunicação coexistindo no código:
- Fluxo manual por `CommunicationLog`, `src/services/communication/communicationService.ts` e `src/actions/communicationLog.actions.ts`.
- Fluxo de envio real por `Communication`, `MessageQueue`, `src/lib/queue.ts`, `src/app/api/cron/route.ts` e webhooks de entrega.
- Não foi encontrada configuração de scheduler em `vercel.json` ou workflow para disparar `/api/cron` e `/api/send-queue`. O código pressupõe um agendador externo, mas o horário não está explicitado no repositório.

## 2. Stack tecnológico completo

| Categoria | Tecnologia | Papel arquitetural | Evidência principal |
| --- | --- | --- | --- |
| Framework web | Next.js 16.2.3 | Runtime full-stack, App Router, SSR, Route Handlers, Server Actions | `package.json`, `src/app/**` |
| UI | React 19.2.4 | Server e Client Components | `package.json`, `src/app/**`, `src/components/**` |
| Linguagem | TypeScript 5 | Tipagem do monólito | `package.json`, `tsconfig.json` |
| Estilo | Tailwind CSS 4 + `@tailwindcss/postcss` | Estilo utilitário | `package.json`, `postcss.config.mjs` |
| Componentização | Radix Slot/Icon, CVA, `tailwind-merge`, `lucide-react`, `framer-motion` | Base de componentes e interações | `package.json`, `src/components/ui/**` |
| ORM | Prisma 6.4.1 | Acesso ao PostgreSQL e modelagem do domínio | `package.json`, `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Banco | PostgreSQL | Persistência principal | `prisma/schema.prisma`, `docker-compose.yml` |
| Autenticação | Auth.js / NextAuth v5 beta | Sessão JWT, credenciais, Google, callbacks e guards | `auth.ts`, `auth.config.ts`, `src/types/next-auth.d.ts` |
| MFA | `otplib`, `qrcode`, AES-GCM caseiro | TOTP para admins e superadmin | `src/actions/mfa.actions.ts`, `src/lib/crypto.ts` |
| Billing | Stripe SDK | Checkout, portal, sincronização de assinatura e webhooks | `src/lib/billing/stripe.ts`, `src/lib/stripe.ts`, `src/actions/billing.ts` |
| Email | Resend | Envio transacional e feedback de entrega | `src/lib/messaging/email.ts`, `src/app/api/webhooks/resend/route.ts` |
| WhatsApp | Meta WhatsApp Cloud API | Envio de texto/template e webhook de status | `src/lib/messaging/whatsapp.ts`, `src/app/api/webhooks/whatsapp/route.ts` |
| Fila / jobs | Fila própria em tabela `MessageQueue` | Retry, backoff, DLQ, fallback de canal | `prisma/schema.prisma`, `src/lib/queue.ts`, `src/app/api/send-queue/route.ts` |
| Rate limit | Tabela `RateLimit` via Prisma | Rate limiting distribuído entre instâncias | `prisma/schema.prisma`, `src/lib/api-rate-limiter.ts` |
| Auditoria | Tabela `ActivityLog` | Trilha auditável de ações críticas | `prisma/schema.prisma`, `src/lib/audit.ts` |
| Testes unitários / integração | Vitest + jsdom + Testing Library | Testes de lógica, auth, permissões, webhooks e ações | `vitest.config.ts`, `src/lib/__tests__/**`, `src/app/api/**/*.test.ts` |
| Testes E2E | Playwright | Fluxos de billing no browser | `playwright.config.ts`, `e2e/billing.spec.ts` |
| Lint | ESLint 9 + `eslint-config-next` | Regras de qualidade | `eslint.config.mjs` |
| CI | GitHub Actions | Lint, test, build e audit | `.github/workflows/ci.yml` |
| Deploy | Vercel + suporte a Docker | Deploy Next.js e imagem container opcional | `vercel.json`, `Dockerfile`, `docker-compose.yml` |
| Observabilidade mínima | `deployment-debug`, logs em console, `GET /api/health` | Diagnóstico básico de runtime | `src/lib/deployment-debug.ts`, `src/app/api/health/route.ts` |

## 3. Todas as variáveis de ambiente

Observação: a tabela abaixo cobre as variáveis de ambiente de aplicação e de integração efetivamente relevantes para o Fluxeer. Variáveis puramente de plataforma encontradas em `.env.production*`, como `VERCEL_*`, `NX_DAEMON` e `TURBO_*`, não foram encontradas no código do app e não mudam a arquitetura funcional do sistema.

| Variável | Obrigatória | Ambientes | Onde usada | Finalidade | Observações |
| --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | Sim | dev, preview, prod, CI | `prisma/schema.prisma`, `src/lib/prisma.ts`, `src/lib/deployment-debug.ts` | Conexão principal com PostgreSQL | Sem ela o app não sobe corretamente e Prisma falha. |
| `AUTH_SECRET` | Sim | dev, preview, prod, CI | `src/lib/safe-auth.ts`, Auth.js em runtime | Segredo principal de sessão/Auth.js | O código depende desta variável; `NEXTAUTH_SECRET` aparece em `.env*`, mas não foi encontrada no código do app. |
| `NEXTAUTH_SECRET` | Não encontrada no código | `.env`, `.env.production`, `.env.production.local` | Não encontrada no código | Legado ou duplicata de segredo de auth | Deve ser tratada como risco de ambiguidade com `AUTH_SECRET`. |
| `AUTH_GOOGLE_ID` | Condicional | dev, preview, prod | `auth.ts` | Client ID do Google OAuth | Necessária apenas para login Google. |
| `AUTH_GOOGLE_SECRET` | Condicional | dev, preview, prod | `auth.ts` | Client secret do Google OAuth | Necessária apenas para login Google. |
| `SUPER_ADMIN_EMAILS` | Condicional | preview, prod | `auth.ts`, `.env.production.local` | Lista de e-mails que recebem `isSuperAdmin` | Se ausente, a área `/superadmin` fica inacessível. |
| `MFA_SECRET_KEY` | Condicional, mas prática obrigatória para admin com MFA | dev, preview, prod, CI | `src/actions/mfa.actions.ts`, `src/lib/crypto.ts` | Assinatura de cookie MFA e criptografia do segredo TOTP | Sem ela o fluxo de MFA quebra. |
| `NEXT_PUBLIC_APP_URL` | Condicional, fortemente recomendada | dev, preview, prod, E2E | `src/actions/auth.ts`, `src/actions/auth.actions.ts`, `src/lib/billing/stripe.ts`, `src/lib/messaging/email.ts`, `playwright.config.ts` | Base URL para links de ativação, reset e Stripe | Quando falta, vários fluxos caem no fallback `https://fluxeer.com.br`. |
| `RESEND_API_KEY` | Condicional | dev, preview, prod | `src/lib/messaging/email.ts`, `scripts/test-resend.ts` | Habilita envio real de e-mail | Se faltar, `sendEmail()` falha de forma graciosa e não envia. |
| `RESEND_FROM_EMAIL` | Não | dev, preview, prod | `src/lib/messaging/email.ts`, `src/actions/auth.ts`, `scripts/test-resend.ts` | Remetente padrão do pipeline genérico de e-mail | Sem ela o fallback genérico é `noreply@fluxo.app`. |
| `RESEND_AUTH_FROM_EMAIL` | Não | dev, preview, prod | `src/lib/messaging/email.ts` | Remetente específico dos e-mails de auth | Se faltar, o fallback é `no-reply@fluxeer.com.br`. |
| `WEBHOOK_SECRET_RESEND` | Condicional | preview, prod | `src/lib/webhookVerify.ts`, `src/app/api/webhooks/resend/route.ts` | Verificação Svix do webhook da Resend | Sem ela o webhook falha fechado. |
| `WHATSAPP_ACCESS_TOKEN` | Condicional | preview, prod | `src/lib/messaging/whatsapp.ts` | Token da Meta Cloud API | Sem ela não há envio real de WhatsApp. |
| `WHATSAPP_PHONE_NUMBER_ID` | Condicional | preview, prod | `src/lib/messaging/whatsapp.ts` | Identificador do número da Meta Cloud API | Sem ela não há envio real de WhatsApp. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Condicional | preview, prod | `src/lib/webhookVerify.ts`, `src/app/api/webhooks/whatsapp/route.ts` | Challenge token do webhook Meta | Sem ela o GET de challenge é rejeitado. |
| `WHATSAPP_WEBHOOK_APP_SECRET` | Condicional | preview, prod | `src/lib/webhookVerify.ts`, `src/app/api/webhooks/whatsapp/route.ts` | Assinatura HMAC do webhook Meta | Sem ela o POST do webhook é rejeitado. |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Não encontrada em runtime | `.env*`, comentário em `src/lib/messaging/whatsapp.ts` | Comentário/documentação apenas | Documentação da conta Meta | Não foi encontrada leitura efetiva desta variável no código. |
| `COMMUNICATION_MODE` | Não | dev, preview, prod | `src/app/api/cron/route.ts`, `src/services/communication/communicationService.ts` | Alterna entre modo `manual` e tentativa de envio automático | O default é `manual`. |
| `CRON_SECRET` | Sim para jobs internos | preview, prod, testes internos | `src/lib/internalEndpointAuth.ts`, `src/app/api/send-queue/route.ts`, testes do cron/send-queue | Protege `/api/cron` e `/api/send-queue` | Sem ela os endpoints internos devolvem `503`. |
| `BASE_BACKOFF_MIN` | Não | dev, preview, prod | `src/lib/queue.ts` | Base em minutos para backoff exponencial da fila | Default em código: `5`. |
| `STUCK_THRESHOLD_MIN` | Não | dev, preview, prod | `src/lib/queue.ts` | Limite para considerar item preso em `sending` | Default em código: `10`. |
| `MSG_LIMIT_CUSTOMER_HOUR` | Não | dev, preview, prod | `src/lib/rateLimiter.ts` | Limite horário por cliente para envios | Default em código: `10`. |
| `MSG_LIMIT_CUSTOMER_DAY` | Não | dev, preview, prod | `src/lib/rateLimiter.ts` | Limite diário por cliente para envios | Default em código: `30`. |
| `MSG_LIMIT_TENANT_HOUR` | Não | dev, preview, prod | `src/lib/rateLimiter.ts` | Limite horário por tenant para burst | Default em código: `50`. |
| `MSG_LIMIT_TENANT_DAY` | Não | dev, preview, prod | `src/lib/rateLimiter.ts` | Limite diário por tenant para envios | Default em código: `200`. |
| `STRIPE_SECRET_KEY` | Condicional | preview, prod, CI | `src/lib/stripe.ts`, `src/lib/billing/stripe.ts` | Cliente Stripe server-side | Billing pago não funciona sem ela. |
| `STRIPE_WEBHOOK_SECRET` | Condicional | preview, prod, CI | `src/lib/stripe.ts`, `src/lib/billing/stripe.ts` | Verificação do webhook Stripe | Sem ela o webhook devolve `503` ou `401`. |
| `STRIPE_PRICE_ID_PRO_MONTHLY` | Sim para billing pago | preview, prod, CI | `src/lib/billing/stripe.ts` | Price ID mensal do plano Pro | Faz parte do conjunto mínimo requerido por `getStripeBillingConfiguration()`. |
| `STRIPE_PRICE_ID_SCALE_MONTHLY` | Sim para billing pago | preview, prod, CI | `src/lib/billing/stripe.ts` | Price ID mensal do plano Scale | Faz parte do conjunto mínimo requerido por `getStripeBillingConfiguration()`. |
| `STRIPE_PRICE_ID_PRO_YEARLY` | Condicional | preview, prod | `src/lib/billing/stripe.ts` | Price ID anual do Pro | Necessária apenas se a UI/negócio usar ciclo anual do Pro. |
| `STRIPE_PRICE_ID_SCALE_YEARLY` | Condicional | preview, prod | `src/lib/billing/stripe.ts` | Price ID anual do Scale | Necessária apenas se a UI/negócio usar ciclo anual do Scale. |
| `STRIPE_PRICE_ID_PRO_LAUNCH` | Condicional | preview, prod | `src/lib/billing/stripe.ts` | Price ID privado de lançamento do Pro | O código suporta lookup, mas esse ciclo não é exposto por padrão na UI. |
| `STRIPE_PRICE_ID_SCALE_LAUNCH` | Condicional | preview, prod | `src/lib/billing/stripe.ts` | Price ID privado de lançamento do Scale | Mesmo comportamento do `launch` acima. |
| `E2E_BILLING_MOCKS` | Não | teste / E2E | `src/lib/e2e-billing.ts`, `playwright.config.ts` | Ativa fixtures fake de billing por cookie | Não deve estar ligado em produção. |
| `CI` | Não | CI | `playwright.config.ts` | Ajusta reuso do web server no Playwright | Variável de pipeline. |
| `WEBHOOK_SECRET_ZAPI` | Não encontrada no código do app | `docker-compose.yml` | Não encontrada no código do app | Parece legado de integração antiga | Diverge de `ZAPI_WEBHOOK_SECRET`. |
| `ZAPI_INSTANCE_ID` | Não encontrada no código do app | `docker-compose.yml` | Não encontrada no código do app | Legado/drift de Z-API | Não aparece no runtime atual. |
| `ZAPI_API_TOKEN` | Não encontrada no código do app | `docker-compose.yml` | Não encontrada no código do app | Legado/drift de Z-API | Não aparece no runtime atual. |
| `ZAPI_WEBHOOK_SECRET` | Condicional, legado | preview, prod | `src/lib/webhookVerify.ts` | Assinatura HMAC de webhook Z-API | O runtime de envio atual usa Meta, não Z-API. |
| `ZAPI_WEBHOOK_TOKEN` | Condicional, legado | preview, prod | `src/lib/webhookVerify.ts` | Fallback legado por token para webhook Z-API | O runtime de envio atual usa Meta, não Z-API. |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Não encontrada no código | `.env.example` | Não encontrada no código | Sobra de documentação | O rate limit real é parametrizado por chamadas de função, não por essa env. |
| `RATE_LIMIT_WEBHOOK_REQUESTS_PER_MINUTE` | Não encontrada no código | `.env.example` | Não encontrada no código | Sobra de documentação | O rate limit real não lê essa env. |
| `VERCEL_OIDC_TOKEN` | Não encontrada no código do app | `.env.local`, `.env.production*`, `.env.vercel` | Não encontrada no código do app | Variável de plataforma | Não há evidência de uso funcional pelo app. |

Observações relevantes de configuração:

- Ambiguidade real de auth: `AUTH_SECRET` é consumida no código; `NEXTAUTH_SECRET` aparece em `.env*`, mas não foi encontrada no app.
- Ambiguidade real de remetente: auth usa `RESEND_AUTH_FROM_EMAIL`; envs antigas e fluxo genérico usam `RESEND_FROM_EMAIL`.
- Drift real de WhatsApp/Z-API: o runtime de envio aponta para Meta Cloud API, enquanto `docker-compose.yml` ainda carrega variáveis de Z-API.

## 4. Estrutura do diretório de conteúdo

### Árvore resumida

```text
src/
  app/
  actions/
  lib/
  services/
  components/
  types/
  constants/
prisma/
e2e/
scripts/
public/
.github/workflows/
```

### Responsabilidades por diretório

| Diretório | Responsabilidade | Exemplos importantes | Observações |
| --- | --- | --- | --- |
| `src/app` | App Router, páginas, layouts e APIs | `src/app/(dashboard)/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/api/webhooks/stripe/route.ts` | Mistura UI, entrypoints internos e integrações externas. |
| `src/app/(auth)` | Fluxos de login, cadastro, reset, MFA e ativação | `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/mfa-setup/page.tsx` | O cadastro oficial passa por Server Action, não por `/api/register`. |
| `src/app/(dashboard)` | Área principal autenticada do produto | `/`, `/cobrancas`, `/clientes`, `/historico`, `/comunicacoes`, `/relatorios`, `/fila`, `/planos`, `/configuracoes` | O layout chama `requireTenant()` em `src/app/(dashboard)/layout.tsx`. |
| `src/app/onboarding` | Onboarding inicial do tenant e passos guiados | `src/app/onboarding/page.tsx`, `src/app/onboarding/OnboardingFlow.tsx` | Existe fluxo visual próprio, mas o estado de conclusão vem de `src/actions/onboarding.ts`. |
| `src/app/superadmin` | Painel global sem isolamento por tenant | `src/app/superadmin/page.tsx` | Acesso restrito por `isSuperAdmin`. |
| `src/app/api` | APIs de integração, machine endpoints e webhooks | `api/forecast`, `api/reports`, `api/risk-score`, `api/cron`, `api/send-queue`, `api/webhooks/**` | Alguns endpoints são REST; outros são acionados por scheduler externo. |
| `src/actions` | Server Actions por domínio | `customers.ts`, `invoices.ts`, `billing.ts`, `auth.ts`, `auth.actions.ts`, `reports-extended.ts` | É a principal camada de aplicação do monólito. |
| `src/lib` | Infraestrutura e lógica de suporte | `prisma.ts`, `permissions.ts`, `safe-auth.ts`, `queue.ts`, `billing/**`, `messaging/**`, `audit.ts` | Concentra a maior parte da infraestrutura crítica. |
| `src/lib/billing` | Configuração de planos, limites e integração Stripe | `plans.ts`, `limits.ts`, `stripe.ts` | O snapshot de billing é persistido no `Tenant`. |
| `src/lib/messaging` | Wrappers de e-mail e WhatsApp | `email.ts`, `whatsapp.ts`, `whatsapp-templates.ts` | Usa provedores externos diretamente. |
| `src/services/communication` | Motor de geração manual de régua de cobrança | `communicationService.ts`, `collectionRules.ts`, `messageGenerator.ts` | É um fluxo paralelo ao envio real por `MessageQueue`. |
| `src/components` | Componentes visuais do produto | `layout/Sidebar.tsx`, `dashboard/CashForecast.tsx`, `reports/*`, `timeline/BillingTimeline.tsx` | Organização por domínio visual. |
| `src/types` | Tipos compartilhados e augmentations | `next-auth.d.ts`, `timeline.types.ts` | Tipagem de sessão e timeline. |
| `src/constants` | Constantes globais | `src/constants/index.ts` | Há sinais de drift com o runtime real em alguns status e endpoints. |
| `prisma` | Schema, migrations e seeds | `schema.prisma`, `seed.ts`, `seed-history.ts`, `migrations/` | Fonte de verdade do modelo de dados. |
| `e2e` | Testes Playwright | `e2e/billing.spec.ts` | Hoje focado em billing. |
| `src/lib/__tests__` e `src/app/api/**/*.test.ts` | Testes de lógica, auth, permissões e webhooks | `multi-tenant-isolation.test.ts`, `viewer-readonly.test.ts`, `route.test.ts` | Cobertura mais forte em backend do que em UI. |
| `scripts` | Scripts operacionais e smoke tests | `create-admin.ts`, `reset-admin.ts`, `test_cron_engine.ts`, `test-resend.ts` | Mistura scripts úteis e artefatos pouco padronizados. |
| `public` | Assets estáticos | logos e favicons | Sem impacto arquitetural além de branding. |
| `.github/workflows` | Pipeline CI | `ci.yml` | Executa lint, test, build e audit. |
| Arquivos raiz de config | Configuração de build, deploy e runtime | `package.json`, `vercel.json`, `Dockerfile`, `docker-compose.yml`, `playwright.config.ts`, `vitest.config.ts`, `eslint.config.mjs` | Há drift entre `docker-compose.yml` e o runtime atual de mensageria. |

## 5. Serviços, jobs e models de cada app

O projeto não está dividido em apps formais separados. A organização real é por domínio funcional.

| Domínio | Responsabilidade | Rotas / telas | Server Actions | Serviços / helpers | Models Prisma | Jobs / webhooks / integrações |
| --- | --- | --- | --- | --- | --- | --- |
| Auth e identidade | Login, cadastro, ativação, reset, Google OAuth, MFA | `/login`, `/register`, `/activate`, `/verify-email`, `/forgot-password`, `/reset-password`, `/mfa-setup`, `/mfa-challenge` | `src/actions/auth.ts`, `src/actions/auth.actions.ts`, `src/actions/mfa.actions.ts` | `auth.ts`, `auth.config.ts`, `src/lib/safe-auth.ts`, `src/lib/permissions.ts`, `src/lib/crypto.ts` | `User`, `TenantUser`, `PasswordResetToken`, `EmailVerificationToken`, `RateLimit` | Google OAuth via rota oficial do Auth.js, TOTP, Auth.js, e-mails via Resend |
| Multi-tenant e autorização | Isolamento por tenant e papéis | Layouts do dashboard e superadmin | `src/actions/protected-actions.ts` | `src/lib/permissions.ts`, `src/lib/safe-auth.ts`, `middleware.ts` | `Tenant`, `TenantUser` | Sem job próprio; enforcement em runtime |
| Billing e assinatura | Planos, limites, checkout e portal Stripe | `/planos` | `src/actions/billing.ts` | `src/lib/billing/plans.ts`, `src/lib/billing/limits.ts`, `src/lib/billing/stripe.ts`, `src/lib/stripe.ts` | `Tenant`, `StripeEvent` | Stripe Checkout, Billing Portal e webhook Stripe |
| Dashboard executivo | KPIs operacionais, aging, risco, alertas e gráficos | `/` | `src/actions/dashboard.ts`, `src/actions/onboarding.ts` | `src/components/dashboard/**`, `src/components/onboarding/OnboardingChecklist.tsx` | `Invoice`, `CommunicationLog`, `Task`, `PaymentPromise`, `Customer` | Consome dados consolidados; sem integração externa direta |
| Clientes | Cadastro, edição, detalhes, notas e contatos financeiros | `/clientes` | `src/actions/customers.ts` | `src/lib/invoice-utils.ts`, `src/actions/risk-score.ts` | `Customer`, `FinancialContact`, `CustomerNote`, `Invoice`, `User` | Sem webhook; integra internamente com risco |
| Cobranças / recebíveis | CRUD de faturas, baixa manual, cancelamento, promessa e reabertura | `/cobrancas` | `src/actions/invoices.ts` | `src/lib/invoice-utils.ts`, `src/actions/timeline.ts` | `Invoice`, `PaymentPromise`, `Communication` | Gera eventos que depois aparecem no histórico |
| Régua manual de cobrança | Configuração da régua e geração manual de logs | `/configuracoes`, `/comunicacoes` | `src/actions/automation.ts`, `src/actions/communicationLog.actions.ts` | `src/services/communication/communicationService.ts`, `messageGenerator.ts`, `collectionRules.ts`, `whatsappLink.ts` | `BillingFlow`, `CommunicationLog`, `Invoice`, `Customer` | Modo `manual`; não envia pelo provider diretamente |
| Fila e entrega real | Enfileiramento, retry, DLQ, fallback de canal e monitoramento | `/fila` | `src/actions/queue.ts` | `src/lib/queue.ts`, `src/lib/rateLimiter.ts`, `src/lib/messaging/email.ts`, `src/lib/messaging/whatsapp.ts` | `MessageQueue`, `Communication`, `ActivityLog` | `/api/send-queue`, envio Resend e Meta WhatsApp |
| Histórico e tarefas | Timeline do cliente/fatura, tarefas operacionais e promises | `/historico` | `src/actions/history.ts`, `src/actions/timeline.ts`, `src/actions/tasks.ts` | `src/components/timeline/BillingTimeline.tsx` | `Communication`, `CustomerNote`, `PaymentPromise`, `Task`, `Invoice` | Sem integração externa; agrega eventos internos |
| Relatórios e exportação | Relatórios analíticos e export CSV/PDF | `/relatorios`, `/relatorios/*` | `src/actions/reports.ts`, `src/actions/reports-extended.ts` | `src/lib/reports.ts`, `src/lib/export-utils.ts`, `src/lib/pdf/reportPdf.ts` | `Invoice`, `Customer` | `GET /api/reports` para consumo programático |
| Previsão de caixa | Forecast de recebimento e impacto por cliente | `/previsao` | `src/actions/forecast.ts` | `src/lib/forecast.ts`, `src/actions/risk-score.ts` | `Invoice`, `PaymentPromise` | `GET /api/forecast` |
| Importação em lote | Import de recebíveis e criação idempotente de clientes/faturas | `/importar`, `/onboarding/importar`, `/onboarding/mapeamento` | `src/actions/import.ts` | Helpers internos no próprio arquivo, guard de billing limits | `Customer`, `FinancialContact`, `Invoice` | Sem job; operação manual do usuário |
| Superadmin | Visão global cross-tenant | `/superadmin` | `src/actions/superadmin.ts` | Nenhum helper dedicado além do auth global | `Tenant`, `Customer`, `Invoice`, `CommunicationLog` | Sem integração externa; acesso por `SUPER_ADMIN_EMAILS` |
| Machine-facing APIs e webhooks | Superfície para integrações e rotinas externas | `/api/forecast`, `/api/reports`, `/api/risk-score`, `/api/health`, `/api/cron`, `/api/send-queue`, `/api/webhooks/**` | Não usa Server Actions diretamente, exceto chamadas internas | `src/lib/internalEndpointAuth.ts`, `src/lib/webhookVerify.ts` | `StripeEvent`, `Communication`, `MessageQueue`, `RateLimit`, `Tenant` | Stripe, Resend, Meta WhatsApp, scheduler externo |

## 6. 12 common hurdles com soluções documentadas

### 6.1 Incompatibilidade entre o editor da régua e o cron real

- Problema: a estrutura salva por `ReguaClient` não bate com a estrutura esperada por `/api/cron`.
- Sintoma: o usuário edita a régua e nada é disparado pelo cron, mesmo com fluxo salvo.
- Causa provável: `src/actions/automation.ts` salva `stage.active` e `channels.email = true`, mas `src/app/api/cron/route.ts` lê `stage.isActive` e `stage.channels.email.active`.
- Arquivos / pontos relacionados: `src/actions/automation.ts`, `src/app/(dashboard)/configuracoes/ReguaClient.tsx`, `src/app/api/cron/route.ts`.
- Solução prática: unificar o shape do JSON da régua e validar com schema antes de persistir e antes de consumir.
- Prevenção futura: criar um tipo compartilhado ou schema Zod único para `BillingFlow.rules`.

### 6.2 Etapa de pré-vencimento pode nunca disparar

- Problema: a etapa pré-vencimento usa valor negativo no editor e comparação incompatível no cron.
- Sintoma: lembretes D-3 não aparecem, mesmo com etapa ativa.
- Causa provável: o default em `src/actions/automation.ts` usa `days: -3`, enquanto o cron faz `Math.abs(diffDays) === stageDays` para `stage.id === 'pre'` em `src/app/api/cron/route.ts`.
- Arquivos / pontos relacionados: `src/actions/automation.ts`, `src/app/api/cron/route.ts`.
- Solução prática: padronizar `days` como positivo para `pre` ou corrigir a comparação no cron.
- Prevenção futura: adicionar teste de contrato cobrindo D-3, D0 e D+N com o payload salvo pela UI.

### 6.3 Horário por etapa é salvo, mas não é executado

- Problema: a UI permite configurar `time` por etapa, mas o runtime não usa esse campo.
- Sintoma: o time operacional acredita que cada etapa dispara em horário específico, mas o comportamento real depende apenas de quando `/api/cron` é acionado.
- Causa provável: `time` existe em `src/actions/automation.ts` e em `ReguaClient.tsx`, porém não é lido em `src/app/api/cron/route.ts`.
- Arquivos / pontos relacionados: `src/actions/automation.ts`, `src/app/(dashboard)/configuracoes/ReguaClient.tsx`, `src/app/api/cron/route.ts`.
- Solução prática: ou remover o campo da UI, ou fazer o cron respeitar janela/horário.
- Prevenção futura: não expor configuração operacional que o backend não execute.

### 6.4 Relatório de carteira a vencer tende a vir vazio

- Problema: o relatório pendente usa um vocabulário de status diferente do schema.
- Sintoma: `/api/reports?type=pending` e telas correlatas podem retornar zero itens apesar de haver faturas em aberto.
- Causa provável: `src/actions/reports-extended.ts` e `src/lib/reports.ts` filtram `pending` e `in_negotiation`, mas o schema usa `OPEN` e `PROMISE_TO_PAY` em `prisma/schema.prisma`.
- Arquivos / pontos relacionados: `src/actions/reports-extended.ts`, `src/lib/reports.ts`, `prisma/schema.prisma`, `src/constants/index.ts`.
- Solução prática: alinhar todos os relatórios ao vocabulário real do banco.
- Prevenção futura: centralizar status em enum de domínio em vez de strings soltas.

### 6.5 Métrica de histórico de pagamento do forecast está inconsistente

- Problema: a base histórica ignora faturas pagas no próprio filtro inicial.
- Sintoma: previsões e probabilidades podem parecer pessimistas ou distorcidas.
- Causa provável: `getPaymentHistoryMetrics()` em `src/actions/forecast.ts` busca `status: { notIn: ['PAID', 'CANCELED'] }` e depois tenta tratar `inv.status === 'PAID'` dentro do loop, o que nunca acontece.
- Arquivos / pontos relacionados: `src/actions/forecast.ts`.
- Solução prática: rever o recorte histórico e incluir pagamentos efetivamente concluídos.
- Prevenção futura: cobrir o cálculo com teste de cenário simples contendo `PAID`, `OPEN` e `PROMISE_TO_PAY`.

### 6.6 Existem dois motores de comunicação concorrendo no repositório

- Problema: há um fluxo manual por `CommunicationLog` e outro de envio real por `MessageQueue` e `Communication`.
- Sintoma: a equipe altera a régua manual e espera refletir no pipeline real, ou vice-versa.
- Causa provável: `src/services/communication/communicationService.ts` e `src/actions/communicationLog.actions.ts` não usam a mesma infraestrutura de `src/lib/queue.ts` e `src/app/api/cron/route.ts`.
- Arquivos / pontos relacionados: `src/services/communication/communicationService.ts`, `src/actions/communicationLog.actions.ts`, `src/lib/queue.ts`, `src/app/api/cron/route.ts`.
- Solução prática: decidir se `CommunicationLog` é apenas planner/manual tool ou se vira estágio anterior do envio real; documentar e consolidar.
- Prevenção futura: um único contrato de mensageria com separação explícita entre planejamento e entrega.

### 6.7 Ambiguidade de env de auth e remetente

- Problema: existem envs duplicadas ou quase duplicadas para auth e email.
- Sintoma: produção usa um segredo/remetente, preview usa outro, e o time não sabe qual o código realmente consome.
- Causa provável: `AUTH_SECRET` é consumida em runtime, mas `NEXTAUTH_SECRET` segue em `.env*`; auth usa `RESEND_AUTH_FROM_EMAIL`, enquanto o pipeline genérico ainda olha `RESEND_FROM_EMAIL`.
- Arquivos / pontos relacionados: `.env*`, `src/lib/safe-auth.ts`, `src/lib/messaging/email.ts`.
- Solução prática: padronizar variáveis oficiais e remover ou comentar explicitamente as legadas.
- Prevenção futura: manter `.env.example` refletindo somente o que o app lê hoje.

### 6.8 Drift entre Meta WhatsApp e Z-API

- Problema: o runtime atual usa Meta Cloud API, mas parte da configuração e constantes ainda falam em Z-API.
- Sintoma: alguém configura `docker-compose.yml` ou lê `src/constants/index.ts` e acredita que o endpoint ou os segredos de Z-API ainda são usados.
- Causa provável: `src/lib/messaging/whatsapp.ts` implementa Meta; `src/lib/webhookVerify.ts` ainda carrega fallback de Z-API; `docker-compose.yml` expõe `ZAPI_*` e `WEBHOOK_SECRET_ZAPI`.
- Arquivos / pontos relacionados: `src/lib/messaging/whatsapp.ts`, `src/lib/webhookVerify.ts`, `src/constants/index.ts`, `docker-compose.yml`.
- Solução prática: remover o que é legado ou separar claramente modo Meta e modo Z-API.
- Prevenção futura: nunca manter provider antigo na configuração sem feature flag explícita.

### 6.9 Matriz de permissões e implementação real não estão 100% alinhadas

- Problema: a matriz central permite mais do que algumas actions realmente deixam fazer.
- Sintoma: operador teoricamente pode criar/editar cliente pela matriz, mas `upsertCustomer()` e `upsertFinancialContact()` exigem admin.
- Causa provável: adoção parcial da `PERMISSIONS_MATRIX`; várias actions ainda usam `requireRole(['admin'])` ou checks manuais.
- Arquivos / pontos relacionados: `src/lib/permissions.ts`, `src/actions/customers.ts`, `src/actions/users.ts`, `src/actions/invoices.ts`.
- Solução prática: migrar mutações para `hasPermission()` ou revisar a matriz para refletir o comportamento real.
- Prevenção futura: toda nova mutation deve declarar permissão, não papel hardcoded.

### 6.10 Cálculo de risco cria efeito N+1 em telas analíticas

- Problema: várias telas calculam score por cliente fazendo múltiplas queries por item.
- Sintoma: dashboard, lista de clientes e relatórios podem degradar com bases maiores.
- Causa provável: `getRiskScoreForCustomer()` consulta invoices e promises por cliente, e é chamado em loop em `src/actions/customers.ts`, `src/actions/dashboard.ts` e `src/actions/reports-extended.ts`.
- Arquivos / pontos relacionados: `src/actions/risk-score.ts`, `src/actions/customers.ts`, `src/actions/dashboard.ts`, `src/actions/reports-extended.ts`.
- Solução prática: pré-agregar dados por tenant/período ou materializar score.
- Prevenção futura: definir budget de query por tela crítica e medir em CI/perf local.

### 6.11 Suite E2E de billing está defasada em relação à UI atual

- Problema: o teste end-to-end de billing espera rotas e CTAs que o produto atual não oferece mais.
- Sintoma: `e2e/billing.spec.ts` tende a falhar ou a testar o lugar errado.
- Causa provável: o teste abre `/configuracoes` e procura “Plano e Billing”, enquanto o billing real mora em `/planos`; o teste ainda pressupõe checkout do plano Starter.
- Arquivos / pontos relacionados: `e2e/billing.spec.ts`, `src/app/(dashboard)/configuracoes/page.tsx`, `src/app/(dashboard)/planos/page.tsx`, `src/actions/billing.ts`, `src/app/(dashboard)/planos/PlanosClient.tsx`.
- Solução prática: reescrever a suite E2E com base no fluxo atual de `/planos`.
- Prevenção futura: toda mudança de IA/rota deve atualizar E2E na mesma PR.

### 6.12 Header estático em `vercel.json` pode gerar falsa sensação de segurança

- Problema: `vercel.json` injeta `X-Webhook-Verified: true` para rotas de webhook, mas a verificação real não acontece ali.
- Sintoma: leitura superficial do projeto sugere que o webhook já chega “verificado”.
- Causa provável: a autenticação real está em `src/lib/webhookVerify.ts` e nos handlers de `src/app/api/webhooks/**`; o header do Vercel é apenas estático.
- Arquivos / pontos relacionados: `vercel.json`, `src/lib/webhookVerify.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/resend/route.ts`, `src/app/api/webhooks/whatsapp/route.ts`.
- Solução prática: remover o header ou renomeá-lo para algo não enganoso.
- Prevenção futura: não usar config de borda para simular estados de segurança que só existem no código do backend.

## 7. 14 design patterns do projeto

| Pattern | Onde aparece | Benefício | Risco / mau uso | Arquivos de referência |
| --- | --- | --- | --- | --- |
| 1. Server Actions como boundary de aplicação | A maior parte das mutações e leituras do produto | Simplifica chamadas entre UI e backend | Pode virar camada inchada e sem módulos claros | `src/actions/**` |
| 2. App Router server-first com client islands | Páginas server carregam dados e passam para componentes client | Bom TTFB e menor necessidade de fetch REST interno | Fronteira servidor/cliente fica implícita demais | `src/app/(dashboard)/**`, `src/app/(auth)/**` |
| 3. Multi-tenant por `tenantId` em quase todas as entidades | Entidades e queries de domínio | Isolamento direto no nível de dado | Fácil esquecer o filtro em novos pontos | `prisma/schema.prisma`, `src/actions/customers.ts`, `src/actions/invoices.ts` |
| 4. Fresh auth read para mutações sensíveis | `requireAuthFresh()` | Evita confiar em JWT stale para papel, tenant e conta ativa | Uso parcial cria comportamento inconsistente | `src/lib/permissions.ts`, `src/actions/**` |
| 5. Enriquecimento da sessão JWT | Callbacks `jwt` e `session` do Auth.js | Leva tenant, role e superadmin para o frontend e server actions | Sessão cresce e depende de callbacks bem mantidos | `auth.ts`, `src/types/next-auth.d.ts` |
| 6. Config centralizada de planos | Snapshot e limites de billing em um lugar | Evita repetir limites em várias telas/actions | Divergência entre UI, Stripe e banco se faltar disciplina | `src/lib/billing/plans.ts`, `src/lib/billing/limits.ts` |
| 7. Adapter/wrapper para provedores externos | Email, WhatsApp e Stripe ficam encapsulados | Troca de provider e tratamento de erro mais centralizados | Drift de config quando o adapter não é a única fonte de verdade | `src/lib/messaging/email.ts`, `src/lib/messaging/whatsapp.ts`, `src/lib/stripe.ts` |
| 8. Fila persistida em banco | `MessageQueue` + `processQueue()` | Não depende de broker externo | Escalabilidade e locking ficam por conta do app | `prisma/schema.prisma`, `src/lib/queue.ts` |
| 9. Idempotência persistida de webhook | Tabela `StripeEvent` | Evita reprocessar o mesmo evento Stripe | Só foi implementado explicitamente para Stripe | `prisma/schema.prisma`, `src/app/api/webhooks/stripe/route.ts` |
| 10. Verificação fail-closed de webhooks | Helpers retornam inválido se faltar config ou assinatura | Segurança melhor para integrações inbound | Requer documentação operacional boa para não parecer “quebrado” | `src/lib/webhookVerify.ts`, `src/lib/stripe.ts` |
| 11. Rate limiting distribuído por banco | `RateLimit` no PostgreSQL | Funciona em ambiente serverless multi-instância | Gera mais carga de banco e exige GC | `src/lib/api-rate-limiter.ts`, `prisma/schema.prisma`, `src/app/api/cron/route.ts` |
| 12. Audit trail em tabela própria | `ActivityLog` e `logAudit()` | Dá rastreabilidade de ações críticas | Adoção parcial deixa lacunas entre domínios | `src/lib/audit.ts`, `prisma/schema.prisma` |
| 13. Fixtures E2E injetadas por cookie | Billing fake por cookie no browser | Testes previsíveis sem Stripe real | Fácil mascarar drift entre teste e produto real | `src/lib/e2e-billing.ts`, `playwright.config.ts`, `e2e/billing.spec.ts` |
| 14. Lógica de cálculo pura fora do acesso a dados | Score de risco, relatórios e forecast ficam em libs puras | Facilita teste e auditoria | Se inputs estiverem errados, o cálculo puro preserva o erro | `src/lib/risk-score.ts`, `src/lib/reports.ts`, `src/lib/forecast.ts` |

## 8. Pipeline semanal completo com horários

### 8.1 Pipeline implementado

Esta subseção documenta somente o que foi encontrado no código.

| Processo | Gatilho real encontrado | Horário | Evidência | Observações |
| --- | --- | --- | --- | --- |
| Billing engine / dunning | `GET /api/cron` com autenticação interna | Horário não explicitado no código | `src/app/api/cron/route.ts`, `src/lib/internalEndpointAuth.ts` | O comentário diz “runs once per day”, mas não há scheduler em `vercel.json`. |
| Processamento de fila | `POST /api/send-queue` com autenticação interna | Horário não explicitado no código | `src/app/api/send-queue/route.ts` | Processa fila, retry, DLQ e stuck recovery. |
| Garbage collection de rate limits | Executado dentro de `/api/cron` | Depende do horário do cron, não explicitado | `src/app/api/cron/route.ts` | Limpa `RateLimit` expirado. |
| Garbage collection de auditoria | Executado dentro de `/api/cron` | Depende do horário do cron, não explicitado | `src/app/api/cron/route.ts` | Remove `ActivityLog` com mais de 90 dias. |
| Geração manual de comunicação | Ação do usuário em `/comunicacoes` | Sem horário fixo; on-demand | `src/actions/communicationLog.actions.ts`, `src/app/(dashboard)/comunicacoes/CommunicationsClient.tsx` | Gera `CommunicationLog`, não envia provider real. |
| Enfileiramento e tentativa de envio | Chamado pelo cron ou por fluxo interno de enqueue | Sem horário próprio; acoplado ao chamador | `src/lib/queue.ts`, `src/app/api/cron/route.ts` | Cria `Communication` + `MessageQueue` e tenta envio imediato. |
| Retry/backoff de fila | Calculado por `nextRetryAt` e reprocessado quando `/api/send-queue` roda | Horário não explicitado; depende da próxima execução do endpoint | `src/lib/queue.ts` | O retry não se autoexecuta sozinho; depende de agendador externo. |
| Webhook Stripe | Evento externo | Event-driven | `src/app/api/webhooks/stripe/route.ts` | Atualiza billing e usa idempotência por `StripeEvent`. |
| Webhook Resend | Evento externo | Event-driven | `src/app/api/webhooks/resend/route.ts` | Atualiza status de `Communication` com base no `externalId`. |
| Webhook WhatsApp | Evento externo | Event-driven | `src/app/api/webhooks/whatsapp/route.ts` | Valida challenge e assinatura Meta; atualiza status de `Communication`. |
| Health check | `GET /api/health` | On-demand | `src/app/api/health/route.ts`, `Dockerfile` | O `Dockerfile` usa esse endpoint no `HEALTHCHECK`. |

Observações do pipeline implementado:

- Não foi encontrada definição de horário em `vercel.json`, `.github/workflows/ci.yml` ou outro arquivo de scheduler.
- Os campos `time` configurados em `BillingFlow.rules` não são consumidos pelo cron real.
- O modo `COMMUNICATION_MODE=manual` existe e muda o comportamento da régua.

### 8.2 Pipeline operacional recomendado

Esta subseção é recomendação operacional baseada na arquitetura encontrada. Não foi encontrada implementação explícita desses horários no repositório.

| Dia / frequência | Horário sugerido | Ação recomendada | Motivo |
| --- | --- | --- | --- |
| Todos os dias úteis | 08:00 | Acionar `GET /api/cron` | Gera cobranças do dia, limpa `RateLimit` expirado e faz GC de auditoria. |
| Todos os dias úteis | 08:15 | Acionar `POST /api/send-queue` | Processa fila, retries, stuck recovery e DLQ. |
| Todos os dias úteis | 09:00 | Revisar `/fila` | Confirmar DLQ, stuck items e falhas permanentes. |
| Todos os dias úteis | 09:30 | Revisar `/comunicacoes` | Validar logs pendentes, enviados, pulados e falhos. |
| Todos os dias úteis | 17:30 | Rodar checagem de saúde e revisão curta de erros | Evita acumular falhas para o dia seguinte. |
| Segunda-feira | 09:00 | Revisão de billing e Stripe | Conferir assinaturas, `past_due`, portal e webhook Stripe. |
| Terça-feira | 09:00 | Revisão da régua e envios | Validar se billing flow, cron e templates estão coerentes. |
| Quarta-feira | 09:00 | Auditoria de auth, MFA e permissões | Revisar admins, superadmins, roles e acesso ao `/superadmin`. |
| Quinta-feira | 09:00 | Revisão de relatórios, risco e forecast | Conferir consistência entre dashboard, relatórios e previsão. |
| Sexta-feira | 09:00 | Revisão de envs, webhooks e deploy readiness | Verificar segredos, drift de config e estado do CI. |
| Sexta-feira | 16:00 | Checklist de manutenção semanal | Fechar pendências de DLQ, retries, logs e documentação. |

## 9. Checklist pós-implementação

- [ ] A feature declara claramente em qual domínio funcional entra.
- [ ] Toda query ou mutation de domínio foi scopiada por `tenantId`.
- [ ] A rota/tela respeita `auth`, `requireAuth`, `requireAuthFresh` ou `requireTenant` conforme criticidade.
- [ ] O papel necessário está alinhado entre UI, action e `PERMISSIONS_MATRIX`.
- [ ] Não foi criado novo vocabulário de status sem alinhar com `prisma/schema.prisma`.
- [ ] Novas envs foram adicionadas em `.env.example` e documentadas com uso real.
- [ ] A implementação não depende de `NEXTAUTH_SECRET` se o runtime usa `AUTH_SECRET`.
- [ ] Se houver webhook novo, ele valida assinatura/token de forma fail-closed.
- [ ] Se houver reprocessamento ou retries, existe idempotência explícita.
- [ ] Se houver job interno, o endpoint é protegido por `requireInternalEndpointAuth()` ou equivalente.
- [ ] Se houver integração externa, existe wrapper central em `src/lib/**` ou `src/services/**`.
- [ ] Se houver envio de comunicação, ficou claro se o fluxo usa `CommunicationLog` manual ou `MessageQueue` real.
- [ ] A feature não adiciona mais um caminho paralelo para o mesmo domínio sem necessidade real.
- [ ] Toda mutation crítica gera auditoria quando aplicável.
- [ ] Os componentes client não importam bibliotecas server-only por acidente.
- [ ] A tela carrega dados iniciais no servidor quando isso reduz fetch duplicado.
- [ ] Não houve regressão de `callbackUrl` nos fluxos de auth.
- [ ] Fluxos de cadastro, ativação, reset e MFA continuam íntegros.
- [ ] Se a feature mexe com billing, os price IDs e ciclos foram validados server-side.
- [ ] Se a feature mexe com Stripe, o webhook correspondente foi considerado.
- [ ] Se a feature mexe com WhatsApp ou e-mail, os webhooks de status continuam compatíveis.
- [ ] Se a feature mexe com relatórios, o contrato de status do domínio foi revisado.
- [ ] Se a feature mexe com forecast ou score, há teste cobrindo o cálculo.
- [ ] Se a feature usa Prisma, a migration foi considerada e o rollback pensado.
- [ ] `npm run lint`, `npm test` e `npm run build` foram considerados no fluxo de entrega.
- [ ] A documentação central (`FLUXEER.md`) foi atualizada se a arquitetura mudou.

## 10. Riscos arquiteturais atuais

| Prioridade | Risco | Evidência | Impacto | Saneamento sugerido |
| --- | --- | --- | --- | --- |
| Alta | Dois motores de comunicação coexistem sem contrato unificado | `src/services/communication/communicationService.ts`, `src/lib/queue.ts`, `src/actions/communicationLog.actions.ts`, `src/app/api/cron/route.ts` | Alto risco de drift funcional e duplicação de regras | Escolher arquitetura oficial de mensageria e rebaixar a outra para adapter ou modo explícito. |
| Alta | Configuração da régua não conversa corretamente com o cron | `src/actions/automation.ts` vs `src/app/api/cron/route.ts` | Automação pode parecer configurada e não executar nada | Unificar schema da régua e cobrir com teste end-to-end de contrato. |
| Alta | Ambiguidade de envs críticas | `AUTH_SECRET` vs `NEXTAUTH_SECRET`, `RESEND_FROM_EMAIL` vs `RESEND_AUTH_FROM_EMAIL`, Meta vs Z-API | Deploys inconsistentes e troubleshooting lento | Padronizar envs oficiais e limpar legado em `.env.example`, Docker e docs. |
| Alta | Vocabulário de status fragmentado | `OPEN/PROMISE_TO_PAY` no schema vs `pending/in_negotiation` em relatórios e constantes | Relatórios e filtros podem mentir ou ficar vazios | Centralizar status do domínio e remover strings órfãs. |
| Média | Enforcement de permissão é parcial e misto | `PERMISSIONS_MATRIX` não é a única fonte de verdade | Regras de acesso podem divergir entre telas e actions | Migrar mutações para política declarativa única. |
| Média | N+1 de score de risco em telas analíticas | `src/actions/customers.ts`, `src/actions/dashboard.ts`, `src/actions/reports-extended.ts` | Escalabilidade ruim com tenants maiores | Materializar score ou calcular em batch. |
| Média | Scheduler operacional não está versionado no repositório | Não há `crons` em `vercel.json` nem workflow para isso | Operação depende de conhecimento externo não documentado | Versionar scheduler ou documentar fonte oficial do acionamento. |
| Média | Testes E2E de billing estão defasados da UI real | `e2e/billing.spec.ts` vs `/planos` atual | CI falsa, cobertura enganosa | Regravar E2E conforme o fluxo atual. |
| Média | Drift entre código e configs auxiliares | `docker-compose.yml`, `src/constants/index.ts`, `vercel.json` | Time novo pode configurar integrações erradas | Revisão de config por domínio e remoção de legado. |
| Baixa | Helpers e caminhos pouco usados seguem no repositório | `src/lib/server-action-auth.ts`, `src/components/layout/ClientAuthGuard.tsx` | Complexidade acidental e confusão de onboarding técnico | Remover, consolidar ou marcar como legado. |

Conclusão objetiva:

- O Fluxeer ainda não é uma big ball of mud, mas já mostra sinais claros de drift entre runtime real, UI de configuração, testes e arquivos de ambiente.
- O maior risco atual não é tecnológico; é de coerência de contrato entre os subfluxos de cobrança, billing e permissões.
- O saneamento prioritário deve começar por mensageria, régua de cobrança, envs oficiais e vocabulário único de status.
