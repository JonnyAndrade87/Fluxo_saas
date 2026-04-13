/**
 * Shared webhook authentication helpers.
 *
 * All verifiers are fail-closed:
 * - Missing configuration -> invalid
 * - Missing auth headers/token -> invalid
 * - Signature mismatch -> invalid
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { Webhook } from 'svix';

type VerifyFailureCode =
  | 'missing_config'
  | 'missing_token'
  | 'invalid_token'
  | 'missing_signature'
  | 'invalid_signature'
  | 'invalid_mode';

export interface VerifyResult {
  valid: boolean;
  error?: string;
  code?: VerifyFailureCode;
  status?: 401 | 403;
}

function verified(): VerifyResult {
  return { valid: true };
}

function failed(
  code: VerifyFailureCode,
  error: string,
  status: 401 | 403 = 401,
): VerifyResult {
  return {
    valid: false,
    code,
    error,
    status,
  };
}

function getRequiredEnv(
  envName: string,
  status: 401 | 403 = 401,
): { ok: true; value: string } | { ok: false; result: VerifyResult } {
  const value = process.env[envName]?.trim();

  if (!value) {
    return {
      ok: false,
      result: failed('missing_config', `${envName} is not configured`, status),
    };
  }

  return { ok: true, value };
}

function safeEqualStrings(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function extractBearerToken(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim();
}

export function verifyWhatsAppChallenge(
  mode: string | null,
  token: string | null,
): VerifyResult {
  if (mode !== 'subscribe') {
    return failed('invalid_mode', 'Invalid webhook challenge mode', 403);
  }

  const configuredToken = getRequiredEnv('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 403);
  if (!configuredToken.ok) {
    return configuredToken.result;
  }

  if (!token) {
    return failed('missing_token', 'Missing hub.verify_token', 403);
  }

  if (!safeEqualStrings(token, configuredToken.value)) {
    return failed('invalid_token', 'Invalid webhook token', 403);
  }

  return verified();
}

export function verifyWhatsAppSignature(
  body: string,
  headers: Headers,
): VerifyResult {
  const appSecret = getRequiredEnv('WHATSAPP_WEBHOOK_APP_SECRET');
  if (!appSecret.ok) {
    return appSecret.result;
  }

  const receivedSignature = headers.get('x-hub-signature-256');
  if (!receivedSignature) {
    return failed('missing_signature', 'Missing x-hub-signature-256 header');
  }

  const expectedSignature = `sha256=${createHmac('sha256', appSecret.value)
    .update(body)
    .digest('hex')}`;

  if (!safeEqualStrings(receivedSignature.toLowerCase(), expectedSignature.toLowerCase())) {
    return failed('invalid_signature', 'WhatsApp signature mismatch');
  }

  return verified();
}

export async function verifyResendSignature(
  body: string,
  headers: Headers,
): Promise<VerifyResult> {
  const secret = getRequiredEnv('WEBHOOK_SECRET_RESEND');
  if (!secret.ok) {
    return secret.result;
  }

  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return failed('missing_signature', 'Missing svix signature headers');
  }

  try {
    const webhook = new Webhook(secret.value);
    webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
    return verified();
  } catch {
    return failed('invalid_signature', 'Resend signature verification failed');
  }
}

export function verifyZapiSignature(
  body: string,
  headers: Headers,
): VerifyResult {
  const secret = process.env.ZAPI_WEBHOOK_SECRET?.trim();
  const legacyToken = process.env.ZAPI_WEBHOOK_TOKEN?.trim();

  if (secret) {
    const receivedSignature = headers.get('x-zapi-signature');
    if (!receivedSignature) {
      return failed('missing_signature', 'Missing x-zapi-signature header');
    }

    const expectedSignature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    const normalizedReceived = receivedSignature.startsWith('sha256=')
      ? receivedSignature
      : `sha256=${receivedSignature}`;

    if (!safeEqualStrings(normalizedReceived.toLowerCase(), expectedSignature.toLowerCase())) {
      return failed('invalid_signature', 'Z-API signature mismatch');
    }

    return verified();
  }

  if (legacyToken) {
    const providedToken = extractBearerToken(
      headers.get('x-zapi-token') ?? headers.get('authorization'),
    );

    if (!providedToken) {
      return failed('missing_token', 'Missing Z-API token');
    }

    if (!safeEqualStrings(providedToken, legacyToken)) {
      return failed('invalid_token', 'Invalid Z-API token');
    }

    return verified();
  }

  return failed('missing_config', 'ZAPI webhook secret/token is not configured');
}
