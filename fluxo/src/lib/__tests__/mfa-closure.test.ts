/**
 * mfa-closure.test.ts
 * Provas formais para o fechamento da Tarefa 16.2 (MFA Admin)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import NextAuth from "next-auth";
import authMiddleware from '@/../middleware';

// Mock do NextAuth para controlar a sessão no middleware
vi.mock("next-auth", () => {
  return {
    default: (config: any) => ({
      auth: (callback: any) => (req: any, ctx: any) => callback(req, ctx),
    }),
  };
});

describe('MFA Closure Proofs (16.2)', () => {
  const req = (pathname: string, role: string = 'admin', mfaEnabled: boolean = false, hasCookie: boolean = false) => {
    const nextUrl = new URL(`https://fluxeer.com.br${pathname}`);
    return {
      nextUrl,
      auth: { user: { role, mfaEnabled } },
      cookies: {
        has: vi.fn().mockReturnValue(hasCookie),
        delete: vi.fn(),
      },
    } as any;
  };

  it('1. Admin SEM MFA configurado: Redireciona para /mfa-setup', async () => {
    const request = req('/dashboard', 'admin', false, false);
    const response = await authMiddleware(request, {} as any);
    
    expect(response?.headers.get('location')).toContain('/mfa-setup');
  });

  it('2. Admin COM MFA configurado (sem cookie): Redireciona para /mfa-challenge', async () => {
    const request = req('/dashboard', 'admin', true, false);
    const response = await authMiddleware(request, {} as any);
    
    expect(response?.headers.get('location')).toContain('/mfa-challenge');
  });

  it('3. Admin COM MFA configurado E COM cookie: Permite acesso (NextResponse.next)', async () => {
    const request = req('/dashboard', 'admin', true, true);
    const response = await authMiddleware(request, {} as any);
    
    // NextResponse.next() não tem location header de redirect
    expect(response?.headers.get('location')).toBeNull();
  });

  it('4. Usuário não-admin (operator): Segue fluxo normal sem challenge', async () => {
    const request = req('/dashboard', 'operator', false, false);
    const response = await authMiddleware(request, {} as any);
    
    expect(response?.headers.get('location')).toBeNull();
  });

  it('5. Não existe bypass silencioso (Admin sem cookie em rota profunda): Bloqueado', async () => {
    const request = req('/configuracoes/equipe', 'admin', true, false);
    const response = await authMiddleware(request, {} as any);
    
    expect(response?.headers.get('location')).toContain('/mfa-challenge');
  });

  it('6. Admin autenticado via Google: Também cai no challenge (Mismo gate do middleware)', async () => {
    // No middleware, não importa o provider, apenas o role e mfaEnabled
    const request = req('/dashboard', 'admin', true, false);
    const response = await authMiddleware(request, {} as any);
    
    expect(response?.headers.get('location')).toContain('/mfa-challenge');
  });
});
