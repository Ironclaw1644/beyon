import { NextResponse } from 'next/server';
import { archiveLocalLead, getLocalLeads, restoreLocalLead, updateLocalLead } from '@/lib/storage';
import { requireAdminApi } from '@/lib/api-auth';
import { getAdminSession } from '@/lib/auth/admin';

function toNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(req: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const leadType = url.searchParams.get('lead_type') || undefined;
    const fromDays = toNumber(url.searchParams.get('fromDays') || url.searchParams.get('from'), 0);
    const page = toNumber(url.searchParams.get('page'), 1);
    const pageSize = toNumber(url.searchParams.get('pageSize'), 20);
    const archivedParam = url.searchParams.get('archived');
    const archived = archivedParam === 'archived' ? 'archived' : archivedParam === 'all' ? 'all' : 'active';

    const result = await getLocalLeads({
      q,
      status,
      lead_type: leadType,
      fromDays: fromDays > 0 ? fromDays : undefined,
      page,
      pageSize,
      archived
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch local leads';
    const lowered = message.toLowerCase();
    const migrationHint =
      lowered.includes('relation') && lowered.includes('leads')
        ? 'Local leads table is missing. Apply database migrations and redeploy.'
        : null;
    return NextResponse.json(
      {
        error: migrationHint || message,
        rows: [],
        total: 0,
        page: 1,
        pageSize: 20
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const body = (await req.json()) as {
      id?: string;
      status?: string;
      lead_type?: string;
      action?: 'archive' | 'restore';
    };
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (body.action === 'archive') {
      const session = await getAdminSession();
      await archiveLocalLead(body.id, session?.email);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'restore') {
      await restoreLocalLead(body.id);
      return NextResponse.json({ ok: true });
    }

    const updated = await updateLocalLead(body.id, {
      status: body.status,
      lead_type: body.lead_type
    });

    return NextResponse.json({ ok: true, row: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
