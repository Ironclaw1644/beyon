'use client';

import type { ActivityEventPayload } from '@/lib/types';

const SESSION_KEY = 'beyon_session_id';

function safeUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getSessionId() {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = safeUuid();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}

function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function trackEvent(input: ActivityEventPayload) {
  if (typeof window === 'undefined') return;
  const url = '/api/track';
  const payload: ActivityEventPayload = {
    ...input,
    session_id: input.session_id || getSessionId(),
    page_path: input.page_path || window.location.pathname,
    referrer: input.referrer || document.referrer || undefined,
    device: input.device || getDeviceType()
  };

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
    return;
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  });
}
