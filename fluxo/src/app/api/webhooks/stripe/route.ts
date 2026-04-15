import type Stripe from 'stripe';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

/**
 * Idempotency guard: check if this Stripe event was already processed.
 * If yes, returns true (skip). If not, inserts the event record and returns false.
 *
 * Uses Prisma upsert-style create with a unique ID constraint — if the INSERT
 * succeeds, we're the first processor. If it fails with a unique constraint
 * violation, a previous invocation already handled it.
 */
async function isEventAlreadyProcessed(eventId: string, eventType: string): Promise<boolean> {
  try {
    await prisma.stripeEvent.create({
      data: { id: eventId, type: eventType },
    });
    return false; // We just inserted it, proceed
  } catch {
    // Unique constraint violation = already processed
    return true;
  }
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

  const event = verification.event;

  // Idempotency: skip already-processed events (fail-closed, returns 200 safely)
  const alreadyProcessed = await isEventAlreadyProcessed(event.id, event.type);
  if (alreadyProcessed) {
    console.info(`[WEBHOOK/STRIPE] Skipping duplicate event: ${event.id} (${event.type})`);
    return NextResponse.json({ ok: true, skipped: 'duplicate_event' });
  }

  try {
    const result = await handleStripeEvent(event);
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
  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : subscription.id;
}
