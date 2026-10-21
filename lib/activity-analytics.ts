import 'server-only';

import { cmsServerClient } from '@/lib/supabase/cmsServer';
import type { Database } from '@/lib/supabase/cms.types';
import { CHANNEL_LABELS, classifySource, type SourceChannel } from '@/lib/source';

type ActivityRow = Database['beyon']['Tables']['activity_events']['Row'];

type RangeDays = 7 | 30 | 90;

const BOT_UA = /bot|crawl|spider|slurp|headlesschrome|lighthouse|google-inspectiontool|chrome-lighthouse|preview/i;

function tally(entries: { channel: SourceChannel; detail: string }[]) {
  const byChannel = new Map<SourceChannel, number>();
  const byDetail = new Map<string, { channel: SourceChannel; detail: string; count: number }>();
  for (const entry of entries) {
    byChannel.set(entry.channel, (byChannel.get(entry.channel) || 0) + 1);
    const key = `${entry.channel}:${entry.detail}`;
    const current = byDetail.get(key) || { ...entry, count: 0 };
    current.count += 1;
    byDetail.set(key, current);
  }
  return {
    channels: [...byChannel.entries()]
      .map(([channel, count]) => ({ channel, label: CHANNEL_LABELS[channel], count }))
      .sort((a, b) => b.count - a.count),
    details: [...byDetail.values()].sort((a, b) => b.count - a.count).slice(0, 15)
  };
}

function normalize(value: string | null | undefined, fallback = 'Unknown') {
  const text = (value || '').trim();
  return text || fallback;
}

export async function getActivityAnalytics(days: RangeDays = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const supabase = cmsServerClient();
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data || []) as ActivityRow[];
  const pageViews = rows.filter((row) => row.event_type === 'page_view');
  const ctaClicks = rows.filter((row) => row.event_type === 'cta_click');
  const formSubmits = rows.filter((row) => row.event_type === 'form_submit');

  const placementInquiries = formSubmits.filter((row) => ['placement', 'community_engagement'].includes((row.form_name || '').toLowerCase())).length;
  const tourRequests = formSubmits.filter((row) => (row.form_name || '').toLowerCase() === 'tour').length;
  const callsClicked = ctaClicks.filter((row) => (row.cta_name || '').toLowerCase() === 'call').length;

  const pageMetrics = new Map<string, { views: number; ctaClicks: number; conversions: number }>();
  for (const row of rows) {
    const path = normalize(row.page_path, '/');
    if (!pageMetrics.has(path)) pageMetrics.set(path, { views: 0, ctaClicks: 0, conversions: 0 });
    const target = pageMetrics.get(path)!;
    if (row.event_type === 'page_view') target.views += 1;
    if (row.event_type === 'cta_click') target.ctaClicks += 1;
    if (row.event_type === 'form_submit') target.conversions += 1;
  }

  const topPages = [...pageMetrics.entries()]
    .map(([page, metrics]) => ({
      page,
      views: metrics.views,
      ctaClicks: metrics.ctaClicks,
      conversions: metrics.conversions,
      conversionRate: metrics.views ? Number(((metrics.conversions / metrics.views) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
  for (const row of pageViews) {
    const device = (row.device || 'unknown').toLowerCase();
    if (device === 'mobile' || device === 'desktop' || device === 'tablet') {
      deviceCounts[device] += 1;
    } else {
      deviceCounts.unknown += 1;
    }
  }
  const totalDevice = pageViews.length || 1;

  const cityMap = new Map<string, { location: string; visits: number; conversions: number }>();
  for (const row of rows) {
    const city = (row.city || '').trim();
    const region = (row.region || '').trim();
    const location = city && region ? `${city}, ${region}` : city || region || 'Unknown';
    if (!cityMap.has(location)) cityMap.set(location, { location, visits: 0, conversions: 0 });
    const target = cityMap.get(location)!;
    if (row.event_type === 'page_view') target.visits += 1;
    if (row.event_type === 'form_submit') target.conversions += 1;
  }
  const topCities = [...cityMap.values()]
    .map((item) => ({
      ...item,
      conversionRate: item.visits ? Number(((item.conversions / item.visits) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 15);

  // A visit's source is its first page view: document.referrer and UTM tags
  // only describe how the session arrived, not later in-site navigation.
  const landings = new Map<string, ActivityRow>();
  for (const row of pageViews) {
    if (BOT_UA.test(row.user_agent || '')) continue;
    const key = row.session_id || row.id;
    if (!landings.has(key)) landings.set(key, row);
  }
  const visitSources = tally([...landings.values()].map((row) => classifySource(row)));

  const { data: leadRows, error: leadError } = await supabase
    .from('leads')
    .select('referrer, utm_source, utm_medium')
    .gte('created_at', since);
  if (leadError) throw new Error(leadError.message);
  const leadSources = tally((leadRows || []).map((row) => classifySource(row)));

  const visits = pageViews.length;
  const conversions = placementInquiries + tourRequests;
  const conversionRate = visits ? Number(((conversions / visits) * 100).toFixed(1)) : 0;

  return {
    rangeDays: days,
    overview: {
      totalVisits: visits,
      placementInquiries,
      tourRequests,
      conversionRate,
      callsClicked
    },
    topPages,
    deviceBreakdown: {
      mobile: Number(((deviceCounts.mobile / totalDevice) * 100).toFixed(1)),
      desktop: Number(((deviceCounts.desktop / totalDevice) * 100).toFixed(1)),
      tablet: Number(((deviceCounts.tablet / totalDevice) * 100).toFixed(1))
    },
    topCities,
    visitSources,
    leadSources
  };
}
