import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
 
export default NextAuth(authConfig).auth;
 
export const config = {
  matcher: [
    // Protect all dashboard routes
    '/(dashboard)/:path*',
    // Protect all protected routes except auth
    '/((?!api|_next/static|_next/image|.*\\.png$|login|register|onboarding|favicon.ico).*)',
  ],
};
