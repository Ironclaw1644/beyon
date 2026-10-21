import 'server-only';
import { cmsServerClient } from '@/lib/supabase/cmsServer';
import { actorInput, easternDate, ranksFromPages, SERP_LOCATION, SERP_QUERIES, type QueryRank } from '@/lib/seo/serp-parse';

/**
 * Weekly Google rank check for the tracked queries (lib/seo/serp-parse.ts),
 * written to beyon.serp_snapshots and shown on the admin SEO tab.
 *
 * Position is the one number that can be measured without Search Console
 * access. It says nothing about clicks, so no traffic is recorded here.
 *
 * The actor run is started asynchronously and polled, then its dataset is
 * read. A single run-sync call holds one connection for the whole scrape and
 * has returned empty bodies when it was cut short.
 */

const API = 'https://api.apify.com/v2';
const ACTOR = 'apify~google-search-scraper';
/** Leave headroom under the route's maxDuration (300s). */
const DEADLINE_MS = 270_000;

export interface SerpSyncResult {
  runId: string;
  checked: number;
  ranking: number;
  recorded: number;
  costUsd: number | null;
  positions: Pick<QueryRank, 'query' | 'position' | 'url'>[];
}

/** Apify's own error text (e.g. the monthly usage cap). Never includes the token. */
async function apifyError(res: Response) {
  try {
    const body = (await res.json()) as { error?: { type?: string; message?: string } };
    const e = body?.error;
    if (e) return [e.type, e.message].filter(Boolean).join(': ').slice(0, 300);
  } catch {
    /* not JSON */
  }
  return res.statusText || 'no detail';
}

async function apify(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    // Header rather than `?token=`; query strings leak into logs.
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(70_000)
  });
  if (!res.ok) throw new Error(`Apify ${path.split('?')[0]} failed (${res.status}): ${await apifyError(res)}`);
  return res.json();
}

type RunData = { id: string; status: string; defaultDatasetId: string; usageTotalUsd?: number };

export async function syncSerpRankings(): Promise<SerpSyncResult> {
  const token = process.env.APIFY_API_KEY?.trim();
  if (!token) throw new Error('APIFY_API_KEY is not set.');
  const started = Date.now();

  const startBody = (await apify(token, `/acts/${ACTOR}/runs`, { method: 'POST', body: JSON.stringify(actorInput()) })) as { data: RunData };
  let run = startBody.data;

  while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
    if (Date.now() - started > DEADLINE_MS) {
      throw new Error(`Apify run ${run.id} still ${run.status} after ${Math.round(DEADLINE_MS / 1000)}s; rows not written.`);
    }
    // waitForFinish blocks server-side for up to 60s, so this is a long poll, not a busy loop.
    run = ((await apify(token, `/actor-runs/${run.id}?waitForFinish=60`)) as { data: RunData }).data;
  }
  if (run.status !== 'SUCCEEDED') throw new Error(`Apify run ${run.id} ended ${run.status}.`);

  const items = (await apify(token, `/datasets/${run.defaultDatasetId}/items?clean=true&format=json`)) as unknown;
  if (!Array.isArray(items)) throw new Error('Apify dataset returned an unexpected shape.');
  if (items.length === 0) throw new Error(`Apify run ${run.id} returned no SERP pages.`);

  const ranks = ranksFromPages(items);
  const capturedOn = easternDate();
  const rows = ranks.map((r) => ({
    query: r.query,
    captured_on: capturedOn,
    source: 'apify',
    location: SERP_LOCATION,
    position: r.position,
    url: r.url,
    pages_checked: r.pagesChecked,
    top_results: r.topResults
  }));

  const { error } = await cmsServerClient().from('serp_snapshots').upsert(rows, { onConflict: 'query,captured_on,source' });
  // Supabase returns a plain object, not an Error; wrap it so the route logs the message.
  if (error) throw new Error(`Could not save rankings: ${error.message}`);

  const missing = SERP_QUERIES.filter((q) => !ranks.some((r) => r.query === q));
  if (missing.length) console.warn(`[serp-sync] no SERP returned for: ${missing.join(' | ')}`);

  return {
    runId: run.id,
    checked: ranks.length,
    ranking: ranks.filter((r) => r.position !== null).length,
    recorded: rows.length,
    costUsd: typeof run.usageTotalUsd === 'number' ? Number(run.usageTotalUsd.toFixed(4)) : null,
    positions: ranks
      .map(({ query, position, url }) => ({ query, position, url }))
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999) || a.query.localeCompare(b.query))
  };
}

export type SerpRow = {
  query: string;
  captured_on: string;
  position: number | null;
  url: string | null;
  top_results: { position: number; domain: string }[];
};

/** Latest and previous snapshot per query, for the admin SEO tab. */
export async function getSerpOverview() {
  const { data, error } = await cmsServerClient()
    .from('serp_snapshots')
    .select('query, captured_on, position, url, top_results')
    .order('captured_on', { ascending: false })
    .limit(600);
  if (error) throw new Error(error.message);
  const rows = (data || []) as SerpRow[];
  const byQuery = new Map<string, SerpRow[]>();
  for (const row of rows) byQuery.set(row.query, [...(byQuery.get(row.query) || []), row]);
  const queries = [...byQuery.entries()].map(([query, list]) => ({
    query,
    latest: list[0],
    previous: list[1] || null,
    history: list.slice(0, 12).map((r) => ({ date: r.captured_on, position: r.position }))
  }));
  queries.sort((a, b) => (a.latest.position ?? 999) - (b.latest.position ?? 999) || a.query.localeCompare(b.query));
  return { location: SERP_LOCATION, lastRun: rows[0]?.captured_on || null, queries };
}
