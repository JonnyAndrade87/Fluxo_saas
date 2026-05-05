# 🚀 Quick Start — FOCOs Implementados

## 📌 Resumo Rápido

Quatro módulos críticos foram implementados para operação completa:

### ✅ FOCO 1: Score de Risco (Centralizado)
- **Rota:** `/api/risk-score` | Server Action: `getRiskScoreForCustomer()`
- **Score:** 0-100, faixas 0-25/26-50/51-75/76-100
- **Integrado em:** FOCO 2, FOCO 3, Dashboard de Clientes

### ✅ FOCO 2: Previsão de Caixa (60 dias)
- **Rota:** `/previsao` | API: `/api/forecast`
- **Cenários:** Otimista, Realista, Conservador
- **Integrado em:** Score de Risco, Dashboard

### ✅ FOCO 3: Relatórios Expandidos (5 tipos)
- **Rota:** `/relatorios` | API: `/api/reports`
- **Relatórios:** Vencidos, Carteira, Atraso, Risco, Executivo
- **Exportação:** CSV UTF-8 com BOM + Impressão
- **Integrado em:** Score de Risco + Forecast

### ✅ FOCO 4: Permissões Multiusuário
- **Rota:** `/auditoria` | Lib: `src/lib/permissions.ts`
- **Perfis:** Admin, Financeiro, Cobrança, Gestor
- **Auditoria:** Ações críticas (deletar, modificar, exportar)
- **Proteção:** Middleware centralizado + validação de permissão

---

## 🎯 Como Acessar

### Via Dashboard
```
/relatorios              → Grid com 5 cards
/relatorios/vencidos    → Títulos vencidos
/relatorios/carteira    → Carteira a vencer
/relatorios/atraso      → Clientes com maior atraso
/relatorios/risco       → Ranking por risco
/relatorios/executivo   → Resumo executivo
/previsao               → Previsão de caixa
/auditoria              → Trilha de auditoria (admin only)
```

### Via API REST
```bash
# Risk Score
curl "https://app/api/risk-score?customerId=xxx"

# Forecast JSON
curl "https://app/api/forecast?type=weekly&days=60"

# Reports
curl "https://app/api/reports?type=overdue&period=90d"

# Exportar CSV
curl "https://app/api/reports?type=overdue&export=csv" > report.csv
```

### Via Server Actions
```typescript
import { getOverdueReport, getPendingReport } from '@/actions/reports-extended';
import { getReceivablesForecast } from '@/actions/forecast';
import { getRiskScoreForCustomer } from '@/actions/risk-score';
import { hasPermission, executeWithAudit } from '@/lib/permissions';

// Risk Score
const score = await getRiskScoreForCustomer(customerId, tenantId);
````

// Forecast
const forecast = await getReceivablesForecast('weekly', 60);

// Reports
const overdue = await getOverdueReport('90d', customerId);
const pending = await getPendingReport(customerId);
```

---

## 📂 Estrutura de Arquivos

```
src/
├── lib/
│   ├── reports.ts              (Geração de dados relatórios)
│   ├── forecast.ts             (Cálculo previsão)
│   ├── risk-score.ts           (Score centralizado)
│   ├── export-utils.ts         (CSV + Print)
│   ├── permissions.ts          (Matriz + helpers FOCO 4)
│   └── audit.ts                (Logging de ações FOCO 4)
├── actions/
│   ├── reports-extended.ts     (Server Actions relatórios)
│   ├── forecast.ts             (Server Actions previsão)
│   ├── risk-score.ts           (Server Actions score)
│   └── protected-actions.ts    (Middleware FOCO 4)
├── app/
│   ├── api/
│   │   ├── reports/route.ts
│   │   ├── forecast/route.ts
│   │   └── risk-score/route.ts
│   └── (dashboard)/
│       ├── relatorios/         (5 páginas + index)
│       ├── previsao/           (1 página)
│       └── auditoria/          (Página de auditoria FOCO 4)
└── components/
    └── reports/                (Filtros, tabela, clientes)
```

---

## 🔧 Filtros Disponíveis

### Período
- `30d`, `60d`, `90d`, `180d`

### Cliente
- Dropdown com clientes ativos
- Opcional (sem seleção = todos)

### Status
- Automático por tipo de relatório
- Vencidos: `status='overdue'`
- Carteira: `status IN ['pending', 'in_negotiation']`

---

## 📊 Integração Score de Risco

Todos os relatórios mostram uma coluna **Risco** que:
1. Busca score centralizado via `getRiskScoreForCustomer()`
2. Mostra nível: **Crítico** (vermelho) | **Alto** (vermelho) | **Médio** (amarelo) | **Baixo** (verde)
3. No Ranking por Risco, também mostra score 0-100

---

## 🎨 Customização

### Adicionar coluna em tabela
Editar `ReportTable.tsx`:
```typescript
<ReportTable
  columns={[
    { key: 'customerName', label: 'Cliente' },
    { key: 'customValue', label: 'Meu Campo', format: (v) => customFormat(v) }
  ]}
  data={data}
/>
```

### Adicionar novo relatório
1. Criar função em `lib/reports.ts`
2. Criar Server Action em `actions/reports-extended.ts`
3. Criar Client Component em `components/reports/MyReportClient.tsx`
4. Criar página em `app/(dashboard)/relatorios/meurelatorio/page.tsx`
5. Adicionar ao grid em `relatorios/page.tsx`

### Exportar para PDF
Estrutura já preparada, instalar biblioteca:
```bash
npm install jspdf html2pdf
```

---

## ⚙️ Variáveis de Ambiente

```env
DATABASE_URL=                    # Prisma DB connection
NEXTAUTH_URL=                    # Auth provider
AUTH_SECRET=                     # Session secret (official)
```

---

## 🧪 Validação

```bash
# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

## 📞 Troubleshooting

| Problema | Solução |
|----------|---------|
| CSV não abre Excel | Usar `/api/reports?export=csv` (UTF-8 BOM) |
| Filtros lentos | Verificar índices em `invoice` table |
| Score não mostra | Verificar `getRiskScoreForCustomer()` chamada |
| API retorna 401 | Validar session + tenantId |
| Relatório vazio | Verificar período tem dados |

---

## 🚀 Deploy

Sistema está 100% pronto para produção:
- ✅ Build sem erros
- ✅ TypeScript tipado
- ✅ Autenticação em todas rotas
- ✅ Multi-tenant isolado
- ✅ Sem migrations necessárias

```bash
git push                         # Deploy automático (vercel/railway/etc)
```

---

**Documentação Completa:** Veja `FOCO_3_RELATORIOS.md`, `FOCO_2_PREVISAO_CAIXA.md`

**Próximos FOCOs:** Aguardando especificação do usuário! 🎯
