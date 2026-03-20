'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export async function getDashboardMetrics() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error("Unauthorized Access: No active B2B Tenant found.");
  }

  // Get Invoices for the Tenant
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    select: { amount: true, balanceDue: true, status: true }
  });

  const totalReceivables = invoices.reduce((acc: number, inv: any) => acc + inv.balanceDue, 0);
  
  const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue');
  const pastDueAmount = overdueInvoices.reduce((acc: number, inv: any) => acc + inv.balanceDue, 0);
  
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
  const receivedAmount = paidInvoices.reduce((acc: number, inv: any) => acc + (inv.amount - inv.balanceDue), 0);
  
  const pendingInvoices = invoices.filter((i: any) => i.status === 'pending');
  
  const defaultRate = totalReceivables > 0 
    ? ((pastDueAmount / totalReceivables) * 100).toFixed(1) 
    : "0.0";

  return {
    totalReceivables,
    pastDueAmount,
    receivedAmount,
    defaultRate,
    counts: {
      total: invoices.length,
      overdue: overdueInvoices.length,
      paid: paidInvoices.length,
      pending: pendingInvoices.length
    }
  };
}
