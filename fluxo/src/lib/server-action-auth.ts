/**
 * Server Action Error Handler
 * Wraps server actions to safely handle auth errors
 */

import { auth } from '../../auth';
import type { Session } from 'next-auth';

export async function withAuth<T>(callback: (session: Session) => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    const session = await auth();
    if (!session?.user) {
      console.warn('No session available');
      return fallbackValue;
    }
    return await callback(session);
  } catch (error) {
    console.error('Server action auth error:', error);
    return fallbackValue;
  }
}

export function getSessionOrNull() {
  return auth().catch(() => null);
}
