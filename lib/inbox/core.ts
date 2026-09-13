// Pure inbox logic: webhook signatures, address/subject/header parsing, thread
// matching, inbound processing and HTML sanitizing. No `server-only` import and
// no `@/` paths, so `npm test` can load it directly.

import { createHmac, timingSafeEqual } from 'node:crypto';
import sanitizeHtml from 'sanitize-html';

export const INBOX_ADDRESS = 'hello@beyonvital.com';
export const INBOX_FROM = `Beyon Vital <${INBOX_ADDRESS}>`;
export const MAX_RECIPIENTS = 10;
export const SUBJECT_MATCH_WINDOW_DAYS = 30;
export const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

// ---------------------------------------------------------------------------
// Webhook signatures (Svix / Standard Webhooks, as used by Resend)
// ---------------------------------------------------------------------------

export type WebhookHeaders = { id: string | null; timestamp: string | null; signature: string | null };
export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'missing_secret' | 'missing_headers' | 'bad_timestamp' | 'expired' | 'bad_signature' };

function webhookKey(secret: string) {
  return Buffer.from(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret, 'base64');
}

export function signWebhookPayload(input: { payload: string; secret: string; id: string; timestamp: number | string }) {
  const digest = createHmac('sha256', webhookKey(input.secret))
    .update(`${input.id}.${input.timestamp}.${input.payload}`)
    .digest('base64');
  return `v1,${digest}`;
}

export function verifyWebhookSignature(input: {
  payload: string;
  headers: WebhookHeaders;
  secret: string | undefined;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): WebhookVerifyResult {
  const secret = input.secret?.trim();
  if (!secret || !webhookKey(secret).length) return { ok: false, reason: 'missing_secret' };

  const { id, timestamp, signature } = input.headers;
  if (!id || !timestamp || !signature) return { ok: false, reason: 'missing_headers' };
  if (!/^\d{1,12}$/.test(timestamp)) return { ok: false, reason: 'bad_timestamp' };

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > (input.toleranceSeconds ?? WEBHOOK_TOLERANCE_SECONDS)) {
    return { ok: false, reason: 'expired' };
  }

  const expected = createHmac('sha256', webhookKey(secret)).update(`${id}.${timestamp}.${input.payload}`).digest();
  // The header carries several space-separated signatures while a secret is rotated.
  for (const part of signature.split(' ')) {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) continue;
    const given = Buffer.from(value, 'base64');
    if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true };
  }
  return { ok: false, reason: 'bad_signature' };
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

const EMAIL_PATTERN = /^[^\s@<>()[\],;:"]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,24}$/i;

export type Mailbox = { email: string; name: string | null };

/** Parses `email@domain` or `Name <email@domain>`. */
export function parseMailbox(raw: string | null | undefined): Mailbox | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const angled = value.match(/^(.*?)<\s*([^<>\s]+)\s*>\s*$/);
  const email = (angled ? angled[2] : value).trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  const name = angled ? angled[1].trim().replace(/^"(.*)"$/, '$1').trim() : '';
  return { email, name: name || null };
}

export type RecipientListResult = { ok: true; emails: string[] } | { ok: false; error: string };

/** Comma-, semicolon- or newline-separated recipients, de-duplicated, at most `max`. */
export function parseRecipientList(raw: string | string[] | null | undefined, max = MAX_RECIPIENTS): RecipientListResult {
  const parts = (Array.isArray(raw) ? raw : String(raw ?? '').split(/[,;\n]/)).map((part) => String(part).trim()).filter(Boolean);
  const emails: string[] = [];
  for (const part of parts) {
    const mailbox = parseMailbox(part);
    if (!mailbox) return { ok: false, error: `"${part.slice(0, 80)}" is not a valid email address.` };
    if (!emails.includes(mailbox.email)) emails.push(mailbox.email);
  }
  if (emails.length > max) return { ok: false, error: `Use at most ${max} addresses.` };
  return { ok: true, emails };
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

const REPLY_PREFIX = /^\s*(?:re|fwd?|aw|sv|wg)\s*(?:\[\d+\])?\s*:\s*/i;

export function stripSubjectPrefixes(subject: string | null | undefined) {
  let value = String(subject ?? '');
  while (REPLY_PREFIX.test(value)) value = value.replace(REPLY_PREFIX, '');
  return value.replace(/\s+/g, ' ').trim();
}

/** Comparison key for thread matching: no Re:/Fwd: prefixes, collapsed spaces, lowercase. */
export function normalizeSubject(subject: string | null | undefined) {
  return stripSubjectPrefixes(subject).toLowerCase();
}

/** `Re: <subject>` without ever stacking `Re: Re:`. */
export function replySubject(subject: string | null | undefined) {
  const value = String(subject ?? '').replace(/\s+/g, ' ').trim();
  const withoutRe = value.replace(/^(?:re\s*(?:\[\d+\])?\s*:\s*)+/i, '');
  return `Re: ${withoutRe || '(no subject)'}`;
}

// ---------------------------------------------------------------------------
// Threading headers
// ---------------------------------------------------------------------------

export function parseMessageIds(header: string | null | undefined): string[] {
  const value = String(header ?? '').trim();
  if (!value) return [];
  const bracketed = value.match(/<[^<>\s]+>/g);
  if (bracketed) return bracketed;
  return value
    .split(/\s+/)
    .filter((token) => token.includes('@'))
    .map((token) => `<${token}>`);
}

export function normalizeMessageId(id: string | null | undefined) {
  return parseMessageIds(id)[0] ?? null;
}

export function getHeader(headers: Record<string, unknown> | null | undefined, name: string) {
  if (!headers) return null;
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== target) continue;
    return Array.isArray(value) ? value.map(String).join(' ') : String(value ?? '');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Forwarded mail (ImprovMX → Resend managed receiving address)
// ---------------------------------------------------------------------------

export const OWN_DOMAIN = 'beyonvital.com';

export function isOwnDomainAddress(email: string | null | undefined) {
  return String(email ?? '').trim().toLowerCase().endsWith(`@${OWN_DOMAIN}`);
}

/** Resend's managed receiving address (…@<id>.resend.app); never shown to the user. */
export function isForwarderAddress(email: string | null | undefined) {
  return /@([a-z0-9-]+\.)*resend\.app$/i.test(String(email ?? '').trim());
}

/** Every address in a To/Cc style header, lowercased (display names dropped). */
export function extractAddresses(header: string | null | undefined) {
  return Array.from(new Set((String(header ?? '').match(/[^\s<>,;"'()]+@[^\s<>,;"'()]+\.[a-z]{2,24}/gi) ?? []).map((item) => item.toLowerCase())));
}

/**
 * The recipients the sender actually addressed, read from the original headers the
 * forwarder preserved. The resend.app hop is removed; if no To survives,
 * Delivered-To / X-Original-To name the @beyonvital.com address, else hello@.
 */
export function originalRecipients(email: Pick<ReceivedEmail, 'to' | 'cc' | 'headers'>) {
  const visible = (list: string[]) => list.filter((address) => !isForwarderAddress(address));
  let to = visible(extractAddresses(getHeader(email.headers, 'to')));
  if (!to.length) to = visible((email.to ?? []).flatMap((item) => extractAddresses(item)));
  if (!to.some(isOwnDomainAddress)) {
    const delivered = visible([
      ...extractAddresses(getHeader(email.headers, 'delivered-to')),
      ...extractAddresses(getHeader(email.headers, 'x-original-to'))
    ]).filter(isOwnDomainAddress);
    to = Array.from(new Set([...to, ...delivered]));
  }
  if (!to.length) to = [INBOX_ADDRESS];
  let cc = visible(extractAddresses(getHeader(email.headers, 'cc')));
  if (!cc.length) cc = visible((email.cc ?? []).flatMap((item) => extractAddresses(item)));
  return { to, cc: cc.filter((address) => !to.includes(address)) };
}

/** Bounces and auto-replies: stored, but they never mark a conversation unread. */
export function isAutomatedEmail(fromEmail: string, headers: Record<string, unknown> | null | undefined) {
  const local = fromEmail.split('@')[0]?.toLowerCase() ?? '';
  if (local === 'mailer-daemon' || local === 'postmaster') return true;
  const autoSubmitted = getHeader(headers, 'auto-submitted')?.trim().toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') return true;
  if (getHeader(headers, 'x-autoreply') || getHeader(headers, 'x-autorespond')) return true;
  return getHeader(headers, 'precedence')?.trim().toLowerCase() === 'auto_reply';
}

export const ECHO_WINDOW_DAYS = 3;

const MAX_REFERENCES = 20;

export type ThreadHeaderSource = {
  direction: 'in' | 'out' | string;
  message_id: string | null;
  in_reply_to: string | null;
  references: string | null;
};

/**
 * Reply headers for a thread (oldest message first). In-Reply-To is the newest
 * inbound Message-ID; References is that message's own References chain plus
 * every known Message-ID up to it, ending with the parent (RFC 5322 §3.6.4).
 */
export function buildReplyHeaders(messages: ThreadHeaderSource[]): { inReplyTo: string | null; references: string | null } {
  let anchorIndex = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].direction === 'in' && normalizeMessageId(messages[i].message_id)) {
      anchorIndex = i;
      break;
    }
  }
  if (anchorIndex < 0) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (normalizeMessageId(messages[i].message_id)) {
        anchorIndex = i;
        break;
      }
    }
  }
  if (anchorIndex < 0) return { inReplyTo: null, references: null };

  const anchor = messages[anchorIndex];
  const inReplyTo = normalizeMessageId(anchor.message_id) as string;
  const chain: string[] = [];
  const add = (id: string | null) => {
    if (id && !chain.includes(id)) chain.push(id);
  };

  const inherited = parseMessageIds(anchor.references);
  (inherited.length ? inherited : parseMessageIds(anchor.in_reply_to)).forEach(add);
  messages.slice(0, anchorIndex + 1).forEach((message) => add(normalizeMessageId(message.message_id)));

  const ordered = [...chain.filter((id) => id !== inReplyTo), inReplyTo];
  // Long chains keep the thread root plus the most recent ids.
  const trimmed = ordered.length > MAX_REFERENCES ? [ordered[0], ...ordered.slice(-(MAX_REFERENCES - 1))] : ordered;
  return { inReplyTo, references: trimmed.join(' ') };
}

// ---------------------------------------------------------------------------
// Thread matching
// ---------------------------------------------------------------------------

export type ThreadCandidate = { id: string; subject: string; participant_email: string; last_message_at: string };

export interface ThreadLookup {
  findThreadIdByMessageIds(messageIds: string[]): Promise<string | null>;
  findRecentThreadsByParticipant(email: string, sinceIso: string): Promise<ThreadCandidate[]>;
}

export type ThreadMatch = { threadId: string; matchedBy: 'headers' | 'subject' };

/**
 * 1. In-Reply-To / References names a Message-ID we stored → that thread.
 * 2. Same participant and same normalized subject, active within 30 days → newest such thread.
 * 3. Otherwise null (caller starts a new thread).
 */
export async function matchThread(
  input: { fromEmail: string; subject: string | null | undefined; inReplyTo?: string | null; references?: string | null; now?: Date },
  lookup: ThreadLookup
): Promise<ThreadMatch | null> {
  const ids = Array.from(new Set([...parseMessageIds(input.inReplyTo), ...parseMessageIds(input.references)]));
  if (ids.length) {
    const threadId = await lookup.findThreadIdByMessageIds(ids);
    if (threadId) return { threadId, matchedBy: 'headers' };
  }

  const subject = normalizeSubject(input.subject);
  const email = input.fromEmail.trim().toLowerCase();
  if (!subject || !email) return null;

  const since = new Date((input.now ?? new Date()).getTime() - SUBJECT_MATCH_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await lookup.findRecentThreadsByParticipant(email, since.toISOString());
  const match = candidates
    .filter(
      (candidate) =>
        candidate.participant_email.toLowerCase() === email &&
        normalizeSubject(candidate.subject) === subject &&
        new Date(candidate.last_message_at).getTime() >= since.getTime()
    )
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())[0];

  return match ? { threadId: match.id, matchedBy: 'subject' } : null;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

export function htmlToPlainText(html: string) {
  return String(html ?? '')
    .replace(/<(style|script|head|title)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

/** Drops quoted history ("On … wrote:", "> " lines) so previews show the new text. */
export function stripQuotedReply(text: string | null | undefined) {
  const original = String(text ?? '');
  const kept: string[] = [];
  for (const line of original.split(/\r?\n/)) {
    if (/^\s*On .{3,300}wrote:\s*$/.test(line) || /^\s*-{2,}\s*(Original Message|Forwarded message)/i.test(line)) break;
    if (/^\s*>/.test(line)) continue;
    kept.push(line);
  }
  return kept.join('\n').trim() || original.trim();
}

export function makeSnippet(text: string | null | undefined, max = 180) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

// ---------------------------------------------------------------------------
// Inbound processing
// ---------------------------------------------------------------------------

export type StoredAttachment = {
  id: string;
  filename: string | null;
  content_type: string;
  size: number;
  content_id: string | null;
  inline: boolean;
};

export type ReceivedEmail = {
  id: string;
  from: string;
  to: string[];
  cc: string[] | null;
  subject: string;
  html: string | null;
  text: string | null;
  headers: Record<string, string> | null;
  message_id: string | null;
  created_at: string;
  attachments: Array<{
    id: string;
    filename: string | null;
    size: number;
    content_type: string;
    content_id?: string | null;
    content_disposition?: string | null;
  }>;
};

export type ForwardStatus = 'pending' | 'forwarded' | 'failed' | 'skipped';

export type InboxMessageInsert = {
  thread_id: string;
  direction: 'in' | 'out';
  resend_email_id: string | null;
  message_id: string | null;
  in_reply_to: string | null;
  references: string | null;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[];
  subject: string;
  text_body: string | null;
  html_body: string | null;
  attachments: StoredAttachment[];
  forward_status: ForwardStatus | null;
  forward_error: string | null;
  created_at: string;
};

export interface InboxRepo extends ThreadLookup {
  findMessageByResendId(resendEmailId: string): Promise<{ id: string; thread_id: string } | null>;
  createThread(input: {
    subject: string;
    participant_email: string;
    participant_name: string | null;
    snippet: string;
    last_message_at: string;
    unread: boolean;
  }): Promise<{ id: string }>;
  deleteThread(id: string): Promise<void>;
  /** Must report `{ duplicate: true }` when resend_email_id already exists. */
  insertMessage(row: InboxMessageInsert): Promise<{ id: string } | { duplicate: true }>;
  /** Subjects of outbound messages sent since the given time (for echo suppression). */
  findRecentOutboundSubjects(sinceIso: string): Promise<string[]>;
  touchThread(id: string, patch: { last_message_at: string; snippet: string; unread?: boolean; archived_at?: null }): Promise<void>;
  updateMessage(id: string, patch: { forward_status: ForwardStatus; forward_error: string | null }): Promise<void>;
}

export interface ReceivingClient {
  get(emailId: string): Promise<ReceivedEmail>;
  forward(input: { emailId: string; to: string; from: string }): Promise<{ id: string }>;
}

export type InboundResult =
  | { status: 'duplicate'; threadId: string }
  | { status: 'ignored'; reason: 'echo' }
  | { status: 'stored'; threadId: string; messageId: string; matchedBy: 'headers' | 'subject' | 'new' };

export function toStoredAttachments(list: ReceivedEmail['attachments'] | null | undefined): StoredAttachment[] {
  return (list ?? []).map((item) => ({
    id: String(item.id),
    filename: item.filename ?? null,
    content_type: item.content_type || 'application/octet-stream',
    size: Number(item.size) || 0,
    content_id: item.content_id ?? null,
    inline: item.content_disposition === 'inline'
  }));
}

export function parseStoredAttachments(value: unknown): StoredAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'string') return [];
    return [
      {
        id: row.id,
        filename: typeof row.filename === 'string' ? row.filename : null,
        content_type: typeof row.content_type === 'string' ? row.content_type : 'application/octet-stream',
        size: typeof row.size === 'number' ? row.size : 0,
        content_id: typeof row.content_id === 'string' ? row.content_id : null,
        inline: row.inline === true
      }
    ];
  });
}

function errorText(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}

function validIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Stores one received email and forwards a copy. Idempotent on the Resend email
 * id: a retried webhook finds the stored row (or loses the unique-constraint race)
 * and neither stores nor forwards again. Forwarding failures are recorded on the
 * message and never thrown, so the webhook still gets a 2xx.
 */
export async function processInboundEmail(
  emailId: string,
  deps: {
    repo: InboxRepo;
    receiving: ReceivingClient;
    /** Null when the Gmail copy is delivered some other way (e.g. ImprovMX); the message is marked `skipped`. */
    forwardTo: string | null;
    forwardFrom?: string;
    now?: () => Date;
    /** Runs the forward after the response (e.g. Next `after`); awaited inline when omitted. */
    defer?: (task: () => Promise<void>) => void;
  }
): Promise<InboundResult> {
  const existing = await deps.repo.findMessageByResendId(emailId);
  if (existing) return { status: 'duplicate', threadId: existing.thread_id };

  const email = await deps.receiving.get(emailId);
  const now = deps.now?.() ?? new Date();
  const sender = parseMailbox(email.from) ?? { email: String(email.from ?? '').trim().toLowerCase(), name: null };
  const inReplyTo = getHeader(email.headers, 'in-reply-to');
  const references = getHeader(email.headers, 'references');
  const text = email.text ?? (email.html ? htmlToPlainText(email.html) : '');
  const snippet = makeSnippet(stripQuotedReply(text));
  const receivedAt = validIso(email.created_at) ?? now.toISOString();
  const subject = String(email.subject ?? '').trim();
  const recipients = originalRecipients(email);
  const automated = isAutomatedEmail(sender.email, email.headers);

  // A copy of our own outbound mail (e.g. someone cc'd hello@) comes back through
  // the forwarder: drop it instead of stacking a duplicate in the thread.
  if (isOwnDomainAddress(sender.email)) {
    const since = new Date(now.getTime() - ECHO_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const sent = await deps.repo.findRecentOutboundSubjects(since);
    if (sent.some((item) => normalizeSubject(item) === normalizeSubject(subject))) return { status: 'ignored', reason: 'echo' };
  }

  const match = await matchThread({ fromEmail: sender.email, subject, inReplyTo, references, now }, deps.repo);
  const threadId =
    match?.threadId ??
    (
      await deps.repo.createThread({
        subject: subject || '(no subject)',
        participant_email: sender.email,
        participant_name: sender.name,
        snippet,
        last_message_at: receivedAt,
        unread: !automated
      })
    ).id;

  const inserted = await deps.repo.insertMessage({
    thread_id: threadId,
    direction: 'in',
    resend_email_id: emailId,
    // The original header wins: behind a forwarder the API's message_id can be the forwarder's.
    message_id: normalizeMessageId(getHeader(email.headers, 'message-id') || email.message_id),
    in_reply_to: inReplyTo,
    references,
    from_email: sender.email,
    from_name: sender.name,
    to_emails: recipients.to,
    cc_emails: recipients.cc,
    subject,
    text_body: text || null,
    html_body: email.html,
    attachments: toStoredAttachments(email.attachments),
    forward_status: deps.forwardTo?.trim() ? 'pending' : 'skipped',
    forward_error: null,
    created_at: receivedAt
  });

  if ('duplicate' in inserted) {
    // A concurrent delivery of the same webhook won; drop the thread we just opened.
    if (!match) await deps.repo.deleteThread(threadId);
    const winner = await deps.repo.findMessageByResendId(emailId);
    return { status: 'duplicate', threadId: winner?.thread_id ?? threadId };
  }

  await deps.repo.touchThread(
    threadId,
    automated ? { last_message_at: receivedAt, snippet } : { last_message_at: receivedAt, snippet, unread: true, archived_at: null }
  );

  const forwardTo = deps.forwardTo?.trim();
  if (forwardTo) {
    const forward = async () => {
      try {
        await deps.receiving.forward({ emailId, to: forwardTo, from: deps.forwardFrom ?? INBOX_FROM });
        await deps.repo.updateMessage(inserted.id, { forward_status: 'forwarded', forward_error: null });
      } catch (error) {
        await deps.repo.updateMessage(inserted.id, { forward_status: 'failed', forward_error: errorText(error) }).catch(() => undefined);
      }
    };
    if (deps.defer) deps.defer(forward);
    else await forward();
  }

  return { status: 'stored', threadId, messageId: inserted.id, matchedBy: match?.matchedBy ?? 'new' };
}

// ---------------------------------------------------------------------------
// Inbound HTML
// ---------------------------------------------------------------------------

const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp);base64,/i;

/**
 * Allow-list sanitizer for received HTML: no scripts, event handlers, iframes,
 * forms, objects or <style> blocks; links open in a new tab without referrer.
 * Remote images are removed (and counted) unless `allowRemoteImages` is set.
 */
export function sanitizeInboundHtml(html: string, options: { allowRemoteImages?: boolean } = {}) {
  let blockedImages = 0;
  const clean = sanitizeHtml(String(html ?? ''), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'font', 'center', 'u', 's', 'strike', 'small', 'big'],
    disallowedTagsMode: 'discard',
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'title', 'head', 'template', 'select', 'button'],
    allowedAttributes: {
      '*': ['style', 'align', 'valign', 'width', 'height', 'bgcolor', 'border', 'dir', 'lang', 'title'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
      table: ['cellpadding', 'cellspacing'],
      td: ['colspan', 'rowspan', 'nowrap'],
      th: ['colspan', 'rowspan'],
      font: ['color', 'face', 'size']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' } }),
      img: (tagName, attribs) => {
        const src = String(attribs.src ?? '').trim();
        const next = { ...attribs };
        if (/^https?:/i.test(src)) {
          if (!options.allowRemoteImages) {
            delete next.src;
            next.alt = attribs.alt || 'Image hidden';
            blockedImages += 1;
          }
        } else if (!SAFE_DATA_IMAGE.test(src)) {
          delete next.src;
        }
        return { tagName, attribs: next };
      }
    }
  });
  return { html: clean, blockedImages };
}

/**
 * Standalone document for a sandboxed iframe. The CSP is a second wall behind the
 * sanitizer: no scripts at all, and no remote loads (including CSS url()) unless
 * images were explicitly allowed.
 */
export function buildSafeEmailDocument(cleanHtml: string, options: { allowRemoteImages?: boolean } = {}) {
  const imgSrc = options.allowRemoteImages ? 'data: https: http:' : 'data:';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${imgSrc}; style-src 'unsafe-inline'; font-src data:"><base target="_blank"><style>html,body{margin:0;padding:0;background:#fff}body{padding:2px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1F1A17;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%!important}a{color:#A8392A}</style></head><body>${cleanHtml}</body></html>`;
}
