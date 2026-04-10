'use server';

import prisma from '@/lib/prisma';
import { calculateRiskScore, RiskScoreResult } from '@/lib/risk-score';
import { createRiskAlerts } from './risk-alerts';
import { isInvoiceOverdue } from '@/lib/invoice-utils';

/**
 * Extrai dados de risco de um cliente e calcula seu score
 * Centraliza a lógica de cálculo para evitar duplicação
 */
export async function getRiskScoreForCustomer(
  customerId: string,
  tenantId: string
): Promise<RiskScoreResult | null> {
  // Validar customer pertence ao tenant
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId }
  });

  if (!customer) return null;

  // Buscar todas as invoices do cliente
  const invoices = await prisma.invoice.findMany({
    where: { customerId, tenantId },
    select: {
      id: true,
      status: true,
      dueDate: true,
      updatedAmount: true,
      amount: true
    }
  });

  // Buscar promessas quebradas
  const invoiceIds = invoices.map(i => i.id);
  const brokenPromises = await prisma.paymentPromise.findMany({
    where: {
      tenantId,
      invoiceId: { in: invoiceIds },
      status: 'broken'
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXTRAIR DADOS PARA CÁLCULO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Atrasos (histórico completo de faturas atrasadas)
  const delayedInvoices = invoices.filter(inv => isInvoiceOverdue(inv));
  const delayCount = delayedInvoices.length;

  // 2. Atraso máximo e médio
  const delays: number[] = [];
  let maxDelayDays = 0;

  delayedInvoices.forEach(inv => {
    const dueDate = new Date(inv.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    delays.push(diffDays);
    maxDelayDays = Math.max(maxDelayDays, diffDays);
  });

  const avgDelayDays = delays.length > 0
    ? delays.reduce((a, b) => a + b, 0) / delays.length
    : 0;

  // 3. Valor total em aberto (pendente + atrasado)
  const openAmount = invoices
    .filter(inv => inv.status === 'OPEN' || inv.status === 'PROMISE_TO_PAY')
    .reduce((sum, inv) => sum + (inv.updatedAmount || inv.amount || 0), 0);

  // 4. Promessas quebradas
  const promisesBrokenCount = brokenPromises.length;

  // 5. Total de invoices (para contexto)
  const totalInvoices = invoices.length;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CALCULAR SCORE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const riskScore = calculateRiskScore({
    delayCount,
    maxDelayDays,
    avgDelayDays,
    openAmount,
    promisesBrokenCount,
    totalInvoices
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CRIAR ALERTAS AUTOMÁTICOS (se Crítico ou Alto)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (riskScore.level === 'Crítico' || riskScore.level === 'Alto') {
    // Fire-and-forget: criar alerta sem bloquear a resposta
    // (não aguardamos para não deixar lento)
    createRiskAlerts({
      customerId,
      tenantId,
      riskScore: riskScore.score,
      riskLevel: riskScore.level,
      riskJustification: riskScore.justification
    }).catch((err) => {
      console.error('[RISK ALERT ERROR]', err);
      // Não relançamos erro para não quebrar cálculo de score
    });
  }

  return riskScore;
}

/**
 * Calcula scores para todos os clientes de um tenant
 * Retorna ranking ordenado por score decrescente
 */
export async function getRiskScoresForTenant(tenantId: string) {
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    select: { id: true, name: true }
  });

  const scores = await Promise.all(
    customers.map(async (c) => {
      const riskScore = await getRiskScoreForCustomer(c.id, tenantId);
      return {
        customerId: c.id,
        customerName: c.name,
        ...riskScore
      };
    })
  );

  // Filtrar nulls e ordenar por score decrescente
  return scores
    .filter((s) => s !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}
