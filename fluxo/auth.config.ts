import type { NextAuthConfig } from 'next-auth';
import { getBillingE2EScenario, isBillingE2EModeEnabled } from './src/lib/e2e-billing';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const isPublicRoute =
        nextUrl.pathname === '/' ||
        nextUrl.pathname === '/login' ||
        nextUrl.pathname === '/register' ||
        nextUrl.pathname === '/activate' ||
        nextUrl.pathname === '/verify-email' ||
        nextUrl.pathname === '/forgot-password' ||
        nextUrl.pathname.startsWith('/reset-password');

      // Allow access to public routes
      if (isPublicRoute) {
        return true;
      }

      if (isBillingE2EModeEnabled() && getBillingE2EScenario(request.cookies)) {
        return true;
      }

      // For onboarding routes, allow authenticated users (tenant validation happens in layout)
      if (nextUrl.pathname.startsWith('/onboarding') && isLoggedIn) {
        return true;
      }

      // For other protected routes, user must be logged in
      if (isLoggedIn) return true;

      // Unauthenticated users trying to access protected routes are blocked
      return false;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
