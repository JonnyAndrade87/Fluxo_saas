# Backlog de Segurança — Fluxeer

Itens pendentes pós-hardening (16.1–16.5). Nenhum destes bloqueia produção.
Ordenados por impacto descendente.

---

## 1. Redução de Warnings de Lint (259 ativos)

**Contexto**: `npm run lint` retorna 0 errors / 259 warnings. A maioria são `@typescript-eslint/no-explicit-any`.

**Abordagem sugerida**:
- Atacar por módulo, priorizando arquivos de core (actions, lib) sobre configurações e scripts.
- Meta realista: reduzir para <100 warnings em 2 sessões de refactoring.
- Não exigir zero warnings em CI ainda — mas adicionar regra para não aumentar a contagem.

**Ação imediata (sem refactoring)**: adicionar `eslint --max-warnings 259` no CI para detectar regressões.

---

## 2. Audit Trail Transacional

**Contexto**: todos os `logAudit` são best-effort pós-ação. Se o banco falhar após uma ação sensível, o log pode ser perdido.

**Candidatos prioritários para auditoria atômica**:

| Ação | Risco de perda | Esforço |
|---|---|---|
| `INVOICE_DELETED` | Alto | Médio — adicionar `activityLog` dentro da `$transaction` |
| `CUSTOMER_DELETED` | Alto | Médio |
| `USER_DELETED` | Alto | Baixo |
| `AUTH_LOGIN_FAILURE` | Baixo | — (post-facto por natureza) |
| `AUTH_MFA_VERIFIED` | Baixo | — (cookie já garante o estado) |

**Padrão a implementar** (onde valer):
```ts
await prisma.$transaction([
  prisma.invoice.delete({ where: { id } }),
  prisma.activityLog.create({ data: { action: 'INVOICE_DELETED', ... } }),
]);
```

**Limitação**: logs transacionais só fazem sentido para ações de banco — não para eventos de auth (que são externos ao Prisma).

---

## 3. Pipeline Contínuo de Segurança

**Objetivo**: detectar regressões de segurança automaticamente em PRs.

### Checklist de pipeline mínimo (GitHub Actions / Vercel)

```yaml
# Sugestão de steps no CI:
- name: Run tests
  run: npm test

- name: Lint (with max-warnings gate)
  run: npm run lint -- --max-warnings 259

- name: Type check
  run: npx tsc --noEmit

- name: Build
  run: npm run build

- name: Audit dependencies
  run: npm audit --audit-level=high
```

### Extras recomendados (médio prazo)
- **Snyk ou Dependabot**: varredura automática de CVEs em dependências
- **Secret scanning**: GitHub já faz por padrão — confirmar que está ativo no repo
- **SAST básico**: adicionar `eslint-plugin-security` para detectar padrões perigosos (ex: `eval`, `innerHTML`)

---

## 4. Rotação de `MFA_SECRET_KEY`

**Contexto**: hoje, trocar `MFA_SECRET_KEY` invalida todos os `mfaSecret` criptografados existentes no banco. Usuários perderiam o MFA configurado.

**Solução futura** (sem urgência):
- Adicionar campo `mfaSecretVersion` no `User`
- Manter múltiplas chaves ativas por versão
- Descriptografar com a chave correspondente à versão do registro

**Prioridade**: baixa — só relevante se houver necessidade de rotação de chave.

---

## Deploy Checklist

Verificar antes de cada deploy para produção:

- [ ] `MFA_SECRET_KEY` configurada (mín. 32 chars, `openssl rand -base64 48`)
- [ ] `AUTH_SECRET` configurada e diferente do dev
- [ ] `DATABASE_URL` apontando para PostgreSQL de produção
- [ ] `CRON_SECRET` configurada e cadastrada no scheduler externo
- [ ] `RESEND_API_KEY` válida e domínio verificado
- [ ] `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` com redirect URI de produção
- [ ] `npm run build` sem erros no ambiente de produção
- [ ] `npm test` 123/123 passando
