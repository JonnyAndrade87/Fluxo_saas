'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';
import { revalidatePath } from 'next/cache';

export type GetInvoicesParams = {
  search?: string;
  status?: string;
  sortBy?: string; 
  dateRange?: string;
};

export async function getFilteredInvoices(params: GetInvoicesParams = {}) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error("Unauthorized Access: No active B2B Tenant found.");
  }

  const { search, status, sortBy, dateRange } = params;

  // Construir a query de "where"
  const whereClause: any = { tenantId };

  if (status && status !== 'all') {
    whereClause.status = status;
  }

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

  // Construir a query de "orderBy"
  let orderByClause: any = { dueDate: 'asc' };
  
  if (sortBy) {
    switch (sortBy) {
      case 'value_desc': orderByClause = { balanceDue: 'desc' }; break;
      case 'value_asc': orderByClause = { balanceDue: 'asc' }; break;
      case 'date_desc': orderByClause = { dueDate: 'desc' }; break;
      case 'date_asc': orderByClause = { dueDate: 'asc' }; break;
      case 'risk_desc': 
          // Risco é calculado na aplicação, não tem como ordenar perfeitamente pelo banco SQLite sem custom logic
          // Vamos aproximar risco pela Data de Vencimento mais antiga e Status Overdue.
          orderByClause = [ { status: 'asc' }, { dueDate: 'asc' } ]; 
          break;
    }
  }

  // Fetch Invoices
  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      customer: {
        select: {
          name: true,
          documentNumber: true
        }
      }
    },
    orderBy: orderByClause,
    take: 100 // Hard limit to avoid blowing up memory for now
  });

  return invoices;
}

// Retém o original para evitar quebrar componentes antigos temporariamente
export async function getInvoices() {
  return await getFilteredInvoices();
}

/** 
 * Mutators Rápidos 
 */
export async function markInvoiceAsPaid(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  // O ideal seria checar se a fatura pertence ao tenant logado.
  const updated = await prisma.invoice.update({
    where: { id },
    data: { 
       status: 'paid',
       balanceDue: 0 
    }
  });
  revalidatePath('/cobrancas');
  return { success: true, invoice: updated };
}

export async function pauseInvoice(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: 'paused' } // Permite strings customizadas
  });
  revalidatePath('/cobrancas');
  return { success: true, invoice: updated };
}

export async function registerPromiseToPay(id: string, dateString: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  // Como não há schema estrito para promessa, podemos atualizar description ou custom field
  // Por agora ajustamos o status para "pending" (se estava overdue) e movemos a data de vencimento ou criamos anotação.
  const updated = await prisma.invoice.update({
    where: { id },
    data: { 
       dueDate: new Date(dateString),
       status: 'pending' // Volta a ficar verde/amarela
    }
  });
  revalidatePath('/cobrancas');
  return { success: true, invoice: updated };
}

export async function deleteInvoice(id: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    await prisma.invoice.delete({
      where: { id }
    });
    revalidatePath('/cobrancas');
    return { success: true };
}
