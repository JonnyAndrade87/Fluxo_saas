/**
 * Message Queue Processor
 *
 * Central function that processes queued messages:
 * 1. Reads MessageQueue items with status 'queued'
 * 2. Sends via email.ts or whatsapp.ts
 * 3. Updates MessageQueue.status + Communication.status + externalId
 * 4. Retry logic: retryCount++, mark 'failed' if exhausted
 */

import prisma from '@/lib/db';
import { sendEmail, buildBillingEmailHtml } from './messaging/email';
import { sendWhatsApp } from './messaging/whatsapp';

export interface ProcessQueueResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Enqueue a message and immediately try to send it.
 * Creates both a MessageQueue record and a Communication record.
 */
export async function enqueueAndSend(params: {
  tenantId: string;
  customerId: string;
  invoiceId?: string;
  channel: 'email' | 'whatsapp';
  to: string;                     // email or phone
  subject?: string;
  body: string;
  messageType: string;
  customerName?: string;
  invoiceNumber?: string;
  amount?: string;
  dueDate?: string;
}): Promise<{ communicationId: string; sent: boolean; error?: string }> {
  
  // Create the Communication record with status 'queued'
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
    }
  });

  // Create the MessageQueue record
  const queueItem = await prisma.messageQueue.create({
    data: {
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
      }),
      status: 'queued',
    }
  });

  // Immediately attempt to send
  const result = await trySend({
    channel: params.channel,
    to: params.to,
    subject: params.subject,
    body: params.body,
    customerName: params.customerName,
    invoiceNumber: params.invoiceNumber,
    amount: params.amount,
    dueDate: params.dueDate,
  });

  // Update records based on result
  if (result.success) {
    await prisma.messageQueue.update({
      where: { id: queueItem.id },
      data: { status: 'sent', sentAt: new Date() }
    });
    await prisma.communication.update({
      where: { id: comm.id },
      data: { status: 'sent', externalId: result.messageId }
    });
    return { communicationId: comm.id, sent: true };
  } else {
    // Leave in queue for retry
    await prisma.messageQueue.update({
      where: { id: queueItem.id },
      data: { retryCount: 1, errorLog: result.error }
    });
    await prisma.communication.update({
      where: { id: comm.id },
      data: { status: 'queued', errorMessage: result.error, retryCount: 1 }
    });
    return { communicationId: comm.id, sent: false, error: result.error };
  }
}

/**
 * Process all queued messages (for retry endpoint).
 */
export async function processQueue(maxItems = 50): Promise<ProcessQueueResult> {
  const result: ProcessQueueResult = { processed: 0, sent: 0, failed: 0, errors: [] };

  const items = await prisma.messageQueue.findMany({
    where: {
      status: 'queued',
      retryCount: { lt: 3 }, // maxRetries default = 3
    },
    orderBy: { createdAt: 'asc' },
    take: maxItems,
  });

  for (const item of items) {
    result.processed++;
    
    // Mark as 'sending' to prevent double-processing
    await prisma.messageQueue.update({
      where: { id: item.id },
      data: { status: 'sending' }
    });

    const metadata = item.metadata ? JSON.parse(item.metadata) : {};
    
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
        data: { status: 'sent', sentAt: new Date() }
      });
      if (metadata.communicationId) {
        await prisma.communication.update({
          where: { id: metadata.communicationId },
          data: { status: 'sent', externalId: sendResult.messageId }
        }).catch(() => {}); // best-effort
      }
    } else {
      result.failed++;
      result.errors.push(`[${item.id}] ${sendResult.error}`);
      const newRetryCount = item.retryCount + 1;
      const exhausted = newRetryCount >= item.maxRetries;
      
      await prisma.messageQueue.update({
        where: { id: item.id },
        data: {
          status: exhausted ? 'failed' : 'queued',
          retryCount: newRetryCount,
          errorLog: sendResult.error,
        }
      });
      if (metadata.communicationId) {
        await prisma.communication.update({
          where: { id: metadata.communicationId },
          data: {
            status: exhausted ? 'failed' : 'queued',
            errorMessage: sendResult.error,
            retryCount: newRetryCount,
          }
        }).catch(() => {});
      }
    }
  }

  return result;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function trySend(params: {
  channel: 'email' | 'whatsapp';
  to: string;
  subject?: string;
  body: string;
  customerName?: string;
  invoiceNumber?: string;
  amount?: string;
  dueDate?: string;
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
    return sendWhatsApp({ to: params.to, message: params.body });
  }
}
