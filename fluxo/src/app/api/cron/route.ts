import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { enqueueAndSend } from '@/lib/queue';

export const dynamic = 'force-dynamic';

/**
 * Billing Engine Cron — runs once per day.
 * Supports both:
 *   - Dunning v1 legacy format: { preAtivado, diaAtivado, posAtivado, ... }
 *   - Dunning v2 stages format: { stages: [{ id, isActive, days, channels, ... }] }
 *
 * Messages are now actually sent via Resend (email) and Z-API (WhatsApp).
 * Fail-safe: if provider is unconfigured, Communication stays 'queued' — no false positives.
 */
export async function GET(request: Request) {
  // ── Security Guard ────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: invalid or missing CRON_SECRET header.' },
        { status: 401 }
      );
    }
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeFlows = await prisma.billingFlow.findMany({
      where: { isActive: true }
    });

    let sentMessages = 0;
    let queuedMessages = 0;
    let processedInvoices = 0;

    for (const flow of activeFlows) {
      if (!flow.rules) continue;

      let rules: any;
      try { rules = JSON.parse(flow.rules); } catch { continue; }

      const isV2 = Array.isArray(rules.stages);

      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId: flow.tenantId,
          status: { in: ['pending', 'overdue'] }
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
          for (const stage of (rules.stages as any[])) {
            if (!stage.isActive) continue;

            const stageDays: number = Number(stage.days ?? 0);
            const shouldFire = stage.id === 'pre'
              ? (diffDays < 0 && Math.abs(diffDays) === stageDays)
              : (diffDays === stageDays);

            if (!shouldFire) continue;

            const stageLabel = `Etapa ${stage.id} (D${stage.id === 'pre' ? '-' : '+'}${stageDays})`;
            let fired = false;

            if (stage.channels?.whatsapp?.active && contactPhone) {
              const template = stage.channels.whatsapp.template ?? '';
              const body = populateTemplate(template, inv, 'whatsapp');
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
              fired = true;
            }

            if (stage.channels?.email?.active && contactEmail) {
              const template = stage.channels.email.template ?? '';
              const body = populateTemplate(template, inv, 'email');
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
              fired = true;
            }

            // If stage is active but no explicit channel config, send email by default
            if (!fired && contactEmail) {
              const body = `Lembrete automático: fatura #${inv.invoiceNumber} — ${amountStr}`;
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
    console.error('[CRON ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
