# 🚀 DEPLOYMENT GUIDE - Fluxo

**Última Atualização**: 23 de Março de 2026
**Versão**: 1.0.0

---

## 📋 Pré-requisitos

Antes de fazer deploy, certifique-se de:

- [ ] Node.js 20+ instalado localmente
- [ ] npm ou yarn instalado
- [ ] Git configurado
- [ ] Acesso a serviços de terceiros (Vercel, Docker Hub, PostgreSQL)
- [ ] Variáveis de ambiente configuradas
- [ ] Build local passando (`npm run build`)
- [ ] Linting passando (`npm run lint`)

---

## 🛠️ Configuração de Variáveis de Ambiente

### 1. Copiar Template de Ambiente

```bash
cp .env.example .env.staging
cp .env.example .env.production
```

### 2. Staging (.env.staging)

```env
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/fluxo_staging
AUTH_SECRET=your-staging-secret-key
NEXT_PUBLIC_APP_URL=https://staging.fluxo.com
RESEND_API_KEY=re_staging_...
ZAPI_INSTANCE_ID=staging-instance
```

### 3. Production (.env.production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/fluxo_prod
AUTH_SECRET=your-production-secret-key
NEXT_PUBLIC_APP_URL=https://fluxo.com
RESEND_API_KEY=re_prod_...
ZAPI_INSTANCE_ID=prod-instance
```

⚠️ **IMPORTANTES**:
- Nunca commitar `.env.staging` ou `.env.production` no Git
- Usar senhas fortes (geradas com `openssl rand -base64 32`)
- Guardar secrets em um password manager
- Rotacionar secrets regularmente

---

## 📦 Opção 1: Deploy via Vercel (Recomendado)

### Pré-requisitos
- Conta Vercel criada
- Git repository conectado
- Domínio configurado

### Passos

#### 1. Conectar Repositório

```bash
# Fazer login no Vercel
npm install -g vercel
vercel login

# Link o projeto
vercel link
```

#### 2. Configurar Environment Variables no Vercel Dashboard

```
Vercel Dashboard → Settings → Environment Variables
```

Adicionar para **Staging** e **Production**:
```
DATABASE_URL          → postgresql://...
AUTH_SECRET           → your-secret-key
RESEND_API_KEY        → re_...
WEBHOOK_SECRET_RESEND → webhook-secret
ZAPI_INSTANCE_ID      → instance-id
ZAPI_API_TOKEN        → token
WEBHOOK_SECRET_ZAPI   → webhook-secret
NEXT_PUBLIC_APP_URL   → https://staging.fluxo.com
```

#### 3. Deploy para Staging

```bash
# Build local para teste
npm run build
npm run start

# Fazer push para branch de staging
git push origin staging

# Vercel fará deploy automático
```

#### 4. Deploy para Production

```bash
# Criar release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Vercel fará deploy automático para main/production
```

### Monitoramento Vercel

- **Logs**: `vercel logs`
- **Analytics**: Vercel Dashboard → Analytics
- **Rollback**: `vercel rollback`

---

## 🐳 Opção 2: Deploy via Docker + Railway

### Pré-requisitos
- Conta Railway criada
- Docker instalado localmente
- Docker Hub account (opcional)

### Passos

#### 1. Testar Localmente

```bash
# Build Docker image
docker build -t fluxo:latest .

# Executar container
docker run --env-file .env.local -p 3000:3000 fluxo:latest

# Visitar http://localhost:3000
```

#### 2. Push para Docker Registry

```bash
# Login no Docker Hub
docker login

# Tag image
docker tag fluxo:latest username/fluxo:v1.0.0
docker tag fluxo:latest username/fluxo:latest

# Push
docker push username/fluxo:v1.0.0
docker push username/fluxo:latest
```

#### 3. Deploy no Railway

```bash
# 1. Criar projeto no Railway Dashboard
# 2. Conectar Git repository
# 3. Configurar build command: npm run build
# 4. Adicionar variáveis de ambiente
# 5. Deploy automático ao fazer push
```

#### 4. Database no Railway

```bash
# 1. Adicionar PostgreSQL plugin no Railway
# 2. Copiar DATABASE_URL da variável de ambiente
# 3. Executar migrations:
railway run npx prisma migrate deploy
```

---

## 🐳 Opção 3: Docker Compose (Development/Testing)

### Executar Localmente com Dependências

```bash
# Criar .env.docker
cp .env.example .env.docker

# Configurar variáveis
DB_USER=fluxo
DB_PASSWORD=dev-password
DB_NAME=fluxo_dev

# Executar stack completo
docker-compose up -d

# Logs em tempo real
docker-compose logs -f app

# Para e remove containers
docker-compose down
```

### Acessar Serviços

- **Aplicação**: http://localhost:3000
- **Adminer (DB UI)**: http://localhost:8080
- **Banco de Dados**: postgres://localhost:5432
- **Redis**: redis://localhost:6379

### Executar Migrations

```bash
# Dentro do container
docker-compose exec app npx prisma migrate deploy

# Ou localmente (se PostgreSQL rodando)
DATABASE_URL=postgresql://fluxo:dev-password@localhost:5432/fluxo_dev npx prisma migrate deploy
```

---

## ✅ Checklists de Deploy

### Pré-Deploy

- [ ] `npm run lint` (0 erros)
- [ ] `npm run build` (sucesso, < 10s)
- [ ] `npm run test` (se tiver testes, passar)
- [ ] Variáveis de ambiente corretas
- [ ] Database migrations prontas
- [ ] Secrets seguros e únicos
- [ ] CHANGELOG.md atualizado
- [ ] Versão em `package.json` atualizada

### Staging

- [ ] Build local funciona
- [ ] Docker image funciona localmente
- [ ] Todas as rotas acessíveis
- [ ] Login/autenticação funciona
- [ ] APIs respondendo
- [ ] Webhooks (Resend, Z-API) funcionando
- [ ] Database queries funcionando
- [ ] Performance aceitável

### Production

- [ ] Tudo em staging validado
- [ ] Database backup feito
- [ ] Monitoring configurado
- [ ] Error tracking (Sentry) ativo
- [ ] CDN/cache configurado
- [ ] SSL/HTTPS ativo
- [ ] Rate limiting ativo
- [ ] Logs sendo coletados
- [ ] Plano de rollback documentado

---

## 🔄 CI/CD com GitHub Actions

### Criar `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        if: github.event_name == 'push'
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Monitoramento e Debugging

### Acessar Logs

**Vercel**:
```bash
vercel logs [production|staging]
```

**Docker**:
```bash
docker logs fluxo-app
docker logs fluxo-postgres
```

**Railway**:
```
Railway Dashboard → Deployments → Logs
```

### Verificar Saúde da Aplicação

```bash
# Health check endpoint
curl https://your-domain.com/api/health

# Deve retornar:
{ "status": "ok", "timestamp": "2026-03-23T..." }
```

### Database Debugging

```bash
# Conectar ao banco
npx prisma studio

# Ver estado das migrations
npx prisma migrate status

# Resetar database (CUIDADO!)
npx prisma migrate reset
```

---

## 🔄 Rollback Rápido

### Vercel

```bash
# Listar deployments
vercel deployments

# Rollback para versão anterior
vercel rollback
```

### Docker/Railway

```bash
# Rebuildar última versão funcional
git revert <commit-ruim>
git push origin main

# Ou reverter para tag específica
git checkout v1.0.0
git push origin main --force
```

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Limpar cache
npm run clean
rm -rf .next

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Tentar build novamente
npm run build
```

### Database Connection Issues

```bash
# Verificar connection string
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT version();"

# Ver migrations aplicadas
npx prisma migrate status
```

### Webhooks Não Funcionam

```bash
# Verificar secrets
echo $WEBHOOK_SECRET_RESEND
echo $WEBHOOK_SECRET_ZAPI

# Verificar logs da API
curl -v https://your-domain.com/api/webhooks/resend
```

---

## 📚 Recursos Adicionais

- [Vercel Docs](https://vercel.com/docs)
- [Docker Docs](https://docs.docker.com)
- [Railway Docs](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

---

**Support**: Para dúvidas, verifique logs ou entre em contato com a equipe.
