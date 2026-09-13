import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { cmsServerClient } from '@/lib/supabase/cmsServer';
import type { Announcement } from '@/lib/types';

type GetAnnouncementsOptions = {
  currentPath?: string;
  limit?: number;
};

function mapAnnouncement(row: {
  id: string;
  title: string;
  body: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  target_pages: string[] | null;
  priority: number | null;
  created_at: string;
  updated_at: string;
}): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    active: row.active,
    start_date: row.start_date || '',
    end_date: row.end_date || '',
    target_pages: row.target_pages || [],
    priority: row.priority || 0,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function getAnnouncements(options: GetAnnouncementsOptions = {}) {
  noStore();

  // Announcements are optional page content: if the CMS is unreachable (missing
  // env, schema not exposed yet), render the page without them instead of a 500.
  let data: unknown[] | null = null;
  try {
    const supabase = cmsServerClient();
    const result = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (result.error) throw new Error(result.error.message);
    data = result.data;
  } catch (error) {
    console.error('announcements.load_failed', { message: error instanceof Error ? error.message : String(error) });
    return [];
  }

  const now = new Date();
  const currentPath = options.currentPath;
  const announcements = ((data || []) as Array<{
    id: string;
    title: string;
    body: string;
    active: boolean;
    start_date: string | null;
    end_date: string | null;
    target_pages: string[] | null;
    priority: number | null;
    created_at: string;
    updated_at: string;
  }>)
    .map(mapAnnouncement)
    .filter((item) => item.active)
    .filter((item) => !item.start_date || new Date(item.start_date) <= now)
    .filter((item) => !item.end_date || new Date(item.end_date) >= now)
    .filter((item) => !currentPath || item.target_pages.length === 0 || item.target_pages.includes(currentPath));

  if (options.limit && options.limit > 0) {
    return announcements.slice(0, options.limit);
  }

  return announcements;
}
