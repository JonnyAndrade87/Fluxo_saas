'use client';

import { usePathname } from 'next/navigation';
import { AnalyticsScripts } from './AnalyticsScripts';
import { LandingPageAnalytics } from './LandingPageAnalytics';

/**
 * Whitelist of public routes where marketing analytics (GTM, GA4, Clarity) are allowed.
 * Fail-closed approach: if a route is not explicitly here, NO marketing tracking loads.
 */
const PUBLIC_ROUTES_WHITELIST = [
  '/',
  '/privacidade',
  '/termos',
  '/software-de-cobranca',
  '/regua-de-cobranca',
  '/contas-a-receber',
  '/previsibilidade-de-caixa',
  '/cobranca-b2b',
];

export function MarketingAnalytics() {
  const pathname = usePathname();

  // Check if current path is in the whitelist
  const isWhitelisted = PUBLIC_ROUTES_WHITELIST.includes(pathname);

  // FAIL-CLOSED: Absolute block for any route not explicitly whitelisted (e.g., /dashboard, /clientes)
  if (!isWhitelisted) {
    return null;
  }

  return (
    <>
      <AnalyticsScripts />
      <LandingPageAnalytics />
    </>
  );
}
