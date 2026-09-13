import { NextResponse } from 'next/server';
import { logEmailEvent, updateSubscriberStatusByEmail } from '@/lib/storage';

function getWebhookSecret() {
  return process.env.RESEND_WEBHOOK_SECRET?.trim() || '';
}

function isVerified(req: Request) {
  const secret = getWebhookSecret();
  if (!secret) return false;
  const header = req.headers.get('x-webhook-secret')?.trim();
  const fromUrl = new URL(req.url).searchParams.get('secret')?.trim();
  return header === secret || fromUrl === secret;
}

function extractEmail(payload: any) {
  const direct = payload?.data?.to;
  if (Array.isArray(direct) && direct.length) return String(direct[0]).toLowerCase();
  if (typeof direct === 'string') return direct.toLowerCase();
  if (typeof payload?.data?.email === 'string') return payload.data.email.toLowerCase();
  return '';
}

export async function POST(req: Request) {
  if (!isVerified(req)) {
    return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const type = String(payload?.type || '').toLowerCase();
    const email = extractEmail(payload);

    if (email) {
      await logEmailEvent({ email, type, meta: payload });
      if (type.includes('bounce')) {
        await updateSubscriberStatusByEmail(email, 'bounced', { reason: 'resend_webhook_bounce' });
      } else if (type.includes('complaint') || type.includes('complain')) {
        await updateSubscriberStatusByEmail(email, 'complaint', { reason: 'resend_webhook_complaint' });
      } else if (type.includes('unsubscribe')) {
        await updateSubscriberStatusByEmail(email, 'unsubscribed', { reason: 'resend_webhook_unsubscribe' });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
