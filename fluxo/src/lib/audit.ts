/**
 * FOCO 4 — Auditoria Básica
 * Registra ações críticas para conformidade e rastreabilidade
 */

import prisma from '@/lib/db';
import { shouldAudit, formatAuditAction, type AuditAction, type UserRole } from '@/lib/permissions';

export interface LogAuditParams {
  tenantId: string;
  userId: string | null;
  userRole: UserRole | null;
  action: AuditAction;
  entityType: string; // 'invoice', 'customer', 'user', etc
  entityId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registrar uma ação na trilha de auditoria
 * Apenas registra ações críticas (shouldAudit)
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  // Apenas log ações críticas para não sobrecarregar o banco
  if (!shouldAudit(params.action)) {
    return;
  }

  try {
    await prisma.activityLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    // Não falhar a operação principal se a auditoria falhar
    console.error('[AUDIT ERROR]', error);
  }
}

/**
 * Buscar logs de auditoria (apenas ADMIN)
 */
export async function getAuditLogs(
  tenantId: string,
  limit = 50,
  offset = 0
): Promise<Array<{
  id: string;
  timestamp: Date;
  user: string | null;
  action: string;
  actionLabel: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
}>> {
  const logs = await prisma.activityLog.findMany({
    where: { tenantId },
    include: {
      user: {
        select: { fullName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return logs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt,
    user: log.user?.fullName || log.user?.email || null,
    action: log.action,
    actionLabel: formatAuditAction(log.action as AuditAction),
    entity: log.entityType,
    entityId: log.entityId,
    details: log.metadata ? JSON.parse(log.metadata) : null,
  }));
}

/**
 * Contar total de logs (para paginação)
 */
export async function countAuditLogs(tenantId: string): Promise<number> {
  return await prisma.activityLog.count({ where: { tenantId } });
}

/**
 * Buscar logs por ação específica
 */
export async function getAuditLogsByAction(
  tenantId: string,
  action: AuditAction
): Promise<Array<{
  id: string;
  timestamp: Date;
  user: string | null;
  entityId: string;
}>> {
  const logs = await prisma.activityLog.findMany({
    where: { tenantId, action },
    include: {
      user: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return logs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt,
    user: log.user?.fullName || null,
    entityId: log.entityId,
  }));
}

/**
 * Helper para extrair informações de erro para metadata
 */
export function captureErrorMetadata(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }
  return {
    errorMessage: String(error),
  };
}
