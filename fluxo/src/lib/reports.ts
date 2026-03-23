/**
 * Pure report generation functions
 * No database access — these are testable, deterministic calculations
 * Receives Invoice[] data and produces typed report outputs
 */

import type { Invoice, Customer } from '@prisma/client';

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════

export type OverdueTitle = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerId: string;
  dueDate: string;
  daysOverdue: number;
  balanceDue: number;
  riskLevel: string;
};

export type PendingTitle = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerId: string;
  dueDate: string;
  daysUntilDue: number;
  amount: number;
  riskLevel: string;
};

export type CustomerDelay = {
  customerId: string;
  customerName: string;
  overdueCount: number;
  overdueValue: number;
  maxDaysOverdue: number;
  oldestOverdueDate: string;
  riskLevel: string;
};

export type RiskRanking = {
  customerId: string;
  customerName: string;
  documentNumber: string;
  riskLevel: string;
  riskScore: number;
  totalBilled: number;
  totalOverdue: number;
  overdueTitles: number;
};

export type ExecutiveSummary = {
  generatedAt: string;
  periodLabel: string;
  totalBilled: number;
  totalRecovered: number;
  totalOverdue: number;
  totalPending: number;
  avgDaysOverdue: number;
  defaultRate: number;
  recoveryRate: number;
  totalCustomers: number;
  customersWithOverdue: number;
  topOverdueCustomer: {
    name: string;
    value: number;
  } | null;
  healthStatus: 'Crítico' | 'Alto' | 'Médio' | 'Baixo'; // Based on defaultRate
};

export type ReportFilters = {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  status?: 'pending' | 'overdue' | 'paid';
};

// ════════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════════

function getDaysOverdue(dueDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  const diffMs = new Date(dueDate).getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

function calculateHealthStatus(defaultRate: number): 'Crítico' | 'Alto' | 'Médio' | 'Baixo' {
  if (defaultRate >= 20) return 'Crítico';
  if (defaultRate >= 10) return 'Alto';
  if (defaultRate >= 5) return 'Médio';
  return 'Baixo';
}

// ════════════════════════════════════════════════════════════════════════
// REPORT GENERATORS
// ════════════════════════════════════════════════════════════════════════

/**
 * RELATÓRIO 1: TÍTULOS VENCIDOS
 * Mostra todos os títulos com atraso, ordenados por dias vencidos
 */
export function generateOverdueReport(
  invoices: (Invoice & { customer: Customer })[],
  customerRiskScores: Record<string, { level: string; score: number }>
): OverdueTitle[] {
  return invoices
    .filter(inv => inv.status === 'overdue')
    .map(inv => {
      const daysOverdue = getDaysOverdue(inv.dueDate);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.name,
        customerId: inv.customerId,
        dueDate: formatDate(inv.dueDate),
        daysOverdue,
        balanceDue: Math.round(inv.balanceDue * 100) / 100,
        riskLevel: customerRiskScores[inv.customerId]?.level ?? 'Baixo',
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * RELATÓRIO 2: CARTEIRA A VENCER (próximos 30 dias)
 * Mostra títulos pending/in_negotiation que vencem em até 30 dias
 */
export function generatePendingReport(
  invoices: (Invoice & { customer: Customer })[],
  customerRiskScores: Record<string, { level: string; score: number }>
): PendingTitle[] {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return invoices
    .filter(inv => {
      if (!['pending', 'in_negotiation'].includes(inv.status)) return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate <= thirtyDaysFromNow && dueDate >= now;
    })
    .map(inv => {
      const daysUntil = getDaysUntilDue(inv.dueDate);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.name,
        customerId: inv.customerId,
        dueDate: formatDate(inv.dueDate),
        daysUntilDue: daysUntil,
        amount: Math.round(inv.amount * 100) / 100,
        riskLevel: customerRiskScores[inv.customerId]?.level ?? 'Baixo',
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

/**
 * RELATÓRIO 3: CLIENTES COM MAIOR ATRASO
 * Agrupa por cliente, mostra quantidade e valor de títulos vencidos
 */
export function generateCustomerDelayReport(
  invoices: (Invoice & { customer: Customer })[],
  customerRiskScores: Record<string, { level: string; score: number }>
): CustomerDelay[] {
  const customerMap: Record<
    string,
    {
      name: string;
      overdueCount: number;
      overdueValue: number;
      maxDays: number;
      oldestDate: Date;
    }
  > = {};

  invoices
    .filter(inv => inv.status === 'overdue')
    .forEach(inv => {
      const cid = inv.customerId;
      const daysOverdue = getDaysOverdue(inv.dueDate);

      if (!customerMap[cid]) {
        customerMap[cid] = {
          name: inv.customer.name,
          overdueCount: 0,
          overdueValue: 0,
          maxDays: 0,
          oldestDate: new Date(inv.dueDate),
        };
      }

      customerMap[cid].overdueCount += 1;
      customerMap[cid].overdueValue += inv.balanceDue;
      customerMap[cid].maxDays = Math.max(customerMap[cid].maxDays, daysOverdue);

      if (new Date(inv.dueDate) < customerMap[cid].oldestDate) {
        customerMap[cid].oldestDate = new Date(inv.dueDate);
      }
    });

  return Object.entries(customerMap)
    .map(([cid, data]) => ({
      customerId: cid,
      customerName: data.name,
      overdueCount: data.overdueCount,
      overdueValue: Math.round(data.overdueValue * 100) / 100,
      maxDaysOverdue: data.maxDays,
      oldestOverdueDate: formatDate(data.oldestDate),
      riskLevel: customerRiskScores[cid]?.level ?? 'Baixo',
    }))
    .sort((a, b) => b.overdueValue - a.overdueValue);
}

/**
 * RELATÓRIO 4: RANKING POR RISCO
 * Ordena clientes por risco e mostra exposure
 */
export function generateRiskRankingReport(
  invoices: (Invoice & { customer: Customer })[],
  customerRiskScores: Record<string, { level: string; score: number }>
): RiskRanking[] {
  const customerMap: Record<
    string,
    {
      name: string;
      documentNumber: string;
      totalBilled: number;
      totalOverdue: number;
      overdueTitles: number;
    }
  > = {};

  invoices.forEach(inv => {
    const cid = inv.customerId;
    if (!customerMap[cid]) {
      customerMap[cid] = {
        name: inv.customer.name,
        documentNumber: inv.customer.documentNumber,
        totalBilled: 0,
        totalOverdue: 0,
        overdueTitles: 0,
      };
    }

    customerMap[cid].totalBilled += inv.amount;
    if (inv.status === 'overdue') {
      customerMap[cid].totalOverdue += inv.balanceDue;
      customerMap[cid].overdueTitles += 1;
    }
  });

  return Object.entries(customerMap)
    .map(([cid, data]) => {
      const riskData = customerRiskScores[cid] ?? { level: 'Baixo', score: 0 };
      return {
        customerId: cid,
        customerName: data.name,
        documentNumber: data.documentNumber,
        riskLevel: riskData.level,
        riskScore: riskData.score,
        totalBilled: Math.round(data.totalBilled * 100) / 100,
        totalOverdue: Math.round(data.totalOverdue * 100) / 100,
        overdueTitles: data.overdueTitles,
      };
    })
    .sort((a, b) => {
      // Primary: risk level (Crítico > Alto > Médio > Baixo)
      const riskOrder = { Crítico: 0, Alto: 1, Médio: 2, Baixo: 3 };
      const riskDiff =
        (riskOrder[a.riskLevel as keyof typeof riskOrder] ?? 999) -
        (riskOrder[b.riskLevel as keyof typeof riskOrder] ?? 999);
      if (riskDiff !== 0) return riskDiff;

      // Secondary: overdue value
      return b.totalOverdue - a.totalOverdue;
    });
}

/**
 * RELATÓRIO 5: RESUMO EXECUTIVO
 * KPIs de alto nível para decision makers
 */
export function generateExecutiveSummary(
  invoices: (Invoice & { customer: Customer })[],
  customerRiskScores: Record<string, { level: string; score: number }>,
  periodLabel: string
): ExecutiveSummary {
  let totalBilled = 0;
  let totalRecovered = 0;
  let totalOverdue = 0;
  let totalPending = 0;
  let overdueCount = 0;
  let daysOverdueSum = 0;

  const customerSet = new Set<string>();
  const overdueCustSet = new Set<string>();
  const customerOverdueMap: Record<string, number> = {};

  invoices.forEach(inv => {
    customerSet.add(inv.customerId);

    if (inv.status === 'paid') {
      totalBilled += inv.amount;
      totalRecovered += inv.amount;
    } else if (inv.status === 'overdue') {
      totalBilled += inv.amount;
      totalOverdue += inv.balanceDue;
      overdueCount += 1;
      daysOverdueSum += getDaysOverdue(inv.dueDate);
      overdueCustSet.add(inv.customerId);
      customerOverdueMap[inv.customerId] =
        (customerOverdueMap[inv.customerId] ?? 0) + inv.balanceDue;
    } else if (inv.status === 'pending' || inv.status === 'in_negotiation') {
      totalBilled += inv.amount;
      totalPending += inv.balanceDue;
    } else {
      totalBilled += inv.amount;
    }
  });

  const defaultRate = totalBilled > 0 ? (totalOverdue / totalBilled) * 100 : 0;
  const recoveryRate = totalBilled > 0 ? (totalRecovered / totalBilled) * 100 : 0;
  const avgDaysOverdue = overdueCount > 0 ? Math.round(daysOverdueSum / overdueCount) : 0;

  // Top overdue customer
  let topOverdueCustomer: { name: string; value: number } | null = null;
  const maxOverdue = Math.max(...Object.values(customerOverdueMap), 0);
  if (maxOverdue > 0) {
    const topCustId = Object.entries(customerOverdueMap).find(
      ([, v]) => v === maxOverdue
    )?.[0];
    if (topCustId) {
      const topCust = invoices.find(i => i.customerId === topCustId)?.customer;
      if (topCust) {
        topOverdueCustomer = {
          name: topCust.name,
          value: Math.round(maxOverdue * 100) / 100,
        };
      }
    }
  }

  return {
    generatedAt: formatDate(new Date()),
    periodLabel,
    totalBilled: Math.round(totalBilled * 100) / 100,
    totalRecovered: Math.round(totalRecovered * 100) / 100,
    totalOverdue: Math.round(totalOverdue * 100) / 100,
    totalPending: Math.round(totalPending * 100) / 100,
    avgDaysOverdue,
    defaultRate: parseFloat(defaultRate.toFixed(1)),
    recoveryRate: parseFloat(recoveryRate.toFixed(1)),
    totalCustomers: customerSet.size,
    customersWithOverdue: overdueCustSet.size,
    topOverdueCustomer,
    healthStatus: calculateHealthStatus(defaultRate),
  };
}
