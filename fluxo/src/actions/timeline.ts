'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import type { TimelineEvent, TimelineEventType, TimelineCategory } from '@/types/timeline.types';

interface SessionUser {
  tenantId: string | null;
  id: string;
}

// ─── Label & Description helpers ───────────────────────────────────────────

const RULE_LABELS: Record<string, string> = {
  pre_due_3d: 'D-3 (Pré-vencimento)',
  due_today: 'D0 (Vencimento hoje)',
  overdue_1d: 'D+1 (1 dia em atraso)',
  overdue_3d: 'D+3 (3 dias em atraso)',
  overdue_7d: 'D+7 (7 dias em atraso)',
  overdue_15d: 'D+15 (15 dias em atraso)',
  custom: 'Cobrança customizada',
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp_manual: 'WhatsApp (link manual)',
  email_manual: 'E-mail (manual)',
  internal: 'Interno',
};

function ruleLabel(ruleType: string): string {
  return RULE_LABELS[ruleType] ?? ruleType;
}

function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

// ─── Individual event builders ──────────────────────────────────────────────

function buildInvoiceEvents(invoice: {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  createdAt: Date;
  status: string;
  paidAt?: Date | null;
  paidAmount?: number | null;
  canceledAt?: Date | null;
  cancelReason?: string | null;
  updatedAt: Date;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // INVOICE_CREATED
  events.push({
    id: `${invoice.id}-created`,
    type: 'INVOICE_CREATED',
    category: 'invoice',
    date: invoice.createdAt,
    label: 'Fatura emitida',
    description: `Fatura ${invoice.invoiceNumber} emitida no valor de ${fmt.format(invoice.amount)}, vencimento em ${new Intl.DateTimeFormat('pt-BR').format(invoice.dueDate)}.`,
    metadata: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount, invoiceId: invoice.id },
  });

  // INVOICE_DUE_TODAY
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const isOverdue = dueDate < now && invoice.status !== 'PAID' && invoice.status !== 'CANCELED';
  const isDueToday =
    dueDate.toDateString() === now.toDateString() && invoice.status !== 'PAID';

  if (isDueToday) {
    events.push({
      id: `${invoice.id}-due`,
      type: 'INVOICE_DUE_TODAY',
      category: 'invoice',
      date: dueDate,
      label: 'Vencimento hoje',
      description: `Fatura ${invoice.invoiceNumber} vence hoje — ${fmt.format(invoice.amount)}.`,
      metadata: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount, invoiceId: invoice.id },
    });
  } else if (isOverdue) {
    events.push({
      id: `${invoice.id}-overdue`,
      type: 'INVOICE_OVERDUE',
      category: 'invoice',
      date: dueDate,
      label: 'Fatura vencida',
      description: `Fatura ${invoice.invoiceNumber} venceu em ${new Intl.DateTimeFormat('pt-BR').format(dueDate)} sem pagamento.`,
      metadata: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount, invoiceId: invoice.id },
    });
  }

  // INVOICE_PAID
  if (invoice.status === 'PAID' && invoice.paidAt) {
    events.push({
      id: `${invoice.id}-paid`,
      type: 'INVOICE_PAID',
      category: 'payment',
      date: invoice.paidAt,
      label: 'Pagamento recebido',
      description: `Fatura ${invoice.invoiceNumber} baixada. Valor recebido: ${fmt.format(invoice.paidAmount ?? invoice.amount)}.`,
      metadata: { invoiceNumber: invoice.invoiceNumber, amount: invoice.paidAmount ?? invoice.amount, invoiceId: invoice.id },
    });
  }

  // INVOICE_CANCELED
  if (invoice.status === 'CANCELED' && invoice.canceledAt) {
    events.push({
      id: `${invoice.id}-canceled`,
      type: 'INVOICE_CANCELED',
      category: 'invoice',
      date: invoice.canceledAt,
      label: 'Fatura cancelada',
      description: `Fatura ${invoice.invoiceNumber} cancelada.${invoice.cancelReason ? ` Motivo: ${invoice.cancelReason}` : ''}`,
      metadata: { invoiceNumber: invoice.invoiceNumber, invoiceId: invoice.id },
    });
  }

  return events;
}

function buildCommLogEvents(log: {
  id: string;
  ruleType: string;
  channel: string;
  status: string;
  scheduledFor: Date;
  sentAt?: Date | null;
  createdAt: Date;
  invoiceId?: string | null;
}): TimelineEvent {
  const statusMap: Record<string, { type: TimelineEventType; label: string }> = {
    sent: { type: 'COMM_SENT', label: 'Comunicação enviada' },
    skipped: { type: 'COMM_SKIPPED', label: 'Comunicação ignorada' },
    failed: { type: 'COMM_FAILED', label: 'Falha no envio' },
    pending: { type: 'COMM_GENERATED', label: 'Comunicação gerada' },
  };

  const resolved = statusMap[log.status] ?? { type: 'COMM_GENERATED' as TimelineEventType, label: 'Comunicação' };

  return {
    id: `comm-${log.id}`,
    type: resolved.type,
    category: 'communication',
    date: log.sentAt ?? log.createdAt,
    label: resolved.label,
    description: `Régua: ${ruleLabel(log.ruleType)} — Canal: ${channelLabel(log.channel)}`,
    metadata: {
      ruleType: log.ruleType,
      channel: log.channel,
      status: log.status,
      invoiceId: log.invoiceId ?? undefined,
    },
  };
}

function buildPromiseEvents(promise: {
  id: string;
  status: string;
  amount: number;
  promisedDate: Date;
  createdAt: Date;
  invoiceId: string;
}): TimelineEvent[] {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const events: TimelineEvent[] = [];

  const typeMap: Record<string, { type: TimelineEventType; label: string }> = {
    pending: { type: 'PROMISE_CREATED', label: 'Promessa de pagamento' },
    fulfilled: { type: 'PROMISE_FULFILLED', label: 'Promessa cumprida' },
    broken: { type: 'PROMISE_BROKEN', label: 'Promessa quebrada' },
  };

  const resolved = typeMap[promise.status] ?? typeMap.pending;

  events.push({
    id: `promise-${promise.id}`,
    type: resolved.type,
    category: 'payment',
    date: promise.createdAt,
    label: resolved.label,
    description: `${fmt.format(promise.amount)} prometido para ${new Intl.DateTimeFormat('pt-BR').format(promise.promisedDate)}.`,
    metadata: { amount: promise.amount, invoiceId: promise.invoiceId },
  });

  return events;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getCustomerTimeline(customerId: string): Promise<TimelineEvent[]> {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const [invoices, commLogs, promises, notes] = await Promise.all([
    prisma.invoice.findMany({
      where: { customerId, tenantId },
      select: {
        id: true, invoiceNumber: true, amount: true, dueDate: true, createdAt: true,
        status: true, paidAt: true, paidAmount: true, canceledAt: true, cancelReason: true, updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.communicationLog.findMany({
      where: { customerId, tenantId },
      select: { id: true, ruleType: true, channel: true, status: true, scheduledFor: true, sentAt: true, createdAt: true, invoiceId: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.paymentPromise.findMany({
      where: { invoice: { customerId }, tenantId },
      select: { id: true, status: true, amount: true, promisedDate: true, createdAt: true, invoiceId: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.customerNote.findMany({
      where: { customerId, tenantId },
      select: { id: true, content: true, createdAt: true, user: { select: { fullName: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const events: TimelineEvent[] = [];

  for (const inv of invoices) {
    events.push(...buildInvoiceEvents(inv));
  }

  for (const log of commLogs) {
    events.push(buildCommLogEvents(log));
  }

  for (const promise of promises) {
    events.push(...buildPromiseEvents(promise));
  }

  for (const note of notes) {
    events.push({
      id: `note-${note.id}`,
      type: 'NOTE_ADDED',
      category: 'note',
      date: note.createdAt,
      label: 'Nota adicionada',
      description: note.content,
      metadata: { actorName: note.user?.fullName ?? 'Sistema' },
    });
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getInvoiceTimeline(invoiceId: string): Promise<TimelineEvent[]> {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const [invoice, commLogs, promises] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId, tenantId },
      select: {
        id: true, invoiceNumber: true, amount: true, dueDate: true, createdAt: true,
        status: true, paidAt: true, paidAmount: true, canceledAt: true, cancelReason: true, updatedAt: true,
      },
    }),
    prisma.communicationLog.findMany({
      where: { invoiceId, tenantId },
      select: { id: true, ruleType: true, channel: true, status: true, scheduledFor: true, sentAt: true, createdAt: true, invoiceId: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.paymentPromise.findMany({
      where: { invoiceId, tenantId },
      select: { id: true, status: true, amount: true, promisedDate: true, createdAt: true, invoiceId: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (!invoice) return [];

  const events: TimelineEvent[] = [];

  events.push(...buildInvoiceEvents(invoice));

  for (const log of commLogs) {
    events.push(buildCommLogEvents(log));
  }

  for (const promise of promises) {
    events.push(...buildPromiseEvents(promise));
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}
