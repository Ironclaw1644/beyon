import 'server-only';

import { getSubscriberByEmail, upsertSubscriber } from '@/lib/storage';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type LeadOptInInput = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  source: string;
};

export async function upsertSubscriberFromLeadOptIn(input: LeadOptInInput) {
  const email = String(input.email || '').trim().toLowerCase();
  if (!email || !isValidEmail(email)) return { skipped: true as const, reason: 'invalid_email' as const };

  const existing = await getSubscriberByEmail(email);
  if (existing && existing.status !== 'active') {
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
    status: 'active'
  });

  return { skipped: false as const };
}
