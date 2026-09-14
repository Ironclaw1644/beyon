import Link from 'next/link';
import Image from 'next/image';
import { navLinks } from '@/lib/content';
import { Button } from '@/components/ui';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-ink/5 bg-white/85 backdrop-blur-md">
      <div className="container-shell flex items-center justify-between gap-2 py-2.5 md:gap-3 md:py-3">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3">
          <Image
            src="/brand/logo-mark.png"
            alt="Beyon Vital logo"
            width={44}
            height={44}
            sizes="44px"
            className="h-10 w-10 shrink-0 md:h-11 md:w-11"
            priority
          />
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-xl font-bold uppercase tracking-[0.06em] text-brand-primary sm:text-2xl">Beyon Vital</span>
            <span className="mt-1 block truncate text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-brand-muted sm:text-[0.65rem]">Residential Group Home</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 xl:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-brand-muted hover:text-brand-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/placement-inquiry" trackCta="placement-inquiry" className="hidden sm:inline-flex">Inquire</Button>
          <Button href="/tour" variant="ghost" trackCta="request-tour" className="hidden md:inline-flex">Request a Tour</Button>
        </div>
      </div>
      <nav className="container-shell overflow-x-auto pb-2 xl:hidden" aria-label="Primary mobile">
        <div className="flex gap-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-brand-muted hover:border-brand-primary/30 hover:text-brand-ink">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
