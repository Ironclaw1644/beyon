import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { syncSerpRankings } from '@/lib/seo/serp-sync';

// The Apify run queues, then scrapes 2 pages per query; ~1-3 minutes in practice.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function hasValidCronSecret(req: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  const header = req.headers.get('x-cron-secret') || '';
  return auth === `Bearer ${expected}` || header === expected;
}

export async function GET(req: Request) {
  if (!hasValidCronSecret(req)) {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;
  }

  try {
    const result = await syncSerpRankings();
    console.log(`[serp-sync] run ${result.runId}: ${result.ranking}/${result.checked} ranked, ${result.recorded} rows, $${result.costUsd ?? '?'}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rank check failed';
    console.error(`[serp-sync] ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
