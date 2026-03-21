'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export async function saveBillingFlow(rulesData: any) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error('Unauthorized');
  }

  const existingFlow = await prisma.billingFlow.findFirst({
    where: { tenantId }
  });

  if (existingFlow) {
    return await prisma.billingFlow.update({
      where: { id: existingFlow.id },
      data: { rules: JSON.stringify(rulesData) }
    });
  } else {
    return await prisma.billingFlow.create({
      data: {
        tenantId,
        name: 'Régua Global de Automação',
        isActive: true,
        rules: JSON.stringify(rulesData)
      }
    });
  }
}

export async function getBillingFlow() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error('Unauthorized');
  }

  const flow = await prisma.billingFlow.findFirst({
    where: { tenantId }
  });

  if (!flow) return null;

  try {
    return JSON.parse(flow.rules);
  } catch (error) {
    return null;
  }
}
