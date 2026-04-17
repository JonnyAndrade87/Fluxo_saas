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
 * Calcula scores em lote para um conjunto de clientes de um tenant.
 *
 * Usa APENAS 2 queries fixas independente do número de clientes:
 *   1. Todas as invoices do tenant (filtradas pelos customerIds)
 *   2. Todas as promessas quebradas do tenant (filtradas pelos customerIds)
 *
 * Retorna um Map<customerId, RiskScoreResult | null>.
 * Alertas de risco são disparados fire-and-forget para clientes Alto/Crítico.
 */
export async function getRiskScoresBatch(
  tenantId: string,
  customerIds: string[]
): Promise<Map<string, RiskScoreResult | null>> {
  if (customerIds.length === 0) return new Map();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Query 1: todas as invoices dos clientes solicitados ─────────────────────
  const allInvoices = await prisma.invoice.findMany({
    where: { tenantId, customerId: { in: customerIds } },
    select: { id: true, status: true, dueDate: true, updatedAmount: true, amount: true, customerId: true },
  });

  // Agrupar invoices por cliente
  const invoicesByCustomer = new Map<string, typeof allInvoices>();
  for (const inv of allInvoices) {
    const list = invoicesByCustomer.get(inv.customerId) ?? [];
    list.push(inv);
    invoicesByCustomer.set(inv.customerId, list);
  }

  // ── Query 2: todas as promessas quebradas dos clientes solicitados ──────────
  const allInvoiceIds = allInvoices.map((i) => i.id);
  const allBrokenPromises = allInvoiceIds.length > 0
    ? await prisma.paymentPromise.findMany({
        where: { tenantId, invoiceId: { in: allInvoiceIds }, status: 'broken' },
        select: { invoiceId: true, id: true },
      })
    : [];

  // Agrupar promessas quebradas por invoice → depois mapear para customer
  const brokenByInvoice = new Map<string, number>();
  for (const p of allBrokenPromises) {
    brokenByInvoice.set(p.invoiceId, (brokenByInvoice.get(p.invoiceId) ?? 0) + 1);
  }

  // ── Calcular score para cada customer em memória (sem mais queries) ─────────
  const result = new Map<string, RiskScoreResult | null>();

  for (const customerId of customerIds) {
    const invoices = invoicesByCustomer.get(customerId) ?? [];

    const delayedInvoices = invoices.filter((inv) => isInvoiceOverdue(inv));
    const delayCount = delayedInvoices.length;

    const delays: number[] = [];
    let maxDelayDays = 0;
    for (const inv of delayedInvoices) {
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      delays.push(diffDays);
      maxDelayDays = Math.max(maxDelayDays, diffDays);
    }

    const avgDelayDays = delays.length > 0
      ? delays.reduce((a, b) => a + b, 0) / delays.length
      : 0;

    const openAmount = invoices
      .filter((inv) => inv.status === 'OPEN' || inv.status === 'PROMISE_TO_PAY')
      .reduce((sum, inv) => sum + (inv.updatedAmount || inv.amount || 0), 0);

    // Contar promessas quebradas somando por invoice deste cliente
    const promisesBrokenCount = invoices.reduce(
      (acc, inv) => acc + (brokenByInvoice.get(inv.id) ?? 0),
      0
    );

    const totalInvoices = invoices.length;

    const riskScore = calculateRiskScore({
      delayCount,
      maxDelayDays,
      avgDelayDays,
      openAmount,
      promisesBrokenCount,
      totalInvoices,
    });

    // Alertas fire-and-forget (mesmo comportamento do método individual)
    if (riskScore.level === 'Crítico' || riskScore.level === 'Alto') {
      createRiskAlerts({
        customerId,
        tenantId,
        riskScore: riskScore.score,
        riskLevel: riskScore.level,
        riskJustification: riskScore.justification,
      }).catch((err) => console.error('[RISK BATCH ALERT ERROR]', err));
    }

    result.set(customerId, riskScore);
  }

  return result;
}

/**
 * Calcula scores para todos os clientes de um tenant.
 * Usa getRiskScoresBatch internamente (2 queries fixas, sem N+1).
 * Retorna ranking ordenado por score decrescente.
 */
export async function getRiskScoresForTenant(tenantId: string) {
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });

  const scoresMap = await getRiskScoresBatch(tenantId, customers.map((c) => c.id));

  return customers
    .map((c) => {
      const riskScore = scoresMap.get(c.id) ?? null;
      return { customerId: c.id, customerName: c.name, ...riskScore };
    })
    .filter((s) => s.score !== undefined)
    .sort((a, b) => ((b as { score?: number }).score ?? 0) - ((a as { score?: number }).score ?? 0));
}
