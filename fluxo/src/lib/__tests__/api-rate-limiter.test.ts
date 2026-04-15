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
  let enforceRateLimit: any;

  let mockDb: Map<string, any>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockDb = new Map();
    
    vi.mocked(prisma.rateLimit.findUnique).mockImplementation(async (args: any) => mockDb.get(args.where.key) || null);
    
    vi.mocked(prisma.rateLimit.create).mockImplementation(async (args: any) => {
      mockDb.set(args.data.key, args.data);
      return args.data;
    });

    vi.mocked(prisma.rateLimit.update).mockImplementation(async (args: any) => {
      const existing = mockDb.get(args.where.key);
      if (args.data.count?.increment) {
        existing.count += args.data.count.increment;
      } else {
        existing.count = args.data.count;
        existing.resetAt = args.data.resetAt;
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
