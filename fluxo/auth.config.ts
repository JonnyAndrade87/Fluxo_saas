import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/register' || nextUrl.pathname === '/';
      
      // Allow access to public routes
      if (isPublicRoute) {
        if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
           return Response.redirect(new URL('/cobrancas', nextUrl)); // Redirect to dashboard if logged in and trying to access auth pages
        }
        return true;
      }
      
      // If the user is logged in, they can access protected routes
      if (isLoggedIn) return true;
      
      // Redirect unauthenticated users to login page
      return false; 
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
