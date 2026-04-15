# Pipeline de CI — Fluxeer

## Arquivo

`.github/workflows/ci.yml`

## Gatilhos

- `push` para `main` / `master`
- `pull_request` para `main` / `master`

## Etapas (sequenciais)

| # | Etapa | Comando | Falha se... |
|---|---|---|---|
| 1 | Lint | `npm run lint -- --max-warnings 259` | warnings aumentarem acima de 259 ou houver erros |
| 2 | Test | `npm test` | qualquer teste falhar |
| 3 | Build | `npm run build` | build TypeScript/Next.js falhar |
| 4 | Audit | `npm audit --omit=dev --audit-level=high` | vulnerabilidade **high** ou **critical** em dep de produção |

## Secrets necessários no GitHub

Configurar em **Settings → Secrets and variables → Actions**:

| Secret | Obrigatório | Descrição |
|---|---|---|
| `MFA_SECRET_KEY` | ✅ Sim | Chave AES-256 + HMAC — gerar com `openssl rand -base64 48` |
| `AUTH_SECRET` | Recomendado | Secret do NextAuth |
| `DATABASE_URL` | Opcional | Sem banco real no CI — somente build/type-check |

> **Nota**: fallbacks de placeholder estão definidos no workflow para viabilizar o build sem banco real no CI. Eles não têm acesso a dados reais.

## Impacto no fluxo de desenvolvimento

- Todo PR para `main`/`master` é verificado automaticamente antes do merge
- Se lint, test, build ou audit falharem → merge bloqueado (requer configuração de branch protection no GitHub)
- O gate de warnings (`--max-warnings 259`) congela o nível atual: warnings não podem aumentar

## O que NÃO foi alterado

Nenhum arquivo de código da aplicação foi modificado para este pipeline.
Arquivos criados/modificados:

- `.github/workflows/ci.yml` — novo
- `docs/ci.md` — novo

## Validação local (equivalente ao CI)

```bash
npm run lint -- --max-warnings 259
npm test
npm run build
npm audit --omit=dev --audit-level=high
```
