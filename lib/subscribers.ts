import 'server-only';

import { createHash, randomBytes, randomUUID } from 'crypto';
import { checkEmailAddress } from '@/lib/email-address';
import { sendNewsletterConfirmEmail } from '@/lib/email/service';
import { cmsServerClient } from '@/lib/supabase/cmsServer';
import { getSubscriberByEmail, logEmailEvent, upsertSubscriber } from '@/lib/storage';
import type { Database } from '@/lib/supabase/cms.types';
import { SITE_URL } from '@/lib/utils';

type SubscriberRow = Database['beyon']['Tables']['subscribers']['Row'];

const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** A pending address gets at most one confirmation email per window. */
const CONFIRM_RESEND_COOLDOWN_MS = 10 * 60 * 1000;
const CONFIRM_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const NEWSLETTER_SURFACES = ['widget', 'sheet', 'footer'] as const;
export type NewsletterSurface = (typeof NEWSLETTER_SURFACES)[number];

export class NewsletterSendError extends Error {}

type LeadOptInInput = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  source: string;
};

/**
 * Inquiry-form checkbox opt-in (single opt-in, unchanged behavior): the person
 * is already in a real conversation with the business, so no confirmation
 * email is sent. A pending newsletter sign-up for the same address is
 * activated here instead of being mailed twice.
 */
export async function upsertSubscriberFromLeadOptIn(input: LeadOptInInput) {
  const checked = checkEmailAddress(input.email);
  if (!checked.ok) return { skipped: true as const, reason: 'invalid_email' as const };
  const email = checked.email;

  const existing = await getSubscriberByEmail(email);
  if (existing && existing.status !== 'active' && existing.status !== 'pending') {
    return { skipped: true as const, reason: 'suppressed' as const };
  }

  const nextName = (existing?.name?.trim() || '').length ? existing?.name || '' : String(input.name || '').trim();
  const nextPhone = (existing?.phone?.trim() || '').length ? existing?.phone || '' : String(input.phone || '').trim();

  await upsertSubscriber({
    id: existing?.id,
    email,
    name: nextName || undefined,
    phone: nextPhone || undefined,
    source: input.source,
    opted_in: true,
    status: 'active',
    consent_source: `inquiry_form_checkbox:${input.source}`
  });

  return { skipped: false as const };
}

export function hashConfirmToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function newsletterConfirmUrl(token: string) {
  return `${SITE_URL}/newsletter/confirm?token=${encodeURIComponent(token)}`;
}

export type NewsletterSignupOutcome = 'sent' | 'already_active' | 'suppressed' | 'cooldown';

/**
 * Double opt-in step 1. Creates or refreshes a subscriber's confirmation token
 * and emails the link. The caller must answer every outcome identically so the
 * endpoint never reveals whether an address is on the list.
 */
export async function requestNewsletterSignup(input: {
  email: string;
  firstName?: string;
  surface: NewsletterSurface | 'website';
}): Promise<NewsletterSignupOutcome> {
  const supabase = cmsServerClient();
  const email = input.email;
  const { data, error } = await supabase.from('subscribers').select('*').eq('email', email).maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as SubscriberRow | null;

  const now = Date.now();
  if (row && row.status === 'active' && !row.archived_at) return 'already_active';
  if (row && (row.status === 'bounced' || row.status === 'complaint')) return 'suppressed';
  if (
    row?.confirm_sent_at &&
    now - Date.parse(row.confirm_sent_at) < CONFIRM_RESEND_COOLDOWN_MS &&
    row.confirm_token_expires_at &&
    Date.parse(row.confirm_token_expires_at) > now
  ) {
    return 'cooldown';
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashConfirmToken(token);
  const expiresAt = new Date(now + CONFIRM_TOKEN_TTL_MS).toISOString();
  const source = `newsletter_${input.surface}`;

  if (row) {
    // Status is left alone (pending / unsubscribed / archived-active): only the
    // confirm link changes it.
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        confirm_token_hash: tokenHash,
        confirm_token_expires_at: expiresAt,
        confirm_sent_at: null,
        name: row.name || input.firstName || null,
        source: row.status === 'pending' ? source : row.source
      })
      .eq('id', row.id);
    if (updateError) throw new Error(updateError.message);
  } else {
    const { error: insertError } = await supabase.from('subscribers').insert({
      id: randomUUID(),
      email,
      name: input.firstName || null,
      source,
      opted_in: false,
      status: 'pending',
      confirm_token_hash: tokenHash,
      confirm_token_expires_at: expiresAt
    });
    // A concurrent sign-up for the same address already won; treat as sent.
    if (insertError?.code === '23505') return 'cooldown';
    if (insertError) throw new Error(insertError.message);
  }

  try {
    const sent = await sendNewsletterConfirmEmail({
      email,
      confirmUrl: newsletterConfirmUrl(token),
      idempotencyKey: `newsletter-confirm:${tokenHash}`
    });
    await supabase.from('subscribers').update({ confirm_sent_at: new Date().toISOString() }).eq('email', email);
    await logEmailEvent({ email, type: 'sent', meta: { kind: 'newsletter_confirm', source, resend_id: sent.id || null } });
    return 'sent';
  } catch (sendError) {
    const reason = sendError instanceof Error ? sendError.message.slice(0, 200) : 'send_failed';
    await logEmailEvent({ email, type: 'send_failed', meta: { kind: 'newsletter_confirm', source, reason } }).catch(() => undefined);
    throw new NewsletterSendError(reason);
  }
}

export type NewsletterConfirmResult = 'confirmed' | 'already_confirmed' | 'expired' | 'invalid';

/** Double opt-in step 2: the emailed link. */
export async function confirmNewsletterSubscription(token: string): Promise<NewsletterConfirmResult> {
  if (!CONFIRM_TOKEN_PATTERN.test(token)) return 'invalid';

  const supabase = cmsServerClient();
  const tokenHash = hashConfirmToken(token);
  const { data, error } = await supabase.from('subscribers').select('*').eq('confirm_token_hash', tokenHash).maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as SubscriberRow | null;
  if (!row) return 'invalid';

  if (row.status === 'active' && row.confirmed_at && !row.archived_at) return 'already_confirmed';
  if (row.status === 'bounced' || row.status === 'complaint') return 'invalid';
  if (!row.confirm_token_expires_at || Date.parse(row.confirm_token_expires_at) < Date.now()) return 'expired';

  // An unsubscribe that happened after this link was issued wins over the link.
  const issuedAt = Date.parse(row.confirm_token_expires_at) - CONFIRM_TOKEN_TTL_MS;
  if (row.status === 'unsubscribed' && row.unsubscribed_at && Date.parse(row.unsubscribed_at) > issuedAt) return 'invalid';

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('subscribers')
    .update({
      status: 'active',
      opted_in: true,
      confirmed_at: now,
      consent_at: now,
      consent_source: `double_opt_in:${row.source}`,
      unsubscribed_at: null,
      unsubscribe_reason: null,
      archived_at: null,
      archived_by: null
    })
    .eq('id', row.id)
    .eq('confirm_token_hash', tokenHash);
  if (updateError) throw new Error(updateError.message);

  await logEmailEvent({ email: row.email, type: 'subscribed', meta: { kind: 'newsletter_confirm', source: row.source } });
  return 'confirmed';
}
