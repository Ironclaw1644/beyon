import type { MetadataRoute } from 'next';
import { SITE_URL, absoluteUrl } from '@/lib/utils';

// Search and AI-answer crawlers are named explicitly so a future blanket rule
// can't shut them out by accident: ChatGPT search reads OAI-SearchBot and Bing,
// and Perplexity, Claude, and Google's AI features each use their own agent.
const ANSWER_ENGINE_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'Googlebot',
  'Bingbot',
  'Applebot',
  'Applebot-Extended'
];

const PRIVATE = ['/admin', '/api'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: ANSWER_ENGINE_BOTS, allow: '/', disallow: PRIVATE }
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL
  };
}
