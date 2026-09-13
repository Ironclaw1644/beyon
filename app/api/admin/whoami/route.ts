import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth/admin';

export const runtime = 'nodejs';

function getProvidedDebugToken(req: Request) {
  const headerToken = req.headers.get('x-debug-token');
  if (headerToken?.trim()) return headerToken.trim();
  const url = new URL(req.url);
  const queryToken = url.searchParams.get('token');
  return queryToken?.trim() || '';
}

export async function GET(req: Request) {
  const expectedToken = process.env.DEBUG_TOKEN?.trim();
  if (!expectedToken) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const providedToken = getProvidedDebugToken(req);
  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value || '';
  const session = verifyAdminSessionToken(cookieValue);
  const hasAuthCookie = Boolean(cookieValue);
  const allowlistParsed = (process.env.ADMIN_ALLOWLIST || '')
    .split(/[\n\r,]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const hasAllowlistEnv = Boolean(process.env.ADMIN_ALLOWLIST && process.env.ADMIN_ALLOWLIST.trim());

  let authResult: 'authorized' | 'unauthorized' = 'unauthorized';
  let reason = 'Missing auth cookie';

  if (!hasAuthCookie) {
    reason = `Cookie ${ADMIN_COOKIE_NAME} is missing`;
  } else if (!session) {
    reason = 'Session cookie failed signature or expiration checks';
  } else {
    authResult = 'authorized';
    reason = 'Session cookie is valid';
  }

  return NextResponse.json({
    hasAllowlistEnv,
    allowlistParsed,
    allowlistCount: allowlistParsed.length,
    cookieName: ADMIN_COOKIE_NAME,
    hasAuthCookie,
    authResult,
    reason,
    runtime: 'nodejs' as const
  });
}
