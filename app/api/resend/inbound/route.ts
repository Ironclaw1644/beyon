import { after, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/inbox/core';
import { handleInboundEmail, InboxNotConnectedError } from '@/lib/inbox/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Resend Inbound `email.received` webhook. The payload has no body, so the full
// message is fetched from the Receiving API, stored, and forwarded to Gmail.
export async function POST(req: Request) {
  const payload = await req.text();
  const verified = verifyWebhookSignature({
    payload,
    secret: process.env.RESEND_INBOUND_WEBHOOK_SECRET,
    headers: {
      id: req.headers.get('svix-id'),
      timestamp: req.headers.get('svix-timestamp'),
      signature: req.headers.get('svix-signature')
    }
  });
  if (!verified.ok) {
    if (verified.reason === 'missing_secret') {
      console.error('resend.inbound.not_connected', { missing: ['RESEND_INBOUND_WEBHOOK_SECRET'] });
    }
    return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
  }

  let event: { type?: unknown; data?: { email_id?: unknown } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event?.type !== 'email.received') return NextResponse.json({ ok: true, ignored: true });

  const emailId = typeof event.data?.email_id === 'string' ? event.data.email_id.trim() : '';
  if (!emailId) return NextResponse.json({ error: 'Missing data.email_id' }, { status: 400 });

  try {
    const result = await handleInboundEmail(emailId, (task) => after(task));
    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    if (error instanceof InboxNotConnectedError) {
      console.error('resend.inbound.not_connected', { missing: error.missing });
      return NextResponse.json({ error: 'Inbox not connected yet' }, { status: 503 });
    }
    // Non-2xx makes Resend retry; the handler is idempotent on email_id.
    console.error('resend.inbound.error', { emailId, message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Inbound processing failed' }, { status: 500 });
  }
}
