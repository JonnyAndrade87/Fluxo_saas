'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export async function getDashboardMetrics() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error('Unauthorized');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // 1. Core Totais
  const [totalPendingResult, totalOverdueResult, dueTodayResult, expectedThisWeekResult] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId, status: 'pending' },
      _sum: { balanceDue: true }
    }),
    prisma.invoice.aggregate({
      where: { tenantId, status: 'overdue' },
      _sum: { balanceDue: true }
    }),
    prisma.invoice.aggregate({
      // Vence estritamente hoje
      where: { 
        tenantId, 
        status: 'pending',
        dueDate: { gte: today, lt: tomorrow }
      },
      _sum: { balanceDue: true }
    }),
    prisma.invoice.aggregate({
      // Vence nos próximos 7 dias (excluindo hoje)
      where: { 
        tenantId, 
        status: 'pending',
        dueDate: { gte: tomorrow, lt: nextWeek }
      },
      _sum: { balanceDue: true }
    })
  ]);

  const totalPending = totalPendingResult._sum.balanceDue || 0;
  const totalOverdue = totalOverdueResult._sum.balanceDue || 0;
  const dueToday = dueTodayResult._sum.balanceDue || 0;
  const expectedThisWeek = expectedThisWeekResult._sum.balanceDue || 0;

  // 2. Fila de Prioridades (Críticos)
  // Boletos vencidos, ordenados primeiro por maior valor "balanceDue" desc e datas mais antigas.
  const priorityInvoicesRaw = await prisma.invoice.findMany({
    where: { tenantId, status: 'overdue' },
    orderBy: [
      { balanceDue: 'desc' },
      { dueDate: 'asc' }
    ],
    take: 8,
    include: {
      customer: { select: { name: true, documentNumber: true } }
    }
  });

  const priorityList = priorityInvoicesRaw.map(inv => {
    // Calcular "Dias de Atraso"
    const diffTime = Math.abs(today.getTime() - inv.dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Nível de Risco baseado no atraso e valor
    let riskLevel: 'high' | 'medium' | 'critical' = 'medium';
    if (diffDays > 30 || inv.balanceDue > 10000) riskLevel = 'high';
    if (diffDays > 60 || inv.balanceDue > 25000) riskLevel = 'critical';

    return {
      id: inv.id,
      customerName: inv.customer.name,
      amount: inv.balanceDue,
      dueDate: inv.dueDate,
      daysOverdue: diffDays,
      riskLevel
    };
  });

  // 3. Distribuição por Faixa de Atraso
  const overdueAll = await prisma.invoice.findMany({
    where: { tenantId, status: 'overdue' },
    select: { balanceDue: true, dueDate: true }
  });

  let riskDistribution = {
    '1_15_days': 0,
    '16_30_days': 0,
    '31_60_days': 0,
    '60_plus_days': 0
  };

  overdueAll.forEach(inv => {
    const diffTime = Math.abs(today.getTime() - inv.dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 15) riskDistribution['1_15_days'] += inv.balanceDue;
    else if (diffDays <= 30) riskDistribution['16_30_days'] += inv.balanceDue;
    else if (diffDays <= 60) riskDistribution['31_60_days'] += inv.balanceDue;
    else riskDistribution['60_plus_days'] += inv.balanceDue;
  });

  // 4. Fluxo de Caixa Recente (para gráfico simples de histórico/30 dias)
  const recentInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['paid', 'pending', 'overdue'] },
      dueDate: { gte: thirtyDaysAgo }
    },
    orderBy: { dueDate: 'asc' },
    select: { dueDate: true, amount: true, status: true }
  });

  const cashflowMap = new Map();
  recentInvoices.forEach(inv => {
    const dateStr = inv.dueDate.toISOString().split('T')[0];
    if (!cashflowMap.has(dateStr)) {
      cashflowMap.set(dateStr, { date: dateStr, recebido: 0, projetado: 0 });
    }
    const dayData = cashflowMap.get(dateStr);
    
    if (inv.status === 'paid') {
      dayData.recebido += inv.amount;
    } else {
      dayData.projetado += inv.amount;
    }
  });

  const cashflowTrend = Array.from(cashflowMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalPending,
    totalOverdue,
    dueToday,
    expectedThisWeek,
    priorityList,
    riskDistribution,
    cashflowTrend
  };
}
