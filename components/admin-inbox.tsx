'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive, ArrowLeft, ImageIcon, Mail, MailOpen, Paperclip, PenSquare, RotateCcw, Search } from 'lucide-react';
import { Card } from '@/components/ui';

type ThreadSummary = {
  id: string;
  subject: string;
  participant_email: string;
  participant_name: string | null;
  snippet: string;
  last_message_at: string;
  unread: boolean;
  archived_at: string | null;
};

type ThreadAttachment = { id: string; filename: string | null; content_type: string; size: number; inline: boolean };

type ThreadMessage = {
  id: string;
  direction: 'in' | 'out' | string;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[];
  subject: string;
  text_body: string | null;
  htmlDocument: string | null;
  blockedImages: number;
  attachments: ThreadAttachment[];
  forward_status: string | null;
  forward_error: string | null;
  sent_status: string | null;
  created_at: string;
};

type ThreadDetail = { thread: ThreadSummary; messages: ThreadMessage[] };

const FORMAT_HINT = 'Plain text. A blank line starts a new paragraph; start a line with "- " for a bullet.';

function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function formatListTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' })
  });
}

function formatFullTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readJson(res: Response) {
  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Signed out');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/** Sanitized HTML in a sandboxed iframe (no scripts); grows to fit its content. */
function EmailFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(160);

  function resize() {
    const doc = ref.current?.contentDocument;
    if (doc?.body) setHeight(Math.max(80, doc.documentElement.scrollHeight + 4));
  }

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      onLoad={resize}
      style={{ height }}
      className="block w-full max-w-full border-0 bg-white"
    />
  );
}

export function AdminInbox({ onUnreadCount }: { onUnreadCount?: (count: number) => void }) {
  const [mode, setMode] = useState<'active' | 'archived'>('active');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [showImages, setShowImages] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyKey, setReplyKey] = useState(newIdempotencyKey);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyNotice, setReplyNotice] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeKey, setComposeKey] = useState(newIdempotencyKey);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [sendingCompose, setSendingCompose] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const connected = missing !== null && missing.length === 0;
  const notConnected = missing !== null && missing.length > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function fetchThreads() {
    setLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({ mode });
      if (debouncedQuery) params.set('q', debouncedQuery);
      const data = await readJson(await fetch(`/api/admin/inbox?${params.toString()}`));
      setThreads(Array.isArray(data.threads) ? data.threads : []);
      setMissing(Array.isArray(data.missing) ? data.missing : []);
      onUnreadCount?.(Number(data.unreadCount || 0));
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchThreads();
  }, [mode, debouncedQuery]);

  async function openThread(id: string, images = false) {
    setSelectedId(id);
    setLoadingDetail(true);
    setDetailError(null);
    if (id !== selectedId) {
      setReplyBody('');
      setReplyNotice(null);
      setReplyKey(newIdempotencyKey());
    }
    setShowImages(images);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setMobileView('detail');
    try {
      const data = await readJson(await fetch(`/api/admin/inbox/${encodeURIComponent(id)}${images ? '?images=1' : ''}`));
      setDetail({ thread: data.thread, messages: Array.isArray(data.messages) ? data.messages : [] });
      if (Array.isArray(data.missing)) setMissing(data.missing);
      setThreads((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
      onUnreadCount?.(Number(data.unreadCount || 0));
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Failed to load conversation');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function updateThread(id: string, action: 'archive' | 'restore' | 'unread') {
    try {
      const data = await readJson(
        await fetch('/api/admin/inbox', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action })
        })
      );
      onUnreadCount?.(Number(data.unreadCount || 0));
      if (action === 'unread') {
        setThreads((prev) => prev.map((item) => (item.id === id ? { ...item, unread: true } : item)));
      } else {
        setThreads((prev) => prev.filter((item) => item.id !== id));
      }
      setSelectedId(null);
      setDetail(null);
      setMobileView('list');
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Failed to update conversation');
    }
  }

  async function sendReply() {
    if (!detail || !replyBody.trim()) return;
    setSendingReply(true);
    setDetailError(null);
    setReplyNotice(null);
    try {
      await readJson(
        await fetch('/api/admin/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: detail.thread.id, body: replyBody, idempotencyKey: replyKey })
        })
      );
      setReplyBody('');
      setReplyKey(newIdempotencyKey());
      setReplyNotice('Reply sent.');
      await openThread(detail.thread.id, showImages);
      void fetchThreads();
    } catch (error) {
      setReplyKey(newIdempotencyKey());
      setDetailError(error instanceof Error ? error.message : 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  }

  function openCompose() {
    setComposeTo('');
    setComposeCc('');
    setComposeSubject('');
    setComposeBody('');
    setComposeError(null);
    setComposeKey(newIdempotencyKey());
    setComposeOpen(true);
  }

  async function sendCompose() {
    setSendingCompose(true);
    setComposeError(null);
    try {
      const data = await readJson(
        await fetch('/api/admin/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: composeTo, cc: composeCc, subject: composeSubject, body: composeBody, idempotencyKey: composeKey })
        })
      );
      setComposeOpen(false);
      if (mode !== 'active') setMode('active');
      else await fetchThreads();
      if (data.threadId) await openThread(String(data.threadId));
    } catch (error) {
      setComposeKey(newIdempotencyKey());
      setComposeError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSendingCompose(false);
    }
  }

  const blockedImages = detail?.messages.reduce((sum, message) => sum + message.blockedImages, 0) || 0;
  const unreadShown = threads.filter((thread) => thread.unread).length;

  return (
    <div className="space-y-4">
      {notConnected ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Inbox not connected yet</p>
          <p className="mt-1 text-amber-800">
            Receiving and sending from hello@beyonvital.com are turned off until these settings are added: {missing?.join(', ')}.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card interactive={false} className={`${mobileView === 'detail' ? 'hidden lg:block' : ''} min-w-0`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-brand-ink">Inbox</h2>
              <p className="text-xs text-brand-muted">
                hello@beyonvital.com{mode === 'active' && unreadShown ? ` • ${unreadShown} unread` : ''}
              </p>
            </div>
            <button
              onClick={openCompose}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-ink px-3 py-2 text-sm font-semibold text-white"
            >
              <PenSquare className="h-4 w-4" /> Compose
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {(['active', 'archived'] as const).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setMode(item);
                  setSelectedId(null);
                  setDetail(null);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === item ? 'bg-brand-ink text-white' : 'border border-brand-ink/10 bg-white text-brand-muted'}`}
              >
                {item === 'active' ? 'Inbox' : 'Archived'}
              </button>
            ))}
          </div>

          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <span className="sr-only">Search mail</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email or subject"
              className="w-full rounded-xl border border-brand-ink/10 py-2 pl-9 pr-3 text-sm"
            />
          </label>

          {listError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{listError}</p> : null}

          <ul className="mt-3 divide-y divide-brand-ink/5">
            {threads.map((thread) => {
              const selected = thread.id === selectedId;
              return (
                <li key={thread.id}>
                  <button
                    onClick={() => void openThread(thread.id)}
                    className={`flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition ${selected ? 'bg-brand-cream' : 'hover:bg-brand-cream/60'}`}
                  >
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${thread.unread ? 'bg-brand-primary' : 'bg-transparent'}`}
                      aria-label={thread.unread ? 'Unread' : undefined}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${thread.unread ? 'font-semibold text-brand-ink' : 'font-medium text-brand-ink/90'}`}>
                          {thread.participant_name || thread.participant_email}
                        </span>
                        <span className="shrink-0 text-xs text-brand-muted">{formatListTime(thread.last_message_at)}</span>
                      </span>
                      <span className={`mt-0.5 block truncate text-sm ${thread.unread ? 'font-semibold text-brand-ink' : 'text-brand-ink/80'}`}>
                        {thread.subject || '(no subject)'}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-brand-muted">{thread.snippet}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {!loading && !threads.length && !listError ? (
            <p className="mt-4 rounded-xl border border-dashed border-brand-ink/15 px-4 py-6 text-center text-sm text-brand-muted">
              {debouncedQuery ? 'No conversations match your search.' : mode === 'archived' ? 'No archived conversations.' : 'No messages yet.'}
            </p>
          ) : null}
          {loading ? <p className="mt-3 text-xs text-brand-muted">Loading…</p> : null}
        </Card>

        <Card interactive={false} className={`${mobileView === 'list' ? 'hidden lg:block' : ''} min-w-0`}>
          <div className="mb-3 lg:hidden">
            <button
              onClick={() => setMobileView('list')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Inbox
            </button>
          </div>

          {!selectedId ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-brand-muted">
              <Mail className="h-8 w-8 text-brand-ink/30" />
              Select a conversation to read and reply.
            </div>
          ) : loadingDetail && !detail ? (
            <p className="text-sm text-brand-muted">Loading conversation…</p>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-semibold text-brand-ink">{detail.thread.subject || '(no subject)'}</h2>
                  <p className="mt-0.5 break-all text-xs text-brand-muted">
                    {detail.thread.participant_name ? `${detail.thread.participant_name} • ` : ''}
                    {detail.thread.participant_email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void updateThread(detail.thread.id, 'unread')}
                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  >
                    <MailOpen className="h-3.5 w-3.5" /> Mark unread
                  </button>
                  {detail.thread.archived_at ? (
                    <button
                      onClick={() => void updateThread(detail.thread.id, 'restore')}
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Move to Inbox
                    </button>
                  ) : (
                    <button
                      onClick={() => void updateThread(detail.thread.id, 'archive')}
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                    >
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </button>
                  )}
                </div>
              </div>

              {blockedImages > 0 && !showImages ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-ink/10 bg-brand-cream/60 px-3 py-2 text-xs text-brand-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4" /> Images from the sender are hidden to protect your privacy.
                  </span>
                  <button onClick={() => void openThread(detail.thread.id, true)} className="rounded-lg border bg-white px-2 py-1 font-medium text-brand-ink">
                    Show images
                  </button>
                </div>
              ) : null}

              <div className="space-y-3">
                {detail.messages.map((message) => {
                  const outbound = message.direction === 'out';
                  return (
                    <article
                      key={message.id}
                      className={`overflow-hidden rounded-2xl border ${outbound ? 'border-brand-primary/15 bg-brand-cream/50' : 'border-brand-ink/10 bg-white'}`}
                    >
                      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-brand-ink/5 px-4 py-2.5">
                        <div className="min-w-0 text-sm">
                          <span className="font-semibold text-brand-ink">{outbound ? 'You' : message.from_name || message.from_email}</span>
                          <span className="block break-all text-xs text-brand-muted">
                            {outbound ? `to ${message.to_emails.join(', ')}` : message.from_email}
                            {message.cc_emails.length ? ` • cc ${message.cc_emails.join(', ')}` : ''}
                          </span>
                        </div>
                        <span className="text-xs text-brand-muted">{formatFullTime(message.created_at)}</span>
                      </header>
                      <div className="px-4 py-3">
                        {message.htmlDocument ? (
                          <EmailFrame html={message.htmlDocument} title={`Message from ${message.from_email}`} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-brand-ink">{message.text_body || '(empty message)'}</p>
                        )}
                        {message.attachments.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={`/api/admin/inbox/attachment?messageId=${encodeURIComponent(message.id)}&attachmentId=${encodeURIComponent(attachment.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-brand-ink/10 bg-white px-2 py-1 text-xs text-brand-ink hover:border-brand-primary/40"
                              >
                                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{attachment.filename || 'attachment'}</span>
                                <span className="shrink-0 text-brand-muted">{formatSize(attachment.size)}</span>
                              </a>
                            ))}
                          </div>
                        ) : null}
                        {message.forward_status === 'failed' ? (
                          <p className="mt-2 text-[11px] text-rose-700">The copy to Gmail could not be forwarded.</p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-brand-ink/10 bg-white p-3">
                  <label className="block text-xs font-medium text-brand-muted" htmlFor="inbox-reply">
                    Reply to {detail.thread.participant_email}
                  </label>
                  <textarea
                    id="inbox-reply"
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Write your reply…"
                    className="mt-2 min-h-36 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-brand-muted">{FORMAT_HINT}</p>
                    <button
                      onClick={() => void sendReply()}
                      disabled={!connected || sendingReply || !replyBody.trim()}
                      className="rounded-xl bg-brand-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {sendingReply ? 'Sending…' : 'Send reply'}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-brand-muted">Sends from Beyon Vital &lt;hello@beyonvital.com&gt;.</p>
              </div>
              {replyNotice ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{replyNotice}</p> : null}
            </div>
          ) : null}
          {detailError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{detailError}</p> : null}
        </Card>
      </div>

      {composeOpen ? (
        <div className="fixed inset-0 z-50 bg-brand-ink/40 p-3 md:p-6">
          <div className="mx-auto flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-ink/10 px-4 py-3">
              <p className="text-sm font-semibold text-brand-ink">New message</p>
              <button onClick={() => setComposeOpen(false)} className="rounded-lg border border-brand-ink/10 px-2 py-1 text-xs text-brand-muted">
                Close
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-4">
              <p className="text-xs text-brand-muted">From: Beyon Vital &lt;hello@beyonvital.com&gt;</p>
              <label className="block text-xs text-brand-muted">
                To
                <input
                  value={composeTo}
                  onChange={(event) => setComposeTo(event.target.value)}
                  placeholder="name@example.com, another@example.com"
                  inputMode="email"
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-brand-muted">
                Cc (optional)
                <input
                  value={composeCc}
                  onChange={(event) => setComposeCc(event.target.value)}
                  inputMode="email"
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-brand-muted">
                Subject
                <input
                  value={composeSubject}
                  onChange={(event) => setComposeSubject(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-brand-muted">
                Message
                <textarea
                  value={composeBody}
                  onChange={(event) => setComposeBody(event.target.value)}
                  className="mt-1 min-h-48 w-full rounded-xl border border-brand-ink/10 px-3 py-2 text-sm"
                />
              </label>
              <p className="text-[11px] text-brand-muted">{FORMAT_HINT} Up to 10 addresses in To and Cc, separated by commas.</p>
              {composeError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{composeError}</p> : null}
              {notConnected ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">Inbox not connected yet, so sending is turned off.</p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-brand-ink/10 px-4 py-3">
              <button onClick={() => setComposeOpen(false)} className="rounded-xl border border-brand-ink/10 px-3 py-2 text-sm">
                Cancel
              </button>
              <button
                onClick={() => void sendCompose()}
                disabled={!connected || sendingCompose || !composeTo.trim() || !composeSubject.trim() || !composeBody.trim()}
                className="rounded-xl bg-brand-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sendingCompose ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
