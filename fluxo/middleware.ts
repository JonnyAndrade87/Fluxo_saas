import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

/**
 * Matcher disabled - using DashboardGuard component in layout instead
 * This prevents middleware from throwing auth errors during page rendering
 */
export const config = {
  matcher: [
    // Empty matcher - auth handled in layout components
  ],
};
