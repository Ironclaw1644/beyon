import { NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/email/tokens';
import { logEmailEvent, updateSubscriberStatusByEmail } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Two callers:
//  1. The /unsubscribe page: POST application/json { token }.
//  2. Mail clients honoring RFC 8058: POST /api/unsubscribe?token=... with body
//     "List-Unsubscribe=One-Click" (application/x-www-form-urlencoded). No cookies,
//     no redirects, must succeed with a 2xx.
async function readToken(req: Request) {
  const fromQuery = new URL(req.url).searchParams.get('token')?.trim();
  if (fromQuery) return { token: fromQuery, source: 'list_unsubscribe_one_click' };

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = (await req.json().catch(() => ({}))) as { token?: unknown };
    return { token: String(body.token || '').trim(), source: 'unsubscribe_link' };
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null);
    return { token: String(form?.get('token') || '').trim(), source: 'list_unsubscribe_one_click' };
  }
  return { token: '', source: 'unknown' };
}

export async function POST(req: Request) {
  try {
    const { token, source } = await readToken(req);
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const payload = verifyEmailToken(token);
    const email = payload.email.toLowerCase();
    await updateSubscriberStatusByEmail(email, 'unsubscribed', { reason: source });
    await logEmailEvent({ email, type: 'unsubscribed', meta: { source } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to unsubscribe';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// A GET must never unsubscribe (link scanners and prefetchers issue GETs); send
// people to the confirmation page instead.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const target = new URL('/unsubscribe', url.origin);
  if (token) target.searchParams.set('token', token);
  return NextResponse.redirect(target, 303);
}
