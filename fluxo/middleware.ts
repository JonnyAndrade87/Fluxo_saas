import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Only protect dashboard routes
    '/(dashboard)/:path*',
    // Protect other authenticated routes
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
