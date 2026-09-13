import type { MetadataRoute } from 'next';
import { locationSlugs, serviceSlugs } from '@/lib/content';
import { absoluteUrl } from '@/lib/utils';

// Every indexable public page. Thank-you pages, /unsubscribe, and /admin are
// noindex and intentionally left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
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
    ...staticPaths.map((path) => ({ url: absoluteUrl(path), lastModified, changeFrequency: 'monthly' as const, priority: path === '/' ? 1 : 0.7 })),
    ...serviceSlugs.map((slug) => ({ url: absoluteUrl(`/services/${slug}`), lastModified, changeFrequency: 'monthly' as const, priority: 0.9 })),
    ...locationSlugs.map((slug) => ({ url: absoluteUrl(`/locations/${slug}`), lastModified, changeFrequency: 'monthly' as const, priority: 0.8 }))
  ];
}
