/**
 * Fluxo Permission Utilities
 *
 * Usage in server actions:
 *   const { tenantId } = await requireAuth();
 *   await requireRole(['admin', 'operator']);
 */

import { auth } from '../../auth';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/**
 * Asserts the request is authenticated and returns the auth context.
 * Throws if no valid session is found.
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await auth();
  const user = session?.user as any;

  if (!user?.tenantId) {
    throw new Error('UNAUTHORIZED: No active session or tenant.');
  }

  return {
    userId: user.id ?? user.sub ?? '',
    tenantId: user.tenantId,
    role: (user.role ?? 'operator') as UserRole,
  };
}

/**
 * Asserts the authenticated user has one of the required roles.
 * Call AFTER requireAuth().
 *
 * @param allowed – list of roles that are permitted
 * @param ctx – the context returned by requireAuth()
 */
export function requireRole(allowed: UserRole[], ctx: AuthContext): void {
  if (!allowed.includes(ctx.role)) {
    throw new Error(
      `FORBIDDEN: Required role [${allowed.join('|')}], got '${ctx.role}'.`
    );
  }
}
