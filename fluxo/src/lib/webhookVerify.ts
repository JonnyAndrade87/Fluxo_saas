/**
 * Webhook Signature Verification — Message Engine Hardening
 *
 * Resend: uses svix (install: npm install svix)
 *   Env: WEBHOOK_SECRET_RESEND=whsec_...
 *
 * Z-API: HMAC-SHA256 via Node.js crypto
 *   Env: ZAPI_WEBHOOK_SECRET=your-secret
 *
 * Both return { valid: boolean; error?: string }
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface VerifyResult {
  valid: boolean;
  error?: string;
}

// ─── Resend / Svix ────────────────────────────────────────────────────────────

/**
 * Verifies a Resend webhook using the svix library.
 * Falls back to "valid=true" when WEBHOOK_SECRET_RESEND is not configured (dev mode).
 */
export async function verifyResendSignature(
  body: string,
  headers: Headers
): Promise<VerifyResult> {
  const secret = process.env.WEBHOOK_SECRET_RESEND;
  if (!secret) {
    console.warn('[WEBHOOK/RESEND] WEBHOOK_SECRET_RESEND not set — skipping signature check (dev mode)');
    return { valid: true };
  }

  try {
    // Dynamic import to avoid build errors if svix is not installed
    const { Webhook } = await import('svix').catch(() => ({ Webhook: null }));
    if (!Webhook) {
      console.warn('[WEBHOOK/RESEND] svix not installed — install with: npm install svix');
      return { valid: true };
    }

    const wh = new Webhook(secret);
    const svixHeaders = {
      'svix-id':        headers.get('svix-id') ?? '',
      'svix-timestamp': headers.get('svix-timestamp') ?? '',
      'svix-signature': headers.get('svix-signature') ?? '',
    };

    wh.verify(body, svixHeaders);
    return { valid: true };
  } catch (err: any) {
    console.error('[WEBHOOK/RESEND] Signature verification failed:', err.message);
    return { valid: false, error: err.message };
  }
}

// ─── Z-API / HMAC-SHA256 ──────────────────────────────────────────────────────

/**
 * Verifies Z-API webhook signature via HMAC-SHA256.
 * Header expected: x-zapi-signature: sha256=<hex>
 * Falls back to token check (existing behaviour) if ZAPI_WEBHOOK_SECRET is not set.
 */
export function verifyZapiSignature(
  body: string,
  headers: Headers
): VerifyResult {
  const secret = process.env.ZAPI_WEBHOOK_SECRET;
  const legacyToken = process.env.ZAPI_WEBHOOK_TOKEN;

  // Legacy token check (existing behaviour — backward-compatible)
  if (!secret && legacyToken) {
    const token = headers.get('x-zapi-token') ?? headers.get('authorization');
    const expected = legacyToken;
    const tokenValid = token === expected || token === `Bearer ${expected}`;
    return tokenValid
      ? { valid: true }
      : { valid: false, error: 'Invalid Z-API token' };
  }

  // HMAC-SHA256 verification
  if (secret) {
    const receivedSig = headers.get('x-zapi-signature') ?? '';
    if (!receivedSig) {
      return { valid: false, error: 'Missing x-zapi-signature header' };
    }

    // Support "sha256=<hex>" or plain hex
    const hexSig = receivedSig.startsWith('sha256=')
      ? receivedSig.slice(7)
      : receivedSig;

    const expectedHex = createHmac('sha256', secret).update(body).digest('hex');

    try {
      const valid = timingSafeEqual(
        Buffer.from(hexSig, 'hex'),
        Buffer.from(expectedHex, 'hex')
      );
      return valid ? { valid: true } : { valid: false, error: 'HMAC signature mismatch' };
    } catch {
      return { valid: false, error: 'Invalid signature format' };
    }
  }

  // Neither ZAPI_WEBHOOK_SECRET nor ZAPI_WEBHOOK_TOKEN configured — dev mode
  console.warn('[WEBHOOK/ZAPI] No signature secret configured — skipping verification (dev mode)');
  return { valid: true };
}
