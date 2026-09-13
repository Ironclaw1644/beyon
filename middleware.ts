import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'beyon_admin_session';
const CANONICAL_HOST = 'beyonvital.com';
const REDIRECT_HOSTS = new Set([`www.${CANONICAL_HOST}`]);

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostHeader = req.headers.get('host') ?? req.nextUrl.host;
  const currentHost = hostHeader.split(':')[0].toLowerCase();
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase() || 'https';

  // Canonicalize only non-canonical hosts and explicit HTTP apex requests.
  const shouldRedirectHost = REDIRECT_HOSTS.has(currentHost);
  const shouldRedirectHttpApex = currentHost === CANONICAL_HOST && proto === 'http';

  if (shouldRedirectHost || shouldRedirectHttpApex) {
    url.protocol = 'https';
    url.host = CANONICAL_HOST;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === '/admin/login') return NextResponse.next();

  const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (sessionCookie) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)']
};
