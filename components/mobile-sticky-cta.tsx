'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail } from 'lucide-react';
import { business } from '@/lib/content';
import { NEWSLETTER_OPEN_EVENT, isNewsletterHiddenPath, useNewsletterState } from '@/lib/newsletter-client';

export function MobileStickyCTA() {
  const pathname = usePathname();
  const newsletterState = useNewsletterState();
  const showNewsletter = !isNewsletterHiddenPath(pathname) && newsletterState !== 'subscribed';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
      <div className={`mx-auto grid max-w-lg gap-2 ${showNewsletter ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <a href={business.phoneHref} data-track-cta="call" className="rounded-xl border border-brand-ink/15 bg-white px-3 py-3 text-center text-sm font-semibold text-brand-ink transition duration-150 ease-out active:bg-brand-cream">Call</a>
        <Link href="/placement-inquiry" data-track-cta="placement-inquiry" className="rounded-xl bg-brand-primary px-3 py-3 text-center text-sm font-semibold text-white transition duration-150 ease-out active:bg-brand-primary-dark">Inquire</Link>
        {showNewsletter ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(NEWSLETTER_OPEN_EVENT))}
            aria-haspopup="dialog"
            data-track-cta="newsletter"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-primary/25 bg-brand-cream px-2 py-3 text-center text-sm font-semibold text-brand-primary-dark transition duration-150 ease-out active:bg-white"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            Newsletter
          </button>
        ) : null}
      </div>
    </div>
  );
}
