'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';
import { getRiskScoreForCustomer } from './risk-score';

export async function getDashboardMetrics() {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;

    if (!tenantId || !userId) {
      throw new Error('Unauthorized');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // 1. KPIs
  const [
    totalPendingRaw,
    totalOverdueRaw,
    dueNext7DaysRaw,
    paidThisMonthRaw
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId, status: { in: ['OPEN', 'PROMISE_TO_PAY'] }, dueDate: { gte: today } },
      _sum: { updatedAmount: true }
    }),
    prisma.invoice.aggregate({
      where: { tenantId, status: { in: ['OPEN', 'PROMISE_TO_PAY'] }, dueDate: { lt: today } },
      _sum: { updatedAmount: true }
    }),
    (prisma.invoice.aggregate as any)({
      where: { 
        tenantId, 
        status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
        dueDate: { gte: today, lte: next7Days }
      },
      _sum: { updatedAmount: true }
    }),
    (prisma.invoice.aggregate as any)({
      where: {
        tenantId,
        status: 'PAID',
        updatedAt: { gte: firstDayOfMonth }
      },
      _sum: { paidAmount: true }
    })
  ]);

  const totalPending = totalPendingRaw._sum.updatedAmount || 0;
  const totalOverdue = totalOverdueRaw._sum.updatedAmount || 0;
  const dueNext7Days = dueNext7DaysRaw._sum.updatedAmount || 0;
  const paidThisMonth = paidThisMonthRaw._sum.amount || 0;

  const totalEmitted = totalPending + totalOverdue;
  const defaultRate = totalEmitted > 0 ? (totalOverdue / totalEmitted) * 100 : 0;

  // Clientes críticos: clientes com faturas em atraso > 60 dias
  const criticalThresholdDate = new Date(today);
  criticalThresholdDate.setDate(today.getDate() - 60);

  const criticalCustomers = await prisma.invoice.groupBy({
    by: ['customerId'],
    where: {
      tenantId,
      status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
      dueDate: { lt: criticalThresholdDate }
    }
  });
  const criticalCustomersCount = criticalCustomers.length;

  // 2. Próximos Vencimentos (Títulos a vencer, order by dueDate, highlight highs)
  const upcomingInvoicesRaw = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
      dueDate: { gte: today, lte: next7Days }
    },
    orderBy: [
      { dueDate: 'asc' },
      { amount: 'desc' }
    ],
    take: 10,
    include: { customer: { select: { name: true } } }
  });

  const upcomingDues = upcomingInvoicesRaw.map((inv: any) => ({
    id: inv.id,
    customerName: inv.customer?.name || 'Cliente',
    amount: inv.updatedAmount || inv.amount,
    dueDate: inv.dueDate,
    isHighValue: (inv.updatedAmount || inv.amount) > 5000
  }));

  // 3. Tarefas do dia
  const todaysTasksRaw = await prisma.task.findMany({
    where: {
      tenantId,
      assigneeId: userId,
      status: 'pending',
      dueDate: { lte: endOfToday }
    },
    include: { customer: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
    take: 15
  });
  const todaysTasks = todaysTasksRaw.map(t => ({
    id: t.id,
    title: t.title,
    customerName: t.customer.name,
    dueDate: t.dueDate,
    overdue: t.dueDate < today
  }));

  // 4. Alertas Críticos
  const alerts: Array<{id: string, type: 'broken_promise' | 'high_overdue' | 'delivery_failed', title: string, description: string, amount?: number, actionUrl: string}> = [];

  // 4a. Promessas Quebradas
  const brokenPromises = await prisma.paymentPromise.findMany({
    where: { tenantId, status: 'broken' },
    include: { invoice: { include: { customer: true } } },
    take: 5,
    orderBy: { promisedDate: 'desc' }
  });
  brokenPromises.forEach(p => {
    alerts.push({
      id: p.id,
      type: 'broken_promise',
      title: 'Promessa Quebrada',
      description: `Cliente ${p.invoice.customer.name} não pagou R$ ${p.amount.toFixed(2)} prometido para ${p.promisedDate.toLocaleDateString('pt-BR')}`,
      amount: p.amount,
      actionUrl: `/historico?faturaId=${p.invoiceId}`
    });
  });

  // 4b. Falhas de Comunicação
  const failedComms = await prisma.communication.findMany({
    where: { tenantId, status: 'failed' },
    include: { customer: true },
    take: 5,
    orderBy: { sentAt: 'desc' }
  });
  failedComms.forEach(c => {
    alerts.push({
      id: c.id,
      type: 'delivery_failed',
      title: 'Falha de Entrega',
      description: `Não foi possível enviar ${c.channel} para ${c.customer.name}`,
      actionUrl: `/historico?clienteId=${c.customerId}`
    });
  });

  // 5. Ranking de Risco (usando novo serviço centralizado)
  const customersWithOverdue = await prisma.customer.findMany({
    where: {
      tenantId,
      invoices: {
        some: { status: { in: ['OPEN', 'PROMISE_TO_PAY'] }, dueDate: { lt: today } }
      }
    },
    select: { id: true, name: true }
  });

  // Calcular score para cada cliente e ordenar por score decrescente
  const riskScoresRaw = await Promise.all(
    customersWithOverdue.map(async (c) => {
      const riskScore = await getRiskScoreForCustomer(c.id, tenantId);
      return {
        customerId: c.id,
        customerName: c.name,
        score: riskScore?.score ?? 0,
        level: riskScore?.level ?? 'Baixo',
        overdueAmount: riskScore?.metadata?.openAmount ?? 0,
        justification: riskScore?.justification ?? ''
      };
    })
  );

  const riskRankingList = riskScoresRaw
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // 6. Gráfico de Evolução (Recebimentos últimos 30 dias + Próximos 30)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(today.getDate() + 30);

  const chartInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['PAID', 'OPEN', 'PROMISE_TO_PAY'] },
      dueDate: { gte: thirtyDaysAgo, lte: thirtyDaysAhead }
    },
    orderBy: { dueDate: 'asc' },
    select: { dueDate: true, amount: true, status: true, updatedAt: true }
  });

  const flowMap = new Map();
  chartInvoices.forEach(inv => {
    // Para recebidos, tentamos usar o updatedAt se pago, senao dueDate
    const dateToUse = (inv.status === 'PAID' && inv.updatedAt) ? inv.updatedAt : inv.dueDate;
    const dateStr = dateToUse.toISOString().split('T')[0];
    
    if (!flowMap.has(dateStr)) {
      flowMap.set(dateStr, { date: dateStr, recebido: 0, a_receber: 0 });
    }
    const dayData = flowMap.get(dateStr);
    
    if (inv.status === 'PAID') {
      dayData.recebido += inv.amount;
    } else {
      dayData.a_receber += inv.amount;
    }
  });

  const receiptsChart = Array.from(flowMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    kpis: {
      totalPending,
      totalOverdue,
      dueNext7Days,
      paidThisMonth,
      defaultRate,
      criticalCustomersCount
    },
    upcomingDues,
    todaysTasks,
    criticalAlerts: alerts,
    riskRanking: riskRankingList,
    receiptsChart
  };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    // Return empty metrics instead of throwing
    return {
      kpis: {
        totalPending: 0,
        totalOverdue: 0,
        dueNext7Days: 0,
        paidThisMonth: 0,
        defaultRate: 0,
        criticalCustomersCount: 0
      },
      upcomingDues: [],
      todaysTasks: [],
      criticalAlerts: [],
      riskRanking: [],
      receiptsChart: []
    };
  }
}
