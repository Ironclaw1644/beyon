import 'server-only';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Plain-text part. Always sent; derived from the HTML when omitted. */
  text?: string;
  from?: string;
  replyTo?: string;
  /** Extra MIME headers, e.g. List-Unsubscribe for bulk mail. */
  headers?: Record<string, string>;
  /** Forwarded as Resend's Idempotency-Key so a retried send is not delivered twice. */
  idempotencyKey?: string;
};

export class ResendSendError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function requiredEnv(name: 'RESEND_API_KEY' | 'RESEND_FROM') {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function getMissingResendEnvVars() {
  const required = ['RESEND_API_KEY', 'RESEND_FROM'] as const;
  return required.filter((name) => !process.env[name]?.trim());
}

export function normalizeResendFrom(raw: string) {
  const trimmed = raw.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  return unquoted;
}

export function isValidResendFrom(value: string) {
  const plainEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameAddress = /^[^<>]+<\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*>$/;
  return plainEmail.test(value) || nameAddress.test(value);
}

export function resolveResendFrom() {
  const value = normalizeResendFrom(requiredEnv('RESEND_FROM'));
  if (!isValidResendFrom(value)) {
    throw new Error('Invalid RESEND_FROM format. Use "Name <email@domain>" or "email@domain" without wrapping quotes.');
  }
  return value;
}

export function htmlToText(input: string) {
  return input
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendResendEmail(input: SendEmailInput, options: { maxRetries?: number } = {}) {
  const apiKey = requiredEnv('RESEND_API_KEY');
  const from = normalizeResendFrom(input.from || resolveResendFrom());
  if (!isValidResendFrom(from)) {
    throw new Error('Invalid RESEND_FROM format. Use "Name <email@domain>" or "email@domain" without wrapping quotes.');
  }

  const payload = JSON.stringify({
    from,
    to: [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text?.trim() || htmlToText(input.html),
    reply_to: input.replyTo || undefined,
    headers: input.headers && Object.keys(input.headers).length ? input.headers : undefined
  });

  const maxRetries = options.maxRetries ?? 2;
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey.slice(0, 256) } : {})
      },
      body: payload
    });

    const body = await res.json().catch(() => ({}));
    if (res.ok) return body as { id?: string };

    // Back off on rate limits and transient server errors; the idempotency key
    // makes the retry safe.
    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1));
      continue;
    }

    const message = typeof body?.message === 'string' ? body.message : `Resend send failed (${res.status})`;
    throw new ResendSendError(message, res.status, body);
  }
}
