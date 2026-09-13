import 'server-only';

import { randomUUID } from 'crypto';
import { cmsServerClient } from '@/lib/supabase/cmsServer';
import type { Database } from '@/lib/supabase/cms.types';
import type { Announcement, LeadNote, LocalLead, Subscriber } from '@/lib/types';

type CmsTables = Database['beyon']['Tables'];

type DbShape = {
  announcements: Announcement[];
  subscribers: Subscriber[];
  leadNotes: LeadNote[];
};

const seedGuards = new Map<keyof DbShape, Promise<void>>();
const SUPPRESSED_STATUSES = new Set<Subscriber['status']>(['unsubscribed', 'bounced', 'complaint']);

function nowIso() {
  return new Date().toISOString();
}

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function mapAnnouncement(row: CmsTables['announcements']['Row']): Announcement {
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

function mapSubscriber(row: CmsTables['subscribers']['Row']): Subscriber {
  const status = (row.status || (row.opted_in ? 'active' : 'unsubscribed')) as Subscriber['status'];
  return {
    id: row.id,
    email: row.email,
    name: row.name || undefined,
    phone: row.phone || undefined,
    source: row.source,
    opted_in: status === 'active',
    status,
    unsubscribed_at: row.unsubscribed_at || undefined,
    bounced_at: row.bounced_at || undefined,
    complaint_at: row.complaint_at || undefined,
    unsubscribe_reason: row.unsubscribe_reason || undefined,
    archived_at: row.archived_at || undefined,
    archived_by: row.archived_by || undefined,
    created_at: row.created_at,
  };
}

function mapLeadNote(row: CmsTables['lead_notes']['Row']): LeadNote {
  return {
    id: row.id,
    leadId: row.lead_id,
    note: row.note,
    created_at: row.created_at
  };
}

function mapLocalLead(row: CmsTables['leads']['Row']): LocalLead {
  return {
    id: row.id,
    created_at: row.created_at,
    contact_name: row.contact_name || '',
    contact_email: row.contact_email || '',
    contact_phone: row.contact_phone || '',
    company_name: row.company_name || '',
    message: row.message || '',
    page_path: row.page_path || undefined,
    utm_source: row.utm_source || undefined,
    utm_medium: row.utm_medium || undefined,
    utm_campaign: row.utm_campaign || undefined,
    utm_term: row.utm_term || undefined,
    utm_content: row.utm_content || undefined,
    referrer: row.referrer || undefined,
    lead_type: row.lead_type || undefined,
    status: row.status || 'new',
    forwarded_to_leadops: row.forwarded_to_leadops,
    leadops_forwarded_at: row.leadops_forwarded_at || undefined,
    leadops_error: row.leadops_error || undefined,
    confirmation_sent_at: row.confirmation_sent_at || undefined,
    followup_sent_at: row.followup_sent_at || undefined,
    last_email_error: row.last_email_error || undefined,
    admin_notified_at: row.admin_notified_at || undefined,
    admin_notify_error: row.admin_notify_error || undefined,
    archived_at: row.archived_at || undefined,
    archived_by: row.archived_by || undefined
  };
}

function seedDefaults() {
  // No default rows: announcements are written by admins only, so nothing
  // unverified is ever published automatically.
  return {
    announcements: [] as Announcement[]
  };
}

async function ensureSeeded(key: keyof DbShape) {
  if (key === 'subscribers' || key === 'leadNotes') return;
  if (seedGuards.has(key)) return seedGuards.get(key)!;

  const promise = (async () => {
    const supabase = cmsServerClient();
    const seeds = seedDefaults();

    if (key === 'announcements') {
      const { data, error } = await supabase.from('announcements').select('id').limit(1);
      assertNoError(error);
      if (!data?.length && seeds.announcements.length) {
        const rows: CmsTables['announcements']['Insert'][] = seeds.announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          active: a.active,
          start_date: a.start_date || null,
          end_date: a.end_date || null,
          target_pages: a.target_pages,
          priority: a.priority,
          created_at: a.created_at,
          updated_at: a.updated_at
        }));
        const inserted = await supabase.from('announcements').insert(rows);
        assertNoError(inserted.error);
      }
      return;
    }

  })().finally(() => {
    seedGuards.delete(key);
  });

  seedGuards.set(key, promise);
  return promise;
}

export async function dbGet<K extends keyof DbShape>(key: K): Promise<DbShape[K]> {
  await ensureSeeded(key);
  const supabase = cmsServerClient();

  if (key === 'announcements') {
    const { data, error } = await supabase.from('announcements').select('*').order('priority', { ascending: true }).order('created_at', { ascending: false });
    assertNoError(error);
    return ((data as CmsTables['announcements']['Row'][] | null) || []).map(mapAnnouncement) as DbShape[K];
  }

  if (key === 'subscribers') {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false });
    assertNoError(error);
    return ((data as CmsTables['subscribers']['Row'][] | null) || []).map(mapSubscriber) as DbShape[K];
  }

  const { data, error } = await supabase.from('lead_notes').select('*').order('created_at', { ascending: false });
  assertNoError(error);
  return ((data as CmsTables['lead_notes']['Row'][] | null) || []).map(mapLeadNote) as DbShape[K];
}

export async function upsertAnnouncement(input: Partial<Announcement> & Pick<Announcement, 'title' | 'body'>) {
  const supabase = cmsServerClient();
  const now = nowIso();
  let createdAt = now;

  if (input.id) {
    const { data, error } = await supabase.from('announcements').select('created_at').eq('id', input.id).maybeSingle();
    assertNoError(error);
    createdAt = data?.created_at || now;
  }

  const row: CmsTables['announcements']['Insert'] = {
    id: input.id || randomUUID(),
    title: input.title,
    body: input.body,
    active: Boolean(input.active),
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    target_pages: Array.isArray(input.target_pages) ? input.target_pages : [],
    priority: Number(input.priority || 0),
    created_at: createdAt,
    updated_at: now
  };

  const { data, error } = await supabase.from('announcements').upsert(row, { onConflict: 'id' }).select('*').single();
  assertNoError(error);
  return mapAnnouncement(data as CmsTables['announcements']['Row']);
}

export async function deleteAnnouncement(id: string) {
  const supabase = cmsServerClient();
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  assertNoError(error);
}

export async function upsertSubscriber(input: {
  id?: string;
  email: string;
  name?: string;
  phone?: string;
  source: string;
  opted_in?: boolean;
  status?: Subscriber['status'];
  forceResubscribe?: boolean;
  unsubscribe_reason?: string;
}) {
  const supabase = cmsServerClient();
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error('Subscriber email is required');
  const now = nowIso();

  let createdAt = now;
  const existing = await supabase
    .from('subscribers')
    .select('id, created_at, status, unsubscribed_at, bounced_at, complaint_at, unsubscribe_reason, name, phone')
    .eq('email', email)
    .maybeSingle();
  assertNoError(existing.error);
  if (existing.data?.created_at) createdAt = existing.data.created_at;
  const existingStatus = (existing.data?.status || null) as Subscriber['status'] | null;
  const isSuppressed = existingStatus ? SUPPRESSED_STATUSES.has(existingStatus) : false;

  const requestedStatus =
    input.status || (input.opted_in === false ? 'unsubscribed' : 'active');
  const nextStatus = isSuppressed && !input.forceResubscribe ? existingStatus! : requestedStatus;

  const row: CmsTables['subscribers']['Insert'] = {
    id: existing.data?.id || input.id || randomUUID(),
    email,
    name: input.name?.trim() || existing.data?.name || null,
    phone: input.phone?.trim() || existing.data?.phone || null,
    source: input.source,
    opted_in: nextStatus === 'active',
    status: nextStatus,
    unsubscribed_at:
      nextStatus === 'unsubscribed'
        ? existing.data?.unsubscribed_at || now
        : null,
    bounced_at:
      nextStatus === 'bounced'
        ? existing.data?.bounced_at || now
        : null,
    complaint_at:
      nextStatus === 'complaint'
        ? existing.data?.complaint_at || now
        : null,
    unsubscribe_reason:
      nextStatus === 'unsubscribed'
        ? input.unsubscribe_reason || existing.data?.unsubscribe_reason || null
        : null,
    created_at: createdAt,
    updated_at: now
  };

  const { data, error } = await supabase.from('subscribers').upsert(row, { onConflict: 'email' }).select('*').single();
  assertNoError(error);
  return mapSubscriber(data as CmsTables['subscribers']['Row']);
}

export async function getSubscriberByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const supabase = cmsServerClient();
  const { data, error } = await supabase.from('subscribers').select('*').eq('email', normalized).maybeSingle();
  assertNoError(error);
  return data ? mapSubscriber(data as CmsTables['subscribers']['Row']) : null;
}

export async function updateSubscriberStatusById(id: string, status: Subscriber['status'], options?: { reason?: string; forceResubscribe?: boolean }) {
  const supabase = cmsServerClient();
  const { data, error } = await supabase.from('subscribers').select('*').eq('id', id).maybeSingle();
  assertNoError(error);
  if (!data) throw new Error('Subscriber not found');
  const row = mapSubscriber(data as CmsTables['subscribers']['Row']);

  if (SUPPRESSED_STATUSES.has(row.status) && status === 'active' && !options?.forceResubscribe) {
    throw new Error('Subscriber is suppressed. Use forceResubscribe to reactivate.');
  }

  return upsertSubscriber({
    id: row.id,
    email: row.email,
    name: row.name,
    source: row.source,
    status,
    forceResubscribe: options?.forceResubscribe,
    unsubscribe_reason: options?.reason
  });
}

export async function updateSubscriberStatusByEmail(email: string, status: Subscriber['status'], options?: { reason?: string; forceResubscribe?: boolean }) {
  const existing = await getSubscriberByEmail(email);
  if (!existing) {
    return upsertSubscriber({
      email,
      name: '',
      source: 'webhook',
      status,
      opted_in: status === 'active',
      forceResubscribe: options?.forceResubscribe,
      unsubscribe_reason: options?.reason
    });
  }
  return updateSubscriberStatusById(existing.id, status, options);
}

export async function addLeadNote(leadId: string, note: string) {
  const supabase = cmsServerClient();
  const now = nowIso();
  const row: CmsTables['lead_notes']['Insert'] = {
    id: randomUUID(),
    lead_id: leadId,
    note,
    created_at: now,
    updated_at: now
  };
  const { data, error } = await supabase.from('lead_notes').insert(row).select('*').single();
  assertNoError(error);
  return mapLeadNote(data as CmsTables['lead_notes']['Row']);
}

export async function getLeadNotesByLeadId(leadId: string) {
  const supabase = cmsServerClient();
  const { data, error } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  assertNoError(error);
  return ((data as CmsTables['lead_notes']['Row'][] | null) || []).map(mapLeadNote);
}

export async function updateLeadNote(id: string, note: string) {
  const supabase = cmsServerClient();
  const { data, error } = await supabase.from('lead_notes').update({ note, updated_at: nowIso() }).eq('id', id).select('*').single();
  assertNoError(error);
  return mapLeadNote(data as CmsTables['lead_notes']['Row']);
}

export async function deleteLeadNote(id: string) {
  const supabase = cmsServerClient();
  const { error } = await supabase.from('lead_notes').delete().eq('id', id);
  assertNoError(error);
}

export async function insertLocalLead(
  input: Pick<LocalLead, 'contact_name' | 'contact_email' | 'contact_phone' | 'company_name' | 'message'> & {
    page_path?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    referrer?: string;
    lead_type?: string;
    status?: string;
  }
) {
  const supabase = cmsServerClient();
  const row: CmsTables['leads']['Insert'] = {
    contact_name: input.contact_name || null,
    contact_email: input.contact_email || null,
    contact_phone: input.contact_phone || null,
    company_name: input.company_name || null,
    message: input.message || null,
    page_path: input.page_path || null,
    utm_source: input.utm_source || null,
    utm_medium: input.utm_medium || null,
    utm_campaign: input.utm_campaign || null,
    utm_term: input.utm_term || null,
    utm_content: input.utm_content || null,
    referrer: input.referrer || null,
    lead_type: input.lead_type || null,
    status: input.status || 'new'
  };
  const { data, error } = await supabase.from('leads').insert(row).select('*').single();
  assertNoError(error);
  return mapLocalLead(data as CmsTables['leads']['Row']);
}

export async function markLeadForwarded(id: string) {
  const supabase = cmsServerClient();
  const { error } = await supabase
    .from('leads')
    .update({ forwarded_to_leadops: true, leadops_forwarded_at: nowIso(), leadops_error: null })
    .eq('id', id);
  assertNoError(error);
}

export async function markLeadForwardError(id: string, message: string) {
  const supabase = cmsServerClient();
  const safeMessage = message.slice(0, 1000);
  const { error } = await supabase
    .from('leads')
    .update({ forwarded_to_leadops: false, leadops_error: safeMessage })
    .eq('id', id);
  assertNoError(error);
}

export async function updateLocalLead(id: string, patch: { status?: string; lead_type?: string }) {
  const supabase = cmsServerClient();
  const update: CmsTables['leads']['Update'] = {};
  if (typeof patch.status === 'string' && patch.status.trim()) update.status = patch.status.trim();
  if (typeof patch.lead_type === 'string') update.lead_type = patch.lead_type.trim() || null;
  const { data, error } = await supabase.from('leads').update(update).eq('id', id).select('*').single();
  assertNoError(error);
  return mapLocalLead(data as CmsTables['leads']['Row']);
}

export async function getLocalLeadById(id: string) {
  const supabase = cmsServerClient();
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
  assertNoError(error);
  return data ? mapLocalLead(data as CmsTables['leads']['Row']) : null;
}

export async function markLeadEmailSent(id: string, type: 'confirmation' | 'followup') {
  const supabase = cmsServerClient();
  const patch: CmsTables['leads']['Update'] =
    type === 'confirmation'
      ? { confirmation_sent_at: nowIso(), last_email_error: null }
      : { followup_sent_at: nowIso(), last_email_error: null };
  const { error } = await supabase.from('leads').update(patch).eq('id', id);
  assertNoError(error);
}

export async function markLeadEmailError(id: string, message: string) {
  const supabase = cmsServerClient();
  const safeMessage = message.slice(0, 1000);
  const { error } = await supabase.from('leads').update({ last_email_error: safeMessage }).eq('id', id);
  assertNoError(error);
}

export async function markLeadAdminNotified(id: string) {
  const supabase = cmsServerClient();
  const { error } = await supabase
    .from('leads')
    .update({ admin_notified_at: nowIso(), admin_notify_error: null })
    .eq('id', id);
  assertNoError(error);
}

export async function markLeadAdminNotifyError(id: string, message: string) {
  const supabase = cmsServerClient();
  const safeMessage = message.slice(0, 1000);
  const { error } = await supabase
    .from('leads')
    .update({ admin_notify_error: safeMessage })
    .eq('id', id);
  assertNoError(error);
}

export async function archiveLocalLead(id: string, archivedBy?: string) {
  const supabase = cmsServerClient();
  const { error } = await supabase
    .from('leads')
    .update({ archived_at: nowIso(), archived_by: archivedBy?.trim() || null })
    .eq('id', id)
    .is('archived_at', null);
  assertNoError(error);
}

export async function restoreLocalLead(id: string) {
  const supabase = cmsServerClient();
  const { error } = await supabase
    .from('leads')
    .update({ archived_at: null, archived_by: null })
    .eq('id', id);
  assertNoError(error);
}

export async function getLocalLeads(params: {
  q?: string;
  status?: string;
  lead_type?: string;
  fromDays?: number;
  page?: number;
  pageSize?: number;
  archived?: 'active' | 'archived' | 'all';
}) {
  const supabase = cmsServerClient();
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize || 20)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('leads').select('*', { count: 'exact' });
  if (params.archived === 'archived') query = query.not('archived_at', 'is', null);
  else if (params.archived !== 'all') query = query.is('archived_at', null);
  if (params.status) query = query.eq('status', params.status);
  if (params.lead_type) query = query.eq('lead_type', params.lead_type);
  if (params.fromDays && params.fromDays > 0) {
    const fromDate = new Date(Date.now() - params.fromDays * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', fromDate);
  }
  if (params.q) {
    const q = params.q.replace(/['"%_,]/g, ' ').trim();
    if (q) {
      query = query.or(`contact_name.ilike.%${q}%,contact_email.ilike.%${q}%,message.ilike.%${q}%`);
    }
  }

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
  assertNoError(error);
  const rows = ((data as CmsTables['leads']['Row'][] | null) || []).map(mapLocalLead);
  const ids = rows.map((row) => row.id);

  let noteCounts = new Map<string, number>();
  if (ids.length) {
    const notesRes = await supabase.from('lead_notes').select('lead_id').in('lead_id', ids);
    assertNoError(notesRes.error);
    noteCounts = new Map<string, number>();
    for (const note of (notesRes.data || []) as Array<{ lead_id: string }>) {
      noteCounts.set(note.lead_id, (noteCounts.get(note.lead_id) || 0) + 1);
    }
  }

  return {
    rows: rows.map((row) => ({ ...row, notes_count: noteCounts.get(row.id) || 0 })),
    total: count || 0,
    page,
    pageSize
  };
}

export async function exportLocalLeads() {
  const supabase = cmsServerClient();
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  assertNoError(error);
  const rows = ((data as CmsTables['leads']['Row'][] | null) || []).map(mapLocalLead);

  const ids = rows.map((row) => row.id);
  let noteCounts = new Map<string, number>();
  if (ids.length) {
    const notesRes = await supabase.from('lead_notes').select('lead_id').in('lead_id', ids);
    assertNoError(notesRes.error);
    for (const note of (notesRes.data || []) as Array<{ lead_id: string }>) {
      noteCounts.set(note.lead_id, (noteCounts.get(note.lead_id) || 0) + 1);
    }
  }

  return rows.map((row) => ({ ...row, notes_count: noteCounts.get(row.id) || 0 }));
}

export async function logEmailEvent(input: { email: string; type: string; meta?: Record<string, unknown> }) {
  const email = input.email.trim().toLowerCase();
  if (!email) return;
  const supabase = cmsServerClient();
  const { error } = await supabase.from('email_events').insert({
    email,
    type: input.type,
    meta: (input.meta || {}) as any
  });
  assertNoError(error);
}

export async function listSubscribersForBlast(source?: string) {
  const supabase = cmsServerClient();
  let query = supabase
    .from('subscribers')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  if (source) query = query.eq('source', source);
  const { data, error } = await query;
  assertNoError(error);
  return ((data as CmsTables['subscribers']['Row'][] | null) || []).map(mapSubscriber);
}

export async function listSubscribers(params?: { archived?: 'active' | 'archived' | 'all' }) {
  const mode = params?.archived || 'active';
  const supabase = cmsServerClient();
  let query = supabase.from('subscribers').select('*').order('created_at', { ascending: false });
  if (mode === 'archived') query = query.not('archived_at', 'is', null);
  else if (mode !== 'all') query = query.is('archived_at', null);
  const { data, error } = await query;
  assertNoError(error);
  return ((data as CmsTables['subscribers']['Row'][] | null) || []).map(mapSubscriber);
}

export async function archiveSubscriber(id: string, archivedBy?: string) {
  const supabase = cmsServerClient();
  const { error } = await supabase
    .from('subscribers')
    .update({ archived_at: nowIso(), archived_by: archivedBy?.trim() || null })
    .eq('id', id)
    .is('archived_at', null);
  assertNoError(error);
}

export async function restoreSubscriber(id: string) {
  const supabase = cmsServerClient();
  const { error } = await supabase
    .from('subscribers')
    .update({ archived_at: null, archived_by: null })
    .eq('id', id);
  assertNoError(error);
}

export async function purgeArchivedOlderThan(days = 30) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const supabase = cmsServerClient();

  const leadsRes = await supabase
    .from('leads')
    .delete({ count: 'exact' })
    .lt('archived_at', cutoff)
    .not('archived_at', 'is', null);
  assertNoError(leadsRes.error);

  const subscribersRes = await supabase
    .from('subscribers')
    .delete({ count: 'exact' })
    .lt('archived_at', cutoff)
    .not('archived_at', 'is', null);
  assertNoError(subscribersRes.error);

  return {
    leadsDeleted: leadsRes.count || 0,
    subscribersDeleted: subscribersRes.count || 0,
    cutoff
  };
}

export async function listEmailCampaigns(limit = 20) {
  const supabase = cmsServerClient();
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  assertNoError(error);
  return (data || []) as CmsTables['email_campaigns']['Row'][];
}

export async function getEmailCampaignByIdempotencyKey(idempotencyKey: string) {
  const supabase = cmsServerClient();
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  assertNoError(error);
  return (data || null) as CmsTables['email_campaigns']['Row'] | null;
}

export async function createEmailCampaign(input: {
  subject: string;
  previewText?: string;
  body: string;
  audienceSource?: string;
  idempotencyKey: string;
}) {
  const supabase = cmsServerClient();
  const existing = await getEmailCampaignByIdempotencyKey(input.idempotencyKey);
  if (existing) return existing;

  const row: CmsTables['email_campaigns']['Insert'] = {
    subject: input.subject,
    preview_text: input.previewText || null,
    body: input.body,
    audience_source: input.audienceSource || null,
    idempotency_key: input.idempotencyKey,
    status: 'sending',
    total_recipients: 0,
    sent_count: 0,
    skipped_count: 0,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  const { data, error } = await supabase.from('email_campaigns').insert(row).select('*').single();
  assertNoError(error);
  return data as CmsTables['email_campaigns']['Row'];
}

export async function recordEmailCampaignRecipient(input: {
  campaignId: string;
  email: string;
  status: 'sent' | 'skipped';
  reason?: string;
}) {
  const supabase = cmsServerClient();
  const { error } = await supabase.from('email_campaign_recipients').upsert(
    {
      campaign_id: input.campaignId,
      email: input.email.trim().toLowerCase(),
      status: input.status,
      reason: input.reason || null,
      sent_at: input.status === 'sent' ? nowIso() : null,
      created_at: nowIso()
    },
    { onConflict: 'campaign_id,email' }
  );
  assertNoError(error);
}

export async function finalizeEmailCampaign(input: {
  campaignId: string;
  status: 'sent' | 'failed';
  totalRecipients: number;
  sentCount: number;
  skippedCount: number;
}) {
  const supabase = cmsServerClient();
  const { error } = await supabase
    .from('email_campaigns')
    .update({
      status: input.status,
      total_recipients: input.totalRecipients,
      sent_count: input.sentCount,
      skipped_count: input.skippedCount,
      sent_at: input.status === 'sent' ? nowIso() : null,
      updated_at: nowIso()
    })
    .eq('id', input.campaignId);
  assertNoError(error);
}

export async function listCampaignRecipientEmails(campaignId: string, status: 'sent' | 'skipped') {
  const supabase = cmsServerClient();
  const { data, error } = await supabase
    .from('email_campaign_recipients')
    .select('email')
    .eq('campaign_id', campaignId)
    .eq('status', status);
  assertNoError(error);
  return ((data || []) as Array<{ email: string }>).map((row) => row.email.toLowerCase());
}
