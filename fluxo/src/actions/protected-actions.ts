/**
 * FOCO 4 — Proteção de Ações Críticas
 * Server Actions com validação de permissão centralizada
 */

'use server';

import { requireAuth, requireAuthFresh, type UserRole, canPerformDestructiveAction, type AuditAction } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export interface ProtectedActionContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/**
 * Middleware de proteção: validar autenticação e permissão
 */
export async function checkAccess(
  requiredPermissions: (keyof typeof import('@/lib/permissions').PERMISSIONS_MATRIX)[],
  isDestructive = false
): Promise<ProtectedActionContext> {
  // Validate auth using fresh DB state if action is destructive or explicitly requested
  const auth = isDestructive ? await requireAuthFresh() : await requireAuth();

  // Validar permissões
  const { hasPermission: checkPerm } = await import('@/lib/permissions');
  const hasAllAccess = requiredPermissions.every((perm) =>
    checkPerm(auth.role, perm)
  );

  if (!hasAllAccess) {
    throw new Error(
      `FORBIDDEN: Missing required permissions. Required: ${requiredPermissions.join(', ')}`
    );
  }

  // Se for ação destrutiva, só admin pode fazer
  if (isDestructive && !canPerformDestructiveAction(auth.role)) {
    throw new Error('FORBIDDEN: Only admins can perform destructive actions.');
  }

  return {
    userId: auth.userId,
    tenantId: auth.tenantId,
    role: auth.role,
  };
}

/**
 * Helper para executar ação com auditoria automática
 */
export async function executeWithAudit<T>(
  params: {
    action: AuditAction;
    entityType: string;
    entityId: string;
    requiredPermissions: (keyof typeof import('@/lib/permissions').PERMISSIONS_MATRIX)[];
    isDestructive?: boolean;
    description?: string;
  },
  handler: (context: ProtectedActionContext) => Promise<T>
): Promise<T> {
  // Verificar acesso
  const context = await checkAccess(params.requiredPermissions, params.isDestructive);

  try {
    // Executar ação
    const result = await handler(context);

    // Auditar
    await logAudit({
      tenantId: context.tenantId,
      userId: context.userId,
      userRole: context.role,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
    });

    return result;
  } catch (error) {
    // Auditar erro em operações destrutivas
    if (params.isDestructive) {
      await logAudit({
        tenantId: context.tenantId,
        userId: context.userId,
        userRole: context.role,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: `FALHOU: ${params.description || ''}`,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => {
        /* Falha silenciosa em auditoria */
      });
    }
    throw error;
  }
}
