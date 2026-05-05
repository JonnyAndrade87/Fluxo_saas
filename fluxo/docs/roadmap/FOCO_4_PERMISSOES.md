# FOCO 4 — Permissões Multiusuário

**Status:** ✅ Implementado

**Objetivo:** Garantir segurança mínima sem inflar complexidade. Implementação simplificada de controle de acesso por perfil com auditoria básica de ações críticas.

---

## 📋 Resumo da Implementação

### Perfis Implementados

| Perfil | Descrição | Acesso |
|--------|-----------|--------|
| **admin** | Gerenciador completo | Acesso irrestrito a todas as funcionalidades |
| **financeiro** | Gestor financeiro | Criação de faturas, relatórios e previsões |
| **cobrança** | Operador de cobranças | Execução de cobranças e comunicações |
| **gestor** | Gestor executivo | Dashboard e relatórios de gestão |

### Matriz de Permissões

```
┌──────────────┬─────────┬──────────┬────────┬─────────┐
│ Módulo       │ Admin   │ Financ.  │ Cobran │ Gestor  │
├──────────────┼─────────┼──────────┼────────┼─────────┤
│ Dashboard    │ ✅      │ ✅       │ ❌     │ ✅      │
│ Clientes     │ ✅ CRUD │ ✅ R     │ ✅ R   │ ✅ R    │
│ Faturas      │ ✅ CRUD │ ✅ CRU   │ ✅ R   │ ✅ R    │
│ Relatórios   │ ✅ Todos│ ✅ Fin   │ ✅ Cob │ ✅ R    │
│ Cobranças    │ ✅      │ ❌       │ ✅     │ ❌      │
│ Configuração │ ✅      │ ❌       │ ❌     │ ❌      │
│ Auditoria    │ ✅      │ ❌       │ ❌     │ ❌      │
└──────────────┴─────────┴──────────┴────────┴─────────┘
```

### Detalhes das Permissões

#### Dashboard
- `dashboard:view` → `['admin', 'financeiro', 'gestor']`

#### Clientes
- `customers:read` → Todos
- `customers:create` → `admin`
- `customers:update` → `admin`
- `customers:delete` → `admin` (com auditoria)

#### Faturas
- `invoices:read` → Todos
- `invoices:create` → `admin`, `financeiro`
- `invoices:update` → `admin`
- `invoices:delete` → `admin` (com auditoria)
- `invoices:export` → `admin`, `financeiro`, `gestor`

#### Relatórios
- `reports:read` → Todos
- `reports:export` → `admin`, `financeiro`, `gestor` (com auditoria)

#### Previsão de Caixa
- `forecast:read` → `admin`, `financeiro`, `gestor`

#### Cobranças
- `collections:read` → `admin`, `cobrança`
- `collections:create` → `admin`, `cobrança`
- `collections:update` → `admin`, `cobrança`
- `collections:execute` → `admin`, `cobrança` (enviar mensagens, promessas)
- `collections:delete` → `admin`

#### Configuração & Auditoria
- `settings:*` → `admin` apenas
- `audit:read` → `admin` apenas

---

## 🏗️ Arquitetura

### Arquivos Criados

1. **`src/lib/permissions.ts`** (260 linhas)
   - Matriz de permissões
   - Funções de validação: `hasPermission()`, `hasAllPermissions()`, `hasAnyPermission()`
   - Tipos de ações auditadas: `AUDIT_ACTIONS`
   - Helpers: `canPerformDestructiveAction()`, `isDestructiveAction()`, `shouldAudit()`

2. **`src/lib/audit.ts`** (120 linhas)
   - `logAudit()`: Registra ações críticas
   - `getAuditLogs()`: Recupera logs com paginação
   - `countAuditLogs()`: Total de logs
   - `getAuditLogsByAction()`: Filtro por ação
   - Integração com `ActivityLog` do Prisma

3. **`src/actions/protected-actions.ts`** (100 linhas)
   - `checkAccess()`: Middleware de autenticação + permissão
   - `executeWithAudit()`: Wrapper para executar ações com auditoria automática
   - Facilita proteção centralizada

4. **`src/app/(dashboard)/auditoria/page.tsx`** (200 linhas)
   - Interface de visualização de logs
   - Acesso restrito a admin
   - Tabela com paginação
   - Stats de ações registradas

### Fluxo de Proteção

```
Requisição → requireAuth()
           ↓
           Validar tenantId (multi-tenant)
           ↓
           Validar permissão: hasPermission()
           ↓
           Se ação destrutiva: canPerformDestructiveAction() → admin only
           ↓
           Executar ação
           ↓
           logAudit() (se critical)
           ↓
           Retornar resultado
```

---

## 📁 Responsabilidades por Perfil

### ADMIN
✅ Gerenciamento completo
- Criar, editar, deletar clientes
- Criar, editar, deletar faturas
- Configurar sistema
- Acessar auditoria
- Gerenciar usuários
- Executar cobranças

### FINANCEIRO
✅ Gestão financeira
- Visualizar clientes
- Criar faturas
- Visualizar relatórios financeiros
- Exportar dados
- Visualizar previsão
- **Não pode:** deletar, configurar, gerenciar usuários

### COBRANÇA
✅ Execução de cobranças
- Visualizar clientes
- Visualizar faturas
- Executar cobranças (promessas, comunicações)
- Visualizar relatórios de cobranças
- **Não pode:** criar faturas, exportar, deletar

### GESTOR
✅ Visão executiva
- Visualizar dashboard
- Visualizar clientes (leitura)
- Visualizar faturas (leitura)
- Visualizar relatórios
- Exportar relatórios
- Visualizar previsão
- **Não pode:** criar, editar, deletar, executar cobranças

---

## 🔐 Ações Críticas com Auditoria

As seguintes ações SEMPRE disparam um registro de auditoria:

| Ação | Entidade | Acesso |
|------|----------|--------|
| `CUSTOMER_DELETED` | Cliente | Admin only |
| `INVOICE_DELETED` | Fatura | Admin only |
| `USER_DELETED` | Usuário | Admin only |
| `REPORT_EXPORTED` | Relatório | Admin, Financeiro, Gestor |
| `DATA_EXPORTED` | Dados | Admin, Financeiro, Gestor |
| `SETTINGS_CHANGED` | Configuração | Admin only |

Cada registro inclui:
- Data/hora
- Usuário que fez a ação
- Role do usuário
- Tipo de entidade
- ID da entidade
- Metadata (antes/depois, erro, etc)

---

## 💻 Uso em Server Actions

### Exemplo 1: Proteger uma ação simples

```typescript
import { requireAuth, hasPermission } from '@/lib/permissions';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

export async function deleteInvoice(invoiceId: string) {
  const auth = await requireAuth();
  
  // Verificar permissão
  if (!hasPermission(auth.role, 'invoices:delete')) {
    throw new Error('FORBIDDEN: Não pode deletar faturas');
  }
  
  // Deletar
  await prisma.invoice.delete({ where: { id: invoiceId } });
  
  // Auditar
  await logAudit({
    tenantId: auth.tenantId,
    userId: auth.userId,
    userRole: auth.role,
    action: AUDIT_ACTIONS.INVOICE_DELETED,
    entityType: 'invoice',
    entityId: invoiceId,
    description: 'Fatura deletada manualmente',
  });
}
```

### Exemplo 2: Usar executeWithAudit (melhor)

```typescript
import { executeWithAudit } from '@/actions/protected-actions';
import { AUDIT_ACTIONS } from '@/lib/permissions';

export async function deleteInvoice(invoiceId: string) {
  return executeWithAudit(
    {
      action: AUDIT_ACTIONS.INVOICE_DELETED,
      entityType: 'invoice',
      entityId: invoiceId,
      requiredPermissions: ['invoices:delete'],
      isDestructive: true,
      description: 'Fatura deletada manualmente',
    },
    async (ctx) => {
      // ctx = { userId, tenantId, role }
      return await prisma.invoice.delete({ where: { id: invoiceId } });
    }
  );
}
```

---

## 🔍 Visualizando a Auditoria

Acesso via dashboard:
```
/auditoria
```

**Restrições:**
- Apenas admin pode acessar
- Mostra últimas 50 ações
- Paginação automática
- Filtro por página
- Exibe: data/hora, usuário, ação, entidade, ID

---

## ⚠️ O Que NÃO Foi Implementado

❌ RBAC granular (permissões por campo)
❌ Sistema de aprovações multi-step
❌ Revogação de ações (undo)
❌ Roles dinâmicas
❌ Permissões baseadas em dados (ex: "só pode ver seus clientes")
❌ JWT com refresh tokens
❌ 2FA/MFA
❌ Endpoints de gestão de usuários (criar/editar/deletar)

**Justificativa:** Todas essas features seriam "YAGNI" no estágio atual. Implementadas apenas se especificadas em FOCO futuro.

---

## 🧪 Validação

### Build & Lint
```bash
npm run build  # ✅ 0 errors
npm run lint   # ✅ 0 new errors
```

### TypeScript
```bash
# Matriz de permissões é type-safe
const canDelete = hasPermission(role, 'invoices:delete'); // ✅ type-checked
```

### Multi-tenant
Todas as queries incluem `tenantId`:
```typescript
// ✅ Seguro: isolado por tenant
await prisma.activityLog.findMany({ 
  where: { tenantId: ctx.tenantId }
});
```

---

## 📚 Integração com FOCOs Anteriores

### FOCO 1 (Score de Risco)
- Acesso via `risk-score:read` (controle de acesso já existia)
- Auditoria não agora, apenas se `reportExported`

### FOCO 2 (Previsão de Caixa)
- `forecast:read` → `['admin', 'financeiro', 'gestor']`
- Acesso controlado

### FOCO 3 (Relatórios)
- `reports:read` → Todos
- `reports:export` → `['admin', 'financeiro', 'gestor']` (com auditoria)

---

## 🚀 Próximos FOCOs Sugeridos

Se adicionar recursos de **segurança avançada**, considere:

1. **FOCO 5 — Gestão de Usuários**
   - CRUD de users
   - Atribuição de roles
   - Reset de senha

2. **FOCO 6 — Auditoria Avançada**
   - Filtros por ação/usuário
   - Relatórios de conformidade
   - Export de logs

3. **FOCO 7 — Notificações de Segurança**
   - Alerta ao admin sobre exclusões
   - Tentativas de acesso negado
   - Webhooks para eventos críticos

---

## 📝 Resumo das Modificações

| Arquivo | Tipo | Linhas | Descrição |
|---------|------|--------|-----------|
| `src/lib/permissions.ts` | Edição | +260 | Matriz + helpers (antes: 52 linhas) |
| `src/lib/audit.ts` | Novo | 120 | Logging de ações críticas |
| `src/actions/protected-actions.ts` | Novo | 100 | Middleware centralizado |
| `src/app/(dashboard)/auditoria/page.tsx` | Novo | 200 | Interface de auditoria |
| **Total** | — | **680** | **4 arquivos, 0 breaking changes** |

---

## ✅ Checklist de Entrega

- [x] Matriz de permissões 4 perfis
- [x] Funções de validação (`hasPermission`, `hasAllPermissions`, `hasAnyPermission`)
- [x] Detecção de ações destrutivas
- [x] Auditoria de ações críticas
- [x] Integração com ActivityLog (Prisma)
- [x] Página de auditoria (admin only)
- [x] Middleware centralizado (`checkAccess`, `executeWithAudit`)
- [x] Documentação de responsabilidades
- [x] Type-safe (TypeScript)
- [x] Zero breaking changes
- [x] Build: ✅ sem erros
- [x] Lint: ✅ 0 novos erros

---

**FOCO 4 — Completo e pronto para produção!** 🎉
