'use client';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    __fluxeerActiveSection?: string;
  }
}

export type LandingEventName = 'cta_click' | 'form_start' | 'form_submit' | 'scroll_50' | 'scroll_90';

export type LandingEventPayload = {
  page?: string;
  section?: string;
  cta_label?: string;
  source_section?: string;
  form_name?: string;
  device?: string;
  user_data?: {
    email?: string;
    phone_number?: string;
  };
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GOOGLE_ADS_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
const DEBUG_ANALYTICS = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1';

function cleanPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

export function getLandingDevice() {
  if (typeof window === 'undefined') return 'server';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

export function getActiveLandingSection() {
  if (typeof window === 'undefined') return undefined;
  return window.__fluxeerActiveSection ?? sessionStorage.getItem('fluxeer:active-section') ?? undefined;
}

export function setActiveLandingSection(section: string) {
  if (typeof window === 'undefined') return;
  window.__fluxeerActiveSection = section;
  sessionStorage.setItem('fluxeer:active-section', section);
}

export function setLastLandingCtaContext(section: string, label: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('fluxeer:last-cta-section', section);
  sessionStorage.setItem('fluxeer:last-cta-label', label);
}

export function getLastLandingCtaContext() {
  if (typeof window === 'undefined') {
    return { section: undefined, label: undefined };
  }

  return {
    section: sessionStorage.getItem('fluxeer:last-cta-section') ?? undefined,
    label: sessionStorage.getItem('fluxeer:last-cta-label') ?? undefined,
  };
}

export function trackLandingEvent(eventName: LandingEventName, payload: LandingEventPayload = {}) {
  if (typeof window === 'undefined') return;

  const basePayload = cleanPayload({
    page: payload.page ?? window.location.pathname,
    section: payload.section ?? getActiveLandingSection(),
    source_section: payload.source_section,
    cta_label: payload.cta_label,
    form_name: payload.form_name,
    device: payload.device ?? getLandingDevice(),
  });

  window.dataLayer = window.dataLayer ?? [];
  
  if (payload.user_data) {
    window.dataLayer.push({ event: 'set_user_data', user_data: payload.user_data });
  }

  window.dataLayer.push({ event: eventName, ...basePayload, user_data: payload.user_data });

  if (!GTM_ID && typeof window.gtag === 'function') {
    window.gtag('event', eventName, basePayload);
    
    // Disparo direto da conversão do Google Ads no formulário
    if (eventName === 'form_submit' && GOOGLE_ADS_ID && GOOGLE_ADS_CONVERSION_LABEL) {
      window.gtag('event', 'conversion', {
        'send_to': `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`
      });
    }
  }

  if (typeof window.clarity === 'function') {
    if (typeof basePayload.section === 'string') {
      window.clarity('set', 'lp_section', basePayload.section);
    }
    if (typeof basePayload.page === 'string') {
      window.clarity('set', 'lp_page', basePayload.page);
    }
    window.clarity('event', eventName);
  }

  if (DEBUG_ANALYTICS) {
    console.info('[landing-analytics]', eventName, basePayload);
  }
}
