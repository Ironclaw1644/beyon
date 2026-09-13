import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { listEmailCampaigns } from '@/lib/storage';
import { sendBlastCampaign, sendTestBlastEmail } from '@/lib/email/service';

// Blasts are throttled under Resend's rate limit, so allow a long-running request.
export const maxDuration = 300;

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const campaigns = await listEmailCampaigns(25);
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = (await req.json()) as {
      action?: 'test' | 'send';
      subject?: string;
      previewText?: string;
      body?: string;
      audienceSource?: string;
      idempotencyKey?: string;
    };

    const subject = String(body.subject || '').trim();
    const content = String(body.body || '').trim();
    if (!subject || !content) {
      return NextResponse.json({ error: 'subject and body are required' }, { status: 400 });
    }

    if (body.action === 'test') {
      const result = await sendTestBlastEmail({ subject, previewText: body.previewText, body: content });
      return NextResponse.json({ ok: true, testId: result.id || null });
    }

    const idempotencyKey = String(body.idempotencyKey || randomUUID());
    const result = await sendBlastCampaign({
      subject,
      previewText: body.previewText,
      body: content,
      audienceSource: body.audienceSource,
      idempotencyKey
    });

    return NextResponse.json({ ok: true, alreadyProcessed: result.alreadyProcessed, campaign: result.campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send blast';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
