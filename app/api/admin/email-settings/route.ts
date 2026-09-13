import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { getMissingResendEnvVars, normalizeResendFrom, isValidResendFrom } from '@/lib/email/resend';

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const missing = getMissingResendEnvVars();
  const rawFrom = process.env.RESEND_FROM || '';
  const normalizedFrom = normalizeResendFrom(rawFrom);

  return NextResponse.json({
    resendApiKeyPresent: !missing.includes('RESEND_API_KEY'),
    resendFromPresent: !missing.includes('RESEND_FROM'),
    resendFromValid: normalizedFrom ? isValidResendFrom(normalizedFrom) : false,
    resendToPresent: Boolean(process.env.RESEND_TO?.trim()),
    resendReplyToPresent: Boolean(process.env.RESEND_REPLY_TO?.trim())
  });
}
