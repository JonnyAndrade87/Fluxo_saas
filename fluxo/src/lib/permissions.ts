/**
 * FOCO 4 — Permissões Multiusuário
 * Sistema simplificado de controle de acesso por perfil
 *
 * Perfis: admin | financeiro | cobrança | gestor
 * - Sem RBAC granular, apenas controle por módulo e ação crítica
 * - Auditoria básica integrada
 */

import { auth } from '../../auth';

export type UserRole = 'admin' | 'financeiro' | 'cobrança' | 'gestor';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/**
 * Asserts the request is authenticated and returns the auth context.
 * Throws if no valid session is found.
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await auth();
  const user = session?.user as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!user?.tenantId) {
    throw new Error('UNAUTHORIZED: No active session or tenant.');
  }

  return {
    userId: user.id ?? user.sub ?? '',
    tenantId: user.tenantId,
    role: (user.role ?? 'gestor') as UserRole,
  };
}

/**
 * Asserts the authenticated user has one of the required roles.
 * Call AFTER requireAuth().
 *
 * @param allowed – list of roles that are permitted
 * @param ctx – the context returned by requireAuth()
 */
export function requireRole(allowed: UserRole[], ctx: AuthContext): void {
  if (!allowed.includes(ctx.role)) {
    throw new Error(
      `FORBIDDEN: Required role [${allowed.join('|')}], got '${ctx.role}'.`
    );
  }
}

/**
 * Matriz de Permissões Simplificada
 * 
 * ┌─────────────┬───────────┬──────────┬────────┬─────────┐
 * │ Módulo      │ Admin     │ Financ.  │ Cobran │ Gestor  │
 * ├─────────────┼───────────┼──────────┼────────┼─────────┤
 * │ Dashboard   │ ✅ Leitura│ ✅ Leitura│ ❌     │ ✅ Leitura
 * │ Clientes    │ ✅ CRUD   │ ✅ Leitura│ ✅ R   │ ✅ Leitura
 * │ Faturas     │ ✅ CRUD   │ ✅ Criar │ ✅ R   │ ✅ Leitura
 * │ Relatórios  │ ✅ Todos  │ ✅ Financ│ ✅ Cobr│ ✅ Leitura
 * │ Cobranças   │ ✅ Gerenc │ ❌       │ ✅ Exec│ ❌
 * │ Configurar  │ ✅ Sim    │ ❌       │ ❌     │ ❌
 * │ Auditoria   │ ✅ Sim    │ ❌       │ ❌     │ ❌
 * └─────────────┴───────────┴──────────┴────────┴─────────┘
 */
export const PERMISSIONS_MATRIX = {
  // Dashboard
  'dashboard:view': ['admin', 'financeiro', 'gestor'],

  // Clientes
  'customers:read': ['admin', 'financeiro', 'cobrança', 'gestor'],
  'customers:create': ['admin'],
  'customers:update': ['admin'],
  'customers:delete': ['admin'],

  // Faturas
  'invoices:read': ['admin', 'financeiro', 'cobrança', 'gestor'],
  'invoices:create': ['admin', 'financeiro'],
  'invoices:update': ['admin'],
  'invoices:delete': ['admin'],
  'invoices:export': ['admin', 'financeiro', 'gestor'],

  // Relatórios
  'reports:read': ['admin', 'financeiro', 'cobrança', 'gestor'],
  'reports:export': ['admin', 'financeiro', 'gestor'],

  // Previsão de Caixa
  'forecast:read': ['admin', 'financeiro', 'gestor'],

  // Cobranças (tarefas, comunicações)
  'collections:read': ['admin', 'cobrança'],
  'collections:create': ['admin', 'cobrança'],
  'collections:update': ['admin', 'cobrança'],
  'collections:execute': ['admin', 'cobrança'], // Enviar mensagens, fazer promessas
  'collections:delete': ['admin'],

  // Automação
  'automation:read': ['admin', 'financeiro'],
  'automation:configure': ['admin'],

  // Configurações
  'settings:read': ['admin'],
  'settings:update': ['admin'],

  // Auditoria
  'audit:read': ['admin'],

  // Usuários (gestão de equipe)
  'users:read': ['admin'],
  'users:create': ['admin'],
  'users:update': ['admin'],
  'users:delete': ['admin'],
} as const;

/**
 * Descrições de Responsabilidades por Perfil
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Gerenciador completo • Acesso irrestrito a todas as funcionalidades',
  financeiro: 'Gestor financeiro • Criação de faturas, relatórios e previsões',
  cobrança: 'Operador de cobranças • Execução de cobranças e comunicações',
  gestor: 'Gestor executivo • Visão de dashboard e relatórios de gestão',
};

/**
 * Verificar se um usuário tem permissão para uma ação
 * @param userRole Role do usuário autenticado
 * @param permission Permissão a verificar (ex: 'invoices:create')
 * @returns true se tem permissão, false caso contrário
 */
export function hasPermission(
  userRole: UserRole | undefined,
  permission: keyof typeof PERMISSIONS_MATRIX
): boolean {
  if (!userRole) return false;
  const allowedRoles = PERMISSIONS_MATRIX[permission];
  return (allowedRoles as readonly UserRole[]).includes(userRole);
}

/**
 * Verificar se um usuário tem ALL permissões (AND)
 */
export function hasAllPermissions(
  userRole: UserRole | undefined,
  permissions: (keyof typeof PERMISSIONS_MATRIX)[]
): boolean {
  return permissions.every((perm) => hasPermission(userRole, perm));
}

/**
 * Verificar se um usuário tem QUALQUER permissão (OR)
 */
export function hasAnyPermission(
  userRole: UserRole | undefined,
  permissions: (keyof typeof PERMISSIONS_MATRIX)[]
): boolean {
  return permissions.some((perm) => hasPermission(userRole, perm));
}

/**
 * Tipos de ações que disparam auditoria
 */
export const AUDIT_ACTIONS = {
  // Clientes
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED: 'CUSTOMER_DELETED',

  // Faturas
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_UPDATED: 'INVOICE_UPDATED',
  INVOICE_DELETED: 'INVOICE_DELETED',

  // Cobranças
  COLLECTION_PROMISED: 'COLLECTION_PROMISED',
  COLLECTION_COMMUNICATED: 'COLLECTION_COMMUNICATED',

  // Relatórios & Exportação
  REPORT_EXPORTED: 'REPORT_EXPORTED',
  DATA_EXPORTED: 'DATA_EXPORTED',

  // Usuários
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',

  // Configuração
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Apenas ADMIN pode fazer ações destrutivas
 */
export function canPerformDestructiveAction(userRole: UserRole | undefined): boolean {
  return userRole === 'admin';
}

/**
 * Helper para validar se uma ação crítica está sendo feita
 * Retorna true se a ação requer permissão especial
 */
export function isDestructiveAction(action: AuditAction): boolean {
  const destructiveActions: AuditAction[] = [
    AUDIT_ACTIONS.CUSTOMER_DELETED,
    AUDIT_ACTIONS.INVOICE_DELETED,
    AUDIT_ACTIONS.USER_DELETED,
  ];
  return destructiveActions.includes(action);
}

/**
 * Ações que SEMPRE requerem auditoria
 */
export function shouldAudit(action: AuditAction): boolean {
  const criticalActions: AuditAction[] = [
    AUDIT_ACTIONS.CUSTOMER_DELETED,
    AUDIT_ACTIONS.INVOICE_DELETED,
    AUDIT_ACTIONS.USER_DELETED,
    AUDIT_ACTIONS.REPORT_EXPORTED,
    AUDIT_ACTIONS.DATA_EXPORTED,
    AUDIT_ACTIONS.SETTINGS_CHANGED,
  ];
  return criticalActions.includes(action);
}

/**
 * Formatter para relatórios de auditoria
 */
export function formatAuditAction(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    CUSTOMER_CREATED: 'Cliente criado',
    CUSTOMER_UPDATED: 'Cliente atualizado',
    CUSTOMER_DELETED: '🗑️ Cliente deletado',
    INVOICE_CREATED: 'Fatura criada',
    INVOICE_UPDATED: 'Fatura atualizada',
    INVOICE_DELETED: '🗑️ Fatura deletada',
    COLLECTION_PROMISED: 'Promessa de pagamento registrada',
    COLLECTION_COMMUNICATED: 'Comunicação enviada',
    REPORT_EXPORTED: '📥 Relatório exportado',
    DATA_EXPORTED: '📥 Dados exportados',
    USER_CREATED: 'Usuário criado',
    USER_UPDATED: 'Usuário atualizado',
    USER_DELETED: '🗑️ Usuário deletado',
    SETTINGS_CHANGED: '⚙️ Configurações alteradas',
  };
  return labels[action] || action;
}
