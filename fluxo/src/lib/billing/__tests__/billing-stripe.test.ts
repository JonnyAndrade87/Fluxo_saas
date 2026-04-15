import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We test the pure functions that don't require database access.
// The functions that make Stripe API calls or DB calls are tested via integration/E2E.

describe('getStripePriceId', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_ID_PRO_MONTHLY: 'price_pro_monthly_test',
      STRIPE_PRICE_ID_PRO_YEARLY: 'price_pro_yearly_test',
      STRIPE_PRICE_ID_PRO_LAUNCH: 'price_pro_launch_test',
      STRIPE_PRICE_ID_SCALE_MONTHLY: 'price_scale_monthly_test',
      STRIPE_PRICE_ID_SCALE_YEARLY: 'price_scale_yearly_test',
      STRIPE_PRICE_ID_SCALE_LAUNCH: 'price_scale_launch_test',
      STRIPE_SECRET_KEY: 'sk_test_fake',
      STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('resolves correct price ID for pro monthly', async () => {
    const { getStripePriceId } = await import('../stripe');
    expect(getStripePriceId('pro', 'monthly')).toBe('price_pro_monthly_test');
  });

  it('resolves correct price ID for pro yearly', async () => {
    const { getStripePriceId } = await import('../stripe');
    expect(getStripePriceId('pro', 'yearly')).toBe('price_pro_yearly_test');
  });

  it('resolves correct price ID for pro launch (internal only)', async () => {
    const { getStripePriceId } = await import('../stripe');
    expect(getStripePriceId('pro', 'launch')).toBe('price_pro_launch_test');
  });

  it('resolves correct price ID for scale monthly', async () => {
    const { getStripePriceId } = await import('../stripe');
    expect(getStripePriceId('scale', 'monthly')).toBe('price_scale_monthly_test');
  });

  it('throws for starter plan — Starter is free and never goes through Stripe', async () => {
    const { getStripePriceId } = await import('../stripe');
    expect(() => getStripePriceId('starter', 'monthly')).toThrow(
      'O plano Starter é gratuito e não requer checkout Stripe.',
    );
  });

  it('throws StripeBillingConfigurationError if env var is missing', async () => {
    delete process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
    const { getStripePriceId, StripeBillingConfigurationError } = await import('../stripe');
    expect(() => getStripePriceId('pro', 'monthly')).toThrow(StripeBillingConfigurationError);
  });
});

describe('resolvePlanFromStripePriceId', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_ID_PRO_MONTHLY: 'price_pro_monthly_test',
      STRIPE_PRICE_ID_PRO_YEARLY: 'price_pro_yearly_test',
      STRIPE_PRICE_ID_PRO_LAUNCH: 'price_pro_launch_test',
      STRIPE_PRICE_ID_SCALE_MONTHLY: 'price_scale_monthly_test',
      STRIPE_PRICE_ID_SCALE_YEARLY: 'price_scale_yearly_test',
      STRIPE_PRICE_ID_SCALE_LAUNCH: 'price_scale_launch_test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('resolves pro from any pro price ID', async () => {
    const { resolvePlanFromStripePriceId } = await import('../stripe');
    expect(resolvePlanFromStripePriceId('price_pro_monthly_test')).toBe('pro');
    expect(resolvePlanFromStripePriceId('price_pro_yearly_test')).toBe('pro');
    expect(resolvePlanFromStripePriceId('price_pro_launch_test')).toBe('pro');
  });

  it('resolves scale from any scale price ID', async () => {
    const { resolvePlanFromStripePriceId } = await import('../stripe');
    expect(resolvePlanFromStripePriceId('price_scale_monthly_test')).toBe('scale');
    expect(resolvePlanFromStripePriceId('price_scale_launch_test')).toBe('scale');
  });

  it('returns null for unknown price ID', async () => {
    const { resolvePlanFromStripePriceId } = await import('../stripe');
    expect(resolvePlanFromStripePriceId('price_unknown_xyz')).toBeNull();
  });

  it('returns null for null input', async () => {
    const { resolvePlanFromStripePriceId } = await import('../stripe');
    expect(resolvePlanFromStripePriceId(null)).toBeNull();
  });
});

describe('resolveCycleFromStripePriceId', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_ID_PRO_MONTHLY: 'price_pro_monthly_test',
      STRIPE_PRICE_ID_PRO_YEARLY: 'price_pro_yearly_test',
      STRIPE_PRICE_ID_PRO_LAUNCH: 'price_pro_launch_test',
      STRIPE_PRICE_ID_SCALE_MONTHLY: 'price_scale_monthly_test',
      STRIPE_PRICE_ID_SCALE_YEARLY: 'price_scale_yearly_test',
      STRIPE_PRICE_ID_SCALE_LAUNCH: 'price_scale_launch_test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('resolves monthly cycle', async () => {
    const { resolveCycleFromStripePriceId } = await import('../stripe');
    expect(resolveCycleFromStripePriceId('price_pro_monthly_test')).toBe('monthly');
  });

  it('resolves yearly cycle', async () => {
    const { resolveCycleFromStripePriceId } = await import('../stripe');
    expect(resolveCycleFromStripePriceId('price_scale_yearly_test')).toBe('yearly');
  });

  it('resolves launch cycle', async () => {
    const { resolveCycleFromStripePriceId } = await import('../stripe');
    expect(resolveCycleFromStripePriceId('price_pro_launch_test')).toBe('launch');
  });

  it('returns null for unknown price ID', async () => {
    const { resolveCycleFromStripePriceId } = await import('../stripe');
    expect(resolveCycleFromStripePriceId('price_unknown')).toBeNull();
  });
});

describe('mapStripeSubscriptionStatus', () => {
  it('maps active correctly', async () => {
    const { mapStripeSubscriptionStatus } = await import('../stripe');
    expect(mapStripeSubscriptionStatus('active')).toBe('active');
  });

  it('maps trialing correctly', async () => {
    const { mapStripeSubscriptionStatus } = await import('../stripe');
    expect(mapStripeSubscriptionStatus('trialing')).toBe('trialing');
  });

  it('maps past_due, unpaid, and incomplete → past_due', async () => {
    const { mapStripeSubscriptionStatus } = await import('../stripe');
    expect(mapStripeSubscriptionStatus('past_due')).toBe('past_due');
    expect(mapStripeSubscriptionStatus('unpaid')).toBe('past_due');
    expect(mapStripeSubscriptionStatus('incomplete')).toBe('past_due');
  });

  it('maps canceled correctly', async () => {
    const { mapStripeSubscriptionStatus } = await import('../stripe');
    expect(mapStripeSubscriptionStatus('canceled')).toBe('canceled');
  });
});
