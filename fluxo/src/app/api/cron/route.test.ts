// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, queueMock } = vi.hoisted(() => ({
  prismaMock: {
    billingFlow: {
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
    rateLimit: {
      deleteMany: vi.fn(),
    },
    activityLog: {
      deleteMany: vi.fn(),
    },
  },
  queueMock: {
    enqueueAndSend: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/queue', () => ({
  enqueueAndSend: queueMock.enqueueAndSend,
}));

import { GET } from './route';

beforeEach(() => {
  prismaMock.billingFlow.findMany.mockResolvedValue([]);
  prismaMock.invoice.findMany.mockResolvedValue([]);
  prismaMock.rateLimit.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.activityLog.deleteMany.mockResolvedValue({ count: 0 });
  queueMock.enqueueAndSend.mockResolvedValue({ sent: false });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('/api/cron', () => {
  it('returns 503 when CRON_SECRET is absent', async () => {
    const response = await GET(new Request('http://localhost/api/cron'));

    expect(response.status).toBe(503);
    expect(prismaMock.billingFlow.findMany).not.toHaveBeenCalled();
  });

  it('returns 401 with an invalid secret', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret');

    const response = await GET(
      new Request('http://localhost/api/cron', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
    );

    expect(response.status).toBe(401);
    expect(prismaMock.billingFlow.findMany).not.toHaveBeenCalled();
  });

  it('returns 200 with a valid secret', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret');

    const response = await GET(
      new Request('http://localhost/api/cron', {
        headers: { authorization: 'Bearer correct-secret' },
      }),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.billingFlow.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
    });
  });

  it('consumes the normalized billing flow contract used by the UI', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00Z'));
    vi.stubEnv('CRON_SECRET', 'correct-secret');
    vi.stubEnv('COMMUNICATION_MODE', 'live');

    prismaMock.billingFlow.findMany.mockResolvedValue([
      {
        tenantId: 'tenant-1',
        rules: JSON.stringify({
          stages: [
            {
              id: 'pre',
              active: true,
              days: -3,
              time: '09:00',
              channels: { email: true, whatsapp: false },
              templates: {
                email: 'Ola {nome}, sua fatura {fatura} vence em {vencimento}.',
                whatsapp: 'Nao usado',
              },
            },
          ],
        }),
      },
    ]);

    prismaMock.invoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        customerId: 'customer-1',
        invoiceNumber: 'INV-100',
        amount: 150,
        dueDate: new Date('2026-04-19T12:00:00Z'),
        customer: {
          name: 'Cliente Exemplo',
          email: 'financeiro@cliente.com',
          phone: null,
          financialContacts: [],
        },
      },
    ]);

    queueMock.enqueueAndSend.mockResolvedValue({ sent: true });

    const response = await GET(
      new Request('http://localhost/api/cron', {
        headers: {
          authorization: 'Bearer correct-secret',
          'x-forwarded-for': '1.2.3.4',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(queueMock.enqueueAndSend).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        invoiceId: 'invoice-1',
        channel: 'email',
        to: 'financeiro@cliente.com',
        body: 'Ola Cliente Exemplo, sua fatura INV-100 vence em 19/04/2026.',
        messageType: 'Etapa pre (D-3)',
      }),
    );
  });
});
