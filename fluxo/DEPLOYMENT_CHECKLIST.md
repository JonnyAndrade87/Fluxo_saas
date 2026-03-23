# ✅ Checklist Pós-Deploy

## 🚀 Seu app está LIVE em produção!

**URL Principal:** https://fluxo-psi-sepia.vercel.app

---

## 📋 Checklist de Configuração

### 1️⃣ Variáveis de Ambiente (CRÍTICO - Sem isso o app NÃO funciona!)

Acesse: [Vercel Dashboard - Environment Variables](https://vercel.com/jonattans-projects-5e32c066/fluxo/settings/environment-variables)

- [ ] **DATABASE_URL** 
  - Descrição: PostgreSQL connection string
  - Formato: `postgresql://user:password@host:port/database`
  - Recomendado: Railway.app ou Neon
  - Link: https://railway.app ou https://neon.tech

- [ ] **AUTH_SECRET**
  - Descrição: Secret para criptografia de JWT
  - Gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - ⚠️ Guarde bem, não compartilhe!

- [ ] **RESEND_API_KEY**
  - Descrição: API key do Resend (para emails)
  - Link: https://resend.com
  - Alternativa: SendGrid (se preferir)

- [ ] **WEBHOOK_SECRET_RESEND**
  - Descrição: Secret para webhooks do Resend
  - Encontre em: Resend Dashboard > Webhooks

- [ ] **ZAPI_INSTANCE_ID** (Opcional - só se usar WhatsApp)
  - Descrição: Instance ID do ZAPI
  - Link: https://zapi.net

- [ ] **ZAPI_API_TOKEN** (Opcional - só se usar WhatsApp)
  - Descrição: API Token do ZAPI

- [ ] **NEXT_PUBLIC_APP_URL**
  - Descrição: URL pública do seu app
  - Valor: `https://fluxo-psi-sepia.vercel.app` (ou seu domínio customizado)

### 2️⃣ Configurar Database (Recomendado: Railway)

#### Opção A: Railway.app (Mais fácil + integra com Vercel) ✨

1. Acesse https://railway.app
2. Crie conta (pode usar GitHub)
3. Crie novo projeto
4. Selecione PostgreSQL
5. Copy connection string (DATABASE_URL)
6. Cole em Vercel > Environment Variables

```
Exemplo:
postgresql://user:password@railway.hostname.railway.internal:5432/railway
```

#### Opção B: Neon (Serverless Postgres)

1. Acesse https://neon.tech
2. Crie conta
3. Crie novo projeto
4. Copy connection string
5. Cole em Vercel > Environment Variables

#### Opção C: AWS RDS (Mais controle, mais caro)

1. Crie banco PostgreSQL em AWS RDS
2. Configure security groups para aceitar conexões
3. Copy endpoint
4. Cole em Vercel

### 3️⃣ Testar Aplicação Após Variáveis Preenchidas

- [ ] Acesse https://fluxo-psi-sepia.vercel.app
- [ ] Teste **Login**: Crie usuário de teste
- [ ] Teste **Cobrança**: Adicione cliente e cobranças
- [ ] Teste **Previsão**: Verifique gráficos
- [ ] Teste **Automação**: Configure automações
- [ ] Teste **Integração**: Webhooks funcionando
- [ ] Verifique **Logs**: Vercel Dashboard > Deployments > Logs

### 4️⃣ Executar Migrações do Banco (Importante!)

Após configurar DATABASE_URL:

```bash
# Local (para testar antes)
npx prisma migrate deploy

# Em produção (via Vercel CLI)
vercel env pull .env.local
npx prisma migrate deploy
```

Ou clique em "Redeploy" no Vercel Dashboard após adicionar DATABASE_URL.

### 5️⃣ Configurar Domínio Customizado (Opcional)

1. Compre domínio em Namecheap, GoDaddy, etc
2. Acesse Vercel Dashboard > Settings > Domains
3. Adicione domínio
4. Configure nameservers
5. Espere 24-48h para propagação

**Exemplo:**
```
seu-dominio.com.br → fluxo-psi-sepia.vercel.app
```

### 6️⃣ Configurar CI/CD (GitHub Actions - Opcional)

GitHub Actions está pronto em `.github/workflows/`:

- [ ] Verificar workflow em: GitHub > Actions
- [ ] Auto-deploy em: `git push origin main`
- [ ] Preview automático em: Pull Requests

### 7️⃣ Monitoramento (Verificar Regularmente)

- [ ] Logs: [Vercel Logs](https://vercel.com/jonattans-projects-5e32c066/fluxo)
- [ ] Performance: Vercel Dashboard > Analytics
- [ ] Errors: Vercel Dashboard > Monitoring

### 8️⃣ Segurança (IMPORTANTE!)

- [ ] ✅ HTTPS ativado automaticamente
- [ ] ✅ Headers de segurança configurados
- [ ] ✅ Secrets não commitados
- [ ] ✅ .env nunca no git
- [ ] ⚠️ Não compartilhe AUTH_SECRET

### 9️⃣ Backup & Recuperação

- [ ] Configurar backup automático do banco (Railway oferece)
- [ ] Testar restore em ambiente staging
- [ ] Documentar processo de rollback

---

## 📞 Suporte Rápido

| Problema | Solução |
|----------|---------|
| Erro "DATABASE_URL" não definido | Adicione em Vercel > Environment Variables |
| Erro "AUTH_SECRET" não definido | Gere e adicione em Vercel > Environment Variables |
| Build falha com Prisma | Execute: `vercel env pull .env.local && npx prisma generate` |
| App conecta mas mostra erro de banco | Migrações não foram rodadas: `npx prisma migrate deploy` |
| Emails não enviam | Verifique RESEND_API_KEY em Vercel |

---

## 🚀 Auto-Deploy Configurado

De agora em diante:

```bash
# Faz deploy automático em produção
git push origin main

# Faz deploy em staging/preview (cria URL temporária)
git push origin develop
```

---

## 📊 Status Final

| Item | Status | Link |
|------|--------|------|
| App Live | ✅ | https://fluxo-psi-sepia.vercel.app |
| Build | ✅ | [Vercel Deployments](https://vercel.com/jonattans-projects-5e32c066/fluxo) |
| TypeScript | ✅ | Strict mode, 100% typed |
| Routes | ✅ | 28/28 geradas |
| Auto-Deploy | ✅ | Ativado (git push = deploy) |
| Database | ⏳ | Pendente configuração |
| Emails | ⏳ | Pendente RESEND_API_KEY |
| WhatsApp | ⏳ | Pendente ZAPI keys |

---

## ✨ Próximas Features

- [ ] Sentry para error tracking (opcional)
- [ ] Datadog para performance monitoring (opcional)
- [ ] GitHub Actions para testes automáticos (opcional)
- [ ] Backup diário do banco (railway oferece grátis)

---

**Status:** 🟡 Parcialmente Funcional (aguardando variáveis de ambiente)

**Próximo passo:** Preencher as variáveis de ambiente acima!
