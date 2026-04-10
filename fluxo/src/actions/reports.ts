'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { getRiskScoreForCustomer } from './risk-score';
import { isInvoiceOverdue } from '@/lib/invoice-utils';

export type ReportMetrics = {
  // KPIs
  totalBilled: number;       // all invoices in period
  totalPaid: number;         // paid invoices
  totalOverdue: number;      // overdue balance due
  totalPending: number;      // pending balance due
  defaultRate: number;       // % overdue / billed
  recoveryRate: number;      // % paid / billed

  // Time series for bar chart (monthly)
  monthlyCashflow: {
    month: string;
    faturado: number;
    recebido: number;
    atrasado: number;
  }[];

  // Status distribution for pie chart
  statusDistribution: {
    name: string;
    value: number;
    color: string;
  }[];

  // Per-client ranking
  clientRanking: {
    id: string;
    name: string;
    documentNumber: string;
    totalBilled: number;
    totalPaid: number;
    totalOverdue: number;
    invoiceCount: number;
    riskLevel: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  }[];

  // Quick stats
  totalCustomers: number;
  customersWithOverdue: number;
  avgTicket: number;
  periodLabel: string;
};

type PeriodFilter = '1m' | '3m' | '6m' | '12m';

export async function getReportMetrics(period: PeriodFilter = '6m'): Promise<ReportMetrics | null> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return null;

  // Compute start date based on period
  const monthsBack = period === '1m' ? 1 : period === '3m' ? 3 : period === '12m' ? 12 : 6;
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - monthsBack);
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const periodLabels: Record<PeriodFilter, string> = {
    '1m': 'Último mês',
    '3m': 'Últimos 3 meses',
    '6m': 'Últimos 6 meses',
    '12m': 'Últimos 12 meses',
  };

  // Fetch all invoices in period with customer info
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      issueDate: { gte: periodStart }
    },
    select: {
      id: true,
      amount: true,
      status: true,
      dueDate: true,
      issueDate: true,
      customerId: true,
      customer: { select: { id: true, name: true, documentNumber: true } }
    },
    orderBy: { issueDate: 'asc' }
  });

  // Also get ALL overdue invoices regardless of period (to show real exposure)
  const allInvoices = await prisma.invoice.findMany({
    where: { tenantId, status: { in: ['OPEN', 'PROMISE_TO_PAY'] } },
    select: { updatedAmount: true, amount: true, customerId: true, dueDate: true, status: true }
  });
  const overdueList = allInvoices.filter(inv => isInvoiceOverdue(inv));

  // ── KPI Aggregation ──────────────────────────────────────────────────────
  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let pendingCount = 0;
  let paidCount = 0;
  let overdueCount = 0;
  let canceledCount = 0;

  const invoiceList: any[] = invoices;

  invoiceList.forEach((inv: any) => {
    totalBilled += inv.amount;
    if (inv.status === 'PAID') totalPaid += inv.paidAmount || inv.amount;
    if (inv.status === 'OPEN' || inv.status === 'PROMISE_TO_PAY') totalPending += inv.updatedAmount || inv.amount;
    if (inv.status === 'OPEN' || inv.status === 'PROMISE_TO_PAY') pendingCount += inv.amount;
    if (inv.status === 'PAID') paidCount += inv.amount;
    const isOverdue = isInvoiceOverdue(inv);
    if (isOverdue) overdueCount += inv.updatedAmount || inv.amount;
    if (inv.status === 'CANCELED') canceledCount += inv.amount;
  });

  const totalOverdue = overdueList.reduce((s: number, i: any) => s + (i.updatedAmount || i.amount), 0);
  const defaultRate = totalBilled > 0 ? (overdueCount / totalBilled) * 100 : 0;
  const recoveryRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
  const avgTicket = invoices.length > 0 ? totalBilled / invoices.length : 0;

  // ── Monthly Cashflow bar chart ───────────────────────────────────────────
  const monthlyMap: Record<string, { faturado: number; recebido: number; atrasado: number }> = {};

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('. de ', '/').replace('.', '').toUpperCase();
    monthlyMap[key] = { faturado: 0, recebido: 0, atrasado: 0 };
  }

  invoiceList.forEach((inv: any) => {
    const d = inv.issueDate ?? inv.dueDate;
    const key = new Date(d).toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('. de ', '/').replace('.', '').toUpperCase();
    if (monthlyMap[key]) {
      monthlyMap[key].faturado += inv.amount;
      if (inv.status === 'PAID') monthlyMap[key].recebido += inv.paidAmount || inv.amount;
      const isOverdue = isInvoiceOverdue(inv);
      if (isOverdue) monthlyMap[key].atrasado += inv.updatedAmount || inv.amount;
    }
  });

  const monthlyCashflow = Object.entries(monthlyMap).map(([month, v]) => ({
    month,
    faturado: Math.round(v.faturado),
    recebido: Math.round(v.recebido),
    atrasado: Math.round(v.atrasado),
  }));

  // ── Status distribution pie ──────────────────────────────────────────────
  const statusDistribution = [
    { name: 'À Vencer', value: Math.round(pendingCount), color: '#6366f1' },
    { name: 'Liquidados', value: Math.round(paidCount), color: '#10b981' },
    { name: 'Inadimplência', value: Math.round(overdueCount), color: '#f43f5e' },
    { name: 'Cancelados', value: Math.round(canceledCount), color: '#94a3b8' },
  ].filter(i => i.value > 0);

  // ── Per-client ranking ───────────────────────────────────────────────────
  const clientMap: Record<string, {
    id: string; name: string; documentNumber: string;
    totalBilled: number; totalPaid: number; totalOverdue: number; invoiceCount: number;
  }> = {};

  invoiceList.forEach((inv: any) => {
    const cid = inv.customerId;
    if (!clientMap[cid]) {
      clientMap[cid] = {
        id: cid,
        name: inv.customer.name,
        documentNumber: inv.customer.documentNumber,
        totalBilled: 0, totalPaid: 0, totalOverdue: 0, invoiceCount: 0
      };
    }
    clientMap[cid].totalBilled += inv.amount;
    clientMap[cid].invoiceCount += 1;
    if (inv.status === 'PAID') clientMap[cid].totalPaid += inv.paidAmount || inv.amount;
    const isOverdue = isInvoiceOverdue(inv);
    if (isOverdue) clientMap[cid].totalOverdue += inv.updatedAmount || inv.amount;
  });

  // Also include overdue from outside period
  overdueList.forEach((inv: any) => {
    if (clientMap[inv.customerId]) {
      // already counted in period, skip
    }
  });

  // ── Rank clients using centralized risk score service ─────────────────────
  const clientRankingRaw = Object.values(clientMap)
    .sort((a, b) => b.totalBilled - a.totalBilled);

  const clientRanking = await Promise.all(
    clientRankingRaw.map(async (c) => {
      const riskScore = await getRiskScoreForCustomer(c.id, tenantId);
      return {
        ...c,
        riskLevel: riskScore?.level ?? 'Baixo',
        riskScore: riskScore?.score ?? 0,
        riskJustification: riskScore?.justification ?? ''
      };
    })
  );

  // ── Customer stats ───────────────────────────────────────────────────────
  const uniqueCustomers = new Set(invoiceList.map((i: any) => i.customerId));
  const overdueCustomers = new Set(overdueList.map((i: any) => i.customerId));

  return {
    totalBilled: Math.round(totalBilled),
    totalPaid: Math.round(totalPaid),
    totalOverdue: Math.round(totalOverdue),
    totalPending: Math.round(totalPending),
    defaultRate: parseFloat(defaultRate.toFixed(1)),
    recoveryRate: parseFloat(recoveryRate.toFixed(1)),
    monthlyCashflow,
    statusDistribution,
    clientRanking,
    totalCustomers: uniqueCustomers.size,
    customersWithOverdue: overdueCustomers.size,
    avgTicket: Math.round(avgTicket),
    periodLabel: periodLabels[period],
  };
}
