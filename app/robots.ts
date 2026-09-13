import type { MetadataRoute } from 'next';
import { SITE_URL, absoluteUrl } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL
  };
}
