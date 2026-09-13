import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

type EmailTokenPayload = {
  email: string;
  purpose: 'unsubscribe';
  iat: number;
  exp: number;
};

function getSecret() {
  const secret = process.env.EMAIL_TOKEN_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) throw new Error('EMAIL_TOKEN_SECRET or ADMIN_SESSION_SECRET is required');
  return secret;
}

function signPayload(payload: string) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createEmailToken(email: string, ttlSeconds = 60 * 60 * 24 * 30) {
  const now = Math.floor(Date.now() / 1000);
  const payload: EmailTokenPayload = {
    email: email.trim().toLowerCase(),
    purpose: 'unsubscribe',
    iat: now,
    exp: now + ttlSeconds
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

export function verifyEmailToken(token: string) {
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) throw new Error('Invalid token format');
  const expected = signPayload(encoded);
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as EmailTokenPayload;
  if (!payload.email || payload.purpose !== 'unsubscribe') throw new Error('Invalid token payload');
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}
