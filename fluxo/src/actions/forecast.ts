'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import {
  calculateCashFlowForecast,
  CashFlowForecast,
  PaymentHistoryMetrics,
  InvoiceForForecast,
} from '@/lib/forecast';
import { getRiskScoreForCustomer } from './risk-score';
import { isInvoiceOverdue } from '@/lib/invoice-utils';

interface SessionUser {
  tenantId: string | null;
  id: string;
  email: string;
  role: string;
}

/**
 * Calcula métricas de histórico de pagamento
 * Análise dos últimos 90 dias para treinar o modelo
 */
export async function getPaymentHistoryMetrics(
  tenantId: string
): Promise<PaymentHistoryMetrics> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // ─ Buscar todas as invoices dos últimos 90 dias
  const historicalInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      createdAt: { gte: ninetyDaysAgo },
      status: { notIn: ['PAID', 'CANCELED'] },
    },
    include: {
      paymentPromises: true,
    },
  });

  let totalInvoices = 0;
  let totalValue = 0;
  let onTimePayments = 0;
  let latePayments = 0;
  let overdueRecoveries = 0;
  const writeOffs = 0;  // Changed from let to const since never reassigned
  let totalDelayDays = 0;
  let delayedInvoiceCount = 0;
  let brokenPromises = 0;
  let totalPromises = 0;

  for (const inv of historicalInvoices) {
    totalInvoices += 1;
    totalValue += inv.amount || 0;

    if (inv.status === 'PAID') {
      // Calcular delay baseado na dueDate vs updatedAt
      const delayDays = Math.max(
        0,
        Math.floor(
          (inv.updatedAt.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      if (delayDays <= 0) {
        onTimePayments += 1;
      } else {
        latePayments += 1;
        overdueRecoveries += 1;
        totalDelayDays += delayDays;
        delayedInvoiceCount += 1;
      }
    } else if (isInvoiceOverdue(inv)) {
      // Ainda não pago e vencido
      const delayDays = Math.floor(
        (new Date().getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      latePayments += 1;
      totalDelayDays += delayDays;
      delayedInvoiceCount += 1;
    } else {
      // A vencer
      onTimePayments += 1;
    }

    // Contar promessas quebradas
    for (const promise of inv.paymentPromises) {
      totalPromises += 1;
      if (promise.status === 'broken') {
        brokenPromises += 1;
      }
    }
  }

  const avgDelayDays =
    delayedInvoiceCount > 0 ? Math.round(totalDelayDays / delayedInvoiceCount) : 0;
  const promiseBreakRate = totalPromises > 0 ? brokenPromises / totalPromises : 0;

  return {
    totalInvoices: Math.max(1, totalInvoices), // Evitar divisão por zero
    totalValue,
    onTimePayments: Math.max(0, onTimePayments),
    latePayments: Math.max(0, latePayments),
    overdueRecoveries: Math.max(0, overdueRecoveries),
    writeOffs,
    avgDelayDays,
    promiseBreakRate,
  };
}

/**
 * Busca invoices para forecast
 * Inclui títulos a vencer nos próximos 60 dias
 * Inclui títulos vencidos ainda não pagos
 */
export async function getInvoicesForForecast(
  tenantId: string
): Promise<InvoiceForForecast[]> {
  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  // Buscar todas as invoices relevantes
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
      OR: [
        // Títulos vencidos não pagos
        {
          dueDate: { lt: now },
        },
        // Títulos a vencer nos próximos 60 dias
        {
          dueDate: {
            gte: now,
            lte: sixtyDaysFromNow,
          },
        },
      ],
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Enriquecer com score de risco
  const enriched: InvoiceForForecast[] = [];

  for (const inv of invoices) {
    const riskScore = await getRiskScoreForCustomer(inv.customerId, tenantId);
    const daysOverdue = Math.floor(
      (now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    enriched.push({
      id: inv.id,
      customerId: inv.customerId,
      customerName: inv.customer.name,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      updatedAmount: inv.updatedAmount || inv.amount,
      dueDate: inv.dueDate,
      status: inv.status,
      riskScore: riskScore?.score,
      riskLevel: riskScore?.level,
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
    });
  }

  return enriched;
}

/**
 * Calcula a projeção de caixa completa para o tenant
 */
export async function getReceivablesForecast(
  analysisType: 'weekly' | 'monthly' = 'weekly',
  forecastDays: number = 60
): Promise<CashFlowForecast> {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  // Buscar métricas históricas
  const paymentHistory = await getPaymentHistoryMetrics(tenantId);

  // Buscar invoices para forecast
  const invoices = await getInvoicesForForecast(tenantId);

  // Calcular forecast
  const forecast = calculateCashFlowForecast(
    invoices,
    paymentHistory,
    analysisType,
    forecastDays
  );

  // Completar com tenantId
  forecast.tenantId = tenantId;

  return forecast;
}

/**
 * Calcula impacto por cliente
 * Mostra qual cliente contribui mais para cada cenário
 */
export async function getCustomerForecastImpact() {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const invoices = await getInvoicesForForecast(tenantId);
  const paymentHistory = await getPaymentHistoryMetrics(tenantId);

  // Agrupar por cliente
  const byCustomer = new Map<
    string,
    {
      customerId: string;
      customerName: string;
      nominal: number;
      optimistic: number;
      realistic: number;
      conservative: number;
      itemCount: number;
      avgRiskScore: number;
    }
  >();

  for (const inv of invoices) {
    let entry = byCustomer.get(inv.customerId);
    if (!entry) {
      entry = {
        customerId: inv.customerId,
        customerName: inv.customerName,
        nominal: 0,
        optimistic: 0,
        realistic: 0,
        conservative: 0,
        itemCount: 0,
        avgRiskScore: 0,
      };
      byCustomer.set(inv.customerId, entry);
    }

    entry.itemCount += 1;
    entry.nominal += inv.updatedAmount || inv.amount;

    // Usar score para calcular ajustado
    const riskScore = inv.riskScore || 50;
    entry.avgRiskScore += riskScore;

    // Simplificado: usar probabilidade de risco
    const probability = Math.max(0.1, 1 - riskScore / 100);
    entry.realistic += (inv.updatedAmount || inv.amount) * probability;
    entry.optimistic += (inv.updatedAmount || inv.amount) * probability * 1.2;
    entry.conservative += (inv.updatedAmount || inv.amount) * probability * 0.6;
  }

  // Calcular média de risco por cliente
  const results = Array.from(byCustomer.values()).map((entry) => ({
    ...entry,
    avgRiskScore: entry.itemCount > 0 ? Math.round(entry.avgRiskScore / entry.itemCount) : 0,
    nominal: Math.round(entry.nominal),
    optimistic: Math.round(entry.optimistic),
    realistic: Math.round(entry.realistic),
    conservative: Math.round(entry.conservative),
  }));

  // Ordenar por realista descendente
  results.sort((a, b) => b.realistic - a.realistic);

  return results;
}

// ─── NOVO MÓDULO: PROBABILITY-ADJUSTED CASH FORECAST (7/30 DAYS) ────────────

export interface ForecastData {
  next7DaysNominal: number;
  next7DaysExpected: number;
  next30DaysNominal: number;
  next30DaysExpected: number;
  riskBreakdown: {
    level: string;
    nominal: number;
    expected: number;
    probability: number;
  }[];
}

const RISK_PROBABILITIES: Record<string, number> = {
  'Crítico': 0.10, // 10%
  'Alto':    0.30, // 30%
  'Médio':   0.70, // 70%
  'Baixo':   0.95, // 95%
};
const DEFAULT_PROBABILITY = 0.80; // sem score = 80%

export async function getProbabilityAdjustedForecast(): Promise<ForecastData> {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  // Buscar todos os recebíveis faturados nos próximos 30 dias
  const invoices = await getInvoicesForForecast(tenantId);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  let next7DaysNominal = 0;
  let next7DaysExpected = 0;
  let next30DaysNominal = 0;
  let next30DaysExpected = 0;

  const breakdownMap: Record<string, { nominal: number; expected: number; probability: number }> = {
    'Baixo':   { nominal: 0, expected: 0, probability: 0.95 },
    'Médio':   { nominal: 0, expected: 0, probability: 0.70 },
    'Alto':    { nominal: 0, expected: 0, probability: 0.30 },
    'Crítico': { nominal: 0, expected: 0, probability: 0.10 },
    'Sem Score': { nominal: 0, expected: 0, probability: 0.80 },
  };

  for (const inv of invoices) {
    const invDate = new Date(inv.dueDate);
    invDate.setHours(0, 0, 0, 0);

    // Consideramos apenas o que está "após" hoje e até 30 dias (ou atrasadas para 7 e 30 d)
    // Para simplificar: tudo retornado por getInvoicesForForecast (que inclui atrasados) 
    // ou que vence até daqui 30 dias.
    if (invDate > next30Days) continue;

    const isNext7 = invDate <= next7Days;

    const riskLevel = inv.riskLevel;
    const labelKey = riskLevel && RISK_PROBABILITIES[riskLevel] ? riskLevel : 'Sem Score';
    const probability = RISK_PROBABILITIES[labelKey] ?? DEFAULT_PROBABILITY;
    
    // Atualiza base map
    breakdownMap[labelKey].probability = probability; // Em caso de Sem Score

    const amount = inv.updatedAmount;
    const expected = amount * probability;

    // Adiciona no Breakdown
    breakdownMap[labelKey].nominal += amount;
    breakdownMap[labelKey].expected += expected;

    // Pondera em 30d
    next30DaysNominal += amount;
    next30DaysExpected += expected;

    // Pondera em 7d
    if (isNext7) {
      next7DaysNominal += amount;
      next7DaysExpected += expected;
    }
  }

  const riskBreakdown = Object.entries(breakdownMap)
    .filter(([_, data]) => data.nominal > 0)
    .map(([level, data]) => ({
      level,
      nominal: data.nominal,
      expected: data.expected,
      probability: data.probability
    }));

  return {
    next7DaysNominal,
    next7DaysExpected,
    next30DaysNominal,
    next30DaysExpected,
    riskBreakdown
  };
}
