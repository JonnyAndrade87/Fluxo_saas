// @vitest-environment node

import { createHmac } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { billingMock } = vi.hoisted(() => ({
  billingMock: {
    getStripeBillingConfiguration: vi.fn(),
    syncTenantBillingFromCheckoutSession: vi.fn(),
    syncTenantBillingFromStripeReferences: vi.fn(),
    syncTenantBillingFromSubscription: vi.fn(),
  },
}));

vi.mock('@/lib/billing/stripe', () => billingMock);

import { POST } from './route';

beforeEach(() => {
  billingMock.getStripeBillingConfiguration.mockReturnValue({ configured: true, missingEnv: [] });
  billingMock.syncTenantBillingFromCheckoutSession.mockResolvedValue({ updated: true, tenantId: 'tenant-1' });
  billingMock.syncTenantBillingFromStripeReferences.mockResolvedValue({ updated: true, tenantId: 'tenant-1' });
  billingMock.syncTenantBillingFromSubscription.mockResolvedValue({ updated: true, tenantId: 'tenant-1' });

  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_123');
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

function signStripePayload(payload: string, secret: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

describe('Stripe webhook route', () => {
  it('returns 503 when billing env configuration is incomplete', async () => {
    billingMock.getStripeBillingConfiguration.mockReturnValue({
      configured: false,
      missingEnv: ['STRIPE_PRICE_ID_PRO'],
    });

    const response = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      }),
    );

    expect(response.status).toBe(503);
    expect(billingMock.syncTenantBillingFromCheckoutSession).not.toHaveBeenCalled();
  });

  it('returns 401 when the Stripe signature is missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      }),
    );

    expect(response.status).toBe(401);
    expect(billingMock.syncTenantBillingFromCheckoutSession).not.toHaveBeenCalled();
  });

  it('handles checkout.session.completed with a valid Stripe signature', async () => {
    const payload = JSON.stringify({
      id: 'evt_1',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          object: 'checkout.session',
          mode: 'subscription',
          customer: 'cus_123',
          subscription: 'sub_123',
          metadata: { tenantId: 'tenant-1', fluxeerPlan: 'pro' },
        },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': signStripePayload(payload, 'whsec_test_123'),
        },
        body: payload,
      }),
    );

    expect(response.status).toBe(200);
    expect(billingMock.syncTenantBillingFromCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cs_123',
        customer: 'cus_123',
        subscription: 'sub_123',
      }),
    );
  });

  it('handles subscription updates and invoice payment failures', async () => {
    const subscriptionPayload = JSON.stringify({
      id: 'evt_sub',
      object: 'event',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          object: 'subscription',
          customer: 'cus_123',
          status: 'past_due',
          metadata: { tenantId: 'tenant-1' },
          items: { data: [{ price: { id: 'price_pro' } }] },
        },
      },
    });

    const failedInvoicePayload = JSON.stringify({
      id: 'evt_inv',
      object: 'event',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_123',
          object: 'invoice',
          customer: 'cus_123',
          parent: {
            subscription_details: {
              subscription: 'sub_123',
            },
          },
        },
      },
    });

    const subResponse = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': signStripePayload(subscriptionPayload, 'whsec_test_123'),
        },
        body: subscriptionPayload,
      }),
    );

    const invoiceResponse = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': signStripePayload(failedInvoicePayload, 'whsec_test_123'),
        },
        body: failedInvoicePayload,
      }),
    );

    expect(subResponse.status).toBe(200);
    expect(invoiceResponse.status).toBe(200);
    expect(billingMock.syncTenantBillingFromSubscription).toHaveBeenCalledOnce();
    expect(billingMock.syncTenantBillingFromStripeReferences).toHaveBeenCalledWith({
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      fallbackStatus: 'past_due',
    });
  });
});
