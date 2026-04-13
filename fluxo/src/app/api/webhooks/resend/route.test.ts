// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Webhook } from 'svix';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    communication: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

import { POST } from './route';

function makeResendSecret(raw = 'resend-secret') {
  return `whsec_${Buffer.from(raw).toString('base64')}`;
}

beforeEach(() => {
  prismaMock.communication.findFirst.mockResolvedValue(null);
  prismaMock.communication.update.mockResolvedValue({});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('Resend webhook route', () => {
  it('returns 401 without svix headers', async () => {
    vi.stubEnv('WEBHOOK_SECRET_RESEND', makeResendSecret());

    const response = await POST(
      new Request('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'email.delivered', data: { id: 'msg_1' } }),
      }),
    );

    expect(response.status).toBe(401);
    expect(prismaMock.communication.findFirst).not.toHaveBeenCalled();
  });

  it('returns 401 with an invalid svix signature', async () => {
    vi.stubEnv('WEBHOOK_SECRET_RESEND', makeResendSecret());

    const response = await POST(
      new Request('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': 'msg_1',
          'svix-timestamp': String(Math.floor(Date.now() / 1000)),
          'svix-signature': 'invalid',
        },
        body: JSON.stringify({ type: 'email.delivered', data: { id: 'msg_1' } }),
      }),
    );

    expect(response.status).toBe(401);
    expect(prismaMock.communication.findFirst).not.toHaveBeenCalled();
  });

  it('returns 200 with a valid svix signature', async () => {
    const secret = makeResendSecret();
    const webhook = new Webhook(secret);
    const body = JSON.stringify({ type: 'email.delivered', data: { id: 'msg_1' } });
    const msgId = 'msg_1';
    const signedAt = new Date();
    const timestamp = String(Math.floor(signedAt.getTime() / 1000));
    const signature = webhook.sign(msgId, signedAt, body);

    vi.stubEnv('WEBHOOK_SECRET_RESEND', secret);

    const response = await POST(
      new Request('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': msgId,
          'svix-timestamp': timestamp,
          'svix-signature': signature,
        },
        body,
      }),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.communication.findFirst).toHaveBeenCalledWith({
      where: { externalId: 'msg_1' },
    });
  });
});
