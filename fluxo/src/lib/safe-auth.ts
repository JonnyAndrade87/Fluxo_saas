/**
 * Safe Auth Wrapper
 * Handles auth() calls safely without throwing 500 errors
 * If auth fails, redirects to login
 */

import { auth as getAuth } from '../../auth';
import { redirect } from 'next/navigation';

export async function getSessionSafe() {
  try {
    const session = await getAuth();
    return session;
  } catch (error) {
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
  
  return session.user;
}

export async function requireTenant() {
  const user = await requireAuth();
  const tenantId = (user as any)?.tenantId;
  
  if (!tenantId) {
    redirect('/onboarding');
  }
  
  return {
    user,
    tenantId,
  };
}
