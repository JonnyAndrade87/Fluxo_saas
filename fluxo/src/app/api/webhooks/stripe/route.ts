import type Stripe from 'stripe';
import { NextResponse } from 'next/server';

import { verifyStripeWebhookEvent } from '@/lib/stripe';
import {
  getStripeBillingConfiguration,
  syncTenantBillingFromCheckoutSession,
  syncTenantBillingFromStripeReferences,
  syncTenantBillingFromSubscription,
} from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';

function logAuthFailure(code?: string) {
  console.warn(`[WEBHOOK/STRIPE] Authentication failed (${code ?? 'unknown'})`);
}

export async function POST(request: Request) {
  const config = getStripeBillingConfiguration();
  if (!config.configured) {
    console.warn('[WEBHOOK/STRIPE] Missing billing env configuration');
    return NextResponse.json({ error: 'Stripe billing is not configured' }, { status: 503 });
  }

  const body = await request.text();
  const verification = verifyStripeWebhookEvent(body, request.headers.get('stripe-signature'));
  if (!verification.ok) {
    logAuthFailure(verification.code);
    return NextResponse.json(
      { error: 'Unauthorized webhook request', code: verification.code },
      { status: verification.status },
    );
  }

  try {
    const result = await handleStripeEvent(verification.event);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    console.error('[WEBHOOK/STRIPE] Internal error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      return syncTenantBillingFromCheckoutSession(event.data.object as Stripe.Checkout.Session);

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return syncTenantBillingFromSubscription(event.data.object as Stripe.Subscription);

    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;

      return syncTenantBillingFromStripeReferences({
        stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
        stripeSubscriptionId: getInvoiceSubscriptionId(invoice),
        fallbackStatus: 'active',
      });
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;

      return syncTenantBillingFromStripeReferences({
        stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
        stripeSubscriptionId: getInvoiceSubscriptionId(invoice),
        fallbackStatus: 'past_due',
      });
    }

    default:
      return { skipped: `unhandled type: ${event.type}` };
  }
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;

  if (!subscription) {
    return null;
  }

  return typeof subscription === 'string' ? subscription : subscription.id;
}
