import type { MetadataRoute } from 'next';
import { locationSlugs, serviceSlugs } from '@/lib/content';
import { absoluteUrl } from '@/lib/utils';

// When a page's content last changed. Bump the date for a path when its copy
// changes; a build-time date on every URL tells crawlers nothing.
const CONTENT_UPDATED = '2026-10-21';
const UPDATED: Record<string, string> = {};

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
    ...locationSlugs.map((slug) => ({ url: absoluteUrl(`/locations/${slug}`), lastModified: lastModified(`/locations/${slug}`), changeFrequency: 'monthly' as const, priority: 0.8 }))
  ];
}
