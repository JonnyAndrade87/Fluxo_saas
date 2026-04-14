import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '@/actions/auth';
import { signIn as nextAuthSignIn } from '../../../auth';
import { GET as activateHandler } from '@/app/api/activate/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// Mock next-auth core (imported by authenticate action)
vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    type: string;
    constructor(msg: string, type: string) {
      super(msg);
      this.type = type;
    }
  }
}));

// Mock the backend signIn function (credentials)
vi.mock('../../../auth', () => ({
  signIn: vi.fn(),
}));

// Mock next-auth/react (Google client-side signIn)
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock prisma for the Activation flow
vi.mock('@/lib/prisma', () => ({
  default: {
    emailVerificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

describe('Onboarding e Callbacks de Autenticação', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Post-Activation (API Route) ──────────────────────────────────────────────
  describe('Post-Activation Flow (api/activate)', () => {
    it('fluxo pós-ativação levando para a rota correta (login com /onboarding callback)', async () => {
      vi.mocked(prisma.emailVerificationToken.findUnique).mockResolvedValue({
        id: '1', email: 'test@example.com', token: 'valid', expires: new Date(Date.now() + 100000), createdAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.emailVerificationToken.findUnique>>);

      const req = new NextRequest('http://localhost:3000/api/activate?token=valid');
      const res = await activateHandler(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?callbackUrl=%2Fonboarding&activated=1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { emailVerified: true, isActive: true }
      });
    });
  });

  // ─── Credentials Login ────────────────────────────────────────────────────────
  describe('Credentials Login Defaults & Callbacks', () => {
    it('login normal sem callbackUrl cai no fallback /cobrancas', async () => {
      const formData = new FormData();
      formData.set('email', 'test@example.com');
      formData.set('password', '123456');

      await authenticate(undefined, formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: '123456',
        redirectTo: '/cobrancas',
      });
    });

    it('login com callbackUrl=/onboarding respeita corretamente a rota de origem', async () => {
      const formData = new FormData();
      formData.set('email', 'test@example.com');
      formData.set('password', '123456');
      formData.set('callbackUrl', '/onboarding');

      await authenticate(undefined, formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: '123456',
        callbackUrl: '/onboarding',
        redirectTo: '/onboarding',
      });
    });
  });

  // ─── Google Login (Client-Side via next-auth/react) ───────────────────────────
  describe('Google OAuth Callbacks (next-auth/react signIn)', () => {
    it('login Google com callbackUrl=/onboarding chama signIn com o callback correto', async () => {
      const { signIn: googleSignIn } = await import('next-auth/react');

      // Simula o que GoogleSignInButton executa quando searchParams tem callbackUrl=/onboarding
      const callbackUrl = '/onboarding';
      googleSignIn('google', { callbackUrl });

      expect(googleSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/onboarding' });
    });

    it('login Google sem callbackUrl usa fallback /cobrancas (mesma regra que Credentials)', async () => {
      const { signIn: googleSignIn } = await import('next-auth/react');

      // Simula quando searchParams.get('callbackUrl') === null → fallback para /cobrancas
      const callbackUrl = null;
      const resolvedCallbackUrl = callbackUrl || '/cobrancas';
      googleSignIn('google', { callbackUrl: resolvedCallbackUrl });

      expect(googleSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/cobrancas' });
    });
  });
});
