import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock prisma and dependencies proactively
vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    tenant: { create: vi.fn() },
    tenantUser: { create: vi.fn() },
    $transaction: vi.fn(),
    emailVerificationToken: { deleteMany: vi.fn(), create: vi.fn() },
  },
}));
vi.mock('@/lib/messaging/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  buildActivationEmailHtml: vi.fn().mockReturnValue('<html>'),
}));
vi.mock('../../../auth', () => ({ auth: vi.fn() }));
vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error { type = ''; }
}));

describe('Rota Legada de Registro e Fluxo Oficial', () => {

  describe('Rota Legada /api/register — Desativada (410 Gone)', () => {
    it('POST /api/register retorna 410 Gone e bloqueia registro legado', async () => {
      const { POST } = await import('@/app/api/register/route');
      const req = new NextRequest('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Hacker', company: 'Evil Corp', cnpj: '00.000.000/0001-00',
          email: 'hacker@evil.com', password: 'test123'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(410); // 410 Gone — permanentemente removida
      expect(body.error).toMatch(/removido/i);
    });

    it('GET /api/register retorna 410 Gone também', async () => {
      const { GET } = await import('@/app/api/register/route');
      const req = new NextRequest('http://localhost:3000/api/register');
      const res = await GET(req);

      expect(res.status).toBe(410);
    });
  });

  describe('Fluxo Oficial de Cadastro — Server Action register()', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('register() com dados válidos cria usuário via Server Action (fluxo oficial)', async () => {
      const prisma = (await import('@/lib/prisma')).default;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // No existing user
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => fn(prisma as any));
      vi.mocked(prisma.tenant.create).mockResolvedValue({ id: 'tenant-1', name: 'Empresa A', documentNumber: '12345678000100', plan: 'starter', subscriptionStatus: 'trialing', stripeCustomerId: null, stripeSubscriptionId: null, maxUsers: 1, maxCustomers: 300, maxInvoices: 1000, supportLevel: 'standard', onboardingTier: 'basic', createdAt: new Date(), updatedAt: new Date() });
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-1', email: 'oficial@a.com', fullName: 'Jan', password: 'h', googleId: null, emailVerified: false, isActive: false, createdAt: new Date(), updatedAt: new Date() });
      vi.mocked(prisma.tenantUser.create).mockResolvedValue({} as any);
      vi.mocked(prisma.emailVerificationToken.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.emailVerificationToken.create).mockResolvedValue({} as any);

      const { register } = await import('@/actions/auth');

      const formData = new FormData();
      formData.set('name', 'Jan');
      formData.set('companyName', 'Empresa A');
      formData.set('cnpj', '12.345.678/0001-00');
      formData.set('email', 'oficial@a.com');
      formData.set('password', 'Senha@123');

      const result = await register(undefined, formData);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('register() com e-mail já existente retorna erro sem criar duplicata', async () => {
      const prisma = (await import('@/lib/prisma')).default;

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-existing', email: 'dup@a.com' } as any);

      const { register } = await import('@/actions/auth');
      const formData = new FormData();
      formData.set('name', 'Jan');
      formData.set('companyName', 'Empresa A');
      formData.set('cnpj', '12.345.678/0001-00');
      formData.set('email', 'dup@a.com');
      formData.set('password', 'Senha@123');

      const result = await register(undefined, formData);

      expect(result.error).toBeTruthy();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('ausência de comportamento divergente: legada não cria usuário enquanto oficial cria', async () => {
      // Legacy path: blocked
      const { POST } = await import('@/app/api/register/route');
      const legacyReq = new NextRequest('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'X', company: 'Y', cnpj: '111', email: 'x@y.com', password: '123456' }),
        headers: { 'Content-Type': 'application/json' }
      });
      const legacyRes = await POST(legacyReq);
      expect(legacyRes.status).toBe(410); // Blocked

      // Official path: would proceed (mocked above)
      const prisma = (await import('@/lib/prisma')).default;
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => fn(prisma as any));
      vi.mocked(prisma.tenant.create).mockResolvedValue({ id: 't1', name: 'Y', documentNumber: '111', plan: 'starter', subscriptionStatus: 'trialing', stripeCustomerId: null, stripeSubscriptionId: null, maxUsers: 1, maxCustomers: 300, maxInvoices: 1000, supportLevel: 'standard', onboardingTier: 'basic', createdAt: new Date(), updatedAt: new Date() });
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'u1', email: 'x@y.com', fullName: 'X', password: 'h', googleId: null, emailVerified: false, isActive: false, createdAt: new Date(), updatedAt: new Date() });
      vi.mocked(prisma.tenantUser.create).mockResolvedValue({} as any);
      vi.mocked(prisma.emailVerificationToken.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.emailVerificationToken.create).mockResolvedValue({} as any);

      const { register } = await import('@/actions/auth');
      const formData = new FormData();
      formData.set('name', 'X'); formData.set('companyName', 'Y'); formData.set('cnpj', '111');
      formData.set('email', 'x@y.com'); formData.set('password', 'Senha@123');
      const officialResult = await register(undefined, formData);

      expect(officialResult.success).toBe(true); // Official path works
    });
  });
});
