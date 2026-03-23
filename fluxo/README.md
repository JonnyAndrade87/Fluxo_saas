# 💼 Fluxo - Financial Intelligence PlatformThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](.)## Getting Started

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)First, run the development server:

[![TypeScript](https://img.shields.io/badge/typescript-5.3%2B-blue)](https://www.typescriptlang.org/)

[![Next.js](https://img.shields.io/badge/next.js-16.0%2B-black)](https://nextjs.org)```bash

npm run dev

**Plataforma inteligente de inteligência financeira para PMEs com análise de risco, previsão de caixa e relatórios gerenciais em tempo real.**# or

yarn dev

> ✅ **Production Ready** | 28 rotas | 17 Server Actions | 10 APIs | 100% TypeScript# or

pnpm dev

---# or

bun dev

## 🎯 Características Principais```



### 📊 4 Módulos CompletosOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.



| FOCO | Descrição | Status |You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

|------|-----------|--------|

| **1. Score de Risco** | Análise dinâmica 0-100 para cada cliente | ✅ |This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

| **2. Previsão de Caixa** | Projeção 60 dias em 3 cenários | ✅ |

| **3. 5 Relatórios** | Vencidos, Carteira, Atraso, Risco, Executivo | ✅ |## Learn More

| **4. Permissões** | 4 perfis de acesso + auditoria | ✅ |

To learn more about Next.js, take a look at the following resources:

### 🔐 Enterprise Ready

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- ✅ **Autenticação** - NextAuth JWT + sessions- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- ✅ **Multi-tenant** - Isolamento por tenantId

- ✅ **TypeScript** - 100% tipado (strict mode)You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- ✅ **Security** - Rate limiting, webhook verification

- ✅ **Performance** - Build 8.6s, Turbopack otimizado## Deploy on Vercel

- ✅ **Escalabilidade** - PostgreSQL + Redis ready

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

---

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🚀 Quick Start

### 1️⃣ Clonar e Instalar

```bash
git clone https://github.com/yourusername/fluxo.git
cd fluxo
npm install
```

### 2️⃣ Configurar Ambiente

```bash
cp .env.example .env.local

# Editar .env.local com:
# DATABASE_URL=sqlite://./dev.db (ou postgresql://...)
# AUTH_SECRET=your-secret-key
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3️⃣ Setup Banco de Dados

```bash
npx prisma migrate dev
# (opcional) Popula com dados de teste
npx prisma db seed
```

### 4️⃣ Iniciar Servidor

```bash
npm run dev
```

Visite: [http://localhost:3000](http://localhost:3000)

---

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Dashboard protegido
│   ├── api/               # REST API endpoints
│   └── layout.tsx
├── actions/               # Server Actions (17 total)
├── components/
│   ├── ui/                # Componentes reutilizáveis
│   ├── layout/
│   ├── finance/
│   └── reports/
├── lib/                   # Business Logic
│   ├── risk-score.ts      # FOCO 1
│   ├── forecast.ts        # FOCO 2
│   ├── reports.ts         # FOCO 3
│   ├── permissions.ts     # FOCO 4
│   ├── queue.ts           # Message Queue
│   ├── audit.ts           # Auditoria
│   ├── messaging/         # Email + WhatsApp
│   └── db.ts              # Prisma Client
├── types/                 # TypeScript Interfaces (novo)
├── constants/             # Application Constants (novo)
├── hooks/                 # Custom React Hooks (novo)
└── utils/                 # Utilities: logger, etc (novo)
```

---

## 📚 Documentação Completa

### Deployment & Operations
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy via Vercel, Docker, Railway (3 opções)
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Padrões de código, workflow, CI/CD
- **[PROJETO_ORGANIZACAO.md](./PROJETO_ORGANIZACAO.md)** - Roadmap de estabilização

### FOCOs (Módulos)
- **[FOCO_1_CONCLUSAO.md](./FOCO_1_CONCLUSAO.md)** - Score de Risco
- **[FOCO_2_PREVISAO_CAIXA.md](./FOCO_2_PREVISAO_CAIXA.md)** - Previsão de Caixa (algoritmos)
- **[FOCO_3_RELATORIOS.md](./FOCO_3_RELATORIOS.md)** - 5 Relatórios (filtros, export)
- **[FOCO_4_PERMISSOES.md](./FOCO_4_PERMISSOES.md)** - Permissões & Auditoria

### Quick References
- **[QUICKSTART_FOCOS.md](./QUICKSTART_FOCOS.md)** - Referência rápida dos FOCOs
- **[ROADMAP_ESTABILIZACAO.md](./ROADMAP_ESTABILIZACAO.md)** - Próximas 4 semanas

---

## 🛠️ Scripts Disponíveis

```bash
# 📱 Desenvolvimento
npm run dev              # Inicia servidor em localhost:3000

# 🏗️ Build & Production
npm run build            # Build para produção
npm run start            # Inicia servidor de produção
npm run preview          # Preview da build

# ✅ Quality Assurance
npm run lint             # ESLint check
npm run lint -- --fix    # Auto-fix issues
npm run type-check       # TypeScript type checking

# 🗄️ Database
npx prisma studio       # Abrir Prisma Studio (DB UI)
npx prisma db seed      # Popular com dados de teste
npx prisma migrate dev  # Criar + rodar migrations

# 🐳 Docker
docker build -t fluxo . # Build Docker image
docker run -p 3000:3000 fluxo  # Rodar container

# 🐳 Docker Compose (app + postgres + redis + adminer)
docker-compose up       # Iniciar stack
docker-compose down     # Parar stack
```

---

## 🚀 Deployment

### Opção 1: Vercel (Recomendado ⭐)

```bash
npm install -g vercel
vercel login
vercel link
git push origin main    # Auto-deploy ao fazer push
```

### Opção 2: Docker + Railway

```bash
docker build -t fluxo:latest .
# Railway Dashboard → conectar repositório
# Auto-deploy ao fazer push
```

### Opção 3: Docker Compose (Local Testing)

```bash
docker-compose up -d

# Acessar:
# - App:  http://localhost:3000
# - DB UI: http://localhost:8080
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379

docker-compose down  # Parar
```

→ Veja [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções detalhadas!

---

## 🔐 Variáveis de Ambiente

Veja [.env.example](./.env.example) para template completo.

**Essenciais:**

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fluxo
# ou para SQLite (development)
DATABASE_URL=file:./dev.db

# Auth
AUTH_SECRET=your-jwt-secret-key-change-in-production

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Opcionais (features):**

```env
# Email (Resend)
RESEND_API_KEY=re_...
WEBHOOK_SECRET_RESEND=webhook_secret

# WhatsApp (Z-API)
ZAPI_INSTANCE_ID=instance_id
ZAPI_API_TOKEN=api_token
WEBHOOK_SECRET_ZAPI=webhook_secret
```

⚠️ **IMPORTANTE**: Nunca commitar `.env.local` ou `.env.production` no Git!

---

## 📊 Status do Projeto

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| **Build** | ✅ | 8.6s (Turbopack) |
| **TypeScript** | ✅ | 100% tipado (strict mode) |
| **ESLint** | ✅ | 0 erros críticos (57 warnings) |
| **Routes** | ✅ | 28 rotas (estáticas + dinâmicas) |
| **Server Actions** | ✅ | 17 actions, todas tipadas |
| **APIs** | ✅ | 10 endpoints REST |
| **Database** | ✅ | Schema pronto, 0 migrations pendentes |
| **Deployment** | ✅ | 3 opções (Vercel, Docker, Railway) |
| **Documentation** | ✅ | 1.800+ linhas de docs |

---

## 🔧 Stack Tecnológico

### Frontend
- **Next.js 16.2.0** - React framework com App Router
- **React 19** - UI library
- **TypeScript 5.3** - Type safety
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons

### Backend
- **Prisma 6** - ORM database-agnostic
- **NextAuth** - Autenticação JWT
- **Server Actions** - RPC calls (type-safe)

### Database
- **PostgreSQL 14+** - Production
- **SQLite** - Development

### DevOps
- **Docker** - Containerização
- **Vercel** - Hosting recomendado
- **GitHub Actions** - CI/CD (preparado)

### Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks (setup)

---

## 🐛 Troubleshooting

### Build falha?

```bash
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro de conexão com banco de dados?

```bash
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT version();"
npx prisma migrate status
```

### Port 3000 em uso?

```bash
npm run dev -- -p 3001
```

Mais em [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#-troubleshooting)

---

## 🤝 Como Contribuir

Leia [CONTRIBUTING.md](./CONTRIBUTING.md) para:
- ✅ Coding standards (TypeScript, React)
- ✅ Workflow de desenvolvimento
- ✅ Como fazer pull requests
- ✅ Git commit conventions
- ✅ Exemplo: Código "ANTES vs DEPOIS"

---

## 📝 License

MIT License - veja [LICENSE](./LICENSE) para detalhes

---

## 📞 Suporte & Contato

- 📚 **Documentação**: Veja arquivos `*.md` neste repositório
- 🐛 **Reportar Bugs**: [GitHub Issues](https://github.com/yourusername/fluxo/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/yourusername/fluxo/discussions)
- 📧 **Email**: suporte@fluxo.dev

---

**Versão**: 1.0.0  
**Atualizado**: 23 de Março de 2026  
**Status**: ✅ Production Ready

```
   _____ __  __  ___  _____ ______
  |_   _|  \/  |/ _ \| ____|  ____|
    | | | |\/| | | | |  _| | |__
    | | | |  | | | | | |__ |  __|
    | | | |  | | |_| |  __| | |
    |_| |_|  |_|\___/|_|    |_|
```
