import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MobileStickyCTA } from '@/components/mobile-sticky-cta';
import { StructuredData } from '@/components/structured-data';
import { ActivityTracker } from '@/components/activity-tracker';
import { business } from '@/lib/content';
import { defaultDescription, localBusinessJsonLd } from '@/lib/site';
import { SITE_URL } from '@/lib/utils';

// Display: classic Roman caps like the logo wordmark. Body: a clean, widely
// tracked-friendly sans like the logo subline.
const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display', display: 'swap' });
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

// No canonical here on purpose: every page sets its own via buildMetadata().
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: business.brandLine,
  description: defaultDescription,
  applicationName: business.shortName,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }]
  }
};

export const viewport: Viewport = {
  themeColor: '#A8392A'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="pb-20 md:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-ink focus:shadow-card"
        >
          Skip to content
        </a>
        <StructuredData data={localBusinessJsonLd()} />
        <ActivityTracker />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <MobileStickyCTA />
      </body>
    </html>
  );
}
