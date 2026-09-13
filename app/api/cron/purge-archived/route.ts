import { NextResponse } from 'next/server';
import { purgeArchivedOlderThan } from '@/lib/storage';
import { requireAdminApi } from '@/lib/api-auth';

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

  const result = await purgeArchivedOlderThan(30);
  return NextResponse.json({ ok: true, ...result });
}

