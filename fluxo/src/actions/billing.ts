'use server';

import type { TenantPlan } from '@prisma/client';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getBillingE2EFixture } from '@/lib/e2e-billing';
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

async function getE2EBillingFixtureForAction() {
  try {
    const cookieStore = await cookies();
    return getBillingE2EFixture(cookieStore);
  } catch {
    return null;
  }
}

export async function createSubscriptionCheckoutSession(
  plan: TenantPlan,
): Promise<BillingActionResult> {
  if (await getE2EBillingFixtureForAction()) {
    return { url: `/configuracoes?billing=mock-checkout-${plan}#billing` };
  }

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
  if (await getE2EBillingFixtureForAction()) {
    return { url: '/configuracoes?billing=mock-portal#billing' };
  }

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
