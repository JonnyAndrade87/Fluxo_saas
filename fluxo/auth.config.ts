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
          nextUrl.pathname === '/register';
      
      // Allow access to public routes
      if (isPublicRoute) {
        return true;
      }
      
      // If the user is logged in, they can access protected routes
      if (isLoggedIn) return true;
      
      // Unauthenticated users trying to access protected routes are blocked
      return false; 
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
