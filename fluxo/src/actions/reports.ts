'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export type ReportMetrics = {
  totalReceivables: number;
  totalPaid: number;
  totalOverdue: number;
  
  statusDistribution: {
    name: string;
    value: number;
    color: string;
  }[];

  monthlyCashflow: {
    month: string;
    faturado: number;
    recebido: number;
  }[];
};

export async function getReportMetrics(): Promise<ReportMetrics | null> {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return null;
  }

  // Fetch all invoices for the last 6 months to guarantee fast in-memory aggregation
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const invoices = await prisma.invoice.findMany({
     where: { 
       tenantId,
       dueDate: { gte: sixMonthsAgo }
     },
     select: { amount: true, status: true, dueDate: true }
  });

  let totalReceivables = 0;
  let totalPaid = 0;
  let totalOverdue = 0;

  let pendingCount = 0;
  let paidCount = 0;
  let overdueCount = 0;
  let canceledCount = 0;

  const monthlyMap: Record<string, { faturado: number; recebido: number }> = {};

  // Initialize the last 6 months in the map to ensure chronological order in the chart
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
    monthlyMap[monthKey] = { faturado: 0, recebido: 0 };
  }

  invoices.forEach(inv => {
    // 1. KPI Totals
    totalReceivables += inv.amount;
    if (inv.status === 'paid') totalPaid += inv.amount;
    if (inv.status === 'overdue') totalOverdue += inv.amount;

    // 2. Status Distribution (Pie Chart counts)
    if (inv.status === 'pending') pendingCount += inv.amount;
    if (inv.status === 'paid') paidCount += inv.amount;
    if (inv.status === 'overdue') overdueCount += inv.amount;
    if (inv.status === 'canceled') canceledCount += inv.amount;

    // 3. Monthly Cashflow (Bar Chart)
    // Map the date to 'Jan', 'Fev' etc
    if (inv.dueDate) {
      const monthKey = inv.dueDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
      
      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].faturado += inv.amount;
        if (inv.status === 'paid') {
          monthlyMap[monthKey].recebido += inv.amount;
        }
      }
    }
  });

  const statusDistribution = [
    { name: 'À Vencer', value: pendingCount, color: '#6366f1' }, // Indigo
    { name: 'Liquidados', value: paidCount, color: '#10b981' }, // Emerald
    { name: 'Inadimplência', value: overdueCount, color: '#f43f5e' }, // Rose
    { name: 'Cancelados', value: canceledCount, color: '#94a3b8' }, // Slate
  ].filter(item => item.value > 0);

  const monthlyCashflow = Object.keys(monthlyMap).map(month => ({
    month,
    faturado: monthlyMap[month].faturado,
    recebido: monthlyMap[month].recebido
  }));

  return {
    totalReceivables,
    totalPaid,
    totalOverdue,
    statusDistribution,
    monthlyCashflow
  };
}
