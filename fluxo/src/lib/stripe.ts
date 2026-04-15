import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function getStripe(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    return null;
  }

  if (!stripeClient || stripeClientKey !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeClientKey = secretKey;
  }

  return stripeClient;
}

type StripeWebhookFailureCode = 'missing_config' | 'missing_signature' | 'invalid_signature';

export type StripeWebhookVerificationResult =
  | { ok: true; event: Stripe.Event }
  | {
      ok: false;
      code: StripeWebhookFailureCode;
      error: string;
      status: 401 | 503;
    };

export function verifyStripeWebhookEvent(
  payload: string,
  signature: string | null,
): StripeWebhookVerificationResult {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return {
      ok: false,
      code: 'missing_config',
      error: 'Stripe webhook is not configured',
      status: 503,
    };
  }

  if (!signature) {
    return {
      ok: false,
      code: 'missing_signature',
      error: 'Missing stripe-signature header',
      status: 401,
    };
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return { ok: true, event };
  } catch {
    return {
      ok: false,
      code: 'invalid_signature',
      error: 'Stripe signature verification failed',
      status: 401,
    };
  }
}
