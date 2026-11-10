import type { MetadataRoute } from 'next';
import { locationSlugs, serviceSlugs } from '@/lib/content';
import { absoluteUrl } from '@/lib/utils';
import { guidePath, guides } from '@/lib/guides';

// When a page's content last changed. Bump the date for a path when its copy
// changes; a build-time date on every URL tells crawlers nothing.
const CONTENT_UPDATED = '2026-10-21';
const SEO_1102 = '2026-11-02';
const CROSSLINKS_1109 = '2026-11-09';
const UPDATED: Record<string, string> = {
  '/': SEO_1102,
  '/faq': SEO_1102,
  '/resources': CROSSLINKS_1109,
  '/requirements': SEO_1102,
  '/services/residential-group-home': SEO_1102,
  '/services/community-engagement': SEO_1102,
  '/locations/north-chesterfield-va': SEO_1102,
  '/locations/chesterfield-county-va': SEO_1102,
  '/locations/richmond-va': SEO_1102,
  '/dd-waiver-group-home-richmond-va': SEO_1102
};

// Every indexable public page. Thank-you pages, /unsubscribe, and /admin are
// noindex and intentionally left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = (path: string) => new Date(UPDATED[path] || CONTENT_UPDATED);
  const staticPaths = [
    '/',
    '/services',
    '/our-home',
    '/requirements',
    '/placement-inquiry',
    '/services/community-engagement/inquiry',
    '/tour',
    '/contact',
    '/announcements',
    '/resources',
    '/faq'
  ];

  return [
    ...staticPaths.map((path) => ({ url: absoluteUrl(path), lastModified: lastModified(path), changeFrequency: 'monthly' as const, priority: path === '/' ? 1 : 0.7 })),
    ...serviceSlugs.map((slug) => ({ url: absoluteUrl(`/services/${slug}`), lastModified: lastModified(`/services/${slug}`), changeFrequency: 'monthly' as const, priority: 0.9 })),
    ...locationSlugs.map((slug) => ({ url: absoluteUrl(`/locations/${slug}`), lastModified: lastModified(`/locations/${slug}`), changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: absoluteUrl('/dd-waiver-group-home-richmond-va'), lastModified: lastModified('/dd-waiver-group-home-richmond-va'), changeFrequency: 'monthly' as const, priority: 0.9 },
    ...guides.map((guide) => ({ url: absoluteUrl(guidePath(guide.slug)), lastModified: new Date(guide.reviewed), changeFrequency: 'monthly' as const, priority: 0.6 }))
  ];
}
