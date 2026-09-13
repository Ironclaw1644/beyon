'use client';

import { usePathname } from 'next/navigation';
import { NewsletterForm } from '@/components/newsletter-form';
import { NEWSLETTER_BLURB, NEWSLETTER_HEADLINE, isNewsletterHiddenPath } from '@/lib/newsletter-client';

/** Full-width sign-up band rendered directly above the site footer. */
export function NewsletterBand() {
  const pathname = usePathname();
  if (isNewsletterHiddenPath(pathname)) return <div className="mt-16" aria-hidden="true" />;

  return (
    <section aria-labelledby="newsletter-band-title" className="relative mt-16 overflow-hidden bg-brand-ink text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 0%, rgba(168,57,42,0.35), transparent 45%), radial-gradient(circle at 95% 100%, rgba(157,170,140,0.16), transparent 40%)'
        }}
      />
      <div className="container-shell relative grid gap-6 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-center lg:gap-12">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-accent">Newsletter</p>
          <h2 id="newsletter-band-title" className="text-3xl font-bold leading-tight sm:text-4xl">
            {NEWSLETTER_HEADLINE}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/75 sm:text-base">{NEWSLETTER_BLURB}</p>
        </div>
        <NewsletterForm surface="footer" tone="dark" layout="inline" />
      </div>
    </section>
  );
}
