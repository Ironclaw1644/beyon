import {
  answerSummary,
  business,
  communityEngagement,
  faqs,
  homeFeatureSentence,
  locationPages,
  locationSlugs,
  mission,
  requirements,
  servicePages,
  serviceSlugs
} from '@/lib/content';
import { absoluteUrl } from '@/lib/utils';
import { guidePath, guides } from '@/lib/guides';

/**
 * /llms.txt: a plain-text brief for AI assistants, built only from the sourced
 * facts in lib/content.ts (docs/claims.md). Never hand-write facts here; add
 * them to content.ts with a claims.md source first.
 */
export function llmsTxt() {
  const lines: string[] = [];
  lines.push(`# ${business.brandLine}`, '');
  lines.push(`> ${answerSummary}`, '');
  lines.push(mission, '');
  lines.push('## Key facts', '');
  lines.push(`- Business name: ${business.name}`);
  lines.push(`- Address: ${business.address}`);
  lines.push(`- Phone: ${business.phone}`);
  lines.push(`- Email: ${business.email}`);
  lines.push(`- Website: ${absoluteUrl('/')}`);
  lines.push(`- Serves: ${locationSlugs.map((slug) => locationPages[slug].shortName).join('; ')}`);
  lines.push(`- Who we serve: mature and young adults`);
  lines.push(`- The home: ${homeFeatureSentence}`);
  lines.push(`- Requirements: ${requirements.map((item) => item.text.replace(/\.$/, '')).join('; ')}`);
  lines.push(`- Community Engagement: ${communityEngagement.description} Hours ${communityEngagement.hours}. Includes ${communityEngagement.activities.join(', ').toLowerCase()}.`);
  lines.push('');
  lines.push('## Services', '');
  for (const slug of serviceSlugs) {
    lines.push(`- [${servicePages[slug].title}](${absoluteUrl(`/services/${slug}`)}): ${servicePages[slug].summary}`);
  }
  lines.push('');
  lines.push('## Areas served', '');
  for (const slug of locationSlugs) {
    lines.push(`- [${locationPages[slug].title}](${absoluteUrl(`/locations/${slug}`)})`);
  }
  lines.push('');
  lines.push('## Pages', '');
  lines.push(`- [Our Home](${absoluteUrl('/our-home')}): photos and features of the home`);
  lines.push(`- [Requirements](${absoluteUrl('/requirements')}): who can live at the home`);
  lines.push(`- [ID/DD Waiver Group Home Near Richmond, VA](${absoluteUrl('/dd-waiver-group-home-richmond-va')}): we accept ID/DD Waivers; who the home is for and how to start`);
  lines.push(`- [FAQ](${absoluteUrl('/faq')}): common questions`);
  lines.push(`- [Inquiry](${absoluteUrl('/placement-inquiry')}): send an inquiry (contact details only, no medical information)`);
  lines.push(`- [Request a tour](${absoluteUrl('/tour')})`);
  lines.push(`- [Contact](${absoluteUrl('/contact')})`);
  lines.push('');
  lines.push('## Guides for families (Virginia, with official sources on each page)', '');
  for (const guide of guides) {
    lines.push(`- [${guide.question}](${absoluteUrl(guidePath(guide.slug))})`);
  }
  lines.push('');
  lines.push('## FAQ', '');
  for (const item of faqs) {
    lines.push(`Q: ${item.q}`, `A: ${item.a}`, '');
  }
  return `${lines.join('\n').trim()}\n`;
}
