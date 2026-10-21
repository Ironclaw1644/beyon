// Unit tests for the rank tracker parser, AI/search source classification, and
// the SEO limits on sourced copy. No network. Run with `npm test`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { actorInput, easternDate, ranksFromPages, SERP_QUERIES, uuleFor } from '../lib/seo/serp-parse';
import { classifySource } from '../lib/source';
import { locationPages, locationSlugs, servicePages, serviceSlugs } from '../lib/content';
import { llmsTxt } from '../lib/seo/llms';

test('uule matches Google tokens already verified on Bond & Fifth', () => {
  assert.equal(uuleFor('Miami,Florida,United States'), 'w+CAIQICIbTWlhbWksRmxvcmlkYSxVbml0ZWQgU3RhdGVz');
  assert.equal(uuleFor('Atlanta,Georgia,United States'), 'w+CAIQICIdQXRsYW50YSxHZW9yZ2lhLFVuaXRlZCBTdGF0ZXM=');
});

test('actor input: localized, two pages, at most 12 queries', () => {
  const input = actorInput();
  assert.equal(input.maxPagesPerQuery, 2);
  assert.match(input.locationUule, /^w\+CAIQICI/);
  assert.ok(SERP_QUERIES.length <= 12);
  assert.equal(input.queries.split('\n').length, SERP_QUERIES.length);
});

const page = (term: string, pageNo: number, urls: string[], start = 1) => ({
  searchQuery: { term, page: pageNo },
  organicResults: urls.map((url, i) => ({ url, position: start + i }))
});

test('ranksFromPages merges pages and keeps the best position', () => {
  const items = [
    page('group homes richmond va', 1, ['https://a.org/', 'https://www.b.com/x']),
    page('group homes richmond va', 2, ['https://c.org/', 'https://beyonvital.com/locations/richmond-va?x=1'], 11),
    page('beyon vital', 1, ['https://npidb.org/x', 'https://beyonvital.com/contact', 'https://beyonvital.com/'])
  ];
  const ranks = ranksFromPages(items);
  const richmond = ranks.find((r) => r.query === 'group homes richmond va')!;
  assert.equal(richmond.position, 12);
  assert.equal(richmond.url, 'https://beyonvital.com/locations/richmond-va');
  assert.equal(richmond.pagesChecked, 2);
  assert.deepEqual(richmond.topResults.map((t) => t.domain), ['a.org', 'b.com']);
  assert.equal(ranks.find((r) => r.query === 'beyon vital')!.position, 2);
});

test('ranksFromPages offsets a page 2 that restarts at 1', () => {
  const items = [
    page('q', 1, Array.from({ length: 9 }, (_, i) => `https://x${i}.com/`)),
    page('q', 2, ['https://y.com/', 'https://beyonvital.com/faq'])
  ];
  assert.equal(ranksFromPages(items)[0].position, 11);
});

test('ranksFromPages records null when the site is absent and ignores look-alikes', () => {
  const items = [page('q', 1, ['https://notbeyonvital.com/', 'https://x.com/'])];
  assert.equal(ranksFromPages(items)[0].position, null);
});

test('easternDate uses America/New_York', () => {
  assert.equal(easternDate(new Date('2026-10-21T02:00:00Z')), '2026-10-20');
});

test('classifySource: AI assistants by referrer and utm', () => {
  assert.deepEqual(classifySource({ referrer: 'https://chatgpt.com/' }), { channel: 'ai', detail: 'ChatGPT' });
  assert.deepEqual(classifySource({ utm_source: 'chatgpt.com', referrer: '' }), { channel: 'ai', detail: 'ChatGPT' });
  assert.equal(classifySource({ referrer: 'https://www.perplexity.ai/search?q=x' }).detail, 'Perplexity');
  assert.equal(classifySource({ referrer: 'https://copilot.microsoft.com/' }).detail, 'Copilot');
  assert.equal(classifySource({ referrer: 'https://gemini.google.com/app' }).detail, 'Gemini');
  assert.equal(classifySource({ referrer: 'https://claude.ai/chat/1' }).detail, 'Claude');
});

test('classifySource: search, social, email, referral, direct', () => {
  assert.equal(classifySource({ referrer: 'https://www.google.com/' }).channel, 'google');
  assert.equal(classifySource({ referrer: 'https://bing.com/' }).channel, 'bing');
  assert.equal(classifySource({ referrer: 'https://duckduckgo.com/' }).channel, 'other-search');
  assert.equal(classifySource({ referrer: 'https://l.facebook.com/' }).channel, 'social');
  assert.equal(classifySource({ utm_source: 'flyer', utm_medium: 'qr' }).channel, 'referral');
  assert.equal(classifySource({ utm_source: 'newsletter' }).channel, 'email');
  assert.equal(classifySource({ referrer: 'https://luziq.ai/x' }).detail, 'luziq.ai');
  assert.equal(classifySource({ referrer: 'https://beyonvital.com/faq' }).channel, 'direct');
  assert.equal(classifySource({}).channel, 'direct');
  assert.equal(classifySource({ referrer: 'not a url' }).channel, 'direct');
});

test('service and location titles fit in 60 characters, descriptions 140-160', () => {
  const pages = [...serviceSlugs.map((s) => servicePages[s]), ...locationSlugs.map((s) => locationPages[s])];
  for (const p of pages) {
    assert.ok(p.metaTitle.length <= 60, `${p.metaTitle} (${p.metaTitle.length})`);
    assert.ok(p.metaDescription.length >= 140 && p.metaDescription.length <= 160, `${p.metaDescription} (${p.metaDescription.length})`);
  }
});

test('llms.txt carries the sourced facts and nothing the claims register rules out', () => {
  const text = llmsTxt();
  assert.match(text, /^# Beyon Vital Residential Group Home/);
  assert.match(text, /8120 Clovertree Ct, North Chesterfield, VA 23235/);
  assert.match(text, /ID\/DD Waivers/);
  for (const banned of [/licen[sc]/i, /24\/7|around the clock|overnight/i, /medicaid/i, /years of experience/i, /testimonial/i]) {
    assert.doesNotMatch(text, banned);
  }
});
