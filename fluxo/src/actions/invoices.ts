'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';
import { revalidatePath } from 'next/cache';

interface SessionUser {
  tenantId: string | null;
  id: string;
  email: string;
  role: string;
}

export type GetInvoicesParams = {
  search?: string;
  status?: string;
  sortBy?: string; 
  dateRange?: string;
};

export async function getFilteredInvoices(params: GetInvoicesParams = {}) {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");

  const { search, status, sortBy, dateRange } = params;
  const whereClause: Record<string, any> = { tenantId };

  if (status && status !== 'all') whereClause.status = status;

  if (search && search.trim() !== '') {
    whereClause.OR = [
      { invoiceNumber: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { documentNumber: { contains: search } } }
    ];
  }

  if (dateRange && dateRange !== 'all') {
    const today = new Date();
    if (dateRange === '7days') {
      const past = new Date(today); past.setDate(today.getDate() - 7);
      whereClause.dueDate = { gte: past, lte: today };
    } else if (dateRange === 'next7days') {
      const future = new Date(today); future.setDate(today.getDate() + 7);
      whereClause.dueDate = { gte: today, lte: future };
    } else if (dateRange === 'last30days') {
      const past = new Date(today); past.setDate(today.getDate() - 30);
      whereClause.dueDate = { gte: past, lte: today };
    }
  }

  let orderByClause: any = { dueDate: 'asc' };
  if (sortBy) {
    switch (sortBy) {
      case 'value_desc': orderByClause = { balanceDue: 'desc' }; break;
      case 'value_asc':  orderByClause = { balanceDue: 'asc' };  break;
      case 'date_desc':  orderByClause = { dueDate: 'desc' };    break;
      case 'date_asc':   orderByClause = { dueDate: 'asc' };     break;
      case 'risk_desc':  orderByClause = [{ status: 'asc' }, { dueDate: 'asc' }]; break;
    }
  }

  return prisma.invoice.findMany({
    where: whereClause,
    include: {
      customer: { select: { name: true, documentNumber: true, email: true, phone: true } }
    },
    orderBy: orderByClause,
    take: 100
  });
}

export async function getInvoices() {
  return getFilteredInvoices();
}

// ── markInvoiceAsPaid ──────────────────────────────────────────────────────────
// FIX: added tenant isolation + Communication event so payment appears in /historico

export async function markInvoiceAsPaid(id: string) {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");

  // Fetch the invoice first to build the communication message
  const inv = await prisma.invoice.findFirst({
    where: { id, tenantId },          // tenant-isolated
    include: { customer: true }
  });
  if (!inv) throw new Error("Invoice not found or access denied");

  // Mark as paid
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: 'paid', balanceDue: 0 }
  });

  // Create a Communication event so the payment shows in /historico timeline
  const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  await prisma.communication.create({
    data: {
      tenantId,
      customerId: inv.customerId,
      invoiceId: id,
      channel: 'system',
      messageType: 'payment_confirmed',
      content: `✅ Pagamento confirmado manualmente.\nFatura #${inv.invoiceNumber} • ${fmtBRL.format(inv.amount)}\nBaixa realizada em ${new Date().toLocaleDateString('pt-BR')}.`,
      status: 'delivered',
    }
  });

  revalidatePath('/cobrancas');
  revalidatePath('/clientes');
  revalidatePath('/historico');
  revalidatePath('/');

  return { success: true, invoice: updated };
}

// ── pauseInvoice ───────────────────────────────────────────────────────────────

export async function pauseInvoice(id: string) {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");

  const inv = await prisma.invoice.findFirst({ where: { id, tenantId } });
  if (!inv) throw new Error("Invoice not found or access denied");

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: 'paused' }
  });

  revalidatePath('/cobrancas');
  return { success: true, invoice: updated };
}

// ── registerPromiseToPay ───────────────────────────────────────────────────────
// FIX: now creates a real PaymentPromise record (visible in /historico timeline)
// instead of mutating the invoice's dueDate (which was wrong)

export async function registerPromiseToPay(id: string, dateString: string) {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  let userId: string | undefined = (session?.user as SessionUser)?.id;
  if (!tenantId) throw new Error("Unauthorized");

  // Fallback userId
  if (!userId) {
    const tUser = await prisma.tenantUser.findFirst({ where: { tenantId } });
    userId = tUser?.userId;
  }

  const inv = await prisma.invoice.findFirst({ where: { id, tenantId } });
  if (!inv) throw new Error("Invoice not found or access denied");

  // Create the PaymentPromise record (shows in /historico)
  await prisma.paymentPromise.create({
    data: {
      tenantId,
      invoiceId: id,
      userId: userId!,
      amount: inv.balanceDue,
      promisedDate: new Date(dateString),
      notes: 'Promessa registrada via painel de cobranças.',
      status: 'pending',
    }
  });

  revalidatePath('/cobrancas');
  revalidatePath('/historico');
  return { success: true };
}

// ── deleteInvoice ──────────────────────────────────────────────────────────────

export async function deleteInvoice(id: string) {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");

  const inv = await prisma.invoice.findFirst({ where: { id, tenantId } });
  if (!inv) throw new Error("Invoice not found or access denied");

  await prisma.invoice.delete({ where: { id } });
  revalidatePath('/cobrancas');
  revalidatePath('/historico');
  revalidatePath('/');
  return { success: true };
}

// ── createInvoice ──────────────────────────────────────────────────────────────

export async function getCustomersForSelect() {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");
  return prisma.customer.findMany({
    where: { tenantId, status: 'active' },
    select: { id: true, name: true, documentNumber: true },
    orderBy: { name: 'asc' }
  });
}

export async function createInvoice(data: {
  customerId: string;
  amount: number;
  dueDate: string;
  description?: string;
}) {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");

  const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

  const newInvoice = await prisma.invoice.create({
    data: {
      tenantId,
      customerId: data.customerId,
      invoiceNumber,
      amount: data.amount,
      balanceDue: data.amount,
      dueDate: new Date(data.dueDate),
      status: 'pending',
    }
  });

  revalidatePath('/cobrancas');
  revalidatePath('/clientes');
  revalidatePath('/historico');
  revalidatePath('/');
  return { success: true, invoice: newInvoice };
}
