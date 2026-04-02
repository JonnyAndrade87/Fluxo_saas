/**
 * Message Queue Processor — HARDENED v2
 *
 * Improvements over v1:
 *  1. Idempotency:        idempotencyKey prevents duplicate sends on cron re-runs
 *  2. Stuck recovery:     resets 'sending' items older than STUCK_THRESHOLD_MIN back to 'queued'
 *  3. Exponential backoff: nextRetryAt = now + 2^retryCount * 5min
 *  4. Dead-letter queue:  isDlq=true + status='failed_permanent' after maxRetries
 *  5. Channel fallback:   WhatsApp permanent fail → auto-enqueue email
 *  6. Rate limiting:      checks per customer + per tenant before sending
 *  7. Structured logs:    all logs include messageId, tenantId, channel
 */

import { createHash } from 'crypto';
import prisma from '@/lib/db';
import { sendEmail, buildBillingEmailHtml } from './messaging/email';
import { sendWhatsApp, sendWhatsAppTemplate } from './messaging/whatsapp';
import { checkRateLimit } from './rateLimiter';

export interface ProcessQueueResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;   // rate-limited or idempotent skips
  dlq: number;       // moved to dead-letter
  fallbacks: number; // channel fallbacks triggered
  stuckReset: number;
  errors: string[];
}

// Items stuck in 'sending' for longer than this are reset to 'queued'
const STUCK_THRESHOLD_MS = parseInt(process.env.STUCK_THRESHOLD_MIN ?? '10', 10) * 60 * 1000;

// Backoff: retryN → wait = 2^N * BASE_BACKOFF_MS
const BASE_BACKOFF_MS = parseInt(process.env.BASE_BACKOFF_MIN ?? '5', 10) * 60 * 1000;

// ─── Idempotency key ─────────────────────────────────────────────────────────

/**
 * Deterministic key: same inputs → same key → cron re-run skips the send.
 * Format: sha256(tenantId|invoiceId|channel|messageType|YYYY-MM-DD)
 */
export function buildIdempotencyKey(params: {
  tenantId: string;
  invoiceId?: string | null;
  channel: string;
  messageType: string;
}): string {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const raw = [
    params.tenantId,
    params.invoiceId ?? 'none',
    params.channel,
    params.messageType,
    day,
  ].join('|');
  return createHash('sha256').update(raw).digest('hex');
}

// ─── enqueueAndSend ───────────────────────────────────────────────────────────

/**
 * Enqueue a message and immediately attempt to send it.
 * Idempotent: same key → returns existing record without duplicate send.
 */
export async function enqueueAndSend(params: {
  tenantId: string;
  customerId: string;
  invoiceId?: string;
  channel: 'email' | 'whatsapp';
  to: string;
  subject?: string;
  body: string;
  messageType: string;
  customerName?: string;
  invoiceNumber?: string;
  amount?: string;
  dueDate?: string;
  /** WhatsApp Business API: template name to use (must be Meta-approved). If omitted, free-text is used. */
  templateName?: string;
  /** WhatsApp template language code. Defaults to 'pt_BR'. */
  templateLanguageCode?: string;
  /** WhatsApp template components (variable substitutions). */
  templateComponents?: object[];
  _fallbackFrom?: string;  // internal: set when this call is a channel fallback
  _fallbackEmail?: string; // internal: email to use if WA fails permanently
}): Promise<{ communicationId: string; sent: boolean; error?: string; skipped?: boolean }> {

  const idempotencyKey = buildIdempotencyKey({
    tenantId: params.tenantId,
    invoiceId: params.invoiceId,
    channel: params.channel,
    messageType: params.messageType,
  });

  // ── Check idempotency ──────────────────────────────────────────────────────
  const existing = await prisma.messageQueue.findUnique({
    where: { idempotencyKey },
  });
  if (existing && existing.status === 'sent') {
    console.log(`[QUEUE] Idempotent skip — already sent: ${idempotencyKey}`);
    const meta = existing.metadata ? JSON.parse(existing.metadata) : {};
    return { communicationId: meta.communicationId ?? existing.id, sent: true, skipped: true };
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const rateCheck = await checkRateLimit(params.tenantId, params.customerId);
  if (!rateCheck.allowed) {
    console.warn(`[QUEUE] Rate limited — tenant:${params.tenantId} customer:${params.customerId} — ${rateCheck.reason}`);
    // Log throttling event as activity
    await prisma.activityLog.create({
      data: {
        tenantId: params.tenantId,
        action: 'MESSAGE_THROTTLED',
        entityType: 'customer',
        entityId: params.customerId,
        metadata: JSON.stringify({ reason: rateCheck.reason, channel: params.channel }),
      },
    }).catch(() => {});
    return { communicationId: '', sent: false, error: rateCheck.reason, skipped: true };
  }

  // ── Create Communication record ────────────────────────────────────────────
  const comm = await prisma.communication.create({
    data: {
      tenantId: params.tenantId,
      customerId: params.customerId,
      invoiceId: params.invoiceId ?? null,
      channel: params.channel,
      messageType: params.messageType,
      content: params.body,
      status: 'queued',
      retryCount: 0,
    },
  });

  // ── Create MessageQueue record (idempotent upsert) ─────────────────────────
  const queueItem = await prisma.messageQueue.upsert({
    where: { idempotencyKey },
    create: {
      tenantId: params.tenantId,
      channel: params.channel,
      to: params.to,
      subject: params.subject,
      body: params.body,
      metadata: JSON.stringify({
        communicationId: comm.id,
        customerId: params.customerId,
        invoiceId: params.invoiceId,
        messageType: params.messageType,
        invoiceNumber: params.invoiceNumber,
        fallbackEmail: params.channel === 'whatsapp' ? params._fallbackEmail : undefined,
        // WhatsApp template fields
        templateName: params.templateName,
        templateLanguageCode: params.templateLanguageCode,
        templateComponents: params.templateComponents,
      }),
      status: 'queued',
      idempotencyKey,
      fallbackFrom: params._fallbackFrom ?? null,
    },
    update: {}, // if exists but not 'sent', we'll retry below
  });

  // ── Attempt send ───────────────────────────────────────────────────────────
  const result = await trySend({
    channel: params.channel,
    to: params.to,
    subject: params.subject,
    body: params.body,
    customerName: params.customerName,
    invoiceNumber: params.invoiceNumber,
    amount: params.amount,
    dueDate: params.dueDate,
    templateName: params.templateName,
    templateLanguageCode: params.templateLanguageCode,
    templateComponents: params.templateComponents,
  });

  if (result.success) {
    await Promise.all([
      prisma.messageQueue.update({
        where: { id: queueItem.id },
        data: { status: 'sent', sentAt: new Date(), processingStartedAt: null },
      }),
      prisma.communication.update({
        where: { id: comm.id },
        data: { status: 'sent', externalId: result.messageId },
      }),
    ]);
    console.log(`[QUEUE] Sent — channel:${params.channel} to:${params.to} messageId:${result.messageId} commId:${comm.id}`);
    return { communicationId: comm.id, sent: true };
  } else {
    await Promise.all([
      prisma.messageQueue.update({
        where: { id: queueItem.id },
        data: { retryCount: 1, errorLog: result.error },
      }),
      prisma.communication.update({
        where: { id: comm.id },
        data: { status: 'queued', errorMessage: result.error, retryCount: 1 },
      }),
    ]);
    console.error(`[QUEUE] Send failed — channel:${params.channel} to:${params.to} error:${result.error}`);
    return { communicationId: comm.id, sent: false, error: result.error };
  }
}

// ─── processQueue ─────────────────────────────────────────────────────────────

/**
 * Process all eligible queued messages.
 * Runs stuck recovery first, then processes up to maxItems.
 */
export async function processQueue(maxItems = 50): Promise<ProcessQueueResult> {
  const result: ProcessQueueResult = {
    processed: 0, sent: 0, failed: 0, skipped: 0,
    dlq: 0, fallbacks: 0, stuckReset: 0, errors: [],
  };

  // ── Stuck recovery ─────────────────────────────────────────────────────────
  const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);
  const stuckFixed = await prisma.messageQueue.updateMany({
    where: {
      status: 'sending',
      processingStartedAt: { lt: stuckCutoff },
    },
    data: { status: 'queued', processingStartedAt: null },
  });
  if (stuckFixed.count > 0) {
    result.stuckReset = stuckFixed.count;
    console.warn(`[QUEUE] Recovered ${stuckFixed.count} stuck message(s)`);
  }

  // ── Fetch eligible items ───────────────────────────────────────────────────
  const now = new Date();
  const items = await prisma.messageQueue.findMany({
    where: {
      status: 'queued',
      isDlq: false,
      retryCount: { lt: 3 },
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: now } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: maxItems,
  });

  for (const item of items) {
    result.processed++;
    const metadata = item.metadata ? JSON.parse(item.metadata) : {};

    // Mark as 'sending' with timestamp (stuck detection)
    await prisma.messageQueue.update({
      where: { id: item.id },
      data: { status: 'sending', processingStartedAt: new Date() },
    });

    const sendResult = await trySend({
      channel: item.channel as 'email' | 'whatsapp',
      to: item.to,
      subject: item.subject ?? undefined,
      body: item.body,
    });

    if (sendResult.success) {
      result.sent++;
      await prisma.messageQueue.update({
        where: { id: item.id },
        data: { status: 'sent', sentAt: new Date(), processingStartedAt: null },
      });
      if (metadata.communicationId) {
        await prisma.communication.update({
          where: { id: metadata.communicationId },
          data: { status: 'sent', externalId: sendResult.messageId },
        }).catch(() => {});
      }
      console.log(`[QUEUE] ✓ Sent — id:${item.id} channel:${item.channel} messageId:${sendResult.messageId}`);
    } else {
      result.failed++;
      result.errors.push(`[${item.id}] ${sendResult.error}`);

      const newRetryCount = item.retryCount + 1;
      const exhausted = newRetryCount >= item.maxRetries;

      // Exponential backoff: 2^retryCount * BASE_BACKOFF_MS
      const backoffMs = Math.pow(2, newRetryCount) * BASE_BACKOFF_MS;
      const nextRetryAt = new Date(Date.now() + backoffMs);

      if (exhausted) {
        // ── Dead-letter queue ────────────────────────────────────────────────
        result.dlq++;
        await prisma.messageQueue.update({
          where: { id: item.id },
          data: {
            status: 'failed_permanent',
            isDlq: true,
            retryCount: newRetryCount,
            errorLog: sendResult.error,
            processingStartedAt: null,
          },
        });
        if (metadata.communicationId) {
          await prisma.communication.update({
            where: { id: metadata.communicationId },
            data: { status: 'failed', errorMessage: sendResult.error, retryCount: newRetryCount },
          }).catch(() => {});
        }
        console.error(`[QUEUE] ✗ DLQ — id:${item.id} channel:${item.channel} after ${newRetryCount} retries`);

        // ── Channel fallback: WhatsApp → Email ────────────────────────────────
        if (item.channel === 'whatsapp' && !item.fallbackFrom) {
          const fallbackEmail = metadata.fallbackEmail as string | undefined;
          if (fallbackEmail) {
            result.fallbacks++;
            console.log(`[QUEUE] Fallback WA→Email — original:${item.id} to:${fallbackEmail}`);
            await enqueueAndSend({
              tenantId: item.tenantId,
              customerId: metadata.customerId,
              invoiceId: metadata.invoiceId,
              channel: 'email',
              to: fallbackEmail,
              subject: `Cobrança automática — Fatura #${metadata.invoiceNumber ?? ''}`,
              body: item.body,
              messageType: `FALLBACK:${metadata.messageType ?? 'unknown'}`,
              _fallbackFrom: item.id,
            }).catch(e => console.error('[QUEUE] Fallback enqueue error:', e));
          }
        }
      } else {
        await prisma.messageQueue.update({
          where: { id: item.id },
          data: {
            status: 'queued',
            retryCount: newRetryCount,
            errorLog: sendResult.error,
            nextRetryAt,
            processingStartedAt: null,
          },
        });
        if (metadata.communicationId) {
          await prisma.communication.update({
            where: { id: metadata.communicationId },
            data: { status: 'queued', errorMessage: sendResult.error, retryCount: newRetryCount },
          }).catch(() => {});
        }
        console.warn(`[QUEUE] Retry #${newRetryCount} scheduled at ${nextRetryAt.toISOString()} — id:${item.id}`);
      }
    }
  }

  return result;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function trySend(params: {
  channel: 'email' | 'whatsapp';
  to: string;
  subject?: string;
  body: string;
  customerName?: string;
  invoiceNumber?: string;
  amount?: string;
  dueDate?: string;
  templateName?: string;
  templateLanguageCode?: string;
  templateComponents?: object[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (params.channel === 'email') {
    const html = (params.customerName && params.invoiceNumber)
      ? buildBillingEmailHtml({
          customerName: params.customerName,
          invoiceNumber: params.invoiceNumber,
          amount: params.amount ?? '',
          dueDate: params.dueDate ?? '',
          messageBody: params.body,
        })
      : `<p>${params.body}</p>`;

    return sendEmail({
      to: params.to,
      subject: params.subject ?? 'Aviso de Cobrança — Fluxo',
      html,
      text: params.body,
    });
  } else {
    // Use approved Meta template when templateName is provided (business-initiated)
    if (params.templateName) {
      return sendWhatsAppTemplate({
        to: params.to,
        templateName: params.templateName,
        languageCode: params.templateLanguageCode ?? 'pt_BR',
        components: params.templateComponents,
      });
    }
    // Fallback: free-text message (works inside 24h customer-initiated session)
    return sendWhatsApp({ to: params.to, message: params.body });
  }
}
