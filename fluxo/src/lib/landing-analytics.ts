'use client';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    __fluxeerActiveSection?: string;
  }
}

export type LandingEventName = 
  | 'cta_click' 
  | 'click_cta_header' 
  | 'click_cta_hero' 
  | 'click_cta_footer' 
  | 'lead_form_start' 
  | 'lead_form_submit' 
  | 'lead_form_success' 
  | 'lead_form_error' 
  | 'scroll_50' 
  | 'scroll_90';

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
  
  // Enhanced Conversions: Push user data first
  if (payload.user_data) {
    window.dataLayer.push({ 
      event: 'set_user_data', 
      user_data: payload.user_data 
    });
  }

  // Google Ads Conversion Data for GTM
  const conversionData = (eventName === 'lead_form_success') ? {
    conversion_id: GOOGLE_ADS_ID,
    conversion_label: GOOGLE_ADS_CONVERSION_LABEL,
    value: 1.0,
    currency: 'BRL'
  } : {};

  window.dataLayer.push({ 
    event: eventName, 
    ...basePayload, 
    ...conversionData,
    user_data: payload.user_data 
  });

  // Fallback direct calls (if GTM is missing)
  if (!GTM_ID && typeof window.gtag === 'function') {
    window.gtag('event', eventName, { ...basePayload, ...conversionData });
    
    if (eventName === 'lead_form_success' && GOOGLE_ADS_ID && GOOGLE_ADS_CONVERSION_LABEL) {
      window.gtag('event', 'conversion', {
        'send_to': `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
        'value': 1.0,
        'currency': 'BRL'
      });
    }
  }

  if (typeof window.clarity === 'function') {
    window.clarity('event', eventName);
  }

  if (DEBUG_ANALYTICS) {
    console.info('[landing-analytics]', eventName, { ...basePayload, ...conversionData });
  }
}
