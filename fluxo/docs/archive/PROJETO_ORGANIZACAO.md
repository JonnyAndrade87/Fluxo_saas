# 📋 Plano de Organização para Deploy Professional

**Data**: 23 de Março de 2026
**Status**: Em Progresso
**Objetivo**: Preparar projeto para staging/produção com estrutura profissional

---

## 📊 Audit Atual

### Problemas Encontrados

#### 1. Code Quality
- ✅ **65 console.log** distribuídos em 15+ arquivos
- ✅ **57 ESLint warnings** (principalmente `@typescript-eslint/no-explicit-any`)
- ✅ **Variáveis não utilizadas** em 5+ arquivos
- ✅ **Imports não utilizados** em alguns arquivos

#### 2. Estrutura de Pastas
- ✅ `src/lib/` bem organizado (14 arquivos)
- ✅ `src/actions/` bem estruturado
- ✅ `src/components/` com subpastas temáticas
- ⚠️ Faltam:
  - `src/hooks/` (reutilizáveis React)
  - `src/types/` (interfaces TS centralizadas)
  - `src/constants/` (constantes da aplicação)
  - `src/utils/` (utilitários não-domínio)

#### 3. Configuração de Deploy
- ❌ `vercel.json` não existe
- ❌ `Dockerfile` não existe
- ❌ `.env.example` não existe
- ✅ `.env` existe mas não documentado

#### 4. Documentação
- ✅ README.md existe
- ⚠️ Precisa de atualização com setup/deploy
- ❌ Falta guia de desenvolvimento local

---

## 🎯 Plano de Ação

### Fase 1: Limpeza de Código (1-2 horas)
- [ ] Remover 65 console.log
- [ ] Remover variáveis não utilizadas
- [ ] Remover imports não utilizados
- [ ] Adicionar tipos corretos (substituir `any` por tipos específicos)

### Fase 2: Reorganização de Pastas (30 minutos)
- [ ] Criar `src/types/` para interfaces centralizadas
- [ ] Criar `src/constants/` para valores fixos
- [ ] Criar `src/hooks/` para custom React hooks
- [ ] Criar `src/utils/` para funções utilitárias genéricas
- [ ] Mover `templates/` para `public/templates/`

### Fase 3: Configurações de Deploy (1 hora)
- [ ] Criar `vercel.json` (Vercel deployment)
- [ ] Criar `Dockerfile` (containerização Docker)
- [ ] Criar `docker-compose.yml` (dev local)
- [ ] Criar `.env.example` (template de env)
- [ ] Criar `.github/workflows/deploy.yml` (CI/CD)

### Fase 4: Documentação (30 minutos)
- [ ] Atualizar README.md
- [ ] Criar CONTRIBUTING.md
- [ ] Criar DEPLOYMENT.md

### Fase 5: Validação Final (30 minutos)
- [ ] `npm run build` (0 errors)
- [ ] `npm run lint` (0 new warnings)
- [ ] Teste local de APIs
- [ ] Teste de fluxo de autenticação

---

## 📁 Estrutura Final Esperada

```
fluxo/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── actions/                # Server Actions
│   ├── components/             # React Components
│   ├── lib/                    # Business Logic
│   ├── hooks/                  # Custom React Hooks (NOVO)
│   ├── types/                  # TypeScript Interfaces (NOVO)
│   ├── constants/              # Application Constants (NOVO)
│   └── utils/                  # Generic Utilities (NOVO)
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│   └── templates/              # Static Templates (NOVO)
│
├── .github/
│   └── workflows/              # CI/CD Pipelines (NOVO)
│
├── templates/                  # Removed -> Move to public/templates/
├── vercel.json                 # Vercel Config (NOVO)
├── Dockerfile                  # Docker Config (NOVO)
├── docker-compose.yml          # Docker Compose (NOVO)
├── .env.example                # Env Template (NOVO)
├── DEPLOYMENT.md               # Deploy Guide (NOVO)
└── CONTRIBUTING.md             # Dev Guide (NOVO)
```

---

## 🚀 Próximos Passos

1. ✅ Executar audit inicial (PRONTO)
2. ⏳ Remover console.log e limpar código
3. ⏳ Reorganizar estrutura de pastas
4. ⏳ Criar configurações de deploy
5. ⏳ Atualizar documentação
6. ⏳ Validação final

---

## 📈 Métricas de Sucesso

- [ ] 0 console.log em produção
- [ ] 0 ESLint warnings (exceto os pré-existentes aceitáveis)
- [ ] 100% TypeScript strict mode
- [ ] Build time < 10s
- [ ] Documentação completa
- [ ] Deploy configurado e testado

---

**Responsável**: GitHub Copilot
**Última Atualização**: 23/03/2026 01:15
