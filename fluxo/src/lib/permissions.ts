/**
 * FOCO 4 — Permissões Multiusuário
 * Sistema simplificado de controle de acesso por perfil (Roles Unification)
 *
 * Perfis oficiais consolidados: admin | operator | viewer
 * - Sem RBAC granular, apenas controle por módulo e ação crítica
 * - Auditoria básica integrada
 */

import { auth } from '../../auth';

export type UserRole = 'admin' | 'operator' | 'viewer';

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

  const rawRole = user.role ?? 'operator';
  const role: UserRole = ['admin', 'operator', 'viewer'].includes(rawRole) 
    ? (rawRole as UserRole)
    : 'operator'; // Trata qualquer inconsistência ou fallback

  return {
    userId: user.id ?? user.sub ?? '',
    tenantId: user.tenantId,
    role,
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
 * Matriz de Permissões Simplificada e Unificada (admin | operator | viewer)
 * 
 * ┌─────────────┬───────────┬──────────┬────────┐
 * │ Módulo      │ Admin     │ Operator │ Viewer │
 * ├─────────────┼───────────┼──────────┼────────┤
 * │ Dashboard   │ ✅ Leitura│ ✅ Leitura│ ✅ Leit│
 * │ Clientes    │ ✅ CRUD   │ ✅ CRU   │ ✅ Leit│
 * │ Faturas     │ ✅ CRUD   │ ✅ CRU   │ ✅ Leit│
 * │ Relatórios  │ ✅ Todos  │ ✅ Todos │ ✅ Leit│
 * │ Cobranças   │ ✅ Gerenc │ ✅ Exec  │ ✅ Leit│
 * │ Configurar  │ ✅ Sim    │ ❌       │ ❌     │
 * │ Auditoria   │ ✅ Sim    │ ❌       │ ❌     │
 * └─────────────┴───────────┴──────────┴────────┘
 */
export const PERMISSIONS_MATRIX = {
  // Dashboard
  'dashboard:view': ['admin', 'operator', 'viewer'],

  // Clientes
  'customers:read': ['admin', 'operator', 'viewer'],
  'customers:create': ['admin', 'operator'],
  'customers:update': ['admin', 'operator'],
  'customers:delete': ['admin'],

  // Faturas
  'invoices:read': ['admin', 'operator', 'viewer'],
  'invoices:create': ['admin', 'operator'],
  'invoices:update': ['admin', 'operator'],
  'invoices:delete': ['admin'],
  'invoices:export': ['admin', 'operator', 'viewer'],

  // Relatórios
  'reports:read': ['admin', 'operator', 'viewer'],
  'reports:export': ['admin', 'operator', 'viewer'],

  // Previsão de Caixa
  'forecast:read': ['admin', 'operator', 'viewer'],

  // Cobranças (tarefas, comunicações)
  'collections:read': ['admin', 'operator', 'viewer'],
  'collections:create': ['admin', 'operator'],
  'collections:update': ['admin', 'operator'],
  'collections:execute': ['admin', 'operator'], // Enviar mensagens, fazer promessas
  'collections:delete': ['admin'],

  // Automação
  'automation:read': ['admin', 'operator', 'viewer'],
  'automation:configure': ['admin'],

  // Configurações
  'settings:read': ['admin', 'operator', 'viewer'],
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
 * Descrições de Responsabilidades por Perfil Unificado
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Proprietário/Gestor • Acesso irrestrito a todas as funcionalidades estratégicas, de equipe e de remoção',
  operator: 'Operador Diário • Criação de faturas, recebimentos, clientes e relatórios financeiros (Sem acesso para deletar entidades críticas)',
  viewer: 'Cosultor / Leitor • Acesso estrito somente leitura (não pode alterar, criar ou enviar cobranças)',
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
