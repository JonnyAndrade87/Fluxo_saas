'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { landingSections } from '@/content/landing';
import {
  getActiveLandingSection,
  getLastLandingCtaContext,
  setActiveLandingSection,
  setLastLandingCtaContext,
  trackLandingEvent,
} from '@/lib/landing-analytics';

export function LandingPageAnalytics() {
  const pathname = usePathname();
  const formStartedRef = useRef(false);
  const scroll50Ref = useRef(false);
  const scroll90Ref = useRef(false);

  useEffect(() => {
    formStartedRef.current = false;
    scroll50Ref.current = false;
    scroll90Ref.current = false;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (pathname !== '/') {
      setActiveLandingSection('page');
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .slice(0, 1)
          .forEach(entry => setActiveLandingSection(entry.target.id));
      },
      { threshold: [0.35, 0.6, 0.85], rootMargin: '-15% 0px -45% 0px' }
    );

    landingSections.forEach(sectionId => {
      const node = document.getElementById(sectionId);
      if (node) observer.observe(node);
    });

    setActiveLandingSection(getActiveLandingSection() ?? 'hero');

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const cta = target?.closest<HTMLElement>('[data-track-cta="true"]');
      if (!cta) return;

      const section = cta.dataset.section || getActiveLandingSection() || (pathname === '/' ? 'hero' : 'page');
      const ctaLabel = cta.dataset.ctaLabel || cta.textContent?.trim() || 'cta';

      setLastLandingCtaContext(section, ctaLabel);
      trackLandingEvent('cta_click', {
        page: pathname,
        section,
        cta_label: ctaLabel,
      });
    };

    const onFocusIn = (event: FocusEvent) => {
      if (formStartedRef.current) return;

      const target = event.target as Element | null;
      const form = target?.closest<HTMLFormElement>('form[data-track-form="true"]');
      if (!form) return;

      formStartedRef.current = true;
      const lastCta = getLastLandingCtaContext();

      trackLandingEvent('form_start', {
        page: pathname,
        section: form.dataset.section || 'demonstracao',
        source_section: lastCta.section || getActiveLandingSection() || 'demonstracao',
        form_name: form.dataset.formName || 'demo_request',
        cta_label: lastCta.label,
      });
    };

    document.addEventListener('click', onClick);
    document.addEventListener('focusin', onFocusIn);

    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/') return;

    const onScroll = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const progress = window.scrollY / maxScroll;

      if (!scroll50Ref.current && progress >= 0.5) {
        scroll50Ref.current = true;
        trackLandingEvent('scroll_50', { page: pathname, section: getActiveLandingSection() || 'hero' });
      }

      if (!scroll90Ref.current && progress >= 0.9) {
        scroll90Ref.current = true;
        trackLandingEvent('scroll_90', { page: pathname, section: getActiveLandingSection() || 'demonstracao' });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  return null;
}
