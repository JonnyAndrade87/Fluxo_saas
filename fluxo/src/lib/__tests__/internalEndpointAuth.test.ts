// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireInternalEndpointAuth } from '../internalEndpointAuth';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('requireInternalEndpointAuth', () => {
  it('returns 503 when CRON_SECRET is not configured', async () => {
    const result = requireInternalEndpointAuth(new Request('http://localhost/internal'));

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.response.status).toBe(503);
    await expect(result.response.json()).resolves.toEqual({
      success: false,
      error: 'Service unavailable',
    });
  });

  it('returns 401 when bearer token is missing', async () => {
    vi.stubEnv('CRON_SECRET', 'internal-secret');

    const result = requireInternalEndpointAuth(new Request('http://localhost/internal'));

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.response.status).toBe(401);
  });

  it('returns 401 when bearer token is invalid', async () => {
    vi.stubEnv('CRON_SECRET', 'internal-secret');

    const result = requireInternalEndpointAuth(
      new Request('http://localhost/internal', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.response.status).toBe(401);
  });

  it('returns ok when bearer token is valid', () => {
    vi.stubEnv('CRON_SECRET', 'internal-secret');

    const result = requireInternalEndpointAuth(
      new Request('http://localhost/internal', {
        headers: { authorization: 'Bearer internal-secret' },
      }),
    );

    expect(result).toEqual({ ok: true });
  });
});
