-- Admin inbox: mail received at beyonvital.com through Resend Inbound, plus the
-- 1:1 replies and new messages sent from the admin. Touches schema `beyon` only.
--
-- inbox_threads: one conversation with one outside participant.
--   * snippet: short preview of the newest message, kept current on every message
--   * unread: true when an inbound message arrives, cleared when the thread is opened
--
-- inbox_messages: every inbound and outbound message.
--   * resend_email_id: Resend's id (received email id for inbound, sent email id for
--     outbound); unique so a retried webhook cannot store the same email twice
--   * message_id / in_reply_to / references: RFC 5322 threading headers
--   * attachments: metadata only (id, filename, content_type, size); bytes stay in
--     Resend and are downloaded through a short-lived URL on request
--   * forward_status / forward_error: the copy forwarded to the client's Gmail
--   * sent_status / send_error: outbound delivery to Resend

create table if not exists beyon.inbox_threads (
  id uuid primary key default gen_random_uuid(),
  subject text not null default '',
  participant_email text not null,
  participant_name text,
  snippet text not null default '',
  last_message_at timestamptz not null default now(),
  unread boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inbox_threads_list_idx
  on beyon.inbox_threads (last_message_at desc)
  where archived_at is null;

create index if not exists inbox_threads_archived_idx
  on beyon.inbox_threads (archived_at, last_message_at desc);

create index if not exists inbox_threads_participant_idx
  on beyon.inbox_threads (participant_email, last_message_at desc);

create table if not exists beyon.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references beyon.inbox_threads (id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  resend_email_id text unique,
  message_id text,
  in_reply_to text,
  "references" text,
  from_email text not null,
  from_name text,
  to_emails text[] not null default '{}',
  cc_emails text[] not null default '{}',
  subject text not null default '',
  text_body text,
  html_body text,
  attachments jsonb not null default '[]'::jsonb,
  forward_status text check (forward_status in ('pending', 'forwarded', 'failed', 'skipped')),
  forward_error text,
  sent_status text check (sent_status in ('sending', 'sent', 'failed')),
  send_error text,
  created_at timestamptz not null default now()
);

create index if not exists inbox_messages_thread_created_idx
  on beyon.inbox_messages (thread_id, created_at);

create index if not exists inbox_messages_message_id_idx
  on beyon.inbox_messages (message_id)
  where message_id is not null;

alter table beyon.inbox_threads enable row level security;
alter table beyon.inbox_messages enable row level security;

revoke all on beyon.inbox_threads from public, anon, authenticated;
revoke all on beyon.inbox_messages from public, anon, authenticated;
grant all privileges on beyon.inbox_threads to service_role;
grant all privileges on beyon.inbox_messages to service_role;

select pg_notify('pgrst', 'reload schema');
