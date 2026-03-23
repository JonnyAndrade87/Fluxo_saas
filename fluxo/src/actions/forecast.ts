'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';
import {
  calculateCashFlowForecast,
  CashFlowForecast,
  PaymentHistoryMetrics,
  InvoiceForForecast,
} from '@/lib/forecast';
import { getRiskScoreForCustomer } from './risk-score';

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
      status: { notIn: ['draft', 'canceled'] },
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

    if (inv.status === 'paid') {
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
    } else if (inv.status === 'overdue') {
      // Ainda não pago
      const delayDays = Math.floor(
        (new Date().getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (delayDays <= 0) {
        // A vencer mas ainda não marcado como pending
        onTimePayments += 1;
      } else {
        latePayments += 1;
        totalDelayDays += delayDays;
        delayedInvoiceCount += 1;
      }
    } else if (inv.status === 'in_negotiation') {
      // Contar como atraso
      const delayDays = Math.floor(
        (new Date().getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (delayDays > 0) {
        latePayments += 1;
        totalDelayDays += delayDays;
        delayedInvoiceCount += 1;
      }
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
      status: { notIn: ['draft', 'canceled', 'paid'] },
      OR: [
        // Títulos vencidos não pagos
        {
          status: 'overdue',
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
      balanceDue: inv.balanceDue,
      dueDate: inv.dueDate,
      status: inv.status as any,
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
    entry.nominal += inv.balanceDue || inv.amount;

    // Usar score para calcular ajustado
    const riskScore = inv.riskScore || 50;
    entry.avgRiskScore += riskScore;

    // Simplificado: usar probabilidade de risco
    const probability = Math.max(0.1, 1 - riskScore / 100);
    entry.realistic += (inv.balanceDue || inv.amount) * probability;
    entry.optimistic += (inv.balanceDue || inv.amount) * probability * 1.2;
    entry.conservative += (inv.balanceDue || inv.amount) * probability * 0.6;
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
