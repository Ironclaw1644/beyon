/**
 * Pure helpers for the weekly rank check (lib/seo/serp-sync.ts): the tracked
 * queries, the Apify actor input, and how the actor's one-item-per-SERP-page
 * output becomes one row per query.
 *
 * Kept free of `server-only` and Supabase so scripts/seo.test.ts can run it.
 *
 * Input notes (learned on Bond & Fifth, 2026-10-12): apify/google-search-scraper
 * silently ignores `locationUiValue` and `resultsPerPage`. Localisation needs
 * `locationUule` (Google's location token) and the top 20 needs
 * `maxPagesPerQuery: 2`, which returns a separate item per page.
 */

/**
 * At most 12 queries: the Apify account is a shared free $5/month cycle, and
 * 11 queries x 2 pages is about $0.10 a run. Edit here, not in the DB.
 */
export const SERP_QUERIES = [
  'group home north chesterfield va',
  'group homes chesterfield va',
  'group homes in chesterfield county va',
  'adult group home richmond va',
  'group homes richmond va',
  'residential group home richmond va',
  'dd waiver group homes richmond va',
  'community engagement services richmond va',
  'day support services chesterfield va',
  'group homes near me',
  'beyon vital'
] as const;

/** Every query is measured from Richmond, VA: the metro the home sits in. */
export const SERP_LOCATION = 'Richmond,Virginia,United States';

const UULE_LENGTH_KEY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Google `uule` token: "w+CAIQICI" + a length key + base64 canonical name. */
export function uuleFor(canonicalName: string) {
  return `w+CAIQICI${UULE_LENGTH_KEY[canonicalName.length]}${Buffer.from(canonicalName).toString('base64')}`;
}

/** Two Google pages = top ~20. Past that the exact number stops being actionable. */
export const PAGES_PER_QUERY = 2;

export function actorInput(queries: readonly string[] = SERP_QUERIES) {
  return {
    queries: queries.join('\n'),
    maxPagesPerQuery: PAGES_PER_QUERY,
    countryCode: 'us',
    languageCode: 'en',
    locationUule: uuleFor(SERP_LOCATION),
    mobileResults: false
  };
}

export const SITE_PATTERN = /(^|\/\/|\.)beyonvital\.com/i;

type Json = Record<string, unknown>;

export interface QueryRank {
  query: string;
  /** Best organic position for our site across the pages fetched, or null. */
  position: number | null;
  /** Which of our URLs Google chose, without query parameters. */
  url: string | null;
  pagesChecked: number;
  /** First 10 organic results as { position, domain }, to see who outranks us. */
  topResults: { position: number; domain: string }[];
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * One rank per query from the actor's items (one item per query per page).
 *
 * Page 2 positions normally continue from page 1 (11..20). If a page restarts
 * at 1, the earlier pages' result counts are added so positions stay absolute.
 * Items for the same query collapse into one row because the snapshots upsert
 * conflicts on (query, captured_on, source).
 */
export function ranksFromPages(items: unknown[], sitePattern: RegExp = SITE_PATTERN): QueryRank[] {
  const byQuery = new Map<string, { page: number; organic: Json[] }[]>();
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Json;
    const sq = (item.searchQuery as Json | undefined) ?? {};
    const term = typeof sq.term === 'string' ? sq.term : null;
    if (!term) continue;
    const page = Number(sq.page) || 1;
    const organic = Array.isArray(item.organicResults) ? (item.organicResults as Json[]) : [];
    const list = byQuery.get(term) ?? [];
    list.push({ page, organic });
    byQuery.set(term, list);
  }

  const out: QueryRank[] = [];
  for (const [query, pages] of byQuery) {
    pages.sort((a, b) => a.page - b.page);
    let offset = 0;
    let best: { position: number; url: string } | null = null;
    const top: { position: number; domain: string }[] = [];
    for (const { page, organic } of pages) {
      const positions = organic.map((r) => Number(r.position)).filter(Number.isFinite);
      const restarts = page > 1 && positions.length > 0 && Math.min(...positions) === 1;
      const add = restarts ? offset : 0;
      for (const r of organic) {
        const url = String(r.url ?? '');
        const pos = Number(r.position);
        if (!Number.isFinite(pos)) continue;
        const abs = pos + add;
        if (abs <= 10) top.push({ position: abs, domain: domainOf(url) });
        if (!sitePattern.test(url)) continue;
        if (!best || abs < best.position) best = { position: abs, url: url.split('?')[0] };
      }
      offset += organic.length;
    }
    top.sort((a, b) => a.position - b.position);
    out.push({ query, position: best?.position ?? null, url: best?.url ?? null, pagesChecked: pages.length, topResults: top });
  }
  return out;
}

/** Eastern date, matching the column default, so an evening run never writes a second row for one day. */
export function easternDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
