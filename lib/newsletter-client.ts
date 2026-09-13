import { useEffect, useState } from 'react';

export const NEWSLETTER_HEADLINE = 'Get updates from Beyon Vital';
export const NEWSLETTER_BLURB = 'News, community engagement updates and announcements from Beyon Vital, LLC.';

/** Dispatched by the mobile sticky bar to open the newsletter sheet. */
export const NEWSLETTER_OPEN_EVENT = 'bv-newsletter:open';
const NEWSLETTER_STATE_EVENT = 'bv-newsletter:state';
const NEWSLETTER_STORAGE_KEY = 'bv-newsletter';

const HIDDEN_PREFIXES = ['/admin', '/unsubscribe', '/newsletter/confirm'];

export type NewsletterLocalState = 'dismissed' | 'subscribed' | null;

export function isNewsletterHiddenPath(pathname: string | null) {
  if (!pathname) return false;
  return HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function readNewsletterState(): NewsletterLocalState {
  try {
    const value = window.localStorage.getItem(NEWSLETTER_STORAGE_KEY);
    return value === 'dismissed' || value === 'subscribed' ? value : null;
  } catch {
    return null;
  }
}

export function writeNewsletterState(state: Exclude<NewsletterLocalState, null>) {
  try {
    window.localStorage.setItem(NEWSLETTER_STORAGE_KEY, state);
  } catch {
    // Private mode: the state just won't persist across page loads.
  }
  window.dispatchEvent(new CustomEvent(NEWSLETTER_STATE_EVENT));
}

/** 'unknown' until mounted, so server and first client render agree. */
export function useNewsletterState() {
  const [state, setState] = useState<NewsletterLocalState | 'unknown'>('unknown');

  useEffect(() => {
    const sync = () => setState(readNewsletterState());
    sync();
    window.addEventListener(NEWSLETTER_STATE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(NEWSLETTER_STATE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return state;
}
