// Unit tests for the admin inbox core. No network, no database: Resend and
// Supabase are replaced by in-memory fakes. Run with `npm test`.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReplyHeaders,
  buildSafeEmailDocument,
  matchThread,
  normalizeSubject,
  parseRecipientList,
  processInboundEmail,
  replySubject,
  sanitizeInboundHtml,
  signWebhookPayload,
  verifyWebhookSignature,
  type InboxMessageInsert,
  type InboxRepo,
  type ReceivedEmail,
  type ReceivingClient,
  type ThreadCandidate
} from '../lib/inbox/core';

const SECRET = `whsec_${Buffer.from('unit-test-secret-not-a-real-key!').toString('base64')}`;
const NOW = 1_800_000_000;

function signed(payload: string, overrides: { secret?: string; timestamp?: number; id?: string } = {}) {
  const id = overrides.id ?? 'msg_test_1';
  const timestamp = String(overrides.timestamp ?? NOW);
  const signature = signWebhookPayload({ payload, secret: overrides.secret ?? SECRET, id, timestamp });
  return { id, timestamp, signature };
}

// ---------------------------------------------------------------------------
// Webhook signatures
// ---------------------------------------------------------------------------

test('webhook signature: valid signature passes', () => {
  const payload = JSON.stringify({ type: 'email.received', data: { email_id: 'e1' } });
  const result = verifyWebhookSignature({ payload, headers: signed(payload), secret: SECRET, nowSeconds: NOW });
  assert.deepEqual(result, { ok: true });
});

test('webhook signature: one valid entry among several passes (secret rotation)', () => {
  const payload = '{"a":1}';
  const headers = signed(payload);
  headers.signature = `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${headers.signature}`;
  assert.deepEqual(verifyWebhookSignature({ payload, headers, secret: SECRET, nowSeconds: NOW }), { ok: true });
});

test('webhook signature: tampered payload fails', () => {
  const headers = signed('{"type":"email.received"}');
  const result = verifyWebhookSignature({ payload: '{"type":"email.received","x":1}', headers, secret: SECRET, nowSeconds: NOW });
  assert.deepEqual(result, { ok: false, reason: 'bad_signature' });
});

test('webhook signature: wrong secret fails', () => {
  const payload = '{}';
  const other = `whsec_${Buffer.from('a-different-secret-entirely-000!').toString('base64')}`;
  const result = verifyWebhookSignature({ payload, headers: signed(payload, { secret: other }), secret: SECRET, nowSeconds: NOW });
  assert.deepEqual(result, { ok: false, reason: 'bad_signature' });
});

test('webhook signature: timestamp older or newer than 5 minutes is expired', () => {
  const payload = '{}';
  const old = signed(payload, { timestamp: NOW - 301 });
  assert.deepEqual(verifyWebhookSignature({ payload, headers: old, secret: SECRET, nowSeconds: NOW }), { ok: false, reason: 'expired' });
  const future = signed(payload, { timestamp: NOW + 301 });
  assert.deepEqual(verifyWebhookSignature({ payload, headers: future, secret: SECRET, nowSeconds: NOW }), { ok: false, reason: 'expired' });
  const edge = signed(payload, { timestamp: NOW - 299 });
  assert.deepEqual(verifyWebhookSignature({ payload, headers: edge, secret: SECRET, nowSeconds: NOW }), { ok: true });
});

test('webhook signature: missing headers or secret fail closed', () => {
  const payload = '{}';
  assert.deepEqual(
    verifyWebhookSignature({ payload, headers: { id: null, timestamp: null, signature: null }, secret: SECRET, nowSeconds: NOW }),
    { ok: false, reason: 'missing_headers' }
  );
  assert.deepEqual(verifyWebhookSignature({ payload, headers: signed(payload), secret: '', nowSeconds: NOW }), {
    ok: false,
    reason: 'missing_secret'
  });
  assert.deepEqual(verifyWebhookSignature({ payload, headers: signed(payload), secret: undefined, nowSeconds: NOW }), {
    ok: false,
    reason: 'missing_secret'
  });
  const badTimestamp = { ...signed(payload), timestamp: 'yesterday' };
  assert.deepEqual(verifyWebhookSignature({ payload, headers: badTimestamp, secret: SECRET, nowSeconds: NOW }), {
    ok: false,
    reason: 'bad_timestamp'
  });
});

// ---------------------------------------------------------------------------
// Subjects, recipients, reply headers
// ---------------------------------------------------------------------------

test('replySubject never doubles Re:', () => {
  assert.equal(replySubject('Tour question'), 'Re: Tour question');
  assert.equal(replySubject('Re: Tour question'), 'Re: Tour question');
  assert.equal(replySubject('RE: re: Tour question'), 'Re: Tour question');
  assert.equal(replySubject('Re[2]: Tour question'), 'Re: Tour question');
  assert.equal(replySubject('Fwd: Tour question'), 'Re: Fwd: Tour question');
  assert.equal(replySubject(''), 'Re: (no subject)');
});

test('normalizeSubject strips Re:/Fwd: prefixes and case', () => {
  assert.equal(normalizeSubject('Re: FWD:  Tour   Question'), 'tour question');
  assert.equal(normalizeSubject('AW: Re[3]: Hello'), 'hello');
  assert.equal(normalizeSubject('Regarding the house'), 'regarding the house');
});

test('parseRecipientList validates, de-duplicates and caps at 10', () => {
  assert.deepEqual(parseRecipientList('a@example.com, Jane Doe <B@Example.com>; a@example.com'), {
    ok: true,
    emails: ['a@example.com', 'b@example.com']
  });
  const invalid = parseRecipientList('a@example.com, not-an-email');
  assert.equal(invalid.ok, false);
  const many = Array.from({ length: 11 }, (_, i) => `p${i}@example.com`).join(',');
  assert.deepEqual(parseRecipientList(many), { ok: false, error: 'Use at most 10 addresses.' });
  assert.deepEqual(parseRecipientList(''), { ok: true, emails: [] });
});

test('buildReplyHeaders: In-Reply-To is the last inbound Message-ID, References is the chain ending with it', () => {
  const headers = buildReplyHeaders([
    { direction: 'in', message_id: '<root@mail.example>', in_reply_to: null, references: null },
    { direction: 'out', message_id: null, in_reply_to: '<root@mail.example>', references: '<root@mail.example>' },
    { direction: 'in', message_id: '<second@mail.example>', in_reply_to: '<sent@resend.dev>', references: '<root@mail.example> <sent@resend.dev>' },
    { direction: 'out', message_id: null, in_reply_to: '<second@mail.example>', references: null }
  ]);
  assert.equal(headers.inReplyTo, '<second@mail.example>');
  assert.equal(headers.references, '<root@mail.example> <sent@resend.dev> <second@mail.example>');
});

test('buildReplyHeaders: bare ids get brackets, empty thread gives no headers', () => {
  assert.deepEqual(buildReplyHeaders([{ direction: 'in', message_id: 'abc@x.example', in_reply_to: null, references: null }]), {
    inReplyTo: '<abc@x.example>',
    references: '<abc@x.example>'
  });
  assert.deepEqual(buildReplyHeaders([]), { inReplyTo: null, references: null });
});

test('buildReplyHeaders: long chains keep the root and stay bounded', () => {
  const refs = Array.from({ length: 40 }, (_, i) => `<r${i}@x.example>`).join(' ');
  const headers = buildReplyHeaders([{ direction: 'in', message_id: '<last@x.example>', in_reply_to: null, references: refs }]);
  const ids = String(headers.references).split(' ');
  assert.equal(ids.length, 20);
  assert.equal(ids[0], '<r0@x.example>');
  assert.equal(ids.at(-1), '<last@x.example>');
});

// ---------------------------------------------------------------------------
// Thread matching + inbound processing (in-memory fakes)
// ---------------------------------------------------------------------------

type MemoryThread = ThreadCandidate & { participant_name: string | null; snippet: string; unread: boolean; archived_at: string | null };

function memoryRepo() {
  const threads = new Map<string, MemoryThread>();
  const messages: Array<InboxMessageInsert & { id: string }> = [];
  let seq = 0;
  const repo: InboxRepo = {
    async findMessageByResendId(id) {
      const found = messages.find((message) => message.resend_email_id === id);
      return found ? { id: found.id, thread_id: found.thread_id } : null;
    },
    async findThreadIdByMessageIds(ids) {
      const found = [...messages].reverse().find((message) => message.message_id && ids.includes(message.message_id));
      return found?.thread_id ?? null;
    },
    async findRecentThreadsByParticipant(email, sinceIso) {
      return [...threads.values()].filter((thread) => thread.participant_email === email && thread.last_message_at >= sinceIso);
    },
    async createThread(input) {
      seq += 1;
      const id = `thread-${seq}`;
      threads.set(id, { id, ...input, archived_at: null });
      return { id };
    },
    async deleteThread(id) {
      threads.delete(id);
    },
    async insertMessage(row) {
      if (row.resend_email_id && messages.some((message) => message.resend_email_id === row.resend_email_id)) return { duplicate: true };
      seq += 1;
      const id = `msg-${seq}`;
      messages.push({ ...row, id });
      return { id };
    },
    async findRecentOutboundSubjects(sinceIso) {
      return messages.filter((message) => message.direction === 'out' && message.created_at >= sinceIso).map((message) => message.subject);
    },
    async touchThread(id, patch) {
      Object.assign(threads.get(id) as MemoryThread, patch);
    },
    async updateMessage(id, patch) {
      Object.assign(messages.find((message) => message.id === id) as InboxMessageInsert, patch);
    }
  };
  return { repo, threads, messages };
}

function fakeReceiving(emails: Record<string, ReceivedEmail>, options: { failForward?: boolean } = {}) {
  const calls = { get: [] as string[], forward: [] as Array<{ emailId: string; to: string; from: string }> };
  const client: ReceivingClient = {
    async get(id) {
      calls.get.push(id);
      const email = emails[id];
      if (!email) throw new Error(`unknown email ${id}`);
      return email;
    },
    async forward(input) {
      calls.forward.push(input);
      if (options.failForward) throw new Error('Resend returned 500');
      return { id: `fwd-${input.emailId}` };
    }
  };
  return { client, calls };
}

function receivedEmail(overrides: Partial<ReceivedEmail> & { id: string }): ReceivedEmail {
  return {
    from: 'Pat Example <pat@example.com>',
    to: ['hello@beyonvital.com'],
    cc: null,
    subject: 'Question about a tour',
    html: '<p>Hello there</p>',
    text: 'Hello there',
    headers: {},
    message_id: `<${overrides.id}@mail.example.com>`,
    created_at: '2026-09-13T12:00:00.000Z',
    attachments: [],
    ...overrides
  };
}

const FORWARD_TO = 'client-inbox@example.com';
const clock = () => new Date('2026-09-13T12:05:00.000Z');

test('processInboundEmail is idempotent on the Resend email id', async () => {
  const { repo, messages, threads } = memoryRepo();
  const { client, calls } = fakeReceiving({ e1: receivedEmail({ id: 'e1' }) });
  const deps = { repo, receiving: client, forwardTo: FORWARD_TO, now: clock };

  const first = await processInboundEmail('e1', deps);
  const second = await processInboundEmail('e1', deps);

  assert.equal(first.status, 'stored');
  assert.deepEqual(second, { status: 'duplicate', threadId: first.threadId });
  assert.equal(messages.length, 1);
  assert.equal(threads.size, 1);
  assert.equal(calls.get.length, 1, 'content fetched once');
  assert.equal(calls.forward.length, 1, 'forwarded once');
  assert.equal(messages[0].forward_status, 'forwarded');
  assert.equal(calls.forward[0].from, 'Beyon Vital <hello@beyonvital.com>');
  assert.equal(calls.forward[0].to, FORWARD_TO);
});

test('processInboundEmail: losing a concurrent insert race stores nothing and forwards nothing', async () => {
  const { repo, messages, threads } = memoryRepo();
  const { client, calls } = fakeReceiving({ e2: receivedEmail({ id: 'e2' }) });
  await processInboundEmail('e2', { repo, receiving: client, forwardTo: FORWARD_TO, now: clock });

  // Simulate the second delivery passing the pre-check before the first row was visible.
  const racingRepo: InboxRepo = { ...repo, findMessageByResendId: (() => {
    let calledOnce = false;
    return async (id: string) => {
      if (!calledOnce) {
        calledOnce = true;
        return null;
      }
      return repo.findMessageByResendId(id);
    };
  })() };
  // Different subject so the race path opens (and must then delete) a new thread.
  const { client: client2, calls: calls2 } = fakeReceiving({ e2: receivedEmail({ id: 'e2', subject: 'Something else' }) });
  const result = await processInboundEmail('e2', { repo: racingRepo, receiving: client2, forwardTo: FORWARD_TO, now: clock });

  assert.equal(result.status, 'duplicate');
  assert.equal(messages.length, 1);
  assert.equal(threads.size, 1, 'orphan thread removed');
  assert.equal(calls.forward.length + calls2.forward.length, 1);
});

test('processInboundEmail records a forward failure and still stores the message', async () => {
  const { repo, messages, threads } = memoryRepo();
  const { client } = fakeReceiving({ e3: receivedEmail({ id: 'e3' }) }, { failForward: true });
  const result = await processInboundEmail('e3', { repo, receiving: client, forwardTo: FORWARD_TO, now: clock });
  assert.equal(result.status, 'stored');
  assert.equal(messages[0].forward_status, 'failed');
  assert.match(String(messages[0].forward_error), /500/);
  assert.equal([...threads.values()][0].unread, true);
});

test('processInboundEmail without a forward address stores the message and skips forwarding', async () => {
  const { repo, messages } = memoryRepo();
  const { client, calls } = fakeReceiving({ e4: receivedEmail({ id: 'e4' }) });
  const result = await processInboundEmail('e4', { repo, receiving: client, forwardTo: null, now: clock });
  assert.equal(result.status, 'stored');
  assert.equal(calls.forward.length, 0);
  assert.equal(messages[0].forward_status, 'skipped');
});

test('forwarded message (resend.app envelope, original To hello@) lands with the real sender and recipient', async () => {
  const { repo, threads, messages } = memoryRepo();
  const { client, calls } = fakeReceiving({
    f1: receivedEmail({
      id: 'f1',
      from: '"Jordan Rivera" <jordan@example.com>',
      to: ['beyon-inbox@abc123.resend.app'],
      message_id: '<forwarder-hop@improvmx.com>',
      headers: {
        To: 'Beyon Vital <hello@beyonvital.com>, beyon-inbox@abc123.resend.app',
        Cc: 'tours@beyonvital.com',
        'Message-ID': '<original-1@mail.example.com>',
        'Delivered-To': 'beyon-inbox@abc123.resend.app'
      }
    }),
    f2: receivedEmail({
      id: 'f2',
      from: 'someone@example.org',
      to: ['beyon-inbox@abc123.resend.app'],
      headers: { To: 'beyon-inbox@abc123.resend.app', 'X-Original-To': 'info@beyonvital.com' }
    })
  });
  const deps = { repo, receiving: client, forwardTo: null, now: clock };
  const first = await processInboundEmail('f1', deps);
  await processInboundEmail('f2', deps);

  if (first.status !== 'stored') throw new Error(`expected stored, got ${first.status}`);
  const thread = threads.get(first.threadId) as MemoryThread;
  assert.equal(thread.participant_email, 'jordan@example.com');
  assert.equal(thread.participant_name, 'Jordan Rivera');
  assert.deepEqual(messages[0].to_emails, ['hello@beyonvital.com']);
  assert.deepEqual(messages[0].cc_emails, ['tours@beyonvital.com']);
  assert.equal(messages[0].message_id, '<original-1@mail.example.com>', 'original Message-ID header, not the forwarder hop');
  assert.deepEqual(messages[1].to_emails, ['info@beyonvital.com']);
  assert.ok(!JSON.stringify(messages).includes('resend.app'), 'forwarder address never stored');
  assert.equal(calls.forward.length, 0, 'FORWARD_INBOUND_TO unset → no forward call');
  assert.equal(messages[0].forward_status, 'skipped');

  const reply = buildReplyHeaders(messages.filter((message) => message.thread_id === first.threadId));
  assert.equal(reply.inReplyTo, '<original-1@mail.example.com>', 'replies thread on the original Message-ID');
});

test('echo of our own outbound mail is dropped; unrelated mail from our domain is kept', async () => {
  const { repo, messages } = memoryRepo();
  messages.push({
    id: 'out-1',
    thread_id: 'thread-x',
    direction: 'out',
    resend_email_id: 'sent-1',
    message_id: null,
    in_reply_to: null,
    references: null,
    from_email: 'hello@beyonvital.com',
    from_name: 'Beyon Vital',
    to_emails: ['pat@example.com'],
    cc_emails: ['hello@beyonvital.com'],
    subject: 'Re: Question about a tour',
    text_body: 'See you Tuesday',
    html_body: null,
    attachments: [],
    forward_status: null,
    forward_error: null,
    created_at: '2026-09-13T11:00:00.000Z'
  });
  const { client, calls } = fakeReceiving({
    echo: receivedEmail({ id: 'echo', from: 'Beyon Vital <hello@beyonvital.com>', subject: 'Re: Question about a tour' }),
    own: receivedEmail({ id: 'own', from: 'hello@beyonvital.com', subject: 'Staff schedule' })
  });
  const deps = { repo, receiving: client, forwardTo: 'client-inbox@example.com', now: clock };
  assert.deepEqual(await processInboundEmail('echo', deps), { status: 'ignored', reason: 'echo' });
  assert.equal((await processInboundEmail('own', deps)).status, 'stored');
  assert.equal(messages.filter((message) => message.direction === 'in').length, 1);
  assert.equal(calls.forward.length, 1, 'the echo is not forwarded');
});

test('bounces and auto-replies are stored but do not mark the conversation unread', async () => {
  const { repo, threads, messages } = memoryRepo();
  const { client } = fakeReceiving({
    bounce: receivedEmail({ id: 'bounce', from: 'Mail Delivery System <MAILER-DAEMON@mx.example.com>', subject: 'Undelivered Mail Returned to Sender' }),
    ooo: receivedEmail({ id: 'ooo', from: 'pat@example.com', subject: 'Out of office', headers: { 'Auto-Submitted': 'auto-replied' } }),
    human: receivedEmail({ id: 'human', from: 'pat@example.com', subject: 'Real question', headers: { 'Auto-Submitted': 'no' } })
  });
  const deps = { repo, receiving: client, forwardTo: null, now: clock };
  const bounce = await processInboundEmail('bounce', deps);
  const ooo = await processInboundEmail('ooo', deps);
  const human = await processInboundEmail('human', deps);
  assert.equal(messages.length, 3);
  assert.equal(bounce.status === 'stored' && (threads.get(bounce.threadId) as MemoryThread).unread, false);
  assert.equal(ooo.status === 'stored' && (threads.get(ooo.threadId) as MemoryThread).unread, false);
  assert.equal(human.status === 'stored' && (threads.get(human.threadId) as MemoryThread).unread, true);
});

test('matchThread: In-Reply-To/References join the thread even with a new subject', async () => {
  const { repo, threads } = memoryRepo();
  const { client } = fakeReceiving({
    a: receivedEmail({ id: 'a', message_id: '<orig@mail.example.com>' }),
    b: receivedEmail({
      id: 'b',
      from: 'someone-else@example.org',
      subject: 'Totally different',
      headers: { 'In-Reply-To': '<unknown@resend.dev>', References: '<orig@mail.example.com> <unknown@resend.dev>' }
    })
  });
  const deps = { repo, receiving: client, forwardTo: FORWARD_TO, now: clock };
  const first = await processInboundEmail('a', deps);
  const second = await processInboundEmail('b', deps);
  if (first.status !== 'stored' || second.status !== 'stored') throw new Error('expected both messages stored');
  assert.equal(second.threadId, first.threadId);
  assert.equal(second.matchedBy, 'headers');
  assert.equal(threads.size, 1);
});

test('matchThread: same participant + normalized subject within 30 days joins; older or other sender does not', async () => {
  const lookupThreads: ThreadCandidate[] = [
    { id: 'recent', subject: 'Question about a tour', participant_email: 'pat@example.com', last_message_at: '2026-09-01T00:00:00.000Z' },
    { id: 'old', subject: 'Old topic', participant_email: 'pat@example.com', last_message_at: '2026-08-01T00:00:00.000Z' }
  ];
  const lookup = {
    async findThreadIdByMessageIds() {
      return null;
    },
    async findRecentThreadsByParticipant(email: string) {
      // Deliberately ignores the date filter so matchThread's own window check is tested.
      return lookupThreads.filter((thread) => thread.participant_email === email);
    }
  };
  const now = new Date('2026-09-13T12:00:00.000Z');

  assert.deepEqual(await matchThread({ fromEmail: 'PAT@example.com', subject: 'RE: question about a  tour', now }, lookup), {
    threadId: 'recent',
    matchedBy: 'subject'
  });
  assert.equal(await matchThread({ fromEmail: 'pat@example.com', subject: 'Re: Old topic', now }, lookup), null, 'older than 30 days');
  assert.equal(await matchThread({ fromEmail: 'other@example.com', subject: 'Question about a tour', now }, lookup), null);
  assert.equal(await matchThread({ fromEmail: 'pat@example.com', subject: 'Re:', now }, lookup), null, 'empty subject never matches');
});

test('processInboundEmail: unmatched mail opens a new unread thread with a snippet', async () => {
  const { repo, threads, messages } = memoryRepo();
  const { client } = fakeReceiving({
    n1: receivedEmail({
      id: 'n1',
      text: 'Thanks for the info!\n\nOn Fri, Sep 12, 2026 at 9:00 AM Beyon Vital wrote:\n> old text',
      attachments: [{ id: 'att-1', filename: 'form.pdf', size: 2048, content_type: 'application/pdf', content_disposition: 'attachment' }]
    })
  });
  const result = await processInboundEmail('n1', { repo, receiving: client, forwardTo: FORWARD_TO, now: clock });
  assert.equal(result.status === 'stored' && result.matchedBy, 'new');
  const thread = [...threads.values()][0];
  assert.equal(thread.participant_email, 'pat@example.com');
  assert.equal(thread.participant_name, 'Pat Example');
  assert.equal(thread.snippet, 'Thanks for the info!');
  assert.equal(thread.unread, true);
  assert.deepEqual(messages[0].attachments, [
    { id: 'att-1', filename: 'form.pdf', content_type: 'application/pdf', size: 2048, content_id: null, inline: false }
  ]);
});

// ---------------------------------------------------------------------------
// HTML sanitizing
// ---------------------------------------------------------------------------

const MALICIOUS = `
<html><head><title>x</title><style>body{background:url(https://tracker.example/bg.png)}</style>
<script>alert('head')</script></head>
<body onload="steal()">
  <p onclick="steal()" style="color:#333">Hello <b>friend</b></p>
  <script>document.cookie</script>
  <img src="https://tracker.example/pixel.gif" onerror="steal()" width="1" height="1">
  <img src="data:image/png;base64,iVBORw0KGgo=" alt="inline">
  <img src="data:text/html;base64,PHNjcmlwdD4=" alt="bad data">
  <img src="//tracker.example/proto.gif">
  <a href="javascript:alert(1)">bad link</a>
  <a href="https://example.com/ok" target="_self">good link</a>
  <iframe src="https://evil.example"></iframe>
  <form action="https://evil.example/phish"><input name="password"><button>Log in</button></form>
  <svg><script>alert(2)</script></svg>
  <object data="evil.swf"></object><embed src="evil.swf">
  <table cellpadding="4"><tr><td bgcolor="#eee">cell</td></tr></table>
</body></html>`;

test('sanitizeInboundHtml strips scripts, handlers, iframes, forms and blocks remote images', () => {
  const { html, blockedImages } = sanitizeInboundHtml(MALICIOUS);
  const lower = html.toLowerCase();
  for (const forbidden of ['<script', 'alert(', 'onload', 'onclick', 'onerror', '<iframe', '<form', '<input', '<button', '<svg', '<object', '<embed', 'javascript:', '<style', 'tracker.example', 'data:text/html']) {
    assert.ok(!lower.includes(forbidden), `output must not contain ${forbidden}`);
  }
  assert.equal(blockedImages, 1);
  assert.ok(html.includes('<b>friend</b>'));
  assert.ok(html.includes('style="color:#333"'));
  assert.ok(html.includes('data:image/png;base64,iVBORw0KGgo='), 'inline raster data image kept');
  assert.ok(html.includes('href="https://example.com/ok"'));
  assert.ok(html.includes('rel="noopener noreferrer nofollow"'));
  assert.ok(html.includes('target="_blank"'));
  assert.ok(html.includes('bgcolor="#eee"'));
});

test('sanitizeInboundHtml keeps remote images only when allowed', () => {
  const { html, blockedImages } = sanitizeInboundHtml('<img src="https://cdn.example/logo.png" alt="logo" onerror="x()">', {
    allowRemoteImages: true
  });
  assert.equal(blockedImages, 0);
  assert.ok(html.includes('src="https://cdn.example/logo.png"'));
  assert.ok(!html.includes('onerror'));
});

test('buildSafeEmailDocument sets a no-script CSP that blocks remote loads by default', () => {
  const blocked = buildSafeEmailDocument('<p>x</p>');
  assert.match(blocked, /default-src 'none'; img-src data:;/);
  assert.ok(!blocked.includes('script-src'));
  const allowed = buildSafeEmailDocument('<p>x</p>', { allowRemoteImages: true });
  assert.match(allowed, /img-src data: https: http:;/);
});
