'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { requireAuthFresh } from '@/lib/permissions';
import { enforceRateLimit } from '@/lib/api-rate-limiter';
import { DEFAULT_BILLING_FLOW_CONFIG, normalizeBillingFlowConfig } from '@/lib/billing-flow';

export async function saveBillingFlow(rulesData: unknown) {
  const ctx = await requireAuthFresh();
  
  // ── Proteção: Apenas Admin pode editar a régua de cobrança
  if ((ctx.role as string) !== 'admin') {
    throw new Error('Forbidden: Apenas administradores podem alterar a régua de cobrança');
  }
  
  const tenantId = ctx.tenantId;

  try {
    await enforceRateLimit('save-billing', tenantId, { limit: 20, windowMs: 60 * 60 * 1000 }); // 20/hr
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : 'Muitas tentativas de salvar o fluxo de cobrança.');
  }

  const normalizedRules = normalizeBillingFlowConfig(rulesData);

  // Find existing config or create if none
  const existingFlow = await prisma.billingFlow.findFirst({
    where: { tenantId }
  });

  if (existingFlow) {
    return await prisma.billingFlow.update({
      where: { id: existingFlow.id },
      data: { rules: JSON.stringify(normalizedRules) }
    });
  } else {
    return await prisma.billingFlow.create({
      data: {
        tenantId,
        name: 'Régua Global de Automação',
        isActive: true,
        rules: JSON.stringify(normalizedRules)
      }
    });
  }
}

export async function getBillingFlow() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    throw new Error('Unauthorized');
  }

  const flow = await prisma.billingFlow.findFirst({
    where: { tenantId }
  });

  if (!flow) return DEFAULT_BILLING_FLOW_CONFIG;

  try {
    return normalizeBillingFlowConfig(JSON.parse(flow.rules));
  } catch {
    return DEFAULT_BILLING_FLOW_CONFIG;
  }
}
