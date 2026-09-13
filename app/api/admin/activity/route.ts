import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { getActivityAnalytics } from '@/lib/activity-analytics';

function parseDays(value: string | null) {
  const parsed = Number(value);
  if (parsed === 7 || parsed === 30 || parsed === 90) return parsed;
  return 30;
}

export async function GET(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(req.url);
    const days = parseDays(url.searchParams.get('days'));
    const data = await getActivityAnalytics(days);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load activity analytics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
