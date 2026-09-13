-- Newsletter double opt-in + serverless-safe rate limiting. Touches schema `beyon` only.
--
-- subscribers:
--   * new status 'pending' (signed up, not yet confirmed; never receives blasts)
--   * confirm_token_hash / confirm_token_expires_at / confirm_sent_at: the emailed
--     confirm link carries a random token; only its SHA-256 is stored
--   * confirmed_at: when the double opt-in link was clicked
--   * consent_source / consent_at: how and when marketing consent was given
--
-- rate_limit_hits: one row per protected request, keyed by a salted HMAC of the
-- client IP (raw IPs are never stored). Counted over a short window.

alter table beyon.subscribers
  add column if not exists confirm_token_hash text,
  add column if not exists confirm_token_expires_at timestamptz,
  add column if not exists confirm_sent_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists consent_source text,
  add column if not exists consent_at timestamptz;

alter table beyon.subscribers drop constraint if exists subscribers_status_check;
alter table beyon.subscribers
  add constraint subscribers_status_check
  check (status in ('pending', 'active', 'unsubscribed', 'bounced', 'complaint'));

-- A row created without an explicit status must not be mailable.
alter table beyon.subscribers alter column status set default 'pending';

create unique index if not exists subscribers_confirm_token_hash_key
  on beyon.subscribers (confirm_token_hash)
  where confirm_token_hash is not null;

create index if not exists subscribers_status_idx
  on beyon.subscribers (status);

create table if not exists beyon.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_bucket_key_created_idx
  on beyon.rate_limit_hits (bucket, key_hash, created_at desc);

create index if not exists rate_limit_hits_created_at_idx
  on beyon.rate_limit_hits (created_at);

alter table beyon.rate_limit_hits enable row level security;

revoke all on beyon.rate_limit_hits from public, anon, authenticated;
grant all privileges on beyon.rate_limit_hits to service_role;
grant all privileges on all sequences in schema beyon to service_role;

select pg_notify('pgrst', 'reload schema');
