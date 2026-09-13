import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import {
  ADMIN_COOKIE_NAME,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isConfiguredAdminEmail,
  verifyAdminPassword
} from '@/lib/auth/admin';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional()
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(fallback: string) {
  const forwarded = fallback.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

function rateLimitKey(email: string, ip: string) {
  return `${email.toLowerCase()}|${ip}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function bumpAttempts(key: string) {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  record.count += 1;
  attempts.set(key, record);
}

function clearAttempts(key: string) {
  attempts.delete(key);
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email and password.' }, { status: 400 });
    }

    const { email, password, next } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const headerStore = await headers();
    const ip = getClientIp(headerStore.get('x-forwarded-for') || '');
    const limiterKey = rateLimitKey(normalizedEmail, ip);

    if (isRateLimited(limiterKey)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again shortly.' }, { status: 429 });
    }

    const emailMatches = isConfiguredAdminEmail(normalizedEmail);
    const passwordMatches = emailMatches ? await verifyAdminPassword(password) : false;

    if (!emailMatches || !passwordMatches) {
      bumpAttempts(limiterKey);
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    clearAttempts(limiterKey);
    const token = createAdminSessionToken(normalizedEmail);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, adminSessionCookieOptions());

    const safeNext = next && next.startsWith('/admin') ? next : '/admin';
    return NextResponse.json({ ok: true, next: safeNext });
  } catch {
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }
}
