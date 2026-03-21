import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Billing Engine Cron — runs once per day.
 * Supports both:
 *   - Dunning v1 legacy format: { preAtivado, diaAtivado, posAtivado, ... }
 *   - Dunning v2 stages format: { stages: [{ id, isActive, days, channels, ... }] }
 */
export async function GET(request: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeFlows = await prisma.billingFlow.findMany({
      where: { isActive: true }
    });

    let sentMessages = 0;
    let processedInvoices = 0;

    for (const flow of activeFlows) {
      if (!flow.rules) continue;

      let rules: any;
      try { rules = JSON.parse(flow.rules); } catch { continue; }

      // Detect which format of rules we have
      const isV2 = Array.isArray(rules.stages);

      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId: flow.tenantId,
          // Paid/canceled invoices are automatically excluded — dunning stops
          status: { in: ['pending', 'overdue'] }
        },
        include: { customer: true }
      });

      processedInvoices += invoices.length;

      for (const inv of invoices) {
        const invDate = new Date(inv.dueDate);
        invDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - invDate.getTime()) / 86400000);
        // diffDays < 0 = pre-due  |  0 = due today  |  > 0 = overdue

        if (isV2) {
          // ── Dunning v2: iterate all active stages ─────────────────────────
          for (const stage of (rules.stages as any[])) {
            if (!stage.isActive) continue;

            const stageDays: number = Number(stage.days ?? 0);
            const shouldFire = stage.id === 'pre'
              ? (diffDays < 0 && Math.abs(diffDays) === stageDays)
              : (diffDays === stageDays);

            if (!shouldFire) continue;

            // Determine active channels for this stage
            const channels: string[] = [];
            if (stage.channels?.whatsapp?.active) channels.push('whatsapp');
            if (stage.channels?.email?.active) channels.push('email');

            for (const channel of channels) {
              const template = stage.channels?.[channel]?.template ?? '';
              const populated = populateTemplate(template, inv, channel);
              await createCommunication(
                flow.tenantId, inv.customerId, inv.id,
                channel, `Etapa ${stage.id} (D${stage.id === 'pre' ? '-' : '+'}${stageDays})`,
                populated
              );
              sentMessages++;
            }

            // If no channels explicitly set but stage is active, fire email by default
            if (channels.length === 0) {
              await createCommunication(
                flow.tenantId, inv.customerId, inv.id,
                'email', `Etapa ${stage.id}`,
                `Lembrete automático: fatura #${inv.invoiceNumber} — ${formatBRL(inv.amount)}`
              );
              sentMessages++;
            }
          }
        } else {
          // ── Dunning v1 legacy ─────────────────────────────────────────────
          const content = rules.emailText || 'Mensagem Padrão de Cobrança';

          if (rules.preAtivado && diffDays < 0 && Math.abs(diffDays) === Number(rules.preDias)) {
            await createCommunication(flow.tenantId, inv.customerId, inv.id, 'email', `Lembrete D-${rules.preDias}`, content);
            sentMessages++;
          } else if (rules.diaAtivado && diffDays === 0) {
            await createCommunication(flow.tenantId, inv.customerId, inv.id, 'email', 'Aviso de Vencimento (D+0)', content);
            sentMessages++;
          } else if (rules.posAtivado && diffDays > 0) {
            const posDays = String(rules.posDias || '').split(',').map(s => Number(s.trim()));
            if (posDays.includes(diffDays)) {
              await createCommunication(flow.tenantId, inv.customerId, inv.id, 'email', `Atraso D+${diffDays}`, content);
              sentMessages++;
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
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error('[CRON ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
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
    .replace(/\{empresa\}/gi, 'Fluxo Financeiro');  // cedente = SaaS sender
}

async function createCommunication(
  tenantId: string,
  customerId: string,
  invoiceId: string,
  channel: string,
  messageType: string,
  content: string
) {
  await prisma.communication.create({
    data: {
      tenantId,
      customerId,
      invoiceId,
      channel,
      messageType,
      content,
      status: 'delivered',
    }
  });
}
