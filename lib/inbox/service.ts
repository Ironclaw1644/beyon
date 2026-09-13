import 'server-only';

import { Resend } from 'resend';
import { cmsServerClient } from '@/lib/supabase/cmsServer';
import type { Database, Json } from '@/lib/supabase/cms.types';
import { renderDirectEmail } from '@/lib/email/template';
import {
  INBOX_ADDRESS,
  INBOX_FROM,
  buildReplyHeaders,
  buildSafeEmailDocument,
  makeSnippet,
  parseStoredAttachments,
  processInboundEmail,
  replySubject,
  sanitizeInboundHtml,
  type InboxRepo,
  type ReceivingClient
} from '@/lib/inbox/core';

type Tables = Database['beyon']['Tables'];
type InboxThreadRow = Tables['inbox_threads']['Row'];

const INBOX_ENV_VARS = ['RESEND_INBOUND_API_KEY', 'RESEND_INBOUND_WEBHOOK_SECRET', 'FORWARD_INBOUND_TO', 'RESEND_API_KEY'] as const;
type InboxEnvVar = (typeof INBOX_ENV_VARS)[number];

const THREAD_COLUMNS = 'id, subject, participant_email, participant_name, snippet, last_message_at, unread, archived_at';

export type InboxThreadSummary = Pick<
  InboxThreadRow,
  'id' | 'subject' | 'participant_email' | 'participant_name' | 'snippet' | 'last_message_at' | 'unread' | 'archived_at'
>;

/** Names (never values) of the env vars the inbox still needs. Empty means connected. */
export function getMissingInboxEnvVars(names: readonly InboxEnvVar[] = INBOX_ENV_VARS): InboxEnvVar[] {
  return names.filter((name) => !process.env[name]?.trim());
}

export class InboxNotConnectedError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(`Inbox not connected yet. Missing env var(s): ${missing.join(', ')}`);
    this.missing = missing;
  }
}

export class InboxInputError extends Error {}

function requireInboxEnv(names: readonly InboxEnvVar[]) {
  const missing = getMissingInboxEnvVars(names);
  if (missing.length) throw new InboxNotConnectedError(missing);
}

function inboxEnv(name: InboxEnvVar) {
  requireInboxEnv([name]);
  return process.env[name]!.trim();
}

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function supabaseInboxRepo(): InboxRepo {
  const db = cmsServerClient();
  return {
    async findMessageByResendId(resendEmailId) {
      const { data, error } = await db.from('inbox_messages').select('id, thread_id').eq('resend_email_id', resendEmailId).maybeSingle();
      assertNoError(error);
      return data;
    },
    async findThreadIdByMessageIds(messageIds) {
      const { data, error } = await db
        .from('inbox_messages')
        .select('thread_id, created_at')
        .in('message_id', messageIds)
        .order('created_at', { ascending: false })
        .limit(1);
      assertNoError(error);
      return data?.[0]?.thread_id ?? null;
    },
    async findRecentThreadsByParticipant(email, sinceIso) {
      const { data, error } = await db
        .from('inbox_threads')
        .select('id, subject, participant_email, last_message_at')
        .eq('participant_email', email)
        .gte('last_message_at', sinceIso)
        .order('last_message_at', { ascending: false })
        .limit(50);
      assertNoError(error);
      return data ?? [];
    },
    async createThread(input) {
      const { data, error } = await db.from('inbox_threads').insert(input).select('id').single();
      assertNoError(error);
      return { id: data!.id };
    },
    async deleteThread(id) {
      const { error } = await db.from('inbox_threads').delete().eq('id', id);
      assertNoError(error);
    },
    async insertMessage(row) {
      const { data, error } = await db
        .from('inbox_messages')
        .insert({ ...row, attachments: row.attachments as unknown as Json })
        .select('id')
        .single();
      // 23505 = unique_violation on resend_email_id: another delivery stored it first.
      if (error?.code === '23505') return { duplicate: true };
      assertNoError(error);
      return { id: data!.id };
    },
    async touchThread(id, patch) {
      const { error } = await db.from('inbox_threads').update(patch).eq('id', id);
      assertNoError(error);
    },
    async updateMessage(id, patch) {
      const { error } = await db.from('inbox_messages').update(patch).eq('id', id);
      assertNoError(error);
    }
  };
}

function resendReceivingClient(): ReceivingClient {
  const resend = new Resend(inboxEnv('RESEND_INBOUND_API_KEY'));
  return {
    async get(emailId) {
      // `cid` keeps inline images as attachment references instead of copying their bytes into html.
      const { data, error } = await resend.emails.receiving.get(emailId, { html_format: 'cid' });
      if (error || !data) throw new Error(error?.message || 'Resend did not return the received email');
      return {
        id: data.id,
        from: data.from,
        to: data.to ?? [],
        cc: data.cc,
        subject: data.subject ?? '',
        html: data.html,
        text: data.text,
        headers: data.headers,
        message_id: data.message_id,
        created_at: data.created_at,
        attachments: data.attachments ?? []
      };
    },
    async forward({ emailId, to, from }) {
      const { data, error } = await resend.emails.receiving.forward({ emailId, to, from });
      if (error || !data) throw new Error(error?.message || 'Resend did not accept the forward');
      return { id: data.id };
    }
  };
}

export async function handleInboundEmail(emailId: string, defer?: (task: () => Promise<void>) => void) {
  requireInboxEnv(['RESEND_INBOUND_API_KEY', 'FORWARD_INBOUND_TO']);
  return processInboundEmail(emailId, {
    repo: supabaseInboxRepo(),
    receiving: resendReceivingClient(),
    forwardTo: inboxEnv('FORWARD_INBOUND_TO'),
    forwardFrom: INBOX_FROM,
    defer
  });
}

export async function listInboxThreads(params: { mode: 'active' | 'archived'; q?: string }): Promise<InboxThreadSummary[]> {
  const db = cmsServerClient();
  let query = db.from('inbox_threads').select(THREAD_COLUMNS).order('last_message_at', { ascending: false }).limit(200);
  query = params.mode === 'archived' ? query.not('archived_at', 'is', null) : query.is('archived_at', null);

  // PostgREST filter syntax characters are removed rather than escaped.
  const term = String(params.q ?? '').replace(/[%_*,()\\"'.:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (term) {
    query = query.or(
      ['subject', 'participant_email', 'participant_name', 'snippet'].map((column) => `${column}.ilike.*${term}*`).join(',')
    );
  }

  const { data, error } = await query;
  assertNoError(error);
  return data ?? [];
}

export async function countUnreadThreads() {
  const db = cmsServerClient();
  const { count, error } = await db
    .from('inbox_threads')
    .select('id', { count: 'exact', head: true })
    .eq('unread', true)
    .is('archived_at', null);
  assertNoError(error);
  return count || 0;
}

export async function setInboxThreadState(id: string, action: 'archive' | 'restore' | 'read' | 'unread') {
  const db = cmsServerClient();
  const patch =
    action === 'archive'
      ? { archived_at: new Date().toISOString() }
      : action === 'restore'
        ? { archived_at: null }
        : { unread: action === 'unread' };
  const { data, error } = await db.from('inbox_threads').update(patch).eq('id', id).select(THREAD_COLUMNS).maybeSingle();
  assertNoError(error);
  return data;
}

export async function getInboxThread(id: string, options: { allowRemoteImages: boolean }) {
  const db = cmsServerClient();
  const threadRes = await db.from('inbox_threads').select(THREAD_COLUMNS).eq('id', id).maybeSingle();
  assertNoError(threadRes.error);
  if (!threadRes.data) return null;

  const messagesRes = await db
    .from('inbox_messages')
    .select(
      'id, direction, from_email, from_name, to_emails, cc_emails, subject, text_body, html_body, attachments, forward_status, forward_error, sent_status, created_at'
    )
    .eq('thread_id', id)
    .order('created_at', { ascending: true });
  assertNoError(messagesRes.error);

  if (threadRes.data.unread) {
    const { error } = await db.from('inbox_threads').update({ unread: false }).eq('id', id);
    assertNoError(error);
  }

  const messages = (messagesRes.data ?? []).map((row) => {
    let htmlDocument: string | null = null;
    let blockedImages = 0;
    // Outbound mail is shown as the text that was typed; only received HTML is rendered.
    if (row.direction === 'in' && row.html_body) {
      const clean = sanitizeInboundHtml(row.html_body, options);
      blockedImages = clean.blockedImages;
      htmlDocument = buildSafeEmailDocument(clean.html, options);
    }
    return {
      id: row.id,
      direction: row.direction,
      from_email: row.from_email,
      from_name: row.from_name,
      to_emails: row.to_emails,
      cc_emails: row.cc_emails,
      subject: row.subject,
      text_body: row.text_body,
      htmlDocument,
      blockedImages,
      attachments: parseStoredAttachments(row.attachments),
      forward_status: row.forward_status,
      forward_error: row.forward_error,
      sent_status: row.sent_status,
      created_at: row.created_at
    };
  });

  return { thread: { ...threadRes.data, unread: false }, messages };
}

/**
 * Sends a reply (threadId set) or a new message from hello@beyonvital.com and
 * stores it in the thread. Replies go to the thread participant with Re: subject
 * and In-Reply-To/References headers.
 */
export async function sendInboxMessage(input: {
  threadId?: string | null;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  idempotencyKey?: string;
}) {
  requireInboxEnv(INBOX_ENV_VARS);

  const body = input.body.replace(/\r\n/g, '\n').trim();
  if (!body) throw new InboxInputError('Write a message first.');
  if (body.length > 20000) throw new InboxInputError('Message is too long (20,000 characters max).');

  const db = cmsServerClient();
  let threadId = input.threadId || null;
  let to = input.to;
  let subject = input.subject.replace(/\s+/g, ' ').trim();
  let inReplyTo: string | null = null;
  let references: string | null = null;

  if (threadId) {
    const threadRes = await db.from('inbox_threads').select(THREAD_COLUMNS).eq('id', threadId).maybeSingle();
    assertNoError(threadRes.error);
    if (!threadRes.data) throw new InboxInputError('Conversation not found.');

    const priorRes = await db
      .from('inbox_messages')
      .select('direction, message_id, in_reply_to, references, subject')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    assertNoError(priorRes.error);
    const prior = priorRes.data ?? [];
    const lastInbound = [...prior].reverse().find((row) => row.direction === 'in');

    to = [threadRes.data.participant_email];
    subject = replySubject(lastInbound?.subject || threadRes.data.subject);
    ({ inReplyTo, references } = buildReplyHeaders(prior));
  } else {
    if (!to.length) throw new InboxInputError('Add at least one recipient.');
    if (!subject) throw new InboxInputError('Add a subject.');
  }
  if (subject.length > 300) throw new InboxInputError('Subject is too long.');

  const cc = input.cc.filter((email) => !to.includes(email));
  const rendered = renderDirectEmail({ subject, body });
  const sentAt = new Date().toISOString();
  let createdThread = false;

  if (!threadId) {
    const created = await db
      .from('inbox_threads')
      .insert({ subject, participant_email: to[0], snippet: makeSnippet(body), last_message_at: sentAt, unread: false })
      .select('id')
      .single();
    assertNoError(created.error);
    threadId = created.data!.id;
    createdThread = true;
  }

  const inserted = await db
    .from('inbox_messages')
    .insert({
      thread_id: threadId,
      direction: 'out',
      from_email: INBOX_ADDRESS,
      from_name: 'Beyon Vital',
      to_emails: to,
      cc_emails: cc,
      subject,
      text_body: body,
      html_body: rendered.html,
      in_reply_to: inReplyTo,
      references,
      attachments: [],
      sent_status: 'sending',
      created_at: sentAt
    })
    .select('id')
    .single();
  if (inserted.error) {
    if (createdThread) await db.from('inbox_threads').delete().eq('id', threadId);
    throw new Error(inserted.error.message);
  }
  const messageId = inserted.data!.id;

  const headers: Record<string, string> = {};
  if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
  if (references) headers.References = references;

  let resendId: string;
  try {
    const resend = new Resend(inboxEnv('RESEND_API_KEY'));
    const { data, error } = await resend.emails.send(
      {
        from: INBOX_FROM,
        to,
        cc: cc.length ? cc : undefined,
        subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: INBOX_ADDRESS,
        headers: Object.keys(headers).length ? headers : undefined
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey.slice(0, 256) } : undefined
    );
    if (error || !data) throw new Error(error?.message || 'Resend did not accept the message');
    resendId = data.id;
  } catch (error) {
    // Nothing went out: remove the rows so the composer can simply retry.
    await db.from('inbox_messages').delete().eq('id', messageId);
    if (createdThread) await db.from('inbox_threads').delete().eq('id', threadId);
    throw error;
  }

  // Resend does not return the RFC Message-ID it assigns, so message_id stays null for
  // outbound mail. Replies still thread: they carry our References chain, and the
  // participant + subject fallback covers brand-new conversations.
  const [messageUpdate, threadUpdate] = await Promise.all([
    db.from('inbox_messages').update({ sent_status: 'sent', resend_email_id: resendId }).eq('id', messageId),
    db.from('inbox_threads').update({ last_message_at: sentAt, snippet: makeSnippet(body), archived_at: null }).eq('id', threadId)
  ]);
  if (messageUpdate.error || threadUpdate.error) {
    console.error('inbox.send.store_after_send_failed', { messageId, message: messageUpdate.error?.message || threadUpdate.error?.message });
  }

  return { threadId, messageId, resendId, subject, to, cc };
}

/** Short-lived Resend download URL for an attachment on a stored inbound message. */
export async function getInboxAttachmentUrl(messageId: string, attachmentId: string) {
  const db = cmsServerClient();
  const { data, error } = await db
    .from('inbox_messages')
    .select('direction, resend_email_id, attachments')
    .eq('id', messageId)
    .maybeSingle();
  assertNoError(error);
  if (!data || data.direction !== 'in' || !data.resend_email_id) return null;
  if (!parseStoredAttachments(data.attachments).some((item) => item.id === attachmentId)) return null;

  const resend = new Resend(inboxEnv('RESEND_INBOUND_API_KEY'));
  const res = await resend.emails.receiving.attachments.get({ emailId: data.resend_email_id, id: attachmentId });
  if (res.error || !res.data?.download_url) throw new Error(res.error?.message || 'Resend did not return a download link');
  return res.data.download_url;
}
