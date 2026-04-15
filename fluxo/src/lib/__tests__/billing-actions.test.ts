import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, billingMock, permissionsMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
  },
  billingMock: {
    createStripeCheckoutSessionForTenant: vi.fn(),
    createStripePortalSessionForTenant: vi.fn(),
    isStripeBillingConfigurationError: vi.fn(),
  },
  permissionsMock: {
    requireAuthFresh: vi.fn(),
    requireRole: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/billing/stripe', () => billingMock);

vi.mock('@/lib/permissions', () => permissionsMock);

import {
  createCustomerPortalSession,
  createSubscriptionCheckoutSession,
} from '@/actions/billing';

describe('Billing server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    permissionsMock.requireAuthFresh.mockResolvedValue({
      tenantId: 'tenant-1',
      userId: 'user-1',
      role: 'admin',
    });
    permissionsMock.requireRole.mockImplementation(() => undefined);
    prismaMock.user.findUnique.mockResolvedValue({ email: 'admin@tenant.com' });
    billingMock.isStripeBillingConfigurationError.mockReturnValue(false);
  });

  it('returns the checkout URL when Stripe checkout is created successfully', async () => {
    billingMock.createStripeCheckoutSessionForTenant.mockResolvedValue({
      url: 'https://checkout.stripe.test/session',
    });

    const result = await createSubscriptionCheckoutSession('pro');

    expect(result).toEqual({ url: 'https://checkout.stripe.test/session' });
    expect(billingMock.createStripeCheckoutSessionForTenant).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      plan: 'pro',
      customerEmail: 'admin@tenant.com',
    });
  });

  it('returns a friendly error when billing is not configured', async () => {
    const configError = new Error('Stripe billing is not configured.');
    billingMock.createStripeCheckoutSessionForTenant.mockRejectedValue(configError);
    billingMock.isStripeBillingConfigurationError.mockReturnValue(true);

    const result = await createSubscriptionCheckoutSession('starter');

    expect(result).toEqual({
      error: 'Billing ainda não está configurado para este ambiente.',
    });
  });

  it('returns the portal URL when Stripe portal session is created successfully', async () => {
    billingMock.createStripePortalSessionForTenant.mockResolvedValue({
      url: 'https://billing.stripe.test/portal',
    });

    const result = await createCustomerPortalSession();

    expect(result).toEqual({ url: 'https://billing.stripe.test/portal' });
    expect(billingMock.createStripePortalSessionForTenant).toHaveBeenCalledWith('tenant-1');
  });
});
