#!/usr/bin/env node
// Tells Bing (and other IndexNow engines) which URLs changed, so ChatGPT search
// and Copilot (both read Bing's index) see edits without waiting for a crawl.
// Google does not take part. Run after a production deploy:
//   npm run indexnow                 -> every URL in the live sitemap + /llms.txt
//   npm run indexnow -- /faq /tour   -> just these paths
//
// The key is public by design: IndexNow verifies it at https://beyonvital.com/<key>.txt.
// If it changes, rename the file in public/ to match.
const KEY = '03695a9331424a91657956d3f36afe61';
const SITE = 'https://beyonvital.com';

const args = process.argv.slice(2);
let urls;
if (args.length) {
  urls = args.map((p) => (p.startsWith('http') ? p : `${SITE}${p.startsWith('/') ? p : `/${p}`}`));
} else {
  const res = await fetch(`${SITE}/sitemap.xml`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not read sitemap (${res.status})`);
  const xml = await res.text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  urls.push(`${SITE}/llms.txt`);
}
urls = [...new Set(urls)].filter((u) => new URL(u).host === new URL(SITE).host);

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls })
});
const meaning = { 200: 'accepted', 202: 'accepted, key validation pending', 400: 'bad request', 403: 'key file missing or mismatched', 422: 'URL not on this host', 429: 'rate limited' };
console.log(`IndexNow ${res.status} (${meaning[res.status] || 'unexpected'}) for ${urls.length} URLs`);
if (!res.ok) process.exit(1);
