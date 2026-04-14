import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '@/actions/auth';
import { signIn as nextAuthSignIn } from '../../../auth';
import { GET as activateHandler } from '@/app/api/activate/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import React from 'react';

// Mock next-auth internally imported by authenticate action
vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    type: string;
    constructor(msg: string, type: string) {
      super(msg);
      this.type = type;
    }
  }
}));

// Mock the backend signIn function
vi.mock('../../../auth', () => ({
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

  describe('Post-Activation Flow (api/activate)', () => {
    it('fluxo pós-ativação levando para a rota correta (login com /onboarding callback)', async () => {
      // Mock valid token
      vi.mocked(prisma.emailVerificationToken.findUnique).mockResolvedValue({
        id: '1', email: 'test@example.com', token: 'valid', expires: new Date(Date.now() + 100000), createdAt: new Date()
      } as any);

      const req = new NextRequest('http://localhost:3000/api/activate?token=valid');
      const res = await activateHandler(req);

      // Verify the redirection target includes the callbackUrl for onboarding
      expect(res.status).toBe(307); // NextResponse.redirect
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?callbackUrl=%2Fonboarding&activated=1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { emailVerified: true, isActive: true }
      });
    });
  });

  describe('Credentials Login Defaults & Callbacks', () => {
    it('login normal sem callbackUrl cai no fallback /cobrancas', async () => {
      const formData = new FormData();
      formData.set('email', 'test@example.com');
      formData.set('password', '123456');
      
      await authenticate(undefined, formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: '123456',
        redirectTo: '/cobrancas', // The correct fallback
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
        redirectTo: '/onboarding', // Respected the injected param
      });
    });
  });
});
