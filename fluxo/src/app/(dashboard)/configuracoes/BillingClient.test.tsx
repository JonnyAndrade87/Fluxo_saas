import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { billingActionsMock } = vi.hoisted(() => ({
  billingActionsMock: {
    createSubscriptionCheckoutSession: vi.fn(),
    createCustomerPortalSession: vi.fn(),
  },
}));

vi.mock('@/actions/billing', () => billingActionsMock);

import BillingClient from './BillingClient';

const baseBilling = {
  plan: 'pro',
  subscriptionStatus: 'trialing',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  maxUsers: 3,
  maxCustomers: 2000,
  maxInvoices: 10000,
  supportLevel: 'priority',
  onboardingTier: 'assisted',
  usage: {
    users: 2,
    customers: 134,
    invoices: 780,
  },
} as const;

describe('BillingClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billingActionsMock.createSubscriptionCheckoutSession.mockResolvedValue({ error: 'checkout-error' });
    billingActionsMock.createCustomerPortalSession.mockResolvedValue({ error: 'portal-error' });
  });

  it('renders the tenant billing data and highlights the current plan', () => {
    render(<BillingClient billing={baseBilling} />);

    expect(screen.getByText('Plano e Billing')).toBeInTheDocument();
    expect(screen.getAllByText('Pro').length).toBeGreaterThan(0);
    expect(screen.getByText('Em trial')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('134/2000')).toBeInTheDocument();
    expect(screen.getByText('780/10000')).toBeInTheDocument();
    expect(screen.getAllByText('Atual').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Priority').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Assisted').length).toBeGreaterThan(0);
  });

  it('shows checkout as the primary CTA during trialing and calls the checkout action', async () => {
    render(<BillingClient billing={baseBilling} />);

    fireEvent.click(screen.getByRole('button', { name: 'Assinar Pro' }));

    await waitFor(() => {
      expect(billingActionsMock.createSubscriptionCheckoutSession).toHaveBeenCalledWith('pro');
    });

    expect(await screen.findByText('checkout-error')).toBeInTheDocument();
  });

  it('prioritizes the portal CTA when the subscription is active', async () => {
    render(
      <BillingClient
        billing={{
          ...baseBilling,
          subscriptionStatus: 'active',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar assinatura' }));

    await waitFor(() => {
      expect(billingActionsMock.createCustomerPortalSession).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('portal-error')).toBeInTheDocument();
  });

  it('shows a clear pending-payment CTA for past_due subscriptions', () => {
    render(
      <BillingClient
        billing={{
          ...baseBilling,
          subscriptionStatus: 'past_due',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
        }}
      />,
    );

    expect(screen.getByText('Há cobrança pendente. Abra o portal Stripe para atualizar o pagamento e evitar impacto operacional.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regularizar pagamento' })).toBeInTheDocument();
  });

  it('shows reactivation CTA when the subscription is canceled', () => {
    render(
      <BillingClient
        billing={{
          ...baseBilling,
          subscriptionStatus: 'canceled',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
        }}
      />,
    );

    expect(screen.getByText('A assinatura foi cancelada. Você pode iniciar uma nova assinatura a qualquer momento.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reativar assinatura' })).toBeInTheDocument();
  });
});
