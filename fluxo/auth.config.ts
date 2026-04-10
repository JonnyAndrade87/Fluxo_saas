import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute =
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
