import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { buildLeadDetailEmailDraft, sendLeadDetailEmail } from '@/lib/email/service';
import { stripMetaBlock } from '@/lib/forms';
import {
  getMissingResendEnvVars,
  normalizeResendFrom,
  resolveResendFrom,
  ResendSendError
} from '@/lib/email/resend';

function redactEmail(email?: string | null) {
  if (!email) return null;
  const [name, domain] = email.split('@');
  if (!name || !domain) return '***';
  return `${name.slice(0, 2)}***@${domain}`;
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const requestId = crypto.randomUUID();

  try {
    const body = (await req.json()) as {
      leadId?: string;
      type?: 'confirmation' | 'followup';
      subject?: string;
      body?: string;
      preview?: boolean;
      sendAgain?: boolean;
    };

    const leadId = String(body.leadId || '').trim();
    const type = body.type;
    console.info('admin.send_lead_email.request', {
      requestId,
      payload: { leadId, type, preview: body.preview === true, sendAgain: body.sendAgain === true }
    });

    const sanitizedBody = typeof body.body === 'string' ? stripMetaBlock(body.body) : undefined;

    if (!leadId || (type !== 'confirmation' && type !== 'followup')) {
      return NextResponse.json({ error: 'leadId and valid email type are required' }, { status: 400 });
    }

    const missingResendVars = getMissingResendEnvVars();
    if (missingResendVars.length) {
      return NextResponse.json(
        { error: `Missing env var(s): ${missingResendVars.join(', ')}` },
        { status: 500 }
      );
    }

    const resolvedFrom = resolveResendFrom();
    console.info('admin.send_lead_email.settings', {
      requestId,
      type,
      resendFrom: normalizeResendFrom(resolvedFrom)
    });

    if (body.preview === true) {
      const draft = await buildLeadDetailEmailDraft({
        leadId,
        type,
        subjectOverride: typeof body.subject === 'string' ? body.subject : undefined,
        bodyOverride: sanitizedBody,
        sendAgain: body.sendAgain === true
      });
      return NextResponse.json({ ok: true, subject: draft.subject, html: draft.html });
    }

    const result = await sendLeadDetailEmail({
      leadId,
      type,
      subjectOverride: typeof body.subject === 'string' ? body.subject : undefined,
      bodyOverride: sanitizedBody,
      sendAgain: body.sendAgain === true
    });

    console.info('admin.send_lead_email.success', {
      requestId,
      type,
      resendId: result.resendId,
      to: redactEmail(result.to)
    });

    return NextResponse.json({ ok: true, resendId: result.resendId || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send lead email';
    if (error instanceof ResendSendError) {
      console.error('admin.send_lead_email.resend_error', {
        requestId,
        status: error.status,
        message: error.message,
        body: error.body
      });
      return NextResponse.json(
        { error: `Resend rejected the request: ${error.message}` },
        { status: 502 }
      );
    }

    console.error('admin.send_lead_email.error', { requestId, message });

    if (message.toLowerCase().includes('invalid resend_from')) {
      return NextResponse.json(
        { error: 'Invalid RESEND_FROM. Use Name <email@domain> or email@domain (no wrapping quotes).' },
        { status: 400 }
      );
    }
    if (message.toLowerCase().includes('does not have an email')) {
      return NextResponse.json({ error: 'Lead does not have a valid recipient email.' }, { status: 400 });
    }
    if (message.toLowerCase().includes('required')) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
