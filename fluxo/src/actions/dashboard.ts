'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { getRiskScoresBatch } from './risk-score';

// ─── Return type ────────────────────────────────────────────────────────────

export interface AgingBucket {
  label: string;
  count: number;
  amount: number;
}

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
}

export interface RecentCommActivity {
  id: string;
  ruleType: string;
  channel: string;
  status: string;
  customerName: string;
  sentAt: Date | null;
  createdAt: Date;
}

export interface DashboardKPIs {
  totalPending: number;
  totalOverdue: number;
  dueNext7Days: number;
  paidThisMonth: number;
  defaultRate: number;
  criticalCustomersCount: number;
  pendingCommsCount: number;
  recoveryRate: number; // % of overdue value recovered this month
}

// ─── Main action ────────────────────────────────────────────────────────────

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

    // Aging thresholds
    const overdue30 = new Date(today);
    overdue30.setDate(today.getDate() - 30);
    const overdue60 = new Date(today);
    overdue60.setDate(today.getDate() - 60);
    const overdue90 = new Date(today);
    overdue90.setDate(today.getDate() - 90);

    // ── Parallel queries ────────────────────────────────────────────────────
    const [
      totalPendingRaw,
      totalOverdueRaw,
      dueNext7DaysRaw,
      paidThisMonthRaw,
      overdueThisMonthBaseRaw,
      pendingCommsCount,
      agingCurrent,
      aging1to30,
      aging31to60,
      aging61to90,
      agingOver90,
    ] = await Promise.all([
      // 1. Total in-flight (not yet due)
      prisma.invoice.aggregate({
        where: { tenantId, status: { in: ['OPEN', 'PROMISE_TO_PAY'] }, dueDate: { gte: today } },
        _sum: { updatedAmount: true },
      }),
      // 2. Total overdue
      prisma.invoice.aggregate({
        where: { tenantId, status: { in: ['OPEN', 'PROMISE_TO_PAY'] }, dueDate: { lt: today } },
        _sum: { updatedAmount: true },
      }),
      // 3. Due in next 7 days
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
          dueDate: { gte: today, lte: next7Days },
        },
        _sum: { updatedAmount: true },
      }),
      // 4. Paid this month
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: { gte: firstDayOfMonth },
        },
        _sum: { paidAmount: true },
      }),
      // 5. Value of invoices that were overdue at start of month (for recovery rate)
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: { gte: firstDayOfMonth },
          dueDate: { lt: firstDayOfMonth }, // was already late when paid
        },
        _sum: { paidAmount: true },
      }),
      // 6. Pending communications (CommunicationLog status=pending)
      prisma.communicationLog.count({
        where: { tenantId, status: 'pending' },
      }),
      // 7. Aging buckets — current (not yet overdue)
      prisma.invoice.aggregate({
        where: { tenantId, status: { in: ['OPEN', 'PROMISE_TO_PAY'] }, dueDate: { gte: today } },
        _sum: { updatedAmount: true },
        _count: { id: true },
      }),
      // aging: 1-30 days overdue
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
          dueDate: { gte: overdue30, lt: today },
        },
        _sum: { updatedAmount: true },
        _count: { id: true },
      }),
      // aging: 31-60 days overdue
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
          dueDate: { gte: overdue60, lt: overdue30 },
        },
        _sum: { updatedAmount: true },
        _count: { id: true },
      }),
      // aging: 61-90 days overdue
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
          dueDate: { gte: overdue90, lt: overdue60 },
        },
        _sum: { updatedAmount: true },
        _count: { id: true },
      }),
      // aging: >90 days (critical)
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
          dueDate: { lt: overdue90 },
        },
        _sum: { updatedAmount: true },
        _count: { id: true },
      }),
    ]);

    const totalPending = totalPendingRaw._sum.updatedAmount ?? 0;
    const totalOverdue = totalOverdueRaw._sum.updatedAmount ?? 0;
    const dueNext7Days = dueNext7DaysRaw._sum.updatedAmount ?? 0;
    const paidThisMonth = paidThisMonthRaw._sum.paidAmount ?? 0;
    const recoveredOverdueThisMonth = overdueThisMonthBaseRaw._sum.paidAmount ?? 0;

    const totalEmitted = totalPending + totalOverdue;
    const defaultRate = totalEmitted > 0 ? (totalOverdue / totalEmitted) * 100 : 0;
    const recoveryRate = totalOverdue > 0 ? (recoveredOverdueThisMonth / (totalOverdue + recoveredOverdueThisMonth)) * 100 : 0;

    // Aging distribution
    const agingDistribution: AgingBucket[] = [
      { label: 'A Vencer', count: agingCurrent._count.id, amount: agingCurrent._sum.updatedAmount ?? 0 },
      { label: '1–30 dias', count: aging1to30._count.id, amount: aging1to30._sum.updatedAmount ?? 0 },
      { label: '31–60 dias', count: aging31to60._count.id, amount: aging31to60._sum.updatedAmount ?? 0 },
      { label: '61–90 dias', count: aging61to90._count.id, amount: aging61to90._sum.updatedAmount ?? 0 },
      { label: '+90 dias', count: agingOver90._count.id, amount: agingOver90._sum.updatedAmount ?? 0 },
    ];

    // ── Critical customers (overdue > 60 days) ──────────────────────────────
    const criticalThresholdDate = new Date(today);
    criticalThresholdDate.setDate(today.getDate() - 60);
    const criticalCustomers = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
        dueDate: { lt: criticalThresholdDate },
      },
    });
    const criticalCustomersCount = criticalCustomers.length;

    // ── Upcoming dues (next 7 days) ─────────────────────────────────────────
    const upcomingInvoicesRaw = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
        dueDate: { gte: today, lte: next7Days },
      },
      orderBy: [{ dueDate: 'asc' }, { amount: 'desc' }],
      take: 10,
      include: { customer: { select: { name: true } } },
    });
    const upcomingDues = upcomingInvoicesRaw.map((inv) => ({
      id: inv.id,
      customerName: inv.customer?.name ?? 'Cliente',
      amount: inv.updatedAmount ?? inv.amount,
      dueDate: inv.dueDate,
      isHighValue: (inv.updatedAmount ?? inv.amount) > 5000,
    }));

    // ── Overdue snapshot (most critical unpaid invoices) ───────────────────
    const overdueSnapshotRaw = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
        dueDate: { lt: today },
      },
      orderBy: [{ dueDate: 'asc' }, { updatedAmount: 'desc' }],
      take: 8,
      include: { customer: { select: { name: true } } },
    });
    const overdueSnapshot: OverdueInvoice[] = overdueSnapshotRaw.map((inv) => {
      const daysOverdue = Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber ?? inv.id.split('-')[0].toUpperCase(),
        customerName: inv.customer?.name ?? 'Cliente',
        amount: inv.updatedAmount ?? inv.amount,
        dueDate: inv.dueDate,
        daysOverdue,
      };
    });

    // ── Recent communication activity ──────────────────────────────────────
    const recentCommsRaw = await prisma.communicationLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: { select: { name: true } } },
    });
    const recentCommActivity: RecentCommActivity[] = recentCommsRaw.map((c) => ({
      id: c.id,
      ruleType: c.ruleType,
      channel: c.channel,
      status: c.status,
      customerName: c.customer?.name ?? 'Cliente',
      sentAt: c.sentAt,
      createdAt: c.createdAt,
    }));

    // ── Today's tasks ───────────────────────────────────────────────────────
    const todaysTasksRaw = await prisma.task.findMany({
      where: {
        tenantId,
        assigneeId: userId,
        status: 'pending',
        dueDate: { lte: endOfToday },
      },
      include: { customer: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 15,
    });
    const todaysTasks = todaysTasksRaw.map((t) => ({
      id: t.id,
      title: t.title,
      customerName: t.customer.name,
      dueDate: t.dueDate,
      overdue: t.dueDate < today,
    }));

    // ── Critical alerts ─────────────────────────────────────────────────────
    const alerts: Array<{
      id: string;
      type: 'broken_promise' | 'high_overdue' | 'delivery_failed';
      title: string;
      description: string;
      amount?: number;
      actionUrl: string;
    }> = [];

    const [brokenPromises, failedComms] = await Promise.all([
      prisma.paymentPromise.findMany({
        where: { tenantId, status: 'broken' },
        include: { invoice: { include: { customer: true } } },
        take: 3,
        orderBy: { promisedDate: 'desc' },
      }),
      prisma.communication.findMany({
        where: { tenantId, status: 'failed' },
        include: { customer: true },
        take: 3,
        orderBy: { sentAt: 'desc' },
      }),
    ]);

    brokenPromises.forEach((p) => {
      alerts.push({
        id: p.id,
        type: 'broken_promise',
        title: 'Promessa Quebrada',
        description: `${p.invoice.customer.name} — R$ ${p.amount.toFixed(2)} para ${p.promisedDate.toLocaleDateString('pt-BR')}`,
        amount: p.amount,
        actionUrl: `/historico?faturaId=${p.invoiceId}`,
      });
    });
    failedComms.forEach((c) => {
      alerts.push({
        id: c.id,
        type: 'delivery_failed',
        title: 'Falha de Entrega',
        description: `Não foi possível enviar ${c.channel} para ${c.customer.name}`,
        actionUrl: `/historico?clienteId=${c.customerId}`,
      });
    });

    // ── Risk ranking ────────────────────────────────────────────────────────
    const customersWithOverdue = await prisma.customer.findMany({
      where: {
        tenantId,
        invoices: {
          some: { status: { in: ['OPEN', 'PROMISE_TO_PAY'] }, dueDate: { lt: today } },
        },
      },
      select: { id: true, name: true },
    });
    const riskScoresMap = await getRiskScoresBatch(
      tenantId,
      customersWithOverdue.map((c) => c.id)
    );
    const riskRankingList = customersWithOverdue
      .map((c) => {
        const rs = riskScoresMap.get(c.id);
        return {
          customerId: c.id,
          customerName: c.name,
          score: rs?.score ?? 0,
          level: rs?.level ?? 'Baixo',
          overdueAmount: rs?.metadata?.openAmount ?? 0,
          justification: rs?.justification ?? '',
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // ── Receipts chart (60d window: -30 past + 30 future) ──────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(today.getDate() + 30);

    const chartInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['PAID', 'OPEN', 'PROMISE_TO_PAY'] },
        dueDate: { gte: thirtyDaysAgo, lte: thirtyDaysAhead },
      },
      orderBy: { dueDate: 'asc' },
      select: { dueDate: true, amount: true, status: true, paidAt: true },
    });

    const flowMap = new Map<string, { date: string; recebido: number; a_receber: number }>();
    chartInvoices.forEach((inv) => {
      const dateToUse = inv.status === 'PAID' && inv.paidAt ? inv.paidAt : inv.dueDate;
      const dateStr = dateToUse.toISOString().split('T')[0];
      if (!flowMap.has(dateStr)) {
        flowMap.set(dateStr, { date: dateStr, recebido: 0, a_receber: 0 });
      }
      const dayData = flowMap.get(dateStr)!;
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
        criticalCustomersCount,
        pendingCommsCount,
        recoveryRate,
      } satisfies DashboardKPIs,
      agingDistribution,
      overdueSnapshot,
      recentCommActivity,
      upcomingDues,
      todaysTasks,
      criticalAlerts: alerts,
      riskRanking: riskRankingList,
      receiptsChart,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      kpis: {
        totalPending: 0,
        totalOverdue: 0,
        dueNext7Days: 0,
        paidThisMonth: 0,
        defaultRate: 0,
        criticalCustomersCount: 0,
        pendingCommsCount: 0,
        recoveryRate: 0,
      } satisfies DashboardKPIs,
      agingDistribution: [] as AgingBucket[],
      overdueSnapshot: [] as OverdueInvoice[],
      recentCommActivity: [] as RecentCommActivity[],
      upcomingDues: [],
      todaysTasks: [],
      criticalAlerts: [],
      riskRanking: [],
      receiptsChart: [],
    };
  }
}
