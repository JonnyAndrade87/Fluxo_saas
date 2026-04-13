// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, queueMock } = vi.hoisted(() => ({
  prismaMock: {
    billingFlow: {
      findMany: vi.fn(),
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
  queueMock.enqueueAndSend.mockResolvedValue({ sent: false });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
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
});
