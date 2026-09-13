import Link from 'next/link';
import { business } from '@/lib/content';

export function MobileStickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <a href={business.phoneHref} data-track-cta="call" className="rounded-xl border border-brand-ink/15 bg-white px-3 py-3 text-center text-sm font-semibold text-brand-ink transition duration-150 ease-out active:bg-brand-cream">Call</a>
        <Link href="/placement-inquiry" data-track-cta="placement-inquiry" className="rounded-xl bg-brand-primary px-3 py-3 text-center text-sm font-semibold text-white transition duration-150 ease-out active:bg-brand-primary-dark">Inquire</Link>
      </div>
    </div>
  );
}
