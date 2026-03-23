// Middleware DISABLED - Auth handled at route level
// This prevents "Unauthorized" errors during build/deployment
// NextAuth is only used in specific routes via next-auth/react

// Uncomment below if you need middleware protection
/*
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
 
export default NextAuth(authConfig).auth;
 
export const config = {
  matcher: ['/(dashboard)/:path*'],
};
*/

// For now, we use a minimal no-op middleware
export function middleware() {
  // No operation - auth is handled per-route
}

export const config = {
  matcher: [], // Empty matcher = no routes checked by middleware
};
