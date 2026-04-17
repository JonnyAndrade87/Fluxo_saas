'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { getRiskScoresBatch } from './risk-score';
import {
  generateOverdueReport,
  generatePendingReport,
  generateCustomerDelayReport,
  generateRiskRankingReport,
  generateExecutiveSummary,
  type OverdueTitle,
  type PendingTitle,
  type CustomerDelay,
  type RiskRanking,
  type ExecutiveSummary,
  type ReportFilters,
} from '@/lib/reports';

// ════════════════════════════════════════════════════════════════════════
// FILTERS & VALIDATION
// ════════════════════════════════════════════════════════════════════════

type ReportType = 'overdue' | 'pending' | 'delay' | 'risk' | 'executive';
type PeriodType = '30d' | '60d' | '90d' | '180d';

const PERIOD_MAP: Record<PeriodType, number> = {
  '30d': 30,
  '60d': 60,
  '90d': 90,
  '180d': 180,
};

async function getInvoicesWithFilters(
  tenantId: string,
  filters: ReportFilters
) {
  const where: any = {
    tenantId,
    issueDate: {},
  };

  // Date filters
  if (filters.startDate) {
    where.issueDate.gte = filters.startDate;
  }
  if (filters.endDate) {
    where.issueDate.lte = filters.endDate;
  }

  // Customer filter
  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  // Status filter
  if (filters.status === 'overdue') {
    where.status = { in: ['OPEN', 'PROMISE_TO_PAY'] };
    where.dueDate = { lt: new Date() };
  } else if (filters.status === 'pending') {
    where.status = { in: ['OPEN', 'PROMISE_TO_PAY'] };
    where.dueDate = { gte: new Date() };
  } else if (filters.status === 'paid') {
    where.status = 'PAID';
  } else if (filters.status) {
    where.status = filters.status;
  }

  return prisma.invoice.findMany({
    where,
    include: { customer: true },
    orderBy: { dueDate: 'asc' },
  });
}

/** Converte Map<customerId, RiskScoreResult> para Record compatível com generateXReport() */
async function batchRiskScores(
  tenantId: string,
  customerIds: string[]
): Promise<Record<string, { level: string; score: number }>> {
  const map = await getRiskScoresBatch(tenantId, customerIds);
  const out: Record<string, { level: string; score: number }> = {};
  map.forEach((rs, cid) => {
    out[cid] = { level: rs?.level ?? 'Baixo', score: rs?.score ?? 0 };
  });
  return out;
}

// ════════════════════════════════════════════════════════════════════════
// OVERDUE TITLES REPORT
// ════════════════════════════════════════════════════════════════════════

export async function getOverdueReport(
  period: PeriodType = '90d',
  customerId?: string
): Promise<OverdueTitle[]> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const daysBack = PERIOD_MAP[period];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const invoices = await getInvoicesWithFilters(tenantId, {
    startDate,
    status: 'overdue',
    customerId,
  });

  // Get all risk scores
  const customerIds = [...new Set(invoices.map(i => i.customerId))];
  const riskScores = await batchRiskScores(tenantId, customerIds);

  return generateOverdueReport(invoices, riskScores);
}

// ════════════════════════════════════════════════════════════════════════
// PENDING TITLES REPORT (Next 30 days)
// ════════════════════════════════════════════════════════════════════════

export async function getPendingReport(
  customerId?: string
): Promise<PendingTitle[]> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
      dueDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
      customerId,
    },
    include: { customer: true },
    orderBy: { dueDate: 'asc' },
  });

  // Get all risk scores
  const customerIds = [...new Set(invoices.map(i => i.customerId))];
  const riskScores = await batchRiskScores(tenantId, customerIds);

  return generatePendingReport(invoices, riskScores);
}

// ════════════════════════════════════════════════════════════════════════
// CUSTOMER DELAY REPORT
// ════════════════════════════════════════════════════════════════════════

export async function getCustomerDelayReport(
  period: PeriodType = '90d',
  customerId?: string
): Promise<CustomerDelay[]> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const daysBack = PERIOD_MAP[period];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const invoices = await getInvoicesWithFilters(tenantId, {
    startDate,
    status: 'overdue',
    customerId,
  });

  // Get all risk scores
  const customerIds = [...new Set(invoices.map(i => i.customerId))];
  const riskScores = await batchRiskScores(tenantId, customerIds);

  return generateCustomerDelayReport(invoices, riskScores);
}

// ════════════════════════════════════════════════════════════════════════
// RISK RANKING REPORT
// ════════════════════════════════════════════════════════════════════════

export async function getRiskRankingReport(
  period: PeriodType = '180d',
  customerId?: string
): Promise<RiskRanking[]> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const daysBack = PERIOD_MAP[period];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get all invoices (any status) in period
  const invoices = await getInvoicesWithFilters(tenantId, {
    startDate,
    customerId,
  });

  // Get all risk scores
  const customerIds = [...new Set(invoices.map(i => i.customerId))];
  const riskScores = await batchRiskScores(tenantId, customerIds);

  return generateRiskRankingReport(invoices, riskScores);
}

// ════════════════════════════════════════════════════════════════════════
// EXECUTIVE SUMMARY
// ════════════════════════════════════════════════════════════════════════

export async function getExecutiveReport(
  period: PeriodType = '90d'
): Promise<ExecutiveSummary> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const daysBack = PERIOD_MAP[period];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const periodLabels: Record<PeriodType, string> = {
    '30d': 'Últimos 30 dias',
    '60d': 'Últimos 60 dias',
    '90d': 'Últimos 90 dias',
    '180d': 'Últimos 180 dias',
  };

  const invoices = await getInvoicesWithFilters(tenantId, {
    startDate,
  });

  // Get all risk scores
  const customerIds = [...new Set(invoices.map(i => i.customerId))];
  const riskScores = await batchRiskScores(tenantId, customerIds);

  return generateExecutiveSummary(
    invoices,
    riskScores,
    periodLabels[period]
  );
}

// ════════════════════════════════════════════════════════════════════════
// MULTI-REPORT BUNDLE (for dashboard/integration)
// ════════════════════════════════════════════════════════════════════════

export async function getReportBundle(period: PeriodType = '90d') {
  const [overdue, pending, delay, risk, executive] = await Promise.all([
    getOverdueReport(period),
    getPendingReport(),
    getCustomerDelayReport(period),
    getRiskRankingReport('180d'),
    getExecutiveReport(period),
  ]);

  return {
    overdue,
    pending,
    delay,
    risk,
    executive,
    generatedAt: new Date().toISOString(),
  };
}

// ════════════════════════════════════════════════════════════════════════
// EXPORT SUPPORT: Get all customers for filter dropdowns
// ════════════════════════════════════════════════════════════════════════

export async function getCustomersForFilter(): Promise<
  Array<{ id: string; name: string }>
> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const customers = await prisma.customer.findMany({
    where: { tenantId, status: 'active' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return customers;
}
