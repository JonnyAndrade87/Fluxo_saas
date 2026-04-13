// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, queueMock } = vi.hoisted(() => ({
  prismaMock: {
    messageQueue: {
      count: vi.fn(),
    },
  },
  queueMock: {
    processQueue: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/queue', () => ({
  processQueue: queueMock.processQueue,
}));

import { GET, POST } from './route';

beforeEach(() => {
  prismaMock.messageQueue.count
    .mockResolvedValueOnce(2)
    .mockResolvedValueOnce(5)
    .mockResolvedValueOnce(1);
  queueMock.processQueue.mockResolvedValue({
    processed: 5,
    sent: 3,
    failed: 1,
    skipped: 1,
    dlq: 0,
    fallbacks: 0,
    stuckReset: 0,
    errors: [],
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('/api/send-queue', () => {
  it('GET returns 503 when CRON_SECRET is absent', async () => {
    const response = await GET(new Request('http://localhost/api/send-queue'));

    expect(response.status).toBe(503);
    expect(prismaMock.messageQueue.count).not.toHaveBeenCalled();
  });

  it('GET returns 401 with an invalid secret', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret');

    const response = await GET(
      new Request('http://localhost/api/send-queue', {
        headers: { authorization: 'Bearer invalid-secret' },
      }),
    );

    expect(response.status).toBe(401);
    expect(prismaMock.messageQueue.count).not.toHaveBeenCalled();
  });

  it('GET returns 200 with a valid secret', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret');

    const response = await GET(
      new Request('http://localhost/api/send-queue', {
        headers: { authorization: 'Bearer correct-secret' },
      }),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.messageQueue.count).toHaveBeenCalledTimes(3);
  });

  it('POST returns 503 when CRON_SECRET is absent', async () => {
    const response = await POST(new Request('http://localhost/api/send-queue', { method: 'POST' }));

    expect(response.status).toBe(503);
    expect(queueMock.processQueue).not.toHaveBeenCalled();
  });

  it('POST returns 401 with an invalid secret', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret');

    const response = await POST(
      new Request('http://localhost/api/send-queue', {
        method: 'POST',
        headers: { authorization: 'Bearer invalid-secret' },
      }),
    );

    expect(response.status).toBe(401);
    expect(queueMock.processQueue).not.toHaveBeenCalled();
  });

  it('POST returns 200 with a valid secret', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret');

    const response = await POST(
      new Request('http://localhost/api/send-queue', {
        method: 'POST',
        headers: { authorization: 'Bearer correct-secret' },
      }),
    );

    expect(response.status).toBe(200);
    expect(queueMock.processQueue).toHaveBeenCalledWith(100);
  });
});
