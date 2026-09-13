import { NextResponse } from 'next/server';
import { checkEmailAddress } from '@/lib/email-address';
import { checkFormGuard, isRateLimited } from '@/lib/form-guard';
import { NEWSLETTER_SURFACES, NewsletterSendError, requestNewsletterSignup, type NewsletterSurface } from '@/lib/subscribers';

export const dynamic = 'force-dynamic';

// Same answer for new, pending, already-active and suppressed addresses, so the
// endpoint never reveals who is on the list.
const SUCCESS_MESSAGE = 'Almost done! Check your inbox for a link to confirm your subscription.';

function readFirstName(value: unknown): { ok: true; value?: string } | { ok: false } {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!name) return { ok: true };
  if (name.length > 80 || /https?:|www\.|[<>@/\\]/i.test(name)) return { ok: false };
  return { ok: true, value: name };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new SyntaxError('Expected an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Please enter your email address.' }, { status: 400 });
  }

  const guard = checkFormGuard(body);
  if (guard.result === 'bot') return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
  if (guard.result === 'reject') return NextResponse.json({ error: guard.error }, { status: 400 });

  const email = checkEmailAddress(body.email);
  if (!email.ok) return NextResponse.json({ error: email.error }, { status: 400 });

  const firstName = readFirstName(body.firstName);
  if (!firstName.ok) return NextResponse.json({ error: 'Please enter just your first name, or leave it blank.' }, { status: 400 });

  if (await isRateLimited(req, 'subscribe', { limit: 5, windowSeconds: 10 * 60 })) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
  }

  const surface = NEWSLETTER_SURFACES.includes(body.surface as NewsletterSurface) ? (body.surface as NewsletterSurface) : 'website';

  try {
    await requestNewsletterSignup({ email: email.email, firstName: firstName.value, surface });
    return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Newsletter sign-up failed';
    console.error('Newsletter sign-up failed', { error: message });
    if (error instanceof NewsletterSendError) {
      return NextResponse.json(
        { error: "We couldn't send your confirmation email right now. Please try again in a few minutes." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: 'Something went wrong on our end. Please try again in a few minutes.' }, { status: 500 });
  }
}
