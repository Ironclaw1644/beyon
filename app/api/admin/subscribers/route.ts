import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { archiveSubscriber, listSubscribers, restoreSubscriber, updateSubscriberStatusById, upsertSubscriber } from '@/lib/storage';
import { getAdminSession } from '@/lib/auth/admin';

export async function GET(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const url = new URL(req.url);
  const archivedParam = url.searchParams.get('archived');
  const archived = archivedParam === 'archived' ? 'archived' : archivedParam === 'all' ? 'all' : 'active';
  return NextResponse.json(await listSubscribers({ archived }));
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = await req.json();
  const item = await upsertSubscriber({
    email: String(body.email || ''),
    name: body.name ? String(body.name) : undefined,
    source: String(body.source || 'admin'),
    opted_in: body.opted_in !== false,
    status: body.status || (body.opted_in === false ? 'unsubscribed' : 'active'),
    forceResubscribe: body.force_resubscribe === true
  });
  return NextResponse.json(item);
}

export async function PATCH(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = await req.json();
  const id = String(body.id || '');
  const action = String(body.action || '');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  if (action === 'archive') {
    const session = await getAdminSession();
    await archiveSubscriber(id, session?.email);
    return NextResponse.json({ ok: true });
  }

  if (action === 'restore') {
    await restoreSubscriber(id);
    return NextResponse.json({ ok: true });
  }

  const status = String(body.status || '') as 'active' | 'unsubscribed' | 'bounced' | 'complaint';
  if (!status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 });

  try {
    const item = await updateSubscriberStatusById(id, status, {
      reason: body.reason ? String(body.reason) : undefined,
      forceResubscribe: body.force_resubscribe === true
    });
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update subscriber';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
