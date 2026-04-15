import { describe, it, expect } from 'vitest';

/**
 * MFA Gate Logic Test
 * Simulates the decision matrix used in middleware.ts
 */
interface MockUser {
  role: string;
  isSuperAdmin: boolean;
  mfaEnabled: boolean;
}

interface MockRequest {
  nextUrl: { pathname: string };
  cookies: { has: (name: string) => boolean };
  auth: { user: MockUser } | null;
}

function simulateMiddleware(req: MockRequest) {
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;
  const { pathname } = req.nextUrl;

  const isPublicRoute = ['/login', '/register', '/mfa-challenge', '/mfa-setup'].includes(pathname);
  
  if (isPublicRoute) return 'NEXT';

  if (isLoggedIn && (user?.role === 'admin' || user?.isSuperAdmin)) {
    const isMfaVerified = req.cookies.has('mfa_verified');

    if (!isMfaVerified) {
      if (user.mfaEnabled) {
        return 'REDIRECT_/mfa-challenge';
      } else {
        return 'REDIRECT_/mfa-setup';
      }
    }
  }

  return 'NEXT';
}

describe('MFA Gate Logic (Middleware)', () => {
  const adminUser: MockUser = { role: 'admin', isSuperAdmin: false, mfaEnabled: true };
  const adminNoMfa: MockUser = { role: 'admin', isSuperAdmin: false, mfaEnabled: false };
  const regularUser: MockUser = { role: 'operator', isSuperAdmin: false, mfaEnabled: false };

  it('blocks admin with MFA enabled but no verification cookie', () => {
    const req: MockRequest = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { has: () => false },
      auth: { user: adminUser }
    };
    expect(simulateMiddleware(req)).toBe('REDIRECT_/mfa-challenge');
  });

  it('blocks admin without MFA setup and forces setup page', () => {
    const req: MockRequest = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { has: () => false },
      auth: { user: adminNoMfa }
    };
    expect(simulateMiddleware(req)).toBe('REDIRECT_/mfa-setup');
  });

  it('allows verified admin to access protected routes', () => {
    const req: MockRequest = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { has: (name) => name === 'mfa_verified' },
      auth: { user: adminUser }
    };
    expect(simulateMiddleware(req)).toBe('NEXT');
  });

  it('allows regular user to bypass MFA gate', () => {
    const req: MockRequest = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { has: () => false },
      auth: { user: regularUser }
    };
    expect(simulateMiddleware(req)).toBe('NEXT');
  });

  it('does not interfere with public routes', () => {
    const req: MockRequest = {
      nextUrl: { pathname: '/login' },
      cookies: { has: () => false },
      auth: null
    };
    expect(simulateMiddleware(req)).toBe('NEXT');
  });

  it('allows access to MFA setup page even if not verified (prevent loop)', () => {
    const req: MockRequest = {
      nextUrl: { pathname: '/mfa-setup' },
      cookies: { has: () => false },
      auth: { user: adminNoMfa }
    };
    expect(simulateMiddleware(req)).toBe('NEXT');
  });
});
