import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { isRateLimited } from '@/lib/form-guard';
import { parseRecipientList } from '@/lib/inbox/core';
import {
  countUnreadThreads,
  getMissingInboxEnvVars,
  InboxInputError,
  InboxNotConnectedError,
  listInboxThreads,
  sendInboxMessage,
  setInboxThreadState
} from '@/lib/inbox/service';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const missing = getMissingInboxEnvVars();
  try {
    const unreadCount = await countUnreadThreads();
    if (url.searchParams.get('summary') === '1') {
      return NextResponse.json({ connected: missing.length === 0, missing, unreadCount });
    }
    const mode = url.searchParams.get('mode') === 'archived' ? 'archived' : 'active';
    const threads = await listInboxThreads({ mode, q: url.searchParams.get('q') || '' });
    return NextResponse.json({ connected: missing.length === 0, missing, unreadCount, threads });
  } catch (error) {
    return NextResponse.json({ connected: missing.length === 0, missing, error: errorMessage(error, 'Failed to load inbox') }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const missing = getMissingInboxEnvVars();
  if (missing.length) {
    return NextResponse.json({ error: `Inbox not connected yet. Missing: ${missing.join(', ')}`, missing }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const threadId = typeof body.threadId === 'string' && body.threadId ? body.threadId : null;
  if (threadId && !UUID.test(threadId)) return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });

  const to = parseRecipientList(threadId ? '' : (body.to as string | string[] | undefined));
  if (!to.ok) return NextResponse.json({ error: `To: ${to.error}` }, { status: 400 });
  const cc = parseRecipientList(threadId ? '' : (body.cc as string | string[] | undefined));
  if (!cc.ok) return NextResponse.json({ error: `Cc: ${cc.error}` }, { status: 400 });

  // Generous for one person answering mail, tight enough to stop a runaway loop.
  if (await isRateLimited(req, 'admin-inbox-send', { limit: 30, windowSeconds: 15 * 60 })) {
    return NextResponse.json({ error: 'Too many messages sent in a short time. Wait a few minutes and try again.' }, { status: 429 });
  }

  try {
    const result = await sendInboxMessage({
      threadId,
      to: to.emails,
      cc: cc.emails,
      subject: typeof body.subject === 'string' ? body.subject : '',
      body: typeof body.body === 'string' ? body.body : '',
      idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined
    });
    return NextResponse.json({ ok: true, threadId: result.threadId, messageId: result.messageId });
  } catch (error) {
    if (error instanceof InboxNotConnectedError) {
      return NextResponse.json({ error: error.message, missing: error.missing }, { status: 503 });
    }
    if (error instanceof InboxInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('admin.inbox.send_error', { message: errorMessage(error, 'send failed') });
    return NextResponse.json({ error: `Email could not be sent: ${errorMessage(error, 'unknown error')}` }, { status: 502 });
  }
}

export async function PATCH(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  const id = String(body.id || '');
  const action = body.action;
  if (!UUID.test(id) || (action !== 'archive' && action !== 'restore' && action !== 'read' && action !== 'unread')) {
    return NextResponse.json({ error: 'id and a valid action are required' }, { status: 400 });
  }

  try {
    const thread = await setInboxThreadState(id, action);
    if (!thread) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    return NextResponse.json({ ok: true, thread, unreadCount: await countUnreadThreads() });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error, 'Failed to update conversation') }, { status: 500 });
  }
}
