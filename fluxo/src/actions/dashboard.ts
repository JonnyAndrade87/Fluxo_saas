'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export async function getDashboardMetrics() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
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
      where: { tenantId, status: 'pending' },
      _sum: { balanceDue: true }
    }),
    prisma.invoice.aggregate({
      where: { tenantId, status: 'overdue' },
      _sum: { balanceDue: true }
    }),
    prisma.invoice.aggregate({
      where: { 
        tenantId, 
        status: 'pending',
        dueDate: { gte: today, lte: next7Days }
      },
      _sum: { balanceDue: true }
    }),
    prisma.invoice.aggregate({
      where: {
        tenantId,
        status: 'paid',
        updatedAt: { gte: firstDayOfMonth } // assuming paid this month = updatedAt >= firstDayOfMonth
      },
      _sum: { amount: true }
    })
  ]);

  const totalPending = totalPendingRaw._sum.balanceDue || 0;
  const totalOverdue = totalOverdueRaw._sum.balanceDue || 0;
  const dueNext7Days = dueNext7DaysRaw._sum.balanceDue || 0;
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
      status: 'overdue',
      dueDate: { lt: criticalThresholdDate }
    }
  });
  const criticalCustomersCount = criticalCustomers.length;

  // 2. Próximos Vencimentos (Títulos a vencer, order by dueDate, highlight highs)
  const upcomingInvoicesRaw = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'pending',
      dueDate: { gte: today, lte: next7Days }
    },
    orderBy: [
      { dueDate: 'asc' },
      { balanceDue: 'desc' }
    ],
    take: 10,
    include: { customer: { select: { name: true } } }
  });

  const upcomingDues = upcomingInvoicesRaw.map(inv => ({
    id: inv.id,
    customerName: inv.customer.name,
    amount: inv.balanceDue,
    dueDate: inv.dueDate,
    isHighValue: inv.balanceDue > 5000 // Custom logic to highlight
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

  // 5. Ranking de Risco
  const riskRankingRaw = await prisma.invoice.groupBy({
    by: ['customerId'],
    where: { tenantId, status: 'overdue' },
    _sum: { balanceDue: true },
    orderBy: { _sum: { balanceDue: 'desc' } },
    take: 10
  });

  const riskRankingList = [];
  for (const item of riskRankingRaw) {
    const cust = await prisma.customer.findUnique({ where: { id: item.customerId }, select: { name: true } });
    if (cust) {
      riskRankingList.push({
        customerId: item.customerId,
        customerName: cust.name,
        overdueAmount: item._sum.balanceDue || 0
      });
    }
  }

  // 6. Gráfico de Evolução (Recebimentos últimos 30 dias + Próximos 30)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(today.getDate() + 30);

  const chartInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['paid', 'pending', 'overdue'] },
      dueDate: { gte: thirtyDaysAgo, lte: thirtyDaysAhead }
    },
    orderBy: { dueDate: 'asc' },
    select: { dueDate: true, amount: true, status: true, updatedAt: true }
  });

  const flowMap = new Map();
  chartInvoices.forEach(inv => {
    // Para recebidos, tentamos usar o updatedAt se pago, senao dueDate
    const dateToUse = (inv.status === 'paid' && inv.updatedAt) ? inv.updatedAt : inv.dueDate;
    const dateStr = dateToUse.toISOString().split('T')[0];
    
    if (!flowMap.has(dateStr)) {
      flowMap.set(dateStr, { date: dateStr, recebido: 0, a_receber: 0 });
    }
    const dayData = flowMap.get(dateStr);
    
    if (inv.status === 'paid') {
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
}
