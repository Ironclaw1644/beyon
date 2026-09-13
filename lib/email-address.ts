// Email normalization and light validation for list sign-ups. Deliberately
// small: it catches typos and throwaway addresses that hurt a new sending
// domain, not every possible bad address.

const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

const TYPO_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlook.con': 'outlook.com',
  'icloud.con': 'icloud.com',
  'aol.con': 'aol.com'
};

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'sharklasers.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc',
  'throwawaymail.com'
]);

const UNREACHABLE_LOCAL_PARTS = new Set(['noreply', 'no-reply', 'donotreply', 'do-not-reply', 'postmaster', 'mailer-daemon', 'abuse']);

export type EmailCheck = { ok: true; email: string } | { ok: false; error: string };

export function normalizeEmail(raw: unknown) {
  return String(raw ?? '').trim().toLowerCase();
}

export function checkEmailAddress(raw: unknown): EmailCheck {
  const email = normalizeEmail(raw);
  if (!email) return { ok: false, error: 'Please enter your email address.' };

  const invalid = { ok: false as const, error: 'Please enter a valid email address.' };
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return invalid;

  const at = email.lastIndexOf('@');
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return invalid;

  const suggestion = TYPO_DOMAINS[domain];
  if (suggestion) return { ok: false, error: `Please double-check your email address. Did you mean ${local}@${suggestion}?` };
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, error: 'Please use a permanent email address so our updates reach you.' };
  if (UNREACHABLE_LOCAL_PARTS.has(local)) return { ok: false, error: 'Please use an email address you read.' };

  return { ok: true, email };
}
