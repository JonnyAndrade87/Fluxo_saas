import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import prisma from '@/lib/prisma';

// Remove the failed unmock
vi.mock('@/lib/prisma', () => ({
  default: {
    rateLimit: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  }
}));

describe('API Rate Limiter', () => {
  type RateLimitRecord = {
    key: string;
    count: number;
    resetAt: Date;
  };

  const prismaMock = prisma as unknown as {
    rateLimit: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  let enforceRateLimit: typeof import('../api-rate-limiter').enforceRateLimit;

  let mockDb: Map<string, RateLimitRecord>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockDb = new Map();
    
    prismaMock.rateLimit.findUnique.mockImplementation(
      async (args: { where: { key: string } }) => mockDb.get(args.where.key) ?? null,
    );
    
    prismaMock.rateLimit.create.mockImplementation(async (args: { data: RateLimitRecord }) => {
      mockDb.set(args.data.key, args.data);
      return args.data;
    });

    prismaMock.rateLimit.update.mockImplementation(async (args: {
      where: { key: string };
      data: { count: { increment: number } | number; resetAt?: Date };
    }) => {
      const existing = mockDb.get(args.where.key);
      if (!existing) {
        throw new Error(`Missing rate limit record for ${args.where.key}`);
      }

      if (typeof args.data.count === 'object') {
        existing.count += args.data.count.increment;
      } else {
        existing.count = args.data.count;
        if (args.data.resetAt) {
          existing.resetAt = args.data.resetAt;
        }
      }
      mockDb.set(args.where.key, existing);
      return existing;
    });

    const actual = await vi.importActual<typeof import('../api-rate-limiter')>('../api-rate-limiter');
    enforceRateLimit = actual.enforceRateLimit;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite requisições abaixo do limite', async () => {
    const config = { limit: 3, windowMs: 1000 };
    
    await expect(enforceRateLimit('login', 'ip-1', config)).resolves.toBeUndefined();
    await expect(enforceRateLimit('login', 'ip-1', config)).resolves.toBeUndefined();
    await expect(enforceRateLimit('login', 'ip-1', config)).resolves.toBeUndefined();
  });

  it('bloqueia requisições excedentes', async () => {
    const config = { limit: 2, windowMs: 1000 };
    
    await enforceRateLimit('login', 'ip-2', config);
    await enforceRateLimit('login', 'ip-2', config);
    
    // 3rd attempt should fail
    await expect(enforceRateLimit('login', 'ip-2', config))
      .rejects.toThrow(/Muitas requisições/);
  });

  it('chaves diferentes possuem limites independentes', async () => {
    const config = { limit: 1, windowMs: 1000 };
    
    // IP 1 uses its limit
    await enforceRateLimit('login', 'ip-3', config);
    await expect(enforceRateLimit('login', 'ip-3', config)).rejects.toThrow();

    // IP 2 is unaffected
    await expect(enforceRateLimit('login', 'ip-4', config)).resolves.toBeUndefined();
  });

  it('reseta o limite após a janela expirar', async () => {
    const config = { limit: 1, windowMs: 5000 };
    
    await enforceRateLimit('login', 'ip-5', config);
    await expect(enforceRateLimit('login', 'ip-5', config)).rejects.toThrow();

    // Advance time past the window
    vi.advanceTimersByTime(5001);

    // Limit is reset
    await expect(enforceRateLimit('login', 'ip-5', config)).resolves.toBeUndefined();
  });
});
