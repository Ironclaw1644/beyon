/**
 * Where a visit or lead came from, read from the landing referrer and UTM tags
 * that activity_events and leads already store. Used by the admin Activity tab
 * ("Visits by source", "Leads by source") and the lead detail "Found via" line.
 *
 * AI assistants get their own channel because ChatGPT, Perplexity, Copilot,
 * Gemini, and Claude now send real visitors, and ChatGPT tags its links with
 * utm_source=chatgpt.com. Pure, so scripts/seo.test.ts can run it.
 */

export type SourceChannel = 'ai' | 'google' | 'bing' | 'other-search' | 'social' | 'email' | 'referral' | 'direct';

export interface SourceInfo {
  channel: SourceChannel;
  /** Human label, e.g. "ChatGPT", "Google search", "luziq.ai". */
  detail: string;
}

const AI_SOURCES: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, 'ChatGPT'],
  [/(^|\.)perplexity\.ai$/, 'Perplexity'],
  [/(^|\.)copilot\.microsoft\.com$|^copilot\.cloud\.microsoft$/, 'Copilot'],
  [/(^|\.)gemini\.google\.com$|^bard\.google\.com$/, 'Gemini'],
  [/(^|\.)claude\.ai$/, 'Claude'],
  [/(^|\.)you\.com$/, 'You.com'],
  [/(^|\.)phind\.com$/, 'Phind'],
  [/(^|\.)meta\.ai$/, 'Meta AI']
];

const AI_UTM: [RegExp, string][] = [
  [/chatgpt|openai/, 'ChatGPT'],
  [/perplexity/, 'Perplexity'],
  [/copilot/, 'Copilot'],
  [/gemini/, 'Gemini'],
  [/claude/, 'Claude']
];

const SOCIAL = /(^|\.)(facebook\.com|fb\.com|instagram\.com|t\.co|x\.com|twitter\.com|linkedin\.com|lnkd\.in|tiktok\.com|youtube\.com|pinterest\.com|nextdoor\.com|reddit\.com)$/;
const OTHER_SEARCH = /(^|\.)(duckduckgo\.com|yahoo\.com|search\.yahoo\.com|ecosia\.org|search\.brave\.com|baidu\.com|yandex\.[a-z]+)$/;
const EMAIL = /(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|mail\.yahoo\.com)$/;

const OWN_HOST = /(^|\.)beyonvital\.com$/;

function hostOf(referrer: string | null | undefined) {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function classifySource(input: { referrer?: string | null; utm_source?: string | null; utm_medium?: string | null }): SourceInfo {
  const utm = (input.utm_source || '').trim().toLowerCase();
  const medium = (input.utm_medium || '').trim().toLowerCase();
  const host = hostOf(input.referrer);

  if (utm) {
    for (const [pattern, label] of AI_UTM) if (pattern.test(utm)) return { channel: 'ai', detail: label };
  }
  if (host) {
    for (const [pattern, label] of AI_SOURCES) if (pattern.test(host)) return { channel: 'ai', detail: label };
  }
  if (utm) {
    if (medium === 'email' || utm === 'newsletter' || utm === 'email') return { channel: 'email', detail: utm };
    if (/^(facebook|fb|instagram|ig|tiktok|linkedin|twitter|x|nextdoor|youtube)$/.test(utm)) return { channel: 'social', detail: utm };
    if (utm === 'google' && /cpc|paid|ppc/.test(medium)) return { channel: 'google', detail: 'Google ads' };
    if (utm === 'google') return { channel: 'google', detail: 'Google' };
    if (utm === 'bing') return { channel: 'bing', detail: 'Bing' };
    return { channel: 'referral', detail: utm };
  }
  if (!host || OWN_HOST.test(host)) return { channel: 'direct', detail: 'Direct / unknown' };
  if (/^google\.[a-z.]+$/.test(host) || host.endsWith('.google.com')) return { channel: 'google', detail: 'Google search' };
  if (host === 'bing.com' || host.endsWith('.bing.com')) return { channel: 'bing', detail: 'Bing search' };
  if (OTHER_SEARCH.test(host)) return { channel: 'other-search', detail: host };
  if (SOCIAL.test(host)) return { channel: 'social', detail: host };
  if (EMAIL.test(host)) return { channel: 'email', detail: host };
  return { channel: 'referral', detail: host };
}

export const CHANNEL_LABELS: Record<SourceChannel, string> = {
  ai: 'AI assistants (ChatGPT etc.)',
  google: 'Google',
  bing: 'Bing',
  'other-search': 'Other search',
  social: 'Social',
  email: 'Email',
  referral: 'Other websites',
  direct: 'Direct / unknown'
};
