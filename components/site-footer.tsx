import Link from 'next/link';
import Image from 'next/image';
import { NewsletterBand } from '@/components/newsletter-band';
import { business, footerLinks, locationPages, locationSlugs } from '@/lib/content';

export function SiteFooter() {
  return (
    <>
    <NewsletterBand />
    <footer className="border-t border-brand-ink/10 bg-white/75">
      <div className="container-shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/brand/logo-mark.png" alt="Beyon Vital logo" width={40} height={40} sizes="40px" className="h-10 w-10" loading="lazy" />
            <p className="leading-none">
              <span className="block font-display text-lg font-bold uppercase tracking-[0.06em] text-brand-primary">Beyon Vital</span>
              <span className="mt-1 block text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-brand-muted">Residential Group Home</span>
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-brand-muted">Therapeutic, behavioral, and psycho-educational services for mature and young adults.</p>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-brand-ink">Contact</h2>
          <ul className="mt-2 space-y-1 text-sm text-brand-muted">
            <li><a href={business.phoneHref} data-track-cta="call" className="hover:text-brand-ink">{business.phone}</a></li>
            <li><a href={`mailto:${business.email}`} className="hover:text-brand-ink">{business.email}</a></li>
            <li>{business.address}</li>
          </ul>
          <h2 className="mt-5 font-sans text-sm font-semibold text-brand-ink">Service areas</h2>
          <ul className="mt-2 space-y-1 text-sm text-brand-muted">
            {locationSlugs.map((slug) => (
              <li key={slug}><Link href={`/locations/${slug}`} className="hover:text-brand-ink">{locationPages[slug].shortName}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-brand-ink">Explore</h2>
          <ul className="mt-2 space-y-1 text-sm text-brand-muted">
            {footerLinks.map((link) => (
              <li key={link.href}><Link href={link.href} className="hover:text-brand-ink">{link.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-brand-ink">Get started</h2>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <Link href="/placement-inquiry" data-track-cta="placement-inquiry" className="rounded-xl bg-brand-primary px-4 py-2 text-center font-semibold text-white transition duration-150 ease-out hover:bg-brand-primary-dark">Inquire</Link>
            <Link href="/services/community-engagement/inquiry" data-track-cta="community-engagement-inquiry" className="rounded-xl bg-brand-ink px-4 py-2 text-center font-semibold text-white transition duration-150 ease-out hover:bg-brand-ink/90">Community Engagement Inquiry</Link>
            <Link href="/tour" data-track-cta="request-tour" className="rounded-xl border border-brand-ink/15 bg-white px-4 py-2 text-center font-semibold text-brand-ink transition duration-150 ease-out hover:bg-brand-cream">Request a Tour</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-brand-ink/5">
        <p className="container-shell py-4 text-xs text-brand-muted">© {new Date().getFullYear()} {business.name}</p>
      </div>
    </footer>
    </>
  );
}
