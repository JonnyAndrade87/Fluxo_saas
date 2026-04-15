import type Stripe from 'stripe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, stripeMock } = vi.hoisted(() => ({
  prismaMock: {
    tenant: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  stripeMock: {
    customers: {
      create: vi.fn(),
      update: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => stripeMock),
}));

import {
  createStripeCheckoutSessionForTenant,
  mapStripeSubscriptionStatus,
  resolvePlanFromStripePriceId,
  syncTenantBillingFromSubscription,
} from '@/lib/billing/stripe';

beforeEach(() => {
  prismaMock.tenant.findUnique.mockReset();
  prismaMock.tenant.findFirst.mockReset();
  prismaMock.tenant.update.mockReset();
  stripeMock.customers.create.mockReset();
  stripeMock.customers.update.mockReset();
  stripeMock.checkout.sessions.create.mockReset();
  stripeMock.billingPortal.sessions.create.mockReset();
  stripeMock.subscriptions.retrieve.mockReset();

  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_123');
  vi.stubEnv('STRIPE_PRICE_ID_STARTER', 'price_starter');
  vi.stubEnv('STRIPE_PRICE_ID_PRO', 'price_pro');
  vi.stubEnv('STRIPE_PRICE_ID_SCALE', 'price_scale');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.fluxeer.test');
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('Stripe billing service', () => {
  it('maps Stripe price IDs back to the internal plan', () => {
    expect(resolvePlanFromStripePriceId('price_pro')).toBe('pro');
    expect(resolvePlanFromStripePriceId('price_unknown')).toBeNull();
  });

  it('maps Stripe subscription statuses to the internal subscription status', () => {
    expect(mapStripeSubscriptionStatus('trialing')).toBe('trialing');
    expect(mapStripeSubscriptionStatus('active')).toBe('active');
    expect(mapStripeSubscriptionStatus('past_due')).toBe('past_due');
    expect(mapStripeSubscriptionStatus('canceled')).toBe('canceled');
    expect(mapStripeSubscriptionStatus('unpaid')).toBe('past_due');
  });

  it('creates a checkout session using the mapped Stripe price ID', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant One',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'trialing',
    });
    prismaMock.tenant.update.mockResolvedValue({});
    stripeMock.customers.create.mockResolvedValue({ id: 'cus_123' });
    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.test/session',
    });

    const session = await createStripeCheckoutSessionForTenant({
      tenantId: 'tenant-1',
      plan: 'pro',
      customerEmail: 'admin@tenant.com',
    });

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_pro', quantity: 1 }],
        metadata: expect.objectContaining({ tenantId: 'tenant-1', fluxeerPlan: 'pro' }),
      }),
    );
    expect(session.url).toBe('https://checkout.stripe.test/session');
  });

  it('syncs tenant billing fields from the Stripe subscription data', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      plan: 'starter',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });
    prismaMock.tenant.update.mockResolvedValue({});

    const result = await syncTenantBillingFromSubscription({
      id: 'sub_123',
      status: 'active',
      customer: 'cus_123',
      metadata: { tenantId: 'tenant-1', fluxeerPlan: 'scale' },
      items: {
        data: [{ price: { id: 'price_scale' } }],
      },
    } as unknown as Stripe.Subscription);

    expect(prismaMock.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: {
        plan: 'scale',
        subscriptionStatus: 'active',
        maxUsers: 10,
        maxCustomers: 20000,
        maxInvoices: 100000,
        supportLevel: 'vip',
        onboardingTier: 'concierge',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      },
    });
    expect(result).toEqual({
      updated: true,
      tenantId: 'tenant-1',
      plan: 'scale',
      subscriptionStatus: 'active',
    });
  });
});
