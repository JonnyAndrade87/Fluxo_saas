'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueueStats {
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  dlq: number;
  stuck: number;
}

export interface DlqItem {
  id: string;
  tenantId: string;
  channel: string;
  to: string;
  subject: string | null;
  status: string;
  retryCount: number;
  maxRetries: number;
  errorLog: string | null;
  fallbackFrom: string | null;
  createdAt: Date;
  processingStartedAt: Date | null;
  metadata: string | null;
}

const STUCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// ─── Server Actions ────────────────────────────────────────────────────────────

/**
 * Get queue stats and DLQ items for the current tenant.
 */
export async function getQueueStats(): Promise<{ stats: QueueStats; dlqItems: DlqItem[] } | null> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return null;

  const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);

  const [queued, sending, sent, failed, dlq, stuck, dlqItems] = await Promise.all([
    prisma.messageQueue.count({ where: { tenantId, status: 'queued', isDlq: false } }),
    prisma.messageQueue.count({ where: { tenantId, status: 'sending' } }),
    prisma.messageQueue.count({ where: { tenantId, status: 'sent' } }),
    prisma.messageQueue.count({ where: { tenantId, status: 'failed' } }),
    prisma.messageQueue.count({ where: { tenantId, isDlq: true } }),
    prisma.messageQueue.count({ where: { tenantId, status: 'sending', processingStartedAt: { lt: stuckCutoff } } }),
    prisma.messageQueue.findMany({
      where: { tenantId, isDlq: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return {
    stats: { queued, sending, sent, failed, dlq, stuck },
    dlqItems: dlqItems as DlqItem[],
  };
}

/**
 * Requeue a dead-letter item so it can be retried.
 * Resets: isDlq=false, retryCount=0, status='queued', nextRetryAt=null
 */
export async function requeueDead(itemId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return { success: false, error: 'Unauthorized' };

  try {
    const item = await prisma.messageQueue.findFirst({
      where: { id: itemId, tenantId, isDlq: true },
    });
    if (!item) return { success: false, error: 'Item not found or not in DLQ' };

    await prisma.messageQueue.update({
      where: { id: itemId },
      data: {
        isDlq: false,
        retryCount: 0,
        status: 'queued',
        nextRetryAt: null,
        errorLog: null,
        processingStartedAt: null,
      },
    });

    // Also reset the associated Communication if present
    const meta = item.metadata ? JSON.parse(item.metadata) : {};
    if (meta.communicationId) {
      await prisma.communication.update({
        where: { id: meta.communicationId },
        data: { status: 'queued', errorMessage: null, retryCount: 0 },
      }).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
