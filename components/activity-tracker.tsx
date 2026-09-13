'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/track-client';

const TRACKED_CTA = new Set([
  'call',
  'placement-inquiry',
  'community-engagement-inquiry',
  'request-tour',
  'view-our-home',
  'review-requirements'
]);

export function ActivityTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    const query = typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '';
    const params = new URLSearchParams(query);
    const current = query ? `${pathname}?${query}` : pathname;
    if (current === lastTrackedPath.current) return;
    lastTrackedPath.current = current;

    trackEvent({
      event_type: 'page_view',
      page_path: pathname,
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined
    });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const element = (event.target as HTMLElement | null)?.closest('[data-track-cta]');
      if (!element) return;
      const ctaName = element.getAttribute('data-track-cta')?.trim().toLowerCase();
      if (!ctaName || !TRACKED_CTA.has(ctaName)) return;
      trackEvent({ event_type: 'cta_click', cta_name: ctaName });
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
