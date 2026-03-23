import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Middleware runs before page rendering
  // This is the correct place to check auth
  return;
});

export const config = {
  matcher: [
    // Protect all dashboard routes
    '/(dashboard)/:path*',
    '/cobrancas/:path*',
    '/relatorios/:path*',
    '/previsao/:path*',
    '/clientes/:path*',
    '/fila/:path*',
    '/historico/:path*',
    '/auditoria/:path*',
    '/configuracoes/:path*',
  ],
};
