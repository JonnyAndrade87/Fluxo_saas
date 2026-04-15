import type { SubscriptionStatus, TenantPlan } from '@prisma/client';
import type Stripe from 'stripe';

import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { getTenantPlanSnapshot, isTenantPlan } from '@/lib/billing/plans';

// ── Billing Cycle ──────────────────────────────────────────────────────────────
// The `launch` cycle is a private price available only to early subscribers.
// It is fully resolved server-side and NEVER exposed to the frontend UI by default.
// To offer a launch price, pass billingCycle: 'launch' from a controlled internal path.
//
// NOTE (future): Auto-migration from launch → monthly after 12 months via Stripe
// Subscription Schedules is NOT implemented yet. When ready, implement it inside
// `createStripeCheckoutSessionForTenant` by attaching a `phases` array that
// transitions the subscription to the regular monthly price after the launch period.
// See: https://stripe.com/docs/billing/subscriptions/subscription-schedules
export type BillingCycle = 'monthly' | 'yearly' | 'launch';
export type PaidPlan = Exclude<TenantPlan, 'starter'>;

// Central price ID config — server-side only.
// All price IDs are resolved from env vars, never hardcoded.
const STRIPE_PRICE_ENV: Record<PaidPlan, Record<BillingCycle, string>> = {
  pro: {
    monthly: 'STRIPE_PRICE_ID_PRO_MONTHLY',
    yearly: 'STRIPE_PRICE_ID_PRO_YEARLY',
    launch: 'STRIPE_PRICE_ID_PRO_LAUNCH',
  },
  scale: {
    monthly: 'STRIPE_PRICE_ID_SCALE_MONTHLY',
    yearly: 'STRIPE_PRICE_ID_SCALE_YEARLY',
    launch: 'STRIPE_PRICE_ID_SCALE_LAUNCH',
  },
};

// Minimum required env vars (monthly cycle; yearly is optional for now).
const REQUIRED_STRIPE_ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_PRO_MONTHLY',
  'STRIPE_PRICE_ID_SCALE_MONTHLY',
];

export class StripeBillingConfigurationError extends Error {
  readonly name = 'StripeBillingConfigurationError';

  constructor(readonly missingEnv: string[]) {
    super('Stripe billing is not configured.');
    Object.setPrototypeOf(this, StripeBillingConfigurationError.prototype);
  }
}

export function isStripeBillingConfigurationError(
  error: unknown,
): error is StripeBillingConfigurationError {
  return error instanceof StripeBillingConfigurationError;
}

export function getStripeBillingMissingEnv(): string[] {
  return REQUIRED_STRIPE_ENV.filter((envName) => !process.env[envName]?.trim());
}

export function getStripeBillingConfiguration() {
  const missingEnv = getStripeBillingMissingEnv();
  return { configured: missingEnv.length === 0, missingEnv };
}

function ensureStripeBillingConfigured(): void {
  const missingEnv = getStripeBillingMissingEnv();
  if (missingEnv.length > 0) {
    throw new StripeBillingConfigurationError(missingEnv);
  }
}

/**
 * Resolves the Stripe price ID for a given paid plan + billing cycle.
 * Starter is explicitly blocked — it has no Stripe price.
 */
export function getStripePriceId(plan: TenantPlan, cycle: BillingCycle): string {
  if (plan === 'starter') {
    throw new Error('O plano Starter é gratuito e não requer checkout Stripe.');
  }

  const envName = STRIPE_PRICE_ENV[plan as PaidPlan]?.[cycle];
  if (!envName) {
    throw new StripeBillingConfigurationError([`STRIPE_PRICE_ID_${plan.toUpperCase()}_${cycle.toUpperCase()}`]);
  }

  const priceId = process.env[envName]?.trim();
  if (!priceId) {
    throw new StripeBillingConfigurationError([envName]);
  }

  return priceId;
}

/**
 * Reverse-lookup: given a Stripe price ID, returns the matching TenantPlan.
 * Scans all plans and cycles (including launch).
 */
export function resolvePlanFromStripePriceId(priceId: string | null | undefined): TenantPlan | null {
  if (!priceId) return null;

  for (const [plan, cycles] of Object.entries(STRIPE_PRICE_ENV) as Array<[PaidPlan, Record<BillingCycle, string>]>) {
    for (const envName of Object.values(cycles)) {
      if (process.env[envName]?.trim() === priceId) {
        return plan;
      }
    }
  }

  return null;
}

/**
 * Reverse-lookup: given a Stripe price ID, returns the billing cycle.
 */
export function resolveCycleFromStripePriceId(priceId: string | null | undefined): BillingCycle | null {
  if (!priceId) return null;

  for (const cycles of Object.values(STRIPE_PRICE_ENV) as Array<Record<BillingCycle, string>>) {
    for (const [cycle, envName] of Object.entries(cycles) as Array<[BillingCycle, string]>) {
      if (process.env[envName]?.trim() === priceId) {
        return cycle;
      }
    }
  }

  return null;
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status | string,
): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'past_due';
    default:
      return 'active';
  }
}

function buildAppUrl(path: string, params?: Record<string, string>): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluxeer.com.br';
  const url = new URL(path, baseUrl);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function normalizeStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

function normalizeStripeSubscriptionId(
  subscription: string | Stripe.Subscription | null,
): string | null {
  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : subscription.id;
}

function resolvePlanFromSubscription(subscription: Stripe.Subscription): TenantPlan | null {
  const priceId = subscription.items.data[0]?.price?.id;
  const mappedPlan = resolvePlanFromStripePriceId(priceId);

  if (mappedPlan) return mappedPlan;

  const metadataPlan = subscription.metadata.fluxeerPlan;
  if (metadataPlan && isTenantPlan(metadataPlan)) {
    return metadataPlan;
  }

  return null;
}

async function findTenantForStripeSync(params: {
  tenantId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  if (params.tenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
    if (tenant) return tenant;
  }

  if (params.stripeSubscriptionId) {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: params.stripeSubscriptionId },
    });
    if (tenant) return tenant;
  }

  if (params.stripeCustomerId) {
    return prisma.tenant.findFirst({
      where: { stripeCustomerId: params.stripeCustomerId },
    });
  }

  return null;
}

async function persistStripeReferences(params: {
  tenantId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  await prisma.tenant.update({
    where: { id: params.tenantId },
    data: {
      stripeCustomerId: params.stripeCustomerId ?? undefined,
      stripeSubscriptionId: params.stripeSubscriptionId ?? undefined,
    },
  });
}

export async function ensureStripeCustomerForTenant(params: {
  tenantId: string;
  tenantName: string;
  customerEmail?: string | null;
  stripeCustomerId?: string | null;
}) {
  ensureStripeBillingConfigured();

  const stripe = getStripe();
  if (!stripe) throw new StripeBillingConfigurationError(['STRIPE_SECRET_KEY']);

  if (params.stripeCustomerId) {
    await stripe.customers.update(params.stripeCustomerId, {
      name: params.tenantName,
      email: params.customerEmail ?? undefined,
      metadata: { tenantId: params.tenantId },
    });
    return params.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    name: params.tenantName,
    email: params.customerEmail ?? undefined,
    metadata: { tenantId: params.tenantId },
  });

  await persistStripeReferences({
    tenantId: params.tenantId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

export async function createStripeCheckoutSessionForTenant(params: {
  tenantId: string;
  plan: TenantPlan;
  billingCycle: BillingCycle;
  customerEmail?: string | null;
}) {
  if (params.plan === 'starter') {
    throw new Error('O plano Starter é gratuito e não requer checkout Stripe.');
  }

  ensureStripeBillingConfigured();

  const stripe = getStripe();
  if (!stripe) throw new StripeBillingConfigurationError(['STRIPE_SECRET_KEY']);

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: {
      id: true,
      name: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
    },
  });

  if (!tenant) throw new Error('Tenant not found');

  if (tenant.stripeSubscriptionId && tenant.subscriptionStatus !== 'canceled') {
    throw new Error('Sua assinatura já existe. Use o portal do cliente para gerenciar ou alterar o plano.');
  }

  const customerId = await ensureStripeCustomerForTenant({
    tenantId: tenant.id,
    tenantName: tenant.name,
    customerEmail: params.customerEmail,
    stripeCustomerId: tenant.stripeCustomerId,
  });

  // Resolve priceId server-side. Frontend never sends a priceId directly.
  const priceId = getStripePriceId(params.plan, params.billingCycle);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: tenant.id,
    success_url: buildAppUrl('/planos', { billing: 'success' }),
    cancel_url: buildAppUrl('/planos', { billing: 'canceled' }),
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      tenantId: tenant.id,
      fluxeerPlan: params.plan,
      billingCycle: params.billingCycle,
    },
    subscription_data: {
      metadata: {
        tenantId: tenant.id,
        fluxeerPlan: params.plan,
        billingCycle: params.billingCycle,
      },
    },
  });

  if (!session.url) {
    throw new Error('Stripe checkout session was created without a URL.');
  }

  return session;
}

export async function createStripePortalSessionForTenant(tenantId: string) {
  ensureStripeBillingConfigured();

  const stripe = getStripe();
  if (!stripe) throw new StripeBillingConfigurationError(['STRIPE_SECRET_KEY']);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { stripeCustomerId: true },
  });

  if (!tenant) throw new Error('Tenant not found');

  if (!tenant.stripeCustomerId) {
    throw new Error('Nenhum cliente Stripe foi encontrado para este tenant.');
  }

  return stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: buildAppUrl('/planos', { billing: 'portal' }),
  });
}

export async function syncTenantBillingFromSubscription(
  subscription: Stripe.Subscription,
  tenantIdHint?: string | null,
) {
  const plan = resolvePlanFromSubscription(subscription);
  if (!plan) {
    throw new Error('Stripe subscription price is not mapped to a Fluxeer plan.');
  }

  const stripeCustomerId = normalizeStripeCustomerId(subscription.customer);
  const tenant = await findTenantForStripeSync({
    tenantId: tenantIdHint ?? subscription.metadata.tenantId,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
  });

  if (!tenant) {
    return { updated: false, skipped: 'tenant_not_found' } as const;
  }

  const subscriptionStatus = mapStripeSubscriptionStatus(subscription.status);
  const billingSnapshot = getTenantPlanSnapshot(plan, subscriptionStatus);

  // Resolve active price metadata
  const activePriceId = subscription.items.data[0]?.price?.id ?? null;
  // current_period_end is available on the Stripe Subscription object at runtime.
  // Use type assertion for SDK version compatibility.
  const rawPeriodEnd = (subscription as unknown as Record<string, unknown>)['current_period_end'] as number | undefined;
  const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : null;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      ...billingSnapshot,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: activePriceId,
      currentPeriodEnd,
    },
  });

  return {
    updated: true,
    tenantId: tenant.id,
    plan,
    subscriptionStatus,
  } as const;
}

export async function syncTenantBillingFromStripeReferences(params: {
  tenantId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  fallbackStatus?: SubscriptionStatus;
}) {
  ensureStripeBillingConfigured();

  const stripe = getStripe();
  if (!stripe) throw new StripeBillingConfigurationError(['STRIPE_SECRET_KEY']);

  if (params.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(params.stripeSubscriptionId);
    return syncTenantBillingFromSubscription(subscription, params.tenantId);
  }

  const tenant = await findTenantForStripeSync(params);
  if (!tenant) {
    return { updated: false, skipped: 'tenant_not_found' } as const;
  }

  if (!params.fallbackStatus) {
    return { updated: false, skipped: 'no_subscription_reference' } as const;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeCustomerId: params.stripeCustomerId ?? undefined,
      stripeSubscriptionId: params.stripeSubscriptionId ?? undefined,
      subscriptionStatus: params.fallbackStatus,
    },
  });

  return {
    updated: true,
    tenantId: tenant.id,
    plan: tenant.plan,
    subscriptionStatus: params.fallbackStatus,
  } as const;
}

export async function syncTenantBillingFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') {
    return { updated: false, skipped: 'unsupported_checkout_mode' } as const;
  }

  const tenantId = session.metadata?.tenantId ?? session.client_reference_id;
  const stripeCustomerId = normalizeStripeCustomerId(session.customer);
  const stripeSubscriptionId = normalizeStripeSubscriptionId(session.subscription);

  if (tenantId) {
    await persistStripeReferences({ tenantId, stripeCustomerId, stripeSubscriptionId });
  }

  return syncTenantBillingFromStripeReferences({
    tenantId,
    stripeCustomerId,
    stripeSubscriptionId,
    fallbackStatus: 'active',
  });
}
