import { auth } from '../../auth';
import prisma from '@/lib/prisma';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/**
 * Asserts the request is authenticated and returns the auth context.
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await auth();
  const user = session?.user as any;

  if (!user?.tenantId) {
    throw new Error('UNAUTHORIZED: No active session or tenant.');
  }

  const rawRole = user.role;
  if (!rawRole || !['admin', 'operator', 'viewer'].includes(rawRole)) {
    throw new Error(`FORBIDDEN: Papel inválido ou legado detectado ('${rawRole}').`);
  }

  return {
    userId: user.id ?? user.sub ?? '',
    tenantId: user.tenantId,
    role: rawRole as UserRole,
  };
}

/**
 * requireAuthFresh — always reads the database.
 */
export async function requireAuthFresh(): Promise<AuthContext & { mfaEnabled: boolean }> {
  const ctx = await requireAuth();
  
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      isActive: true,
      mfaEnabled: true,
      tenants: {
        where: { tenantId: ctx.tenantId },
        select: { role: true },
        take: 1
      }
    }
  });

  if (!user) {
    throw new Error('UNAUTHORIZED: User not found in database.');
  }

  if (!user.isActive) {
    throw new Error('ACCOUNT_INACTIVE');
  }

  const liveRole = user.tenants[0]?.role as UserRole;
  if (!liveRole) {
    throw new Error('FORBIDDEN: No permission for this tenant.');
  }

  return {
    ...ctx,
    role: liveRole,
    mfaEnabled: user.mfaEnabled
  };
}

/**
 * Asserts the authenticated user has one of the required roles.
 */
export function requireRole(allowed: UserRole[], ctx: AuthContext): void {
  if (!allowed.includes(ctx.role)) {
    throw new Error(
      `FORBIDDEN: Required role [${allowed.join('|')}], got '${ctx.role}'.`
    );
  }
}

/**
 * Matriz de Permissões Simplificada e Unificada
 */
export const PERMISSIONS_MATRIX = {
  'dashboard:view': ['admin', 'operator', 'viewer'],
  'customers:read': ['admin', 'operator', 'viewer'],
  'customers:create': ['admin', 'operator'],
  'customers:update': ['admin', 'operator'],
  'customers:delete': ['admin'],
  'invoices:read': ['admin', 'operator', 'viewer'],
  'invoices:create': ['admin', 'operator'],
  'invoices:update': ['admin', 'operator'],
  'invoices:delete': ['admin'],
  'invoices:export': ['admin', 'operator', 'viewer'],
  'reports:read': ['admin', 'operator', 'viewer'],
  'reports:export': ['admin', 'operator', 'viewer'],
  'forecast:read': ['admin', 'operator', 'viewer'],
  'collections:read': ['admin', 'operator', 'viewer'],
  'collections:create': ['admin', 'operator'],
  'collections:update': ['admin', 'operator'],
  'collections:execute': ['admin', 'operator'],
  'collections:delete': ['admin'],
  'automation:read': ['admin', 'operator', 'viewer'],
  'automation:configure': ['admin'],
  'settings:read': ['admin', 'operator', 'viewer'],
  'settings:update': ['admin'],
  'billing:read': ['admin'],
  'billing:configure': ['admin'],
  'audit:read': ['admin'],
  'users:read': ['admin'],
  'users:create': ['admin'],
  'users:update': ['admin'],
  'users:delete': ['admin'],
} as const;

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Proprietário/Gestor • Acesso irrestrito',
  operator: 'Operador Diário',
  viewer: 'Cosultor / Leitor',
};

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
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED: 'CUSTOMER_DELETED',
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_UPDATED: 'INVOICE_UPDATED',
  INVOICE_DELETED: 'INVOICE_DELETED',
  COLLECTION_PROMISED: 'COLLECTION_PROMISED',
  COLLECTION_COMMUNICATED: 'COLLECTION_COMMUNICATED',
  REPORT_EXPORTED: 'REPORT_EXPORTED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE: 'AUTH_LOGIN_FAILURE',
  AUTH_MFA_SETUP: 'AUTH_MFA_SETUP',
  AUTH_MFA_VERIFIED: 'AUTH_MFA_VERIFIED',
  AUTH_MFA_FAILED: 'AUTH_MFA_FAILED',
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
    AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
    AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
    AUDIT_ACTIONS.AUTH_MFA_SETUP,
    AUDIT_ACTIONS.AUTH_MFA_VERIFIED,
    AUDIT_ACTIONS.AUTH_MFA_FAILED,
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
    AUTH_LOGIN_SUCCESS: '🔐 Login bem-sucedido',
    AUTH_LOGIN_FAILURE: '❌ Falha de login local',
    AUTH_MFA_SETUP: '🛡️ MFA Configurado',
    AUTH_MFA_VERIFIED: '✅ MFA Verificado',
    AUTH_MFA_FAILED: '⚠️ Falha no MFA',
  };
  return labels[action] || action;
}

export * from './permissions-shared';
