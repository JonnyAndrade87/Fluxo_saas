/**
 * Módulo de Previsão de Caixa (Receivables Forecast)
 * 
 * Projeta entradas futuras com base em:
 * - Títulos a vencer
 * - Histórico de atraso e recuperação
 * - Score de risco
 * - Promessas de pagamento
 * 
 * Cenários: Otimista, Realista, Conservador
 * 
 * LIMITAÇÕES ASSUMIDAS:
 * 1. Baseado em dados históricos de 30-90 dias (se disponível)
 * 2. Score de risco usado como proxy de probabilidade de pagamento
 * 3. Sem sazonalidade complexa ou ML
 * 4. Títulos cancelados = 0 na projeção
 * 5. Promessas quebradas aumentam conservadorismo
 */

export interface ForecastScenario {
  name: 'otimista' | 'realista' | 'conservador';
  description: string;
  recoveryRate: number; // 0-1: percentage of overdue amounts recoverable
  onTimeRate: number;   // 0-1: percentage of upcoming due paid on time
  delayedPaymentRate: number; // 0-1: percentage paid after due but before 90 days
}

export interface InvoiceForForecast {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  updatedAmount: number;
  dueDate: Date;
  status: string;
  riskScore?: number; // 0-100
  riskLevel?: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  promiseDate?: Date;
  daysOverdue?: number;
}

export interface PaymentHistoryMetrics {
  totalInvoices: number;
  totalValue: number;
  onTimePayments: number;
  latePayments: number;
  overdueRecoveries: number; // Paid after being overdue
  writeOffs: number;
  avgDelayDays: number;
  promiseBreakRate: number; // broken promises / total promises
}

export interface ForecastItem {
  period: string; // YYYY-WW (week) or YYYY-MM (month)
  periodStart: Date;
  periodEnd: Date;
  nominal: number; // All due amounts in period (no discount)
  optimistic: number;
  realistic: number;
  conservative: number;
  itemCount: number;
  riskBreakdown: {
    baixoContribution: number;
    medioContribution: number;
    altoContribution: number;
    criticoContribution: number;
  };
  details: Array<{
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    dueDate: Date;
    riskLevel: string;
    scenarios: { otimista: number; realista: number; conservador: number };
  }>;
}

export interface CashFlowForecast {
  tenantId: string;
  generatedAt: Date;
  analysisType: 'weekly' | 'monthly';
  periods: ForecastItem[];
  summary: {
    totalNominal: number;
    totalOptimistic: number;
    totalRealistic: number;
    totalConservative: number;
    averageRecoveryRate: number;
    periodCovered: string; // "2026-03-22 to 2026-04-26"
  };
  scenarios: Record<string, ForecastScenario>;
  assumptions: string[]; // Explicação clara das suposições
}

/**
 * Calcula probabilidade de recebimento baseada no score de risco
 * Score baixo = alta probabilidade, Score alto = baixa probabilidade
 */
export function getProbabilityFromRiskScore(riskScore?: number): number {
  if (!riskScore) return 0.7; // Default realista
  
  // Invertida: quanto maior o risco, menor a probabilidade de receber
  // Score 0 (sem risco) = 100% (1.0)
  // Score 100 (crítico) = 10% (0.1)
  return Math.max(0.1, 1 - riskScore / 100);
}

/**
 * Calcula fatores de ajuste para cada cenário
 */
export function getScenarioFactors(
  paymentHistory: PaymentHistoryMetrics
): Record<'otimista' | 'realista' | 'conservador', ForecastScenario> {
  // Calcular taxa de recuperação de vencidos (histórico)
  let recoveryRate = 0.5; // Default
  if (paymentHistory.totalInvoices > 0) {
    recoveryRate = paymentHistory.overdueRecoveries / Math.max(1, paymentHistory.latePayments);
  }

  // Calcular taxa de pagamento no prazo (histórico)
  let onTimeRate = 0.7; // Default
  if (paymentHistory.totalInvoices > 0) {
    onTimeRate = paymentHistory.onTimePayments / paymentHistory.totalInvoices;
  }

  // Taxa de atraso antes de recuperação
  let delayedPaymentRate = paymentHistory.latePayments / Math.max(1, paymentHistory.totalInvoices);
  if (delayedPaymentRate + onTimeRate > 1) {
    delayedPaymentRate = 1 - onTimeRate;
  }

  // CENÁRIO OTIMISTA: Assume melhor caso
  // - Todos os títulos no prazo são recebidos
  // - Alguns vencidos são recuperados
  // - Promessas cumpridas
  const otimista: ForecastScenario = {
    name: 'otimista',
    description: 'Melhor cenário: pagamentos no prazo aumentam 20%, recuperação sobe 30%',
    onTimeRate: Math.min(0.95, onTimeRate + 0.2),
    recoveryRate: Math.min(0.95, recoveryRate + 0.3),
    delayedPaymentRate: 0.05,
  };

  // CENÁRIO REALISTA: Usa histórico como base
  // - Mantém tendências históricas
  // - Desconta promessas quebradas
  const promiseDiscountFactor = Math.max(0.85, 1 - paymentHistory.promiseBreakRate);
  const realista: ForecastScenario = {
    name: 'realista',
    description: 'Cenário base: usa histórico de pagamento ajustado por promessas',
    onTimeRate: onTimeRate * promiseDiscountFactor,
    recoveryRate: recoveryRate * promiseDiscountFactor,
    delayedPaymentRate: delayedPaymentRate * promiseDiscountFactor,
  };

  // CENÁRIO CONSERVADOR: Assume pior caso
  // - 30% redução em pagamentos no prazo
  // - 50% redução em recuperação de vencidos
  // - Clientes críticos = quase 0% de chance
  const conservador: ForecastScenario = {
    name: 'conservador',
    description: 'Pior cenário: reduz expectativa de pagamento em 30-50%',
    onTimeRate: onTimeRate * 0.7,
    recoveryRate: recoveryRate * 0.5,
    delayedPaymentRate: delayedPaymentRate * 0.5,
  };

  return { otimista, realista, conservador };
}

/**
 * Ajusta probabilidade por cliente baseado no risco
 */
export function adjustProbabilityForRisk(
  baseRate: number,
  riskLevel?: string
): { base: number; adjusted: number } {
  let adjustment = 1.0;

  if (riskLevel === 'Crítico') {
    adjustment = 0.3; // 70% redução
  } else if (riskLevel === 'Alto') {
    adjustment = 0.6; // 40% redução
  } else if (riskLevel === 'Médio') {
    adjustment = 0.85; // 15% redução
  } else if (riskLevel === 'Baixo') {
    adjustment = 1.0; // Sem ajuste
  }

  return {
    base: baseRate,
    adjusted: baseRate * adjustment,
  };
}

/**
 * Calcula qual período (semana ou mês) um invoice pertence
 */
export function getForcastPeriod(
  date: Date,
  analysisType: 'weekly' | 'monthly'
): { period: string; periodStart: Date; periodEnd: Date } {
  const d = new Date(date);

  if (analysisType === 'weekly') {
    // ISO week format YYYY-WW
    const weekNumber = Math.ceil((d.getDate() - d.getDay() + 1) / 7);
    const year = d.getFullYear();
    const periodStart = new Date(year, d.getMonth(), d.getDate() - d.getDay());
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);

    return {
      period: `${year}-W${String(weekNumber).padStart(2, '0')}`,
      periodStart,
      periodEnd,
    };
  } else {
    // Monthly format YYYY-MM
    const year = d.getFullYear();
    const month = d.getMonth();
    const periodStart = new Date(year, month, 1);
    const periodEnd = new Date(year, month + 1, 0);

    return {
      period: `${year}-${String(month + 1).padStart(2, '0')}`,
      periodStart,
      periodEnd,
    };
  }
}

/**
 * Calcula a projeção de caixa para os próximos 30-60-90 dias
 */
export function calculateCashFlowForecast(
  invoices: InvoiceForForecast[],
  paymentHistory: PaymentHistoryMetrics,
  analysisType: 'weekly' | 'monthly' = 'weekly',
  forecastDays: number = 60
): CashFlowForecast {
  const now = new Date();
  const scenarios = getScenarioFactors(paymentHistory);
  
  // Agrupar invoices por período
  const periodMap = new Map<string, ForecastItem>();

  for (const invoice of invoices) {
    // Ignorar títulos cancelados e já pagos
    if (invoice.status === 'CANCELED' || invoice.status === 'PAID') {
      continue;
    }

    // Ignorar títulos muito antigos (> 90 dias vencidos)
    if ((invoice.status === 'OPEN' || invoice.status === 'PROMISE_TO_PAY') && new Date(invoice.dueDate) < new Date() && invoice.daysOverdue && invoice.daysOverdue > 90) {
      continue; // Análise é futura, não passada
    }

    // Considerar apenas títulos dentro do período de forecast
    const daysUntilDue = Math.ceil(
      (invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue > forecastDays) {
      continue; // Fora do período
    }

    // Calcular período
    const { period, periodStart, periodEnd } = getForcastPeriod(
      invoice.dueDate,
      analysisType
    );

    // Inicializar período se não existir
    if (!periodMap.has(period)) {
      periodMap.set(period, {
        period,
        periodStart,
        periodEnd,
        nominal: 0,
        optimistic: 0,
        realistic: 0,
        conservative: 0,
        itemCount: 0,
        riskBreakdown: {
          baixoContribution: 0,
          medioContribution: 0,
          altoContribution: 0,
          criticoContribution: 0,
        },
        details: [],
      });
    }

    const forecastItem = periodMap.get(period)!;

    // Calcular probabilidades
    let baseProbability = 0.8; // Default

    if ((invoice.status === 'OPEN' || invoice.status === 'PROMISE_TO_PAY') && new Date(invoice.dueDate) < new Date()) {
      // Para vencidos: usar taxa de recuperação do cenário
      baseProbability = scenarios.realista.recoveryRate;
    } else {
      // Para a vencer: usar taxa de pagamento no prazo
      baseProbability = scenarios.realista.onTimeRate;
    }

    // Ajustar por risco
    const { adjusted: riskAdjustedProb } = adjustProbabilityForRisk(
      baseProbability,
      invoice.riskLevel
    );

    // Calcular valores por cenário
    const nominalValue = invoice.updatedAmount || invoice.amount;
    const optimisticValue =
      nominalValue *
      scenarios.otimista[
        (invoice.status === 'OPEN' || invoice.status === 'PROMISE_TO_PAY') && new Date(invoice.dueDate) < new Date() ? 'recoveryRate' : 'onTimeRate'
      ] *
      (invoice.riskLevel === 'Crítico' ? 0.2 : 1);

    const realisticValue = nominalValue * riskAdjustedProb;

    const conservativeValue =
      nominalValue *
      scenarios.conservador[
        (invoice.status === 'OPEN' || invoice.status === 'PROMISE_TO_PAY') && new Date(invoice.dueDate) < new Date() ? 'recoveryRate' : 'onTimeRate'
      ] *
      (invoice.riskLevel === 'Crítico'
        ? 0.1
        : invoice.riskLevel === 'Alto'
          ? 0.5
          : 1);

    // Atualizar agregados
    forecastItem.nominal += nominalValue;
    forecastItem.optimistic += optimisticValue;
    forecastItem.realistic += realisticValue;
    forecastItem.conservative += conservativeValue;
    forecastItem.itemCount += 1;

    // Rastrear breakdown por risco
    if (invoice.riskLevel === 'Baixo') {
      forecastItem.riskBreakdown.baixoContribution += nominalValue;
    } else if (invoice.riskLevel === 'Médio') {
      forecastItem.riskBreakdown.medioContribution += nominalValue;
    } else if (invoice.riskLevel === 'Alto') {
      forecastItem.riskBreakdown.altoContribution += nominalValue;
    } else if (invoice.riskLevel === 'Crítico') {
      forecastItem.riskBreakdown.criticoContribution += nominalValue;
    }

    // Adicionar detalhe
    forecastItem.details.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      amount: nominalValue,
      dueDate: invoice.dueDate,
      riskLevel: invoice.riskLevel || 'N/A',
      scenarios: {
        otimista: Math.round(optimisticValue),
        realista: Math.round(realisticValue),
        conservador: Math.round(conservativeValue),
      },
    });
  }

  // Converter map para array ordenado
  const periods = Array.from(periodMap.values()).sort(
    (a, b) => a.periodStart.getTime() - b.periodStart.getTime()
  );

  // Arredondar valores
  periods.forEach((p) => {
    p.nominal = Math.round(p.nominal);
    p.optimistic = Math.round(p.optimistic);
    p.realistic = Math.round(p.realistic);
    p.conservative = Math.round(p.conservative);
  });

  // Calcular summary
  const totalNominal = periods.reduce((sum, p) => sum + p.nominal, 0);
  const totalOptimistic = periods.reduce((sum, p) => sum + p.optimistic, 0);
  const totalRealistic = periods.reduce((sum, p) => sum + p.realistic, 0);
  const totalConservative = periods.reduce((sum, p) => sum + p.conservative, 0);

  const periodCovered =
    periods.length > 0
      ? `${periods[0].periodStart.toISOString().split('T')[0]} a ${periods[periods.length - 1].periodEnd.toISOString().split('T')[0]}`
      : 'N/A';

  // Assumptions
  const assumptions = [
    `Análise baseada em ${paymentHistory.totalInvoices} faturas históricas`,
    `Taxa de pagamento no prazo (histórico): ${Math.round(paymentHistory.onTimePayments / Math.max(1, paymentHistory.totalInvoices) * 100)}%`,
    `Taxa de recuperação de vencidos: ${Math.round(paymentHistory.overdueRecoveries / Math.max(1, paymentHistory.latePayments) * 100)}%`,
    `Taxa de quebra de promessas: ${Math.round(paymentHistory.promiseBreakRate * 100)}%`,
    `Período de forecast: ${forecastDays} dias`,
    `Score de Risco incorporado na probabilidade de recebimento por cliente`,
    `Cenário Otimista: assume melhora de 20-30% vs histórico`,
    `Cenário Realista: usa histórico ajustado por risco`,
    `Cenário Conservador: reduz expectativa em 30-50% vs histórico`,
  ];

  return {
    tenantId: '', // Preenchido por quem chama
    generatedAt: now,
    analysisType,
    periods,
    summary: {
      totalNominal,
      totalOptimistic,
      totalRealistic,
      totalConservative,
      averageRecoveryRate: scenarios.realista.recoveryRate,
      periodCovered,
    },
    scenarios,
    assumptions,
  };
}
