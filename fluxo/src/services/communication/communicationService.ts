/**
 * communicationService.ts
 * Central orchestrator for the communication layer.
 *
 * FONTE ÚNICA DE VERDADE: este serviço agora lê a BillingFlowConfig ativa
 * do tenant — exatamente a mesma fonte que o cron (/api/cron) consome.
 * Isso elimina a duplicidade de regras entre o motor manual e o executor.
 *
 * Modos (COMMUNICATION_MODE):
 *   - "manual"       → gera CommunicationLog + link wa.me (Planner)
 *   - "whatsapp_api" → enfileira em MessageQueue + gera CommunicationLog como audit (Executor)
 *
 * Fallback: se o tenant não tiver BillingFlow ativo com regras v2,
 * usa collectionRules.ts (regras fixas) para garantir compatibilidade.
 */

import prisma from '@/lib/prisma';
import { normalizeBillingFlowConfig, type BillingFlowConfig } from '@/lib/billing-flow';
import { enqueueAndSend } from '@/lib/queue';
import { buildWhatsAppLink } from './whatsappLink';
import { getRuleForDiff, COLLECTION_RULES, type RuleType, type ChannelType } from './collectionRules';
import { generateMessage, formatBRL, formatDateBR, type MessageVars } from './messageGenerator';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LogMetadata {
  waLink?: string;
  daysOverdue?: number;
  phone?: string;
  email?: string;
  stageId?: string;
}

type CommunicationMode = 'manual' | 'whatsapp_api';

export interface InvoiceForLog {
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

export interface TenantForLog {
  id: string;
  name: string;
}

export interface GenerateResult {
  created: number;
  skipped: number;
  errors: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMode(): CommunicationMode {
  const raw = process.env.COMMUNICATION_MODE ?? 'manual';
  if (raw === 'whatsapp_api' || raw === 'manual') return raw;
  console.warn(`[CommunicationService] Unknown COMMUNICATION_MODE="${raw}", defaulting to "manual".`);
  return 'manual';
}

/**
 * Interpola variáveis {key} num template de string.
 * Compatível com os templates definidos em billing-flow.ts.
 */
function populateTemplate(
  template: string,
  vars: { nome: string; empresa: string; fatura: string; valor: string; vencimento: string; dias_atraso?: number }
): string {
  return template
    .replace(/\{nome\}/g, vars.nome)
    .replace(/\{empresa\}/g, vars.empresa)
    .replace(/\{fatura\}/g, vars.fatura)
    .replace(/\{valor\}/g, vars.valor)
    .replace(/\{vencimento\}/g, vars.vencimento)
    .replace(/\{dias_atraso\}/g, String(vars.dias_atraso ?? 0))
    .replace(/\{pix_copia_cola\}/g, '')
    .replace(/\{pix_block\}/g, '');
}

/**
 * Busca o BillingFlow ativo do tenant e normaliza via billing-flow.ts.
 * Retorna null se não houver flow ativo com config v2 (stages[]).
 */
async function getActiveBillingFlow(tenantId: string): Promise<BillingFlowConfig | null> {
  const flow = await prisma.billingFlow.findFirst({
    where: { tenantId, isActive: true },
    select: { rules: true },
  });
  if (!flow?.rules) return null;

  try {
    const parsed = JSON.parse(flow.rules);
    if (!Array.isArray(parsed?.stages)) return null;
    return normalizeBillingFlowConfig(parsed);
  } catch {
    return null;
  }
}

// ── Core ─────────────────────────────────────────────────────────────────────

/**
 * Run the Intelligent Collection Workflow for all active invoices of a tenant.
 *
 * Usa a BillingFlowConfig ativa do tenant como fonte de verdade de dias e templates.
 * Fallback: collectionRules.ts quando não há BillingFlow v2 configurado.
 *
 * Modo "manual":       gera CommunicationLog + link wa.me (Planner)
 * Modo "whatsapp_api": enfileira em MessageQueue via enqueueAndSend()
 *                      e registra CommunicationLog como audit trail (Executor)
 *
 * Idempotente: seguro de chamar diariamente.
 */
export async function generateCollectionLogs(
  tenant: TenantForLog,
  invoices: InvoiceForLog[]
): Promise<GenerateResult> {
  const mode = getMode();
  const result: GenerateResult = { created: 0, skipped: 0, errors: [] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Carregar régua: billing-flow (fonte única) ou fallback legacy ──────────
  const billingFlow = await getActiveBillingFlow(tenant.id);

  for (const invoice of invoices) {
    const invDate = new Date(invoice.dueDate);
    invDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - invDate.getTime()) / 86400000);

    const phone = invoice.customer.phone ?? '';
    const email = invoice.customer.email ?? '';

    const vars = {
      nome: invoice.customer.name,
      empresa: tenant.name,
      fatura: invoice.invoiceNumber,
      valor: formatBRL(invoice.amount),
      vencimento: formatDateBR(invoice.dueDate),
      dias_atraso: diffDays > 0 ? diffDays : undefined,
    };

    if (billingFlow) {
      // ── CAMINHO PRINCIPAL: régua da UI via billing-flow.ts ─────────────────
      for (const stage of billingFlow.stages) {
        if (!stage.active) continue;
        if (Number(stage.days) !== diffDays) continue;

        // WhatsApp
        if (stage.channels.whatsapp && phone) {
          const message = populateTemplate(stage.templates.whatsapp, vars);
          const waLink = buildWhatsAppLink(phone, message);
          const ruleType = `stage_${stage.id}` as RuleType;
          const channel: ChannelType = 'whatsapp_manual';

          const meta: LogMetadata = { daysOverdue: diffDays, phone, waLink, stageId: stage.id };

          await processEntry({
            mode, tenant, invoice, ruleType, channel, message, today, meta,
            enqueueParams: phone
              ? { channel: 'whatsapp' as const, to: phone, body: message, messageType: `Etapa ${stage.id}`, vars }
              : null,
          });
          result.created++;
        }

        // Email
        if (stage.channels.email && email) {
          const message = populateTemplate(stage.templates.email, vars);
          const ruleType = `stage_${stage.id}_email` as RuleType;
          const channel: ChannelType = 'email_manual';

          const meta: LogMetadata = { daysOverdue: diffDays, email, stageId: stage.id };

          await processEntry({
            mode, tenant, invoice, ruleType, channel, message, today, meta,
            enqueueParams: email
              ? { channel: 'email' as const, to: email, body: message, messageType: `Etapa ${stage.id}`, vars,
                  subject: `Cobrança: Fatura #${invoice.invoiceNumber} — ${vars.valor}` }
              : null,
          });
          result.created++;
        }
      }
    } else {
      // ── FALLBACK: collectionRules.ts (regras fixas) ────────────────────────
      const rule = getRuleForDiff(diffDays);
      if (!rule) continue;

      const message = generateMessage(rule.ruleType, vars as MessageVars);
      const waLink = phone ? buildWhatsAppLink(phone, message) : undefined;
      const meta: LogMetadata = { daysOverdue: diffDays, phone: phone || undefined, waLink };

      try {
        await processEntry({
          mode, tenant, invoice, ruleType: rule.ruleType, channel: rule.channel,
          message, today, meta,
          enqueueParams: phone
            ? { channel: 'whatsapp' as const, to: phone, body: message, messageType: rule.label, vars }
            : null,
        });
        result.created++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('P2002')) { result.skipped++; } else { result.errors.push(`Invoice ${invoice.id}: ${msg}`); }
      }
    }
  }

  return result;
}

// ── Internal helper ───────────────────────────────────────────────────────────

interface ProcessEntryParams {
  mode: CommunicationMode;
  tenant: TenantForLog;
  invoice: InvoiceForLog;
  ruleType: RuleType;
  channel: ChannelType;
  message: string;
  today: Date;
  meta: LogMetadata;
  enqueueParams: {
    channel: 'whatsapp' | 'email';
    to: string;
    body: string;
    subject?: string;
    messageType: string;
    vars: { valor: string; fatura: string };
  } | null;
}

async function processEntry({
  mode, tenant, invoice, ruleType, channel, message, today, meta, enqueueParams,
}: ProcessEntryParams): Promise<void> {
  if (mode === 'manual') {
    // ── Planner: gera CommunicationLog + link wa.me ─────────────────────────
    await prisma.communicationLog.upsert({
      where: {
        collection_log_idempotency: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          ruleType,
          channel,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        ruleType,
        channel,
        message,
        status: 'pending',
        scheduledFor: today,
        metadata: JSON.stringify(meta),
      },
    });
  } else if (mode === 'whatsapp_api' && enqueueParams) {
    // ── Executor: enfileira na MessageQueue e registra audit ─────────────────
    const sendResult = await enqueueAndSend({
      tenantId: tenant.id,
      customerId: invoice.customerId,
      invoiceId: invoice.id,
      channel: enqueueParams.channel,
      to: enqueueParams.to,
      body: enqueueParams.body,
      subject: enqueueParams.subject,
      messageType: enqueueParams.messageType,
      invoiceNumber: invoice.invoiceNumber,
      amount: enqueueParams.vars.valor,
    });

    // CommunicationLog como audit trail do disparo real
    await prisma.communicationLog.upsert({
      where: {
        collection_log_idempotency: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          ruleType,
          channel,
        },
      },
      update: { status: sendResult.sent ? 'sent' : 'pending', sentAt: sendResult.sent ? new Date() : null },
      create: {
        tenantId: tenant.id,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        ruleType,
        channel,
        message,
        status: sendResult.sent ? 'sent' : 'pending',
        scheduledFor: today,
        sentAt: sendResult.sent ? new Date() : null,
        metadata: JSON.stringify({ ...meta, communicationId: sendResult.communicationId }),
      },
    });
  }
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { COLLECTION_RULES, type RuleType, type ChannelType };
