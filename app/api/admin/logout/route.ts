import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, adminSessionCookieOptions } from '@/lib/auth/admin';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, '', {
    ...adminSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0)
  });
  return NextResponse.json({ ok: true });
}
