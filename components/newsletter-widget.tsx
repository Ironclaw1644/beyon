'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Mail, X } from 'lucide-react';
import { NewsletterForm } from '@/components/newsletter-form';
import {
  NEWSLETTER_BLURB,
  NEWSLETTER_HEADLINE,
  NEWSLETTER_OPEN_EVENT,
  isNewsletterHiddenPath,
  readNewsletterState,
  useNewsletterState,
  writeNewsletterState
} from '@/lib/newsletter-client';

const AUTO_OPEN_SCROLL_RATIO = 0.35;
const AUTO_OPEN_DELAY_MS = 12_000;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab / Shift+Tab cycling inside the dialog. */
function trapTab(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return;
  const container = event.currentTarget;
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[aria-hidden="true"]'));
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const outside = !active || active === container || !container.contains(active);
  if (event.shiftKey && (active === first || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close newsletter sign-up"
      className="-m-1.5 rounded-lg p-1.5 text-brand-muted transition duration-150 ease-out hover:bg-brand-cream hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
    >
      <X className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

function Eyebrow() {
  return (
    <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">
      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
      Newsletter
    </p>
  );
}

/**
 * Desktop/tablet: a pill in the bottom-right corner that expands once into a
 * sign-up card after 35% scroll or 12s, then stays a pill once dismissed.
 * Mobile: a bottom sheet opened from the sticky Call / Inquire / Newsletter bar.
 */
export function NewsletterWidget() {
  const pathname = usePathname();
  const stored = useNewsletterState();
  const hidden = isNewsletterHiddenPath(pathname);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardOpenedByUser, setCardOpenedByUser] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const sheetReturnFocus = useRef<HTMLElement | null>(null);

  // Auto-expand once, desktop/tablet only, for visitors who never closed or joined.
  useEffect(() => {
    if (hidden || stored !== null) return;
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    let timer = 0;
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= AUTO_OPEN_SCROLL_RATIO) open();
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
    function open() {
      cleanup();
      setCardOpen(true);
    }
    timer = window.setTimeout(open, AUTO_OPEN_DELAY_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return cleanup;
  }, [hidden, stored]);

  const closeCard = useCallback(() => {
    const hadFocus = Boolean(cardRef.current?.contains(document.activeElement));
    setCardOpen(false);
    setCardOpenedByUser(false);
    if (readNewsletterState() !== 'subscribed') writeNewsletterState('dismissed');
    if (hadFocus) requestAnimationFrame(() => pillRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!cardOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCard();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [cardOpen, closeCard]);

  useEffect(() => {
    const onOpen = () => {
      sheetReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setSheetOpen(true);
    };
    window.addEventListener(NEWSLETTER_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(NEWSLETTER_OPEN_EVENT, onOpen);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    const target = sheetReturnFocus.current;
    if (target) requestAnimationFrame(() => target.focus());
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    // Focus the sheet itself rather than the input so the keyboard doesn't
    // cover the sheet before the visitor has read it.
    sheetRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSheet();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sheetOpen, closeSheet]);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  if (hidden) return null;

  const showDesktop = stored !== 'unknown' && (stored !== 'subscribed' || cardOpen);

  return (
    <>
      {showDesktop ? (
        <div className="hidden md:block">
          {cardOpen ? (
            <div
              ref={cardRef}
              role="dialog"
              aria-modal="false"
              aria-labelledby="newsletter-card-title"
              aria-describedby="newsletter-card-description"
              onKeyDown={trapTab}
              className="bv-slide-up fixed bottom-6 right-6 z-40 w-[23rem] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-card-hover"
            >
              <div className="h-1 bg-brand-primary" aria-hidden="true" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Eyebrow />
                  <CloseButton onClick={closeCard} />
                </div>
                <h2 id="newsletter-card-title" className="mt-1.5 text-[1.75rem] font-bold leading-tight text-brand-ink">
                  {NEWSLETTER_HEADLINE}
                </h2>
                <p id="newsletter-card-description" className="mt-1.5 text-sm leading-6 text-brand-muted">
                  {NEWSLETTER_BLURB}
                </p>
                <div className="mt-4">
                  <NewsletterForm surface="widget" autoFocusEmail={cardOpenedByUser} />
                </div>
              </div>
            </div>
          ) : (
            <button
              ref={pillRef}
              type="button"
              onClick={() => {
                setCardOpenedByUser(true);
                setCardOpen(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={false}
              data-track-cta="newsletter-pill"
              className="bv-fade-in fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-card-hover transition duration-150 ease-out hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream motion-safe:hover:-translate-y-px"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Newsletter
            </button>
          )}
        </div>
      ) : null}

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="bv-fade-in absolute inset-0 bg-brand-ink/45" onClick={closeSheet} aria-hidden="true" />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-sheet-title"
            aria-describedby="newsletter-sheet-description"
            tabIndex={-1}
            onKeyDown={trapTab}
            className="bv-sheet-up absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-brand-ink/10 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3 shadow-2xl outline-none"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-brand-ink/15" aria-hidden="true" />
            <div className="flex items-start justify-between gap-3">
              <Eyebrow />
              <CloseButton onClick={closeSheet} />
            </div>
            <h2 id="newsletter-sheet-title" className="mt-1.5 text-3xl font-bold leading-tight text-brand-ink">
              {NEWSLETTER_HEADLINE}
            </h2>
            <p id="newsletter-sheet-description" className="mt-1.5 text-sm leading-6 text-brand-muted">
              {NEWSLETTER_BLURB}
            </p>
            <div className="mt-4">
              <NewsletterForm surface="sheet" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
