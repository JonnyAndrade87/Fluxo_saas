/**
 * Safe Auth Wrapper
 * Handles auth() calls safely without throwing 500 errors
 * If auth fails, redirects to login
 */

import { auth as getAuth } from '../../auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getBillingE2EFixture } from '@/lib/e2e-billing';

export async function getSessionSafe() {
  try {
    const cookieStore = await cookies();
    const e2eFixture = getBillingE2EFixture(cookieStore);
    if (e2eFixture) {
      return {
        user: e2eFixture.sessionUser,
        expires: '2999-01-01T00:00:00.000Z',
      };
    }

    // Check if AUTH_SECRET is set first
    // This prevents calling auth() with missing SECRET
    if (!process.env.AUTH_SECRET) {
      console.warn('AUTH_SECRET is not set - cannot authenticate');
      redirect('/login');
    }

    const session = await getAuth();
    return session;
  } catch (error: unknown) {
    // If it's a redirect error from next/navigation, let it bubble up
    const err = error as { digest?: string };
    if (err.digest === 'NEXT_REDIRECT' || err.digest?.startsWith?.('NEXT_REDIRECT')) throw error;
    
    // Auth failed - redirect to login
    console.error('Auth error:', error);
    redirect('/login');
  }
}

export async function requireAuth() {
  const session = await getSessionSafe();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  return session.user as import('next-auth').User & { id: string; tenantId?: string; role?: string };
}

export async function requireTenant() {
  const user = await requireAuth();
  const tenantId = user.tenantId;
  
  if (!tenantId) {
    redirect('/onboarding');
  }
  
  return {
    user,
    tenantId,
  };
}
