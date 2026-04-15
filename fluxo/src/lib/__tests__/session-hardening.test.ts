import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuthFresh } from '../permissions';
import { auth } from '../../../auth';
import prisma from '@/lib/prisma';

// Mock dependencies
vi.mock('../../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Session Hardening (Task 16.5)', () => {
  const mockJwtSession = {
    user: {
      id: 'usr_123',
      tenantId: 'tnt_abc',
      role: 'admin',      // stale role in JWT
      mfaEnabled: false, // stale MFA state in JWT
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must immediately reject an active session if account is disabled in the DB', async () => {
    // 1. JWT says user is logged in
    (auth as any).mockResolvedValue(mockJwtSession);

    // 2. DB says the user was deactivated (isActive: false)
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_123',
      isActive: false,  // DEACTIVATED
      mfaEnabled: false,
      tenants: [{ tenantId: 'tnt_abc', role: 'admin' }],
    });

    // 3. Sensitive action requires fresh auth
    await expect(requireAuthFresh()).rejects.toThrow('ACCOUNT_INACTIVE');
  });

  it('Must reflect downgraded role from DB, ignoring the stale JWT role', async () => {
    // 1. JWT says user is an admin
    (auth as any).mockResolvedValue(mockJwtSession);

    // 2. DB says user was downgraded to viewer
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_123',
      isActive: true,
      mfaEnabled: false,
      tenants: [{ tenantId: 'tnt_abc', role: 'viewer' }],
    });

    // 3. User attempts sensitive action
    const ctx = await requireAuthFresh();

    // 4. Context must reflect the DB role, not the stale JWT role
    expect(ctx.role).toBe('viewer'); // downgrade enforced
  });

  it('Must reflect upgraded role from DB, ignoring the stale JWT role', async () => {
    // 1. JWT says user is a viewer
    (auth as any).mockResolvedValue({
      user: { ...mockJwtSession.user, role: 'viewer' }
    });

    // 2. DB says user was upgraded to admin
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_123',
      isActive: true,
      mfaEnabled: false,
      tenants: [{ tenantId: 'tnt_abc', role: 'admin' }],
    });

    // 3. User attempts sensitive action
    const ctx = await requireAuthFresh();

    // 4. Context must reflect the DB role, not the stale JWT role
    expect(ctx.role).toBe('admin'); // upgrade enforced
  });

  it('Must update mfaEnabled state directly from DB', async () => {
    // 1. JWT says MFA is off
    (auth as any).mockResolvedValue(mockJwtSession);

    // 2. DB says MFA was just enabled
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_123',
      isActive: true,
      mfaEnabled: true, // MFA is now ON
      tenants: [{ tenantId: 'tnt_abc', role: 'admin' }],
    });

    const ctx = await requireAuthFresh();

    // 3. Context must return the true MFA state
    expect(ctx.mfaEnabled).toBe(true);
  });

  it('Must allow normal users to continue without interruption', async () => {
    // DB matches JWT
    (auth as any).mockResolvedValue(mockJwtSession);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr_123',
      isActive: true,
      mfaEnabled: false,
      tenants: [{ tenantId: 'tnt_abc', role: 'admin' }],
    });

    const ctx = await requireAuthFresh();

    expect(ctx.userId).toBe('usr_123');
    expect(ctx.role).toBe('admin');
    expect(ctx.mfaEnabled).toBe(false);
  });

  it('Must reject session if user was completely removed from DB', async () => {
    (auth as any).mockResolvedValue(mockJwtSession);
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(requireAuthFresh()).rejects.toThrow('UNAUTHORIZED: User not found in database.');
  });
});
