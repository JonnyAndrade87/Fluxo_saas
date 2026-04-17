import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { enqueueAndSend } from '@/lib/queue';
import { requireInternalEndpointAuth } from '@/lib/internalEndpointAuth';
import { normalizeBillingFlowConfig } from '@/lib/billing-flow';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limit store
const cronRateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isCronRateLimited(key: string, limit: number = 10, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const entry = cronRateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    cronRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count < limit) {
    entry.count++;
    return false;
  }

  return true;
}

/**
 * Billing Engine Cron — runs once per day.
 * Supports both:
 *   - Dunning v1 legacy format: { preAtivado, diaAtivado, posAtivado, ... }
 *   - Dunning v2 normalized format: { stages: [{ id, active, days, channels, templates, ... }] }
 *
 * Messages are now actually sent via Resend (email) and Meta WhatsApp Cloud API.
 * Fail-safe: if provider is unconfigured, Communication stays 'queued' — no false positives.
 */
export async function GET(request: Request) {
  const auth = requireInternalEndpointAuth(request);
  if (!auth.ok) {
    console.warn('[CRON] Internal authentication rejected');
    return auth.response;
  }

  // ── Rate limiting (prevent abuse) ──────────────────────────────────────
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  if (isCronRateLimited(`cron:${clientIp}`, 10, 3600000)) { // Max 10 calls per hour
    console.warn(`[CRON] Rate limit exceeded for IP: ${clientIp}`);
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded - cron can only run 10 times per hour' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Hora atual em America/Sao_Paulo para comparar com stage.time
    const nowBR = new Date();
    const currentHourBR = parseInt(
      nowBR.toLocaleTimeString('pt-BR', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' })
    );
    const currentMinuteBR = parseInt(
      nowBR.toLocaleTimeString('pt-BR', { minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' })
    );
    const currentTotalMinutes = currentHourBR * 60 + currentMinuteBR;

    const mode = process.env.COMMUNICATION_MODE ?? 'manual';
    console.log(`[CRON] Starting execution. Mode: ${mode}. Hour (BR): ${currentHourBR}:${String(currentMinuteBR).padStart(2,'0')}`);

    const activeFlows = await prisma.billingFlow.findMany({
      where: { isActive: true }
    });

    // ── Garbage Collection: Rate Limits ──────────────────────────────────────
    const deletedLimitRecords = await prisma.rateLimit.deleteMany({
      where: { resetAt: { lt: new Date() } }
    });
    console.log(`[CRON] GC cleared ${deletedLimitRecords.count} expired rate limits.`);

    // ── Garbage Collection: Audit Logs (90-day retention) ────────────────────
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deletedAuditRecords = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } }
    });
    console.log(`[CRON] GC cleared ${deletedAuditRecords.count} audit logs older than 90 days.`);

    let sentMessages = 0;
    let queuedMessages = 0;
    let processedInvoices = 0;

    for (const flow of activeFlows) {
      if (!flow.rules) continue;

      let rules: any;
      try { rules = JSON.parse(flow.rules); } catch { continue; }

      const isV2 = Array.isArray(rules.stages);
      const normalizedRules = isV2 ? normalizeBillingFlowConfig(rules) : null;

      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId: flow.tenantId,
          status: { in: ['OPEN', 'PROMISE_TO_PAY'] }
        },
        include: {
          customer: {
            include: {
              financialContacts: { where: { isPrimary: true }, take: 1 }
            }
          }
        }
      });

      processedInvoices += invoices.length;

      for (const inv of invoices) {
        const invDate = new Date(inv.dueDate);
        invDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - invDate.getTime()) / 86400000);

        const customer = inv.customer;
        // Resolve contact: prefer financial contact, fall back to customer email/phone
        const primaryContact = customer.financialContacts[0];
        const contactEmail = primaryContact?.email || customer.email || '';
        const contactPhone = primaryContact?.phone || customer.phone || '';

        const amountStr = formatBRL(inv.amount);
        const dueDateStr = new Date(inv.dueDate).toLocaleDateString('pt-BR');

        if (isV2) {
          // ── Dunning v2 ─────────────────────────────────────────────────────
          for (const stage of normalizedRules!.stages) {
            if (!stage.active) continue;

            const stageDays: number = Number(stage.days ?? 0);
            const dayMatches = diffDays === stageDays;

            // ── Verificação de janela de horário ──────────────────────────
            // stage.time formato: "HH:MM" (ex: "10:00", "08:30")
            // Dispara se horário atual estiver dentro de ±30min do configurado.
            // Se stage.time não estiver definido, dispara sem restrição de horário.
            const timeMatches = (() => {
              if (!stage.time || typeof stage.time !== 'string') return true;
              const [hStr, mStr] = stage.time.split(':');
              const stageMinutes = parseInt(hStr) * 60 + parseInt(mStr || '0');
              return Math.abs(currentTotalMinutes - stageMinutes) <= 30;
            })();

            const shouldFire = dayMatches && timeMatches;

            if (!shouldFire) continue;

            const stageLabel = `Etapa ${stage.id} (D${stageDays > 0 ? `+${stageDays}` : stageDays})`;
            let fired = false;

            if (stage.channels.whatsapp && contactPhone) {
              const template = stage.templates.whatsapp;
              const body = populateTemplate(template, inv, 'whatsapp');
              if (mode !== 'manual') {
                const r = await enqueueAndSend({
                  tenantId: flow.tenantId,
                  customerId: inv.customerId,
                  invoiceId: inv.id,
                  channel: 'whatsapp',
                  to: contactPhone,
                  body,
                  messageType: stageLabel,
                  customerName: customer.name,
                  invoiceNumber: inv.invoiceNumber,
                  amount: amountStr,
                  dueDate: dueDateStr,
                });
                r.sent ? sentMessages++ : queuedMessages++;
              } else {
                queuedMessages++; // Simula processamento em manual mode
              }
              fired = true;
            }

            if (stage.channels.email && contactEmail) {
              const template = stage.templates.email;
              const body = populateTemplate(template, inv, 'email');
              if (mode !== 'manual') {
                const r = await enqueueAndSend({
                  tenantId: flow.tenantId,
                  customerId: inv.customerId,
                  invoiceId: inv.id,
                  channel: 'email',
                  to: contactEmail,
                  subject: `Cobrança: Fatura #${inv.invoiceNumber} — ${amountStr}`,
                  body,
                  messageType: stageLabel,
                  customerName: customer.name,
                  invoiceNumber: inv.invoiceNumber,
                  amount: amountStr,
                  dueDate: dueDateStr,
                });
                r.sent ? sentMessages++ : queuedMessages++;
              } else {
                queuedMessages++;
              }
              fired = true;
            }

            // If stage is active but no explicit channel config, send email by default
            if (!fired && contactEmail) {
              const body = `Lembrete automático: fatura #${inv.invoiceNumber} — ${amountStr}`;
              if (mode !== 'manual') {
                const r = await enqueueAndSend({
                  tenantId: flow.tenantId,
                  customerId: inv.customerId,
                  invoiceId: inv.id,
                  channel: 'email',
                  to: contactEmail,
                  subject: `Cobrança: Fatura #${inv.invoiceNumber}`,
                  body,
                  messageType: stageLabel,
                  customerName: customer.name,
                  invoiceNumber: inv.invoiceNumber,
                  amount: amountStr,
                  dueDate: dueDateStr,
                });
                r.sent ? sentMessages++ : queuedMessages++;
              } else {
                queuedMessages++;
              }
            }
          }
        } else {
          // ── Dunning v1 legacy ───────────────────────────────────────────────
          const content = rules.emailText || 'Mensagem Padrão de Cobrança';

          let messageType = '';
          if (rules.preAtivado && diffDays < 0 && Math.abs(diffDays) === Number(rules.preDias)) {
            messageType = `Lembrete D-${rules.preDias}`;
          } else if (rules.diaAtivado && diffDays === 0) {
            messageType = 'Aviso de Vencimento (D+0)';
          } else if (rules.posAtivado && diffDays > 0) {
            const posDays = String(rules.posDias || '').split(',').map(s => Number(s.trim()));
            if (posDays.includes(diffDays)) messageType = `Atraso D+${diffDays}`;
          }

          if (messageType && contactEmail) {
            if (mode !== 'manual') {
              const r = await enqueueAndSend({
                tenantId: flow.tenantId,
                customerId: inv.customerId,
                invoiceId: inv.id,
                channel: 'email',
                to: contactEmail,
                subject: `Cobrança: Fatura #${inv.invoiceNumber}`,
                body: content,
                messageType,
                customerName: customer.name,
                invoiceNumber: inv.invoiceNumber,
                amount: amountStr,
                dueDate: dueDateStr,
              });
              r.sent ? sentMessages++ : queuedMessages++;
            } else {
              queuedMessages++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedFlows: activeFlows.length,
      processedInvoices,
      sentMessages,
      queuedMessages,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[CRON] Internal execution error');
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function populateTemplate(template: string, inv: any, channel: string): string {
  if (!template) {
    return `Cobrança automática — Fatura #${inv.invoiceNumber} • ${formatBRL(inv.amount)} • Vence ${new Date(inv.dueDate).toLocaleDateString('pt-BR')}`;
  }
  return template
    .replace(/\{nome\}/gi, inv.customer?.name ?? 'Cliente')
    .replace(/\{fatura\}/gi, inv.invoiceNumber ?? inv.id)
    .replace(/\{valor\}/gi, formatBRL(inv.amount))
    .replace(/\{vencimento\}/gi, new Date(inv.dueDate).toLocaleDateString('pt-BR'))
    .replace(/\{empresa\}/gi, 'Fluxo Financeiro');
}
