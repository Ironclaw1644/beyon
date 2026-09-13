'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { Announcement, LocalLead, Subscriber } from '@/lib/types';
import { Badge, Button, Card } from '@/components/ui';
import { AdminInbox } from '@/components/admin-inbox';
import { stripMetaBlock } from '@/lib/forms';

type LeadRecord = LocalLead & { _notes?: { id: string; note: string; created_at: string }[] };

type InitialState = {
  announcements: Announcement[];
  subscribers: Subscriber[];
};

type ActivityData = {
  rangeDays: 7 | 30 | 90;
  overview: {
    totalVisits: number;
    placementInquiries: number;
    tourRequests: number;
    conversionRate: number;
    callsClicked: number;
  };
  topPages: Array<{
    page: string;
    views: number;
    ctaClicks: number;
    conversions: number;
    conversionRate: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  topCities: Array<{
    location: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>;
};

type EmailCampaign = {
  id: string;
  subject: string;
  preview_text: string | null;
  audience_source: string | null;
  status: string;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  skipped_count: number;
  created_at: string;
};

const tabs = ['leads', 'inbox', 'announcements', 'subscribers', 'activity', 'email'] as const;
type Tab = (typeof tabs)[number];

export function AdminDashboard({
  adminEmail,
  initial,
  initialLoadError
}: {
  adminEmail: string;
  initial: InitialState;
  initialLoadError?: string;
}) {
  const [tab, setTab] = useState<Tab>('leads');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [leadTypeFilter, setLeadTypeFilter] = useState('');
  const [leadListMode, setLeadListMode] = useState<'active' | 'archived'>('active');
  const [mobileLeadFiltersOpen, setMobileLeadFiltersOpen] = useState(false);
  const [mobileLeadView, setMobileLeadView] = useState<'list' | 'detail'>('list');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [announcements, setAnnouncements] = useState(initial.announcements);
  const [subscribers, setSubscribers] = useState(initial.subscribers);
  const [subscriberListMode, setSubscriberListMode] = useState<'active' | 'archived'>('active');
  const [leadNoteDraft, setLeadNoteDraft] = useState('');
  const [loadingLeadNotes, setLoadingLeadNotes] = useState(false);
  const [leadNoteMessage, setLeadNoteMessage] = useState<string | null>(null);
  const [leadNoteError, setLeadNoteError] = useState<string | null>(null);
  const [sendingLeadEmailType, setSendingLeadEmailType] = useState<'confirmation' | 'followup' | null>(null);
  const [leadEmailMessage, setLeadEmailMessage] = useState<string | null>(null);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [emailComposerType, setEmailComposerType] = useState<'confirmation' | 'followup'>('confirmation');
  const [emailComposerSubject, setEmailComposerSubject] = useState('');
  const [emailComposerBody, setEmailComposerBody] = useState('');
  const [emailComposerPreviewHtml, setEmailComposerPreviewHtml] = useState('');
  const [emailComposerTab, setEmailComposerTab] = useState<'compose' | 'preview'>('compose');
  const [emailComposerLoadingPreview, setEmailComposerLoadingPreview] = useState(false);
  const [emailComposerSendAgain, setEmailComposerSendAgain] = useState(false);
  const [activityDays, setActivityDays] = useState<7 | 30 | 90>(30);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailPreview, setEmailPreview] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSourceFilter, setEmailSourceFilter] = useState('');
  const [campaignIdempotencyKey, setCampaignIdempotencyKey] = useState(() => `${Date.now()}`);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [testingCampaign, setTestingCampaign] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [inboxUnread, setInboxUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadInboxSummary() {
      try {
        const res = await fetch('/api/admin/inbox?summary=1');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setInboxUnread(Number(data.unreadCount || 0));
      } catch {
        // The badge is best-effort; the Inbox tab shows real errors.
      }
    }
    void loadInboxSummary();
    const timer = window.setInterval(loadInboxSummary, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function fetchLeads() {
    setLoadingLeads(true);
    setLeadError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (leadTypeFilter) params.set('lead_type', leadTypeFilter);
      if (q) params.set('q', q);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('archived', leadListMode === 'archived' ? 'archived' : 'active');
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load leads');
      const items = Array.isArray(data.rows) ? data.rows : [];
      setLeads(items);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setLeadError(e instanceof Error ? e.message : 'Failed to load leads');
      setLeads([]);
      setTotal(0);
    } finally {
      setLoadingLeads(false);
    }
  }

  async function fetchSubscribers(mode: 'active' | 'archived' = subscriberListMode) {
    try {
      const params = new URLSearchParams();
      params.set('archived', mode === 'archived' ? 'archived' : 'active');
      const res = await fetch(`/api/admin/subscribers?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load subscribers');
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to load subscribers');
    }
  }

  async function fetchActivity(days: 7 | 30 | 90) {
    setLoadingActivity(true);
    setActivityError(null);
    try {
      const res = await fetch(`/api/admin/activity?days=${days}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load activity analytics');
      setActivityData(data as ActivityData);
    } catch (error) {
      setActivityData(null);
      setActivityError(error instanceof Error ? error.message : 'Failed to load activity analytics');
    } finally {
      setLoadingActivity(false);
    }
  }

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/admin/email-blasts');
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load campaigns');
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to load campaigns');
    }
  }

  async function sendTestEmail() {
    setTestingCampaign(true);
    setEmailError(null);
    setEmailMessage(null);
    try {
      const res = await fetch('/api/admin/email-blasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          subject: emailSubject,
          previewText: emailPreview,
          body: emailBody
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test email');
      setEmailMessage('Test email sent to RESEND_TO.');
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to send test email');
    } finally {
      setTestingCampaign(false);
    }
  }

  async function sendCampaign() {
    setSendingCampaign(true);
    setEmailError(null);
    setEmailMessage(null);
    try {
      const res = await fetch('/api/admin/email-blasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          subject: emailSubject,
          previewText: emailPreview,
          body: emailBody,
          audienceSource: emailSourceFilter || undefined,
          idempotencyKey: campaignIdempotencyKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send campaign');
      if (data.campaign?.status === 'failed') {
        // Keep the idempotency key: sending again retries only the recipients who did not get it.
        await fetchCampaigns();
        throw new Error('Some emails failed to send. Send again to retry the recipients who did not receive it.');
      }
      setEmailMessage(data.alreadyProcessed ? 'This campaign was already processed.' : 'Campaign sent.');
      setCampaignIdempotencyKey(`${Date.now()}`);
      await fetchCampaigns();
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to send campaign');
    } finally {
      setSendingCampaign(false);
    }
  }

  async function setSubscriberStatus(id: string, nextStatus: 'active' | 'unsubscribed' | 'bounced' | 'complaint', forceResubscribe = false) {
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus, force_resubscribe: forceResubscribe })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscriber');
      setSubscribers((prev) => prev.map((item) => (item.id === id ? data : item)));
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to update subscriber');
    }
  }

  useEffect(() => {
    fetchLeads();
  }, [status, q, page, pageSize, leadTypeFilter, leadListMode]);

  useEffect(() => {
    if (tab !== 'subscribers') return;
    fetchSubscribers(subscriberListMode);
  }, [tab, subscriberListMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || !leads.length) return;
    const leadId = new URL(window.location.href).searchParams.get('leadId');
    if (!leadId) return;
    const match = leads.find((item) => String(item.id || '') === leadId);
    if (match && String(selectedLead?.id || '') !== String(match.id || '')) {
      void openLead(match);
    }
  }, [leads]);

  useEffect(() => {
    if (tab !== 'activity') return;
    fetchActivity(activityDays);
  }, [tab, activityDays]);

  useEffect(() => {
    if (tab !== 'email') return;
    fetchCampaigns();
  }, [tab]);

  const leadCountLabel = useMemo(() => {
    if (loadingLeads) return 'Loading leads…';
    return `${leads.length} ${leadListMode === 'archived' ? 'deleted leads' : 'leads shown'}`;
  }, [loadingLeads, leads.length, leadListMode]);

  function defaultLeadEmailDraft(type: 'confirmation' | 'followup') {
    const requestType = selectedLead?.lead_type ? `${selectedLead.lead_type} request` : 'request';
    const subject =
      type === 'confirmation' ? `${requestType[0].toUpperCase()}${requestType.slice(1)} Received` : `Following up on your ${requestType}`;
    const body =
      type === 'confirmation'
        ? `Hi,\n\nThank you for reaching out to Beyon Vital, LLC. We received your request and will follow up.\n\nIf you would like to talk sooner, call us at (804) 366-3442.`
        : `Hi,\n\nJust checking in with next steps for your request. If you'd like to move forward, reply to this email or call (804) 366-3442.`;
    return { subject, body };
  }

  async function saveAnnouncement(formData: FormData) {
    const payload = {
      id: String(formData.get('id') || ''),
      title: String(formData.get('title') || ''),
      body: String(formData.get('body') || ''),
      active: formData.get('active') === 'on',
      start_date: String(formData.get('start_date') || ''),
      end_date: String(formData.get('end_date') || ''),
      target_pages: String(formData.get('target_pages') || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      priority: Number(formData.get('priority') || 0)
    };
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const item = await res.json();
    if (res.ok) setAnnouncements((prev) => [item, ...prev.filter((a) => a.id !== item.id)]);
  }

  async function deleteAnnouncementById(id: string) {
    const res = await fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  async function addSubscriber(formData: FormData) {
    const payload = {
      email: String(formData.get('email') || ''),
      name: String(formData.get('name') || ''),
      source: String(formData.get('source') || 'admin'),
      opted_in: true
    };
    const res = await fetch('/api/admin/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const item = await res.json();
    if (res.ok) setSubscribers((prev) => [item, ...prev.filter((s) => s.id !== item.id)]);
  }

  async function addNote() {
    const leadId = String(selectedLead?.id || '');
    if (!leadId || !leadNoteDraft.trim()) return;
    setLeadNoteMessage(null);
    setLeadNoteError(null);
    const res = await fetch('/api/admin/lead-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, note: leadNoteDraft.trim() })
    });
    const item = await res.json();
    if (res.ok) {
      setSelectedLead((prev) => (prev ? { ...prev, _notes: [item, ...((prev._notes as any[]) || [])] } : prev));
      setLeads((prev) =>
        prev.map((lead) =>
          String(lead.id || '') === leadId ? { ...lead, _notes: [item, ...((lead._notes as any[]) || [])] } : lead
        )
      );
      setLeadNoteDraft('');
      setLeadNoteMessage('Note saved.');
    } else {
      setLeadNoteError(item?.error || 'Failed to save note');
    }
  }

  async function openLead(lead: LeadRecord) {
    setSelectedLead(lead);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('leadId', String(lead.id || ''));
      window.history.replaceState({}, '', url.toString());
      if (window.innerWidth < 768) setMobileLeadView('detail');
    }
    setLoadingLeadNotes(true);
    try {
      const res = await fetch(`/api/admin/lead-notes?leadId=${encodeURIComponent(String(lead.id || ''))}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load lead notes');
      const notes = Array.isArray(data) ? data : [];
      setSelectedLead((prev) => (prev && prev.id === lead.id ? { ...prev, _notes: notes } : prev));
      setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, _notes: notes } : item)));
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'Failed to load lead notes');
    } finally {
      setLoadingLeadNotes(false);
    }
  }

  async function patchLead(id: string, patch: { status?: string; lead_type?: string }) {
    const res = await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLeadError(data.error || 'Failed to update lead');
      return;
    }
    if (data.row) {
      setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...data.row } : lead)));
      setSelectedLead((prev) => (prev && prev.id === id ? { ...prev, ...data.row } : prev));
    }
  }

  async function archiveLead(id: string) {
    if (!window.confirm('Delete lead?\nAre you sure? You can restore it for 30 days.')) return;
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'archive' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete lead');
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'Failed to delete lead');
    }
  }

  async function restoreLead(id: string) {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'restore' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to restore lead');
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'Failed to restore lead');
    }
  }

  async function archiveSubscriberById(id: string) {
    if (!window.confirm('Delete subscriber?\nAre you sure? You can restore it for 30 days.')) return;
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'archive' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete subscriber');
      setSubscribers((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to delete subscriber');
    }
  }

  async function restoreSubscriberById(id: string) {
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'restore' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to restore subscriber');
      setSubscribers((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to restore subscriber');
    }
  }

  function openLeadEmailComposer(type: 'confirmation' | 'followup', sendAgain = false) {
    const defaults = defaultLeadEmailDraft(type);
    setEmailComposerType(type);
    setEmailComposerSubject(defaults.subject);
    setEmailComposerBody(defaults.body);
    setEmailComposerSendAgain(sendAgain);
    setEmailComposerPreviewHtml('');
    setEmailComposerTab('compose');
    setEmailComposerOpen(true);
    setLeadError(null);
    setLeadEmailMessage(null);
  }

  async function loadLeadEmailPreview() {
    const leadId = String(selectedLead?.id || '');
    if (!leadId) return;
    setEmailComposerLoadingPreview(true);
    setLeadError(null);
    try {
      const res = await fetch('/api/admin/send-lead-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          type: emailComposerType,
          subject: emailComposerSubject,
          body: emailComposerBody,
          preview: true,
          sendAgain: emailComposerSendAgain
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load preview');
      setEmailComposerPreviewHtml(String(data.html || ''));
      setEmailComposerTab('preview');
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'Failed to load preview');
    } finally {
      setEmailComposerLoadingPreview(false);
    }
  }

  async function sendLeadEmailFromComposer() {
    const leadId = String(selectedLead?.id || '');
    if (!leadId) return;
    setSendingLeadEmailType(emailComposerType);
    setLeadError(null);
    setLeadEmailMessage(null);
    try {
      const res = await fetch('/api/admin/send-lead-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          type: emailComposerType,
          subject: emailComposerSubject,
          body: emailComposerBody,
          sendAgain: emailComposerSendAgain
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      const sentAt = new Date().toISOString();
      setLeadEmailMessage('Message sent.');
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              confirmation_sent_at: emailComposerType === 'confirmation' ? sentAt : prev.confirmation_sent_at,
              followup_sent_at: emailComposerType === 'followup' ? sentAt : prev.followup_sent_at,
              last_email_error: ''
            }
          : prev
      );
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                confirmation_sent_at: emailComposerType === 'confirmation' ? sentAt : lead.confirmation_sent_at,
                followup_sent_at: emailComposerType === 'followup' ? sentAt : lead.followup_sent_at,
                last_email_error: ''
              }
            : lead
        )
      );
      setEmailComposerOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send email';
      setLeadError(message);
      setSelectedLead((prev) => (prev ? { ...prev, last_email_error: message } : prev));
    } finally {
      setSendingLeadEmailType(null);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <div className="container-shell w-full max-w-full overflow-x-hidden py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt="Beyon Vital logo"
              width={38}
              height={38}
              className="h-9 w-9 rounded-full object-contain"
              priority
            />
            <h1 className="text-3xl font-semibold text-brand-ink">Admin Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-brand-muted">Signed in as {adminEmail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/export/leads" className="rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-sm font-medium">
            Export Leads CSV
          </a>
          <a
            href="/api/admin/export/subscribers"
            className="rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-sm font-medium"
          >
            Export Subscribers CSV
          </a>
          <button onClick={logout} className="rounded-xl bg-brand-ink px-3 py-2 text-sm font-semibold text-white">
            Logout
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t ? 'bg-brand-ink text-white' : 'border border-brand-ink/10 bg-white text-brand-muted'
            }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
            {t === 'inbox' && inboxUnread > 0 ? (
              <span className="ml-2 rounded-full bg-brand-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-white" aria-label={`${inboxUnread} unread`}>
                {inboxUnread > 99 ? '99+' : inboxUnread}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {initialLoadError ? (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Admin data could not be loaded. You can still access the dashboard, but CMS sections may be empty until connectivity/env issues are resolved.
          <span className="mt-1 block text-amber-800">{initialLoadError}</span>
        </p>
      ) : null}

      <div className="w-full max-w-full overflow-x-hidden">
        {tab === 'leads' && (
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className={mobileLeadView === 'detail' ? 'hidden md:block' : ''}>
              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    setLeadListMode('active');
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${leadListMode === 'active' ? 'bg-brand-ink text-white' : 'border border-brand-ink/10 bg-white text-brand-muted'}`}
                >
                  Active Leads
                </button>
                <button
                  onClick={() => {
                    setLeadListMode('archived');
                    setPage(1);
                    setSelectedLead(null);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${leadListMode === 'archived' ? 'bg-brand-ink text-white' : 'border border-brand-ink/10 bg-white text-brand-muted'}`}
                >
                  Recently Deleted
                </button>
              </div>
              <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
                <button
                  onClick={() => setMobileLeadFiltersOpen((prev) => !prev)}
                  className="rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-sm font-medium"
                >
                  {mobileLeadFiltersOpen ? 'Hide Filters' : 'Show Filters'}
                </button>
                <div className="rounded-xl border border-brand-ink/10 px-3 py-2 text-xs text-brand-muted">
                  Page {page} • {total}
                </div>
              </div>
              <div className={`${mobileLeadFiltersOpen ? 'grid' : 'hidden'} gap-3 md:grid md:grid-cols-5`}>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name/email/message"
                  className="w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm md:col-span-2"
                />
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="status"
                  className="w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                />
                <select
                  value={leadTypeFilter}
                  onChange={(e) => setLeadTypeFilter(e.target.value)}
                  className="w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                >
                  <option value="">All lead types</option>
                  <option value="placement">placement</option>
                  <option value="tour">tour</option>
                  <option value="general">general</option>
                  <option value="community_engagement">community_engagement</option>
                </select>
                <div className="hidden rounded-xl border border-brand-ink/10 px-3 py-2 text-xs text-brand-muted md:block">
                  Page {page} • {total} total
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-brand-muted">{leadCountLabel}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border px-3 py-1.5 text-sm">
                    Prev
                  </button>
                  <button onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 text-sm">
                    Next
                  </button>
                </div>
              </div>
              {leadError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{leadError}</p> : null}

              <div className="mt-4 space-y-3 md:hidden">
                {leads.map((lead) => {
                  return (
                    <div key={lead.id} className="w-full rounded-2xl border border-brand-ink/10 bg-white p-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-brand-ink">{lead.contact_name || 'Unknown'}</p>
                          <p className="break-all text-xs text-brand-muted">{lead.contact_email || ''}</p>
                        </div>
                        <Badge>{lead.status || 'new'}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-brand-muted">
                        {lead.lead_type || 'unknown'} • notes {lead.notes_count || 0}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        {leadListMode === 'active' ? (
                          <>
                            <button onClick={() => void openLead(lead)} className="rounded-lg border px-2 py-1 text-xs text-brand-primary">
                              View
                            </button>
                            <button onClick={() => void archiveLead(lead.id)} className="rounded-lg border p-1.5 text-rose-600" aria-label="Delete lead">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => void restoreLead(lead.id)} className="rounded-lg border px-2 py-1 text-xs">
                            <span className="inline-flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Restore</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-ink/10 text-xs uppercase tracking-wider text-brand-muted">
                      <th className="px-2 py-2">Created</th>
                      <th className="px-2 py-2">Contact</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Forwarded</th>
                      <th className="px-2 py-2">Notes</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      return (
                        <tr key={lead.id} className="border-b border-brand-ink/5">
                          <td className="px-2 py-2">{lead.created_at?.slice(0, 10)}</td>
                          <td className="px-2 py-2">
                            <div className="font-medium">{lead.contact_name || 'Unknown'}</div>
                            <div className="text-xs text-brand-muted">
                              {lead.contact_email || ''} • {lead.contact_phone || ''}
                            </div>
                          </td>
                          <td className="px-2 py-2">{lead.lead_type || ''}</td>
                          <td className="px-2 py-2">{lead.status || ''}</td>
                          <td className="px-2 py-2">{lead.forwarded_to_leadops ? 'Yes' : 'Pending'}</td>
                          <td className="px-2 py-2">{lead.notes_count || 0}</td>
                          <td className="px-2 py-2">
                            {leadListMode === 'active' ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => void openLead(lead)} className="rounded-lg border px-2 py-1 text-xs text-brand-primary">
                                  View
                                </button>
                                <button onClick={() => void archiveLead(lead.id)} className="rounded-lg border p-1.5 text-rose-600" aria-label="Delete lead">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => void restoreLead(lead.id)} className="rounded-lg border px-2 py-1 text-xs">
                                <span className="inline-flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Restore</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {leadListMode === 'active' ? (
            <Card className={`${mobileLeadView === 'list' ? 'hidden md:block' : ''} max-w-full overflow-x-hidden`}>
              <div className="mb-3 md:hidden">
                <button
                  onClick={() => {
                    setMobileLeadView('list');
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('leadId');
                      window.history.replaceState({}, '', url.toString());
                    }
                  }}
                  className="rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-sm font-medium"
                >
                  Back to Leads
                </button>
              </div>
              <h2 className="text-lg font-semibold text-brand-ink">Lead Detail</h2>
              {!selectedLead ? (
                <p className="mt-3 text-sm text-brand-muted">Select a lead to view details and local notes.</p>
              ) : (
                <div className="mt-3 space-y-4 text-sm">
                  <div className="grid max-w-full gap-2">
                    <DetailRow label="Name" value={selectedLead.contact_name} />
                    <DetailRow label="Email" value={selectedLead.contact_email} />
                    <DetailRow label="Phone" value={selectedLead.contact_phone} />
                    <DetailRow label="Lead Type" value={selectedLead.lead_type} />
                    <DetailRow label="Status" value={selectedLead.status} />
                    <DetailRow label="Forwarded to System" value={selectedLead.forwarded_to_leadops ? 'Yes' : 'No'} />
                    <DetailRow label="Manual Confirmation Sent" value={selectedLead.confirmation_sent_at || 'No'} />
                    <DetailRow label="Manual Follow-up Sent" value={selectedLead.followup_sent_at || 'No'} />
                    <DetailRow label="Last Email Error" value={selectedLead.last_email_error || 'None'} />
                    <DetailRow label="Created" value={selectedLead.created_at || ''} />
                  </div>
                  {selectedLead.leadops_error ? (
                    <div className="max-w-full overflow-hidden rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                      <p className="break-words">Forwarding failed — check system settings.</p>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[11px]">Details</summary>
                        <p className="mt-1 break-words text-[11px]">{selectedLead.leadops_error}</p>
                      </details>
                    </div>
                  ) : null}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => openLeadEmailComposer('confirmation')}
                      disabled={sendingLeadEmailType !== null}
                      className="rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
                    >
                      Send Confirmation
                    </button>
                    <button
                      onClick={() => openLeadEmailComposer('followup')}
                      disabled={sendingLeadEmailType !== null}
                      className="rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
                    >
                      Send Follow-up
                    </button>
                  </div>
                  {leadEmailMessage ? <p className="text-xs text-emerald-700">{leadEmailMessage}</p> : null}
                  {(selectedLead.confirmation_sent_at || selectedLead.followup_sent_at) ? (
                    <div className="rounded-xl border border-brand-ink/10 bg-brand-cream/50 px-3 py-2 text-xs text-brand-muted">
                      Already sent before. To send again, click below and confirm.
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            openLeadEmailComposer('confirmation', true);
                          }}
                          className="rounded-lg border px-2 py-1 text-xs"
                        >
                          Send Confirmation Again
                        </button>
                        <button
                          onClick={() => {
                            openLeadEmailComposer('followup', true);
                          }}
                          className="rounded-lg border px-2 py-1 text-xs"
                        >
                          Send Follow-up Again
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-brand-muted">
                      Status
                      <select
                        value={selectedLead.status || 'new'}
                        onChange={(e) => patchLead(selectedLead.id, { status: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                      >
                        <option value="new">new</option>
                        <option value="contacted">contacted</option>
                        <option value="qualified">qualified</option>
                        <option value="closed">closed</option>
                      </select>
                    </label>
                    <label className="text-xs text-brand-muted">
                      Lead Type
                      <select
                        value={selectedLead.lead_type || ''}
                        onChange={(e) => patchLead(selectedLead.id, { lead_type: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                      >
                        <option value="">unset</option>
                        <option value="placement">placement</option>
                        <option value="tour">tour</option>
                        <option value="general">general</option>
                        <option value="community_engagement">community_engagement</option>
                      </select>
                    </label>
                  </div>
                  <div>
                    <p className="font-semibold text-brand-ink">Message</p>
                    <pre className="mt-2 max-h-56 max-w-full overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-brand-cream p-3 text-xs text-brand-ink">
                      {stripMetaBlock(selectedLead.message)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold text-brand-ink">Notes</p>
                    {loadingLeadNotes ? <p className="mt-2 text-xs text-brand-muted">Loading notes...</p> : null}
                    <div className="mt-2 space-y-2">
                      {(((selectedLead._notes as any[]) || [])).map((note) => (
                        <div key={note.id} className="max-w-full overflow-hidden rounded-xl border border-brand-ink/10 bg-white p-3">
                          <p className="whitespace-pre-wrap break-words text-sm">{note.note}</p>
                          <p className="mt-1 break-words text-xs text-brand-muted">{new Date(note.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                      {!loadingLeadNotes && !((selectedLead._notes as any[]) || []).length ? (
                        <p className="text-xs text-brand-muted">No notes yet.</p>
                      ) : null}
                    </div>
                    <textarea
                      value={leadNoteDraft}
                      onChange={(e) => setLeadNoteDraft(e.target.value)}
                      placeholder="Add local note"
                      className="mt-3 min-h-24 w-full rounded-xl border border-brand-ink/10 px-3 py-2"
                    />
                    {leadNoteMessage ? <p className="mt-2 text-xs text-emerald-700">{leadNoteMessage}</p> : null}
                    {leadNoteError ? <p className="mt-2 text-xs text-rose-700">{leadNoteError}</p> : null}
                    <button onClick={addNote} className="mt-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-semibold text-white">
                      Save Note
                    </button>
                  </div>
                </div>
              )}
            </Card>
            ) : null}
          </div>
        )}

        {tab === 'inbox' && <AdminInbox onUnreadCount={setInboxUnread} />}

        {tab === 'announcements' && (
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <h2 className="text-lg font-semibold">Add / Edit Announcement</h2>
              <form action={saveAnnouncement} className="mt-4 space-y-3">
                <input type="hidden" name="id" />
                <input name="title" placeholder="Title" className="w-full rounded-xl border px-3 py-2" required />
                <textarea name="body" placeholder="Body" className="min-h-28 w-full rounded-xl border px-3 py-2" required />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="start_date" type="date" className="rounded-xl border px-3 py-2" />
                  <input name="end_date" type="date" className="rounded-xl border px-3 py-2" />
                  <input name="target_pages" placeholder="/,/tour" className="rounded-xl border px-3 py-2" />
                  <input name="priority" type="number" placeholder="Priority" className="rounded-xl border px-3 py-2" defaultValue={1} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input name="active" type="checkbox" defaultChecked /> Active
                </label>
                <Button type="submit">Save Announcement</Button>
              </form>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold">Current Announcements</h2>
              <div className="mt-4 space-y-3">
                {[...announcements].sort((a, b) => a.priority - b.priority).map((announcement) => (
                  <div key={announcement.id} className="rounded-2xl border border-brand-ink/10 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-brand-ink">{announcement.title}</p>
                        <p className="mt-1 text-xs text-brand-muted">
                          priority {announcement.priority} • {announcement.active ? 'active' : 'inactive'}
                        </p>
                      </div>
                      <button onClick={() => deleteAnnouncementById(announcement.id)} className="text-sm text-rose-600">
                        Delete
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-brand-muted">{announcement.body}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'subscribers' && (
          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <Card>
              <h2 className="text-lg font-semibold">Add Subscriber</h2>
              <form action={addSubscriber} className="mt-4 space-y-3">
                <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border px-3 py-2" />
                <input name="name" placeholder="Name" className="w-full rounded-xl border px-3 py-2" />
                <input name="source" defaultValue="admin" placeholder="Source" className="w-full rounded-xl border px-3 py-2" />
                <Button type="submit">Add Subscriber</Button>
              </form>
            </Card>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubscriberListMode('active')}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${subscriberListMode === 'active' ? 'bg-brand-ink text-white' : 'border border-brand-ink/10 bg-white text-brand-muted'}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setSubscriberListMode('archived')}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${subscriberListMode === 'archived' ? 'bg-brand-ink text-white' : 'border border-brand-ink/10 bg-white text-brand-muted'}`}
                  >
                    Recently Deleted
                  </button>
                </div>
                <a href="/api/admin/export/subscribers" className="text-sm text-brand-primary">
                  Export CSV
                </a>
              </div>
              {emailError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{emailError}</p> : null}
              <div className="mt-4 space-y-2 md:hidden">
                {subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="rounded-xl border border-brand-ink/10 p-3 text-sm">
                    <p className="font-semibold">{subscriber.email}</p>
                    <p className="text-xs text-brand-muted">
                      {subscriber.name || 'No name'} • {subscriber.source} • {subscriber.created_at.slice(0, 10)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                      <SubscriberStatusBadge status={subscriber.status} />
                      <span>Confirmed {subscriber.confirmed_at ? subscriber.confirmed_at.slice(0, 10) : '—'}</span>
                      {subscriber.consent_source ? <span>consent: {subscriber.consent_source}</span> : null}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {subscriberListMode === 'active' ? (
                        <>
                          <button onClick={() => setSubscriberStatus(subscriber.id, 'unsubscribed')} className="rounded-lg border px-2 py-1 text-xs">
                            Unsubscribe
                          </button>
                          <button
                            onClick={() => {
                              if (!window.confirm('This subscriber is suppressed. Re-enable marketing emails?')) return;
                              void setSubscriberStatus(subscriber.id, 'active', true);
                            }}
                            className="rounded-lg border px-2 py-1 text-xs"
                          >
                            Re-enable
                          </button>
                          <button onClick={() => void archiveSubscriberById(subscriber.id)} className="rounded-lg border p-1.5 text-rose-600" aria-label="Delete subscriber">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => void restoreSubscriberById(subscriber.id)} className="rounded-lg border px-2 py-1 text-xs">
                          <span className="inline-flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Restore</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-brand-muted">
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Source</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Confirmed</th>
                      <th className="px-2 py-2">Date</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-t">
                        <td className="px-2 py-2">{subscriber.email}</td>
                        <td className="px-2 py-2">{subscriber.name || ''}</td>
                        <td className="px-2 py-2">
                          {subscriber.source}
                          {subscriber.consent_source ? <span className="block text-xs text-brand-muted">consent: {subscriber.consent_source}</span> : null}
                        </td>
                        <td className="px-2 py-2"><SubscriberStatusBadge status={subscriber.status} /></td>
                        <td className="px-2 py-2">{subscriber.confirmed_at ? subscriber.confirmed_at.slice(0, 10) : '—'}</td>
                        <td className="px-2 py-2">{subscriber.created_at.slice(0, 10)}</td>
                        <td className="px-2 py-2">
                          {subscriberListMode === 'active' ? (
                            <div className="flex gap-2">
                              <button onClick={() => setSubscriberStatus(subscriber.id, 'unsubscribed')} className="rounded-lg border px-2 py-1 text-xs">
                                Unsubscribe
                              </button>
                              <button
                                onClick={() => {
                                  if (!window.confirm('This subscriber is suppressed. Re-enable marketing emails?')) return;
                                  void setSubscriberStatus(subscriber.id, 'active', true);
                                }}
                                className="rounded-lg border px-2 py-1 text-xs"
                              >
                                Re-enable
                              </button>
                              <button onClick={() => void archiveSubscriberById(subscriber.id)} className="rounded-lg border p-1.5 text-rose-600" aria-label="Delete subscriber">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => void restoreSubscriberById(subscriber.id)} className="rounded-lg border px-2 py-1 text-xs">
                              <span className="inline-flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Restore</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === 'activity' && (
          <div className="space-y-5">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-brand-ink">Activity Dashboard</h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    Plain-language analytics showing what is working, where visitors come from, and which pages drive inquiries.
                  </p>
                </div>
                <div className="flex gap-2">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setActivityDays(days as 7 | 30 | 90)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        activityDays === days ? 'bg-brand-ink text-white' : 'border border-brand-ink/10 bg-white text-brand-muted'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {loadingActivity ? (
              <Card>
                <p className="text-sm text-brand-muted">Loading activity analytics...</p>
              </Card>
            ) : null}

            {activityError ? (
              <Card>
                <p className="text-sm text-rose-700">{activityError}</p>
                <p className="mt-2 text-xs text-brand-muted">
                  If this mentions missing relations, apply the latest Supabase migration for `activity_events` and redeploy.
                </p>
              </Card>
            ) : null}

            {activityData ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <MetricCard label="Total Visits" value={activityData.overview.totalVisits} />
                  <MetricCard label="Inquiries" value={activityData.overview.placementInquiries} />
                  <MetricCard label="Tour Requests" value={activityData.overview.tourRequests} />
                  <MetricCard label="Conversion Rate" value={`${activityData.overview.conversionRate}%`} />
                  <MetricCard label="Calls Clicked" value={activityData.overview.callsClicked} />
                </div>

                <Card>
                  <h3 className="text-base font-semibold text-brand-ink">Top Pages</h3>
                  <p className="mt-1 text-sm text-brand-muted">
                    This shows which pages get the most attention and which ones drive inquiries.
                  </p>
                  <div className="-mx-4 mt-4 w-full overflow-x-auto px-4">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wider text-brand-muted">
                          <th className="px-2 py-2">Page</th>
                          <th className="px-2 py-2">Views</th>
                          <th className="px-2 py-2">CTA Clicks</th>
                          <th className="px-2 py-2">Conversions</th>
                          <th className="px-2 py-2">Conversion Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityData.topPages.map((item) => (
                          <tr key={item.page} className="border-b border-brand-ink/5">
                            <td className="px-2 py-2">{item.page}</td>
                            <td className="px-2 py-2">{item.views}</td>
                            <td className="px-2 py-2">{item.ctaClicks}</td>
                            <td className="px-2 py-2">{item.conversions}</td>
                            <td className="px-2 py-2">{item.conversionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Card>
                    <h3 className="text-base font-semibold text-brand-ink">Device Breakdown</h3>
                    <p className="mt-1 text-sm text-brand-muted">Use this to prioritize mobile improvements when mobile traffic dominates.</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <PercentRow label="Mobile" value={activityData.deviceBreakdown.mobile} />
                      <PercentRow label="Desktop" value={activityData.deviceBreakdown.desktop} />
                      <PercentRow label="Tablet" value={activityData.deviceBreakdown.tablet} />
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-base font-semibold text-brand-ink">Top Cities</h3>
                    <div className="-mx-4 mt-4 w-full overflow-x-auto px-4">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase tracking-wider text-brand-muted">
                            <th className="px-2 py-2">Location</th>
                            <th className="px-2 py-2">Visits</th>
                            <th className="px-2 py-2">Conversions</th>
                            <th className="px-2 py-2">Conversion %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityData.topCities.map((item) => (
                            <tr key={item.location} className="border-b border-brand-ink/5">
                              <td className="px-2 py-2">{item.location}</td>
                              <td className="px-2 py-2">{item.visits}</td>
                              <td className="px-2 py-2">{item.conversions}</td>
                              <td className="px-2 py-2">{item.conversionRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <Card>
                  <h3 className="text-base font-semibold text-brand-ink">How to Use This Page</h3>
                  <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                    <li><span className="font-semibold text-brand-ink">Top Pages:</span> Focus updates where traffic is high but inquiries are low.</li>
                    <li><span className="font-semibold text-brand-ink">Device Mix:</span> If mobile is highest, prioritize phone-sized layout fixes first.</li>
                    <li><span className="font-semibold text-brand-ink">Top Locations:</span> Use city/region trends to guide local outreach.</li>
                    <li><span className="font-semibold text-brand-ink">Conversions:</span> Inquiry, tour, and contact submissions show what is working.</li>
                  </ul>
                </Card>
              </>
            ) : null}
          </div>
        )}

        {tab === 'email' && (
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <h2 className="text-lg font-semibold text-brand-ink">Email Blasts</h2>
              <p className="mt-1 text-sm text-brand-muted">Send updates to active subscribers only. Unsubscribed and bounced emails are skipped.</p>
              <div className="mt-4 space-y-3">
                <input
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  placeholder="Subject"
                  className="w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                />
                <input
                  value={emailPreview}
                  onChange={(event) => setEmailPreview(event.target.value)}
                  placeholder="Preview text (optional)"
                  className="w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                />
                <textarea
                  value={emailBody}
                  onChange={(event) => setEmailBody(event.target.value)}
                  placeholder="Body (plain text or markdown bullets)"
                  className="min-h-52 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                />
                <select
                  value={emailSourceFilter}
                  onChange={(event) => setEmailSourceFilter(event.target.value)}
                  className="w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                >
                  <option value="">Active subscribers (all sources)</option>
                  <option value="placement">placement</option>
                  <option value="tour">tour</option>
                  <option value="general">general</option>
                  <option value="community_engagement">community_engagement</option>
                  <option value="newsletter">newsletter</option>
                </select>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={sendTestEmail}
                  disabled={testingCampaign || !emailSubject.trim() || !emailBody.trim()}
                  className="rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {testingCampaign ? 'Sending test...' : 'Send Test Email'}
                </button>
                <button
                  onClick={sendCampaign}
                  disabled={sendingCampaign || !emailSubject.trim() || !emailBody.trim()}
                  className="rounded-xl bg-brand-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {sendingCampaign ? 'Sending campaign...' : 'Send Campaign'}
                </button>
              </div>
              {emailMessage ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{emailMessage}</p> : null}
              {emailError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{emailError}</p> : null}
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-ink">Recent Campaigns</h3>
                <button onClick={fetchCampaigns} className="rounded-lg border px-3 py-1.5 text-xs">Refresh</button>
              </div>
              <div className="mt-4 space-y-3">
                {campaigns.length ? campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-xl border border-brand-ink/10 p-3">
                    <p className="font-semibold text-brand-ink">{campaign.subject}</p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {campaign.status} • recipients {campaign.total_recipients} • sent {campaign.sent_count} • skipped {campaign.skipped_count}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      source {campaign.audience_source || 'all'} • {campaign.sent_at ? campaign.sent_at.slice(0, 19).replace('T', ' ') : campaign.created_at.slice(0, 19).replace('T', ' ')}
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-brand-muted">No campaigns yet.</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {emailComposerOpen && selectedLead ? (
        <div className="fixed inset-0 z-50 bg-brand-ink/40 p-3 md:p-6">
          <div className="mx-auto max-h-[95vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-ink/10 px-4 py-3">
              <p className="text-sm font-semibold text-brand-ink">
                {emailComposerType === 'confirmation' ? 'Send Confirmation' : 'Send Follow-up'}
              </p>
              <button
                onClick={() => setEmailComposerOpen(false)}
                className="rounded-lg border border-brand-ink/10 px-2 py-1 text-xs text-brand-muted"
              >
                Close
              </button>
            </div>
            <div className="flex items-center gap-2 border-b border-brand-ink/10 px-4 py-2">
              <button
                onClick={() => setEmailComposerTab('compose')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${emailComposerTab === 'compose' ? 'bg-brand-ink text-white' : 'border border-brand-ink/10'}`}
              >
                Compose
              </button>
              <button
                onClick={() => void loadLeadEmailPreview()}
                disabled={emailComposerLoadingPreview}
                className="rounded-lg border border-brand-ink/10 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              >
                {emailComposerLoadingPreview ? 'Loading preview...' : 'Preview'}
              </button>
            </div>
            <div className="max-h-[calc(95vh-148px)] overflow-y-auto p-4">
              {emailComposerTab === 'compose' ? (
                <div className="space-y-3">
                  <label className="block text-xs text-brand-muted">
                    Subject
                    <input
                      value={emailComposerSubject}
                      onChange={(event) => setEmailComposerSubject(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs text-brand-muted">
                    Message body
                    <textarea
                      value={emailComposerBody}
                      onChange={(event) => setEmailComposerBody(event.target.value)}
                      className="mt-1 min-h-40 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              ) : (
                <div className="rounded-xl border border-brand-ink/10">
                  {emailComposerPreviewHtml ? (
                    <iframe title="Email preview" srcDoc={emailComposerPreviewHtml} className="h-[560px] w-full max-w-full" />
                  ) : (
                    <p className="p-4 text-sm text-brand-muted">Preview is not available yet.</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-brand-ink/10 px-4 py-3">
              <p className="truncate text-xs text-brand-muted">To: {selectedLead.contact_email || 'No recipient email'}</p>
              <button
                onClick={() => void sendLeadEmailFromComposer()}
                disabled={sendingLeadEmailType !== null || !emailComposerSubject.trim()}
                className="rounded-xl bg-brand-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {sendingLeadEmailType ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <p>
      <span className="font-semibold text-brand-ink">{label}:</span>{' '}
      <span className="max-w-full break-words text-brand-muted">{String(value || '')}</span>
    </p>
  );
}

function MetricCard({ label, value, compact = false }: { label: string; value: number | string; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-brand-ink/10 bg-white ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-xs uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function PercentRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-brand-muted">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-brand-cream">
        <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function SubscriberStatusBadge({ status }: { status: Subscriber['status'] }) {
  const tone =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'pending'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-rose-50 text-rose-800';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{status}</span>;
}
