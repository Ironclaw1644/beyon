import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cmsServerClient } from '@/lib/supabase/cmsServer';
import type { Database } from '@/lib/supabase/cms.types';
import type { ActivityEventType } from '@/lib/types';

const ALLOWED_EVENT_TYPES: ActivityEventType[] = ['page_view', 'cta_click', 'form_submit'];

function cleanText(value: unknown, max = 255) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function cleanPath(value: unknown) {
  const text = cleanText(value, 500);
  if (!text) return null;
  if (!text.startsWith('/')) return null;
  return text;
}

function firstHeaderValue(value: string | null) {
  if (!value) return '';
  return value.split(',')[0]?.trim() || '';
}

function getDeviceFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (!ua) return 'unknown';
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

function hashIp(ip: string) {
  if (!ip) return null;
  const salt = process.env.EMAIL_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET || 'beyon';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function geoFromRequest(req: NextRequest) {
  const geo = (req as unknown as { geo?: { city?: string; region?: string; country?: string } }).geo;
  // Vercel percent-encodes the city header ("New%20York").
  const city = safeDecode(firstHeaderValue(req.headers.get('x-vercel-ip-city'))) || geo?.city || '';
  const region = firstHeaderValue(req.headers.get('x-vercel-ip-country-region')) || geo?.region || '';
  const country = firstHeaderValue(req.headers.get('x-vercel-ip-country')) || geo?.country || '';
  return { city, region, country };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const eventType = cleanText(body.event_type, 40) as ActivityEventType | null;
    if (!eventType || !ALLOWED_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    const userAgent = firstHeaderValue(req.headers.get('user-agent'));
    const xff = firstHeaderValue(req.headers.get('x-forwarded-for'));
    const { city, region, country } = geoFromRequest(req);

    const row: Database['beyon']['Tables']['activity_events']['Insert'] = {
      session_id: cleanText(body.session_id, 120),
      event_type: eventType,
      page_path: cleanPath(body.page_path),
      referrer: cleanText(body.referrer, 1000),
      utm_source: cleanText(body.utm_source, 120),
      utm_medium: cleanText(body.utm_medium, 120),
      utm_campaign: cleanText(body.utm_campaign, 160),
      utm_term: cleanText(body.utm_term, 160),
      utm_content: cleanText(body.utm_content, 160),
      device: getDeviceFromUserAgent(userAgent),
      city: cleanText(city, 120),
      region: cleanText(region, 120),
      country: cleanText(country, 120),
      ip_hash: hashIp(xff),
      user_agent: cleanText(userAgent, 1000),
      cta_name: cleanText(body.cta_name, 100),
      form_name: cleanText(body.form_name, 100)
    };

    const supabase = cmsServerClient();
    const { error } = await supabase.from('activity_events').insert(row);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tracking failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
