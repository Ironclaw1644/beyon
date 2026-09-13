import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ADMIN_COOKIE_NAME = 'beyon_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getRequiredEnv(name: 'ADMIN_EMAIL' | 'ADMIN_SESSION_SECRET') {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(data: string) {
  const secret = getRequiredEnv('ADMIN_SESSION_SECRET');
  return createHmac('sha256', secret).update(data).digest('base64url');
}

function verifySignedValue(data: string, signature: string) {
  const expected = sign(data);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createAdminSessionToken(email: string) {
  const payload: AdminSessionPayload = {
    email: normalizeEmail(email),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null): AdminSessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  if (!verifySignedValue(encoded, signature)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encoded)) as AdminSessionPayload;
    if (!parsed.email || !parsed.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: normalizeEmail(parsed.email), exp: parsed.exp };
  } catch {
    return null;
  }
}

export function isConfiguredAdminEmail(email: string) {
  const adminEmail = normalizeEmail(getRequiredEnv('ADMIN_EMAIL'));
  return normalizeEmail(email) === adminEmail;
}

export async function verifyAdminPassword(password: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (hash) {
    return bcrypt.compare(password, hash);
  }

  const plain = process.env.ADMIN_PASSWORD;
  if (plain && process.env.NODE_ENV !== 'production') {
    const left = Buffer.from(password);
    const right = Buffer.from(plain);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }

  return false;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login?error=session');
  return session;
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  };
}
