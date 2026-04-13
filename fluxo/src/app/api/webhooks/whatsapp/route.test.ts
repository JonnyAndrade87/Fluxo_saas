// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    communication: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

import { GET, POST } from './route';

function signWhatsApp(body: string, secret: string) {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

beforeEach(() => {
  prismaMock.communication.updateMany.mockResolvedValue({ count: 0 });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('WhatsApp webhook route', () => {
  it('returns 403 when challenge token is missing/invalid', async () => {
    vi.stubEnv('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'expected-token');

    const request = new NextRequest(
      'http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=12345',
    );

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it('returns 401 without WhatsApp signature header', async () => {
    vi.stubEnv('WHATSAPP_WEBHOOK_APP_SECRET', 'meta-secret');

    const body = JSON.stringify({ object: 'whatsapp_business_account' });
    const request = new NextRequest('http://localhost/api/webhooks/whatsapp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(prismaMock.communication.updateMany).not.toHaveBeenCalled();
  });

  it('returns 401 with invalid WhatsApp signature', async () => {
    vi.stubEnv('WHATSAPP_WEBHOOK_APP_SECRET', 'meta-secret');

    const body = JSON.stringify({ object: 'whatsapp_business_account' });
    const request = new NextRequest('http://localhost/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=invalid',
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(prismaMock.communication.updateMany).not.toHaveBeenCalled();
  });

  it('returns 200 with a valid WhatsApp signature', async () => {
    const secret = 'meta-secret';
    vi.stubEnv('WHATSAPP_WEBHOOK_APP_SECRET', secret);

    const body = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { statuses: [{ id: 'wamid-1', status: 'read' }] } }] }],
    });

    const request = new NextRequest('http://localhost/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': signWhatsApp(body, secret),
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(prismaMock.communication.updateMany).toHaveBeenCalledWith({
      where: { externalId: 'wamid-1' },
      data: { status: 'read' },
    });
  });
});
