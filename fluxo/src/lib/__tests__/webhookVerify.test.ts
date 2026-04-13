// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'crypto';
import { Webhook } from 'svix';
import {
  verifyResendSignature,
  verifyWhatsAppChallenge,
  verifyWhatsAppSignature,
  verifyZapiSignature,
} from '../webhookVerify';

function makeResendSecret(raw = 'resend-secret') {
  return `whsec_${Buffer.from(raw).toString('base64')}`;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('webhookVerify', () => {
  it('fails closed when WhatsApp verify token config is missing', () => {
    const result = verifyWhatsAppChallenge('subscribe', 'token');
    expect(result.valid).toBe(false);
    expect(result.code).toBe('missing_config');
    expect(result.status).toBe(403);
  });

  it('accepts a valid WhatsApp challenge token', () => {
    vi.stubEnv('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'verify-token');

    const result = verifyWhatsAppChallenge('subscribe', 'verify-token');
    expect(result.valid).toBe(true);
  });

  it('fails closed when WhatsApp signature is missing', () => {
    vi.stubEnv('WHATSAPP_WEBHOOK_APP_SECRET', 'meta-secret');

    const result = verifyWhatsAppSignature('{"ok":true}', new Headers());
    expect(result.valid).toBe(false);
    expect(result.code).toBe('missing_signature');
  });

  it('accepts a valid WhatsApp signature', () => {
    const body = JSON.stringify({ object: 'whatsapp_business_account' });
    const secret = 'meta-secret';
    vi.stubEnv('WHATSAPP_WEBHOOK_APP_SECRET', secret);

    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    const headers = new Headers({ 'x-hub-signature-256': signature });

    const result = verifyWhatsAppSignature(body, headers);
    expect(result.valid).toBe(true);
  });

  it('fails closed when Resend secret is missing', async () => {
    const result = await verifyResendSignature('{"ok":true}', new Headers());
    expect(result.valid).toBe(false);
    expect(result.code).toBe('missing_config');
  });

  it('accepts a valid Resend svix signature', async () => {
    const secret = makeResendSecret();
    const webhook = new Webhook(secret);
    const body = JSON.stringify({ type: 'email.delivered', data: { id: 'msg_123' } });
    const msgId = 'msg_123';
    const signedAt = new Date();
    const timestamp = String(Math.floor(signedAt.getTime() / 1000));
    const signature = webhook.sign(msgId, signedAt, body);

    vi.stubEnv('WEBHOOK_SECRET_RESEND', secret);

    const result = await verifyResendSignature(
      body,
      new Headers({
        'svix-id': msgId,
        'svix-timestamp': timestamp,
        'svix-signature': signature,
      }),
    );

    expect(result.valid).toBe(true);
  });

  it('fails closed for Z-API when no secret or token is configured', () => {
    const result = verifyZapiSignature('{"ok":true}', new Headers());
    expect(result.valid).toBe(false);
    expect(result.code).toBe('missing_config');
  });
});
