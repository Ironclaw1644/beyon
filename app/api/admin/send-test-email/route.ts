import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { getMissingResendEnvVars, resolveResendFrom, ResendSendError, sendResendEmail } from '@/lib/email/resend';

export async function POST() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const missing = getMissingResendEnvVars();
  if (missing.length) {
    return NextResponse.json({ error: `Missing env var(s): ${missing.join(', ')}` }, { status: 500 });
  }

  const to = process.env.RESEND_TO?.trim();
  if (!to) {
    return NextResponse.json({ error: 'Missing env var: RESEND_TO' }, { status: 500 });
  }

  try {
    const from = resolveResendFrom();
    const result = await sendResendEmail({
      to,
      from,
      subject: 'Beyon Vital admin test email',
      html: '<p>This is a test email from the Beyon Vital admin settings check.</p>',
      text: 'This is a test email from the Beyon Vital admin settings check.',
      replyTo: process.env.RESEND_REPLY_TO?.trim() || undefined
    });

    return NextResponse.json({ ok: true, resendId: result.id || null });
  } catch (error) {
    if (error instanceof ResendSendError) {
      return NextResponse.json({ error: `Resend rejected the request: ${error.message}` }, { status: 502 });
    }
    const message = error instanceof Error ? error.message : 'Failed to send test email';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
