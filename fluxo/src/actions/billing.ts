'use server';

import type { TenantPlan } from '@prisma/client';

import prisma from '@/lib/prisma';
import { requireAuthFresh, requireRole } from '@/lib/permissions';
import {
  createStripeCheckoutSessionForTenant,
  createStripePortalSessionForTenant,
  isStripeBillingConfigurationError,
} from '@/lib/billing/stripe';

type BillingActionResult = {
  url?: string;
  error?: string;
};

export async function createSubscriptionCheckoutSession(
  plan: TenantPlan,
): Promise<BillingActionResult> {
  const ctx = await requireAuthFresh();
  requireRole(['admin'], ctx);

  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true },
    });

    const session = await createStripeCheckoutSessionForTenant({
      tenantId: ctx.tenantId,
      plan,
      customerEmail: user?.email ?? null,
    });

    return { url: session.url ?? undefined };
  } catch (error: unknown) {
    if (isStripeBillingConfigurationError(error)) {
      return { error: 'Billing ainda não está configurado para este ambiente.' };
    }

    return {
      error: error instanceof Error ? error.message : 'Falha ao iniciar o checkout de assinatura.',
    };
  }
}

export async function createCustomerPortalSession(): Promise<BillingActionResult> {
  const ctx = await requireAuthFresh();
  requireRole(['admin'], ctx);

  try {
    const session = await createStripePortalSessionForTenant(ctx.tenantId);
    return { url: session.url };
  } catch (error: unknown) {
    if (isStripeBillingConfigurationError(error)) {
      return { error: 'Billing ainda não está configurado para este ambiente.' };
    }

    return {
      error: error instanceof Error ? error.message : 'Falha ao abrir o portal do cliente.',
    };
  }
}
