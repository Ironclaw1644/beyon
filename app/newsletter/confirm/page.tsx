import type { Metadata } from 'next';
import { Button } from '@/components/ui';
import { business } from '@/lib/content';
import { confirmNewsletterSubscription, type NewsletterConfirmResult } from '@/lib/subscribers';
import { absoluteUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm Subscription | Beyon Vital, LLC',
  description: 'Confirm email updates from Beyon Vital, LLC.',
  alternates: { canonical: absoluteUrl('/newsletter/confirm') },
  robots: { index: false, follow: false }
};

const COPY: Record<NewsletterConfirmResult | 'error', { eyebrow: string; title: string; body: string }> = {
  confirmed: {
    eyebrow: 'Subscription confirmed',
    title: 'You’re on the list.',
    body: `Thank you for confirming. You’ll receive news, community engagement updates and announcements from ${business.name}. Every update includes an unsubscribe link.`
  },
  already_confirmed: {
    eyebrow: 'Already confirmed',
    title: 'You’re already subscribed.',
    body: 'This email address is already confirmed, so there is nothing else you need to do.'
  },
  expired: {
    eyebrow: 'Link expired',
    title: 'This link has expired.',
    body: 'Confirmation links are valid for 7 days. Sign up again from any page of our website and we’ll send you a fresh link.'
  },
  invalid: {
    eyebrow: 'Link not valid',
    title: 'We couldn’t confirm this link.',
    body: 'The confirmation link is incomplete or no longer valid. Copy the full link from your email, or sign up again from any page of our website to get a new one.'
  },
  error: {
    eyebrow: 'Please try again',
    title: 'Something went wrong.',
    body: 'We couldn’t confirm your subscription just now. Please open the link from your email again in a few minutes.'
  }
};

export default async function NewsletterConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  let result: NewsletterConfirmResult | 'error' = 'invalid';
  if (token) {
    try {
      result = await confirmNewsletterSubscription(token);
    } catch (error) {
      console.error('Newsletter confirmation failed', { error: error instanceof Error ? error.message : String(error) });
      result = 'error';
    }
  }

  const copy = COPY[result];
  const success = result === 'confirmed' || result === 'already_confirmed';

  return (
    <div className="container-shell py-16 sm:py-20">
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-card">
        <div className={success ? 'h-1 bg-brand-primary' : 'h-1 bg-brand-accent'} aria-hidden="true" />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">{copy.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight text-brand-ink">{copy.title}</h1>
          <p className="mt-3 text-sm leading-7 text-brand-muted sm:text-base">{copy.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/">Back to Home</Button>
            <Button href="/services" variant="ghost">Explore Our Services</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
