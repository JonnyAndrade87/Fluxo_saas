import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = 
    ['/', '/login', '/register', '/activate', '/verify-email', '/forgot-password'].includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith('/reset-password');
  
  const isMfaPage = nextUrl.pathname === '/mfa-challenge' || nextUrl.pathname === '/mfa-setup';

  let response: NextResponse;

  if (isApiAuthRoute || isPublicRoute) {
    response = NextResponse.next();
  } else if (!isLoggedIn) {
    response = NextResponse.next();
    if (req.cookies.has('mfa_verified')) {
      response.cookies.delete('mfa_verified');
    }
    // Note: session-based redirect to login is handled by auth middleware automatically if not public
  } else if (isLoggedIn && (user?.role === 'admin' || user?.isSuperAdmin)) {
    const isMfaVerified = req.cookies.has('mfa_verified');

    if (!isMfaVerified && !isMfaPage) {
      if (user.mfaEnabled) {
        response = NextResponse.redirect(new URL('/mfa-challenge', nextUrl));
      } else {
        response = NextResponse.redirect(new URL('/mfa-setup', nextUrl));
      }
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  // ─── Security Headers ───────────────────────────────────────────────────────
  const headers = response.headers;
  
  // Strict CSP
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
    connect-src 'self';
    frame-ancestors 'none';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  headers.set('Content-Security-Policy', cspHeader);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.png|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico).*)'],
};
