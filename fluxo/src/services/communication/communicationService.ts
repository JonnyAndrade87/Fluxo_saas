/**
 * communicationService.ts
 * Central orchestrator for the communication layer.
 *
 * Reads COMMUNICATION_MODE from environment:
 *   - "manual"        → generates CommunicationLog + WhatsApp wa.me link only
 *   - "whatsapp_api"  → (future) will call the real WhatsApp Cloud API sender
 *
 * The existing WhatsApp API infrastructure (src/lib/messaging/whatsapp.ts,
 * src/lib/queue.ts, api/webhooks/whatsapp, api/cron) is NOT called or modified here.
 * This service is plug-compatible: swapping COMMUNICATION_MODE activates the real sender.
 */

import prisma from '@/lib/db';
import { generateMessage, formatBRL, formatDateBR, type MessageVars } from './messageGenerator';
import { buildWhatsAppLink } from './whatsappLink';
import { getRuleForDiff, COLLECTION_RULES, type RuleType, type ChannelType } from './collectionRules';

// ── Type for the CommunicationLog metadata JSON ──────────────────────────────
interface LogMetadata {
  waLink?: string;
  daysOverdue?: number;
  phone?: string;
  pixCopyCola?: string;
}

// ── Mode detection ─────────────────────────────────────────────────────────────
type CommunicationMode = 'manual' | 'whatsapp_api';

function getMode(): CommunicationMode {
  const raw = process.env.COMMUNICATION_MODE ?? 'manual';
  if (raw === 'whatsapp_api' || raw === 'manual') return raw;
  console.warn(`[CommunicationService] Unknown COMMUNICATION_MODE="${raw}", defaulting to "manual".`);
  return 'manual';
}

// ── Invoice shape (minimal for generation) ────────────────────────────────────
interface InvoiceForLog {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
}

interface TenantForLog {
  id: string;
  name: string;
}

export interface GenerateResult {
  created: number;
  skipped: number;
  errors: string[];
}

/**
 * Run the Intelligent Collection Workflow for all active invoices of a tenant.
 * Creates CommunicationLog entries (idempotent — safe to run daily).
 */
export async function generateCollectionLogs(
  tenant: TenantForLog,
  invoices: InvoiceForLog[]
): Promise<GenerateResult> {
  const mode = getMode();
  const result: GenerateResult = { created: 0, skipped: 0, errors: [] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const invoice of invoices) {
    const invDate = new Date(invoice.dueDate);
    invDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - invDate.getTime()) / 86400000);

    const rule = getRuleForDiff(diffDays);
    if (!rule) continue;

    const vars: MessageVars = {
      nome: invoice.customer.name,
      empresa: tenant.name,
      fatura: invoice.invoiceNumber,
      valor: formatBRL(invoice.amount),
      vencimento: formatDateBR(invoice.dueDate),
      dias_atraso: diffDays > 0 ? diffDays : undefined,
    };

    const message = generateMessage(rule.ruleType, vars);
    const phone = invoice.customer.phone ?? '';
    const waLink = phone ? buildWhatsAppLink(phone, message) : undefined;

    const metadata: LogMetadata = {
      daysOverdue: diffDays,
      phone: phone || undefined,
      waLink,
    };

    try {
      if (mode === 'manual') {
        await prisma.communicationLog.upsert({
          where: {
            collection_log_idempotency: {
              tenantId: tenant.id,
              invoiceId: invoice.id,
              ruleType: rule.ruleType,
              channel: rule.channel,
            },
          },
          update: {}, // Do not overwrite if already exists
          create: {
            tenantId: tenant.id,
            customerId: invoice.customerId,
            invoiceId: invoice.id,
            ruleType: rule.ruleType,
            channel: rule.channel,
            message,
            status: 'pending',
            scheduledFor: today,
            metadata: JSON.stringify(metadata),
          },
        });
        result.created++;
      } else {
        // Future: COMMUNICATION_MODE=whatsapp_api
        // Call the existing real sender here without touching this file's logic
        // import { enqueueAndSend } from '@/lib/queue';
        // await enqueueAndSend({ ... })
        result.skipped++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // P2002 = unique constraint (already exists) — treat as skip
      if (msg.includes('P2002')) {
        result.skipped++;
      } else {
        result.errors.push(`Invoice ${invoice.id}: ${msg}`);
      }
    }
  }

  return result;
}

/**
 * Re-export rule metadata for use in the UI without re-importing collectionRules.
 */
export { COLLECTION_RULES, type RuleType, type ChannelType };
