'use server';

import type { TenantPlan } from '@prisma/client';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getBillingE2EFixture } from '@/lib/e2e-billing';
import { requireAuthFresh, requireRole } from '@/lib/permissions';
import type { BillingCycle } from '@/lib/billing/stripe';
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

/**
 * Creates a Stripe Checkout Session for a paid plan subscription.
 *
 * Security:
 * - Plan and cycle are validated server-side. The client never sends a priceId.
 * - Starter plan is blocked explicitly — no Stripe checkout.
 * - tenantId is always derived from the authenticated session, never from the client.
 */
export async function createSubscriptionCheckoutSession(
  plan: TenantPlan,
  billingCycle: BillingCycle = 'monthly',
): Promise<BillingActionResult> {
  // Starter is free — never goes through Stripe.
  if (plan === 'starter') {
    return { error: 'O plano Starter é gratuito e não requer assinatura Stripe.' };
  }

  if (await getE2EBillingFixtureForAction()) {
    return { url: `/planos?billing=mock-checkout-${plan}-${billingCycle}` };
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
      billingCycle,
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

/**
 * Opens a Stripe Billing Portal session for the authenticated tenant.
 * Requires an existing stripeCustomerId on the tenant.
 */
export async function createCustomerPortalSession(): Promise<BillingActionResult> {
  if (await getE2EBillingFixtureForAction()) {
    return { url: '/planos?billing=mock-portal' };
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
