-- Beyon Vital, LLC — application schema `beyon` (shared WalkPerro Supabase project).
--
-- One clean migration that reproduces the final state the app needs. It is the
-- squash of the 13 migrations from the source codebase (initial CMS, local leads, gallery rework,
-- subscriber opt-in, activity events, email compliance + geo, lead email
-- tracking, lead-note timestamps, admin notification tracking, subscriber phone,
-- soft-delete archiving, campaign-recipient ON CONFLICT fix) minus objects the
-- app no longer touches (`pages`, `gallery`).
--
-- Access model: the app talks to this schema only through the service role
-- (lib/supabase/cmsServer.ts). RLS is enabled on every table with no policies, so
-- anon/authenticated get nothing; service_role bypasses RLS.
--
-- After applying: add `beyon` to Project Settings -> Data API -> Exposed schemas,
-- otherwise PostgREST returns "Invalid schema: beyon".

create schema if not exists beyon;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create or replace function beyon.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- announcements (public banners; admin CRUD)
-- ---------------------------------------------------------------------------

create table if not exists beyon.announcements (
  id text primary key,
  title text not null,
  body text not null,
  active boolean not null default true,
  start_date date,
  end_date date,
  target_pages text[] not null default '{}',
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_active_priority_idx
  on beyon.announcements (active, priority, created_at desc);

-- ---------------------------------------------------------------------------
-- subscribers (email list; suppression statuses; soft delete)
-- ---------------------------------------------------------------------------

create table if not exists beyon.subscribers (
  id text primary key,
  email text not null,
  name text,
  phone text,
  source text not null default 'form',
  opted_in boolean not null default false,
  status text not null default 'active',
  unsubscribed_at timestamptz,
  bounced_at timestamptz,
  complaint_at timestamptz,
  unsubscribe_reason text,
  archived_at timestamptz,
  archived_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- upsertSubscriber() uses ON CONFLICT (email); the app lowercases before writing.
  constraint subscribers_email_key unique (email),
  constraint subscribers_status_check check (status in ('active', 'unsubscribed', 'bounced', 'complaint'))
);

create unique index if not exists subscribers_email_lower_key
  on beyon.subscribers (lower(email));

create index if not exists subscribers_created_at_idx
  on beyon.subscribers (created_at desc);

create index if not exists subscribers_archived_at_idx
  on beyon.subscribers (archived_at);

-- ---------------------------------------------------------------------------
-- leads (every website form submission)
-- ---------------------------------------------------------------------------

create table if not exists beyon.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text,
  contact_email text,
  contact_phone text,
  company_name text,
  message text,
  page_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  lead_type text,
  status text default 'new',
  forwarded_to_leadops boolean not null default false,
  leadops_forwarded_at timestamptz,
  leadops_error text,
  confirmation_sent_at timestamptz,
  followup_sent_at timestamptz,
  last_email_error text,
  admin_notified_at timestamptz,
  admin_notify_error text,
  archived_at timestamptz,
  archived_by text
);

create index if not exists leads_created_at_idx on beyon.leads (created_at desc);
create index if not exists leads_status_idx on beyon.leads (status);
create index if not exists leads_lead_type_idx on beyon.leads (lead_type);
create index if not exists leads_contact_email_idx on beyon.leads (contact_email);
create index if not exists leads_confirmation_sent_at_idx on beyon.leads (confirmation_sent_at);
create index if not exists leads_followup_sent_at_idx on beyon.leads (followup_sent_at);
create index if not exists leads_archived_at_idx on beyon.leads (archived_at);

-- ---------------------------------------------------------------------------
-- lead_notes (admin notes per lead; lead_id stores leads.id as text)
-- ---------------------------------------------------------------------------

create table if not exists beyon.lead_notes (
  id text primary key,
  lead_id text not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_id_idx
  on beyon.lead_notes (lead_id, created_at desc);

-- ---------------------------------------------------------------------------
-- activity_events (first-party analytics: page views, CTA clicks, form submits)
-- ---------------------------------------------------------------------------

create table if not exists beyon.activity_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  event_type text not null,
  page_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device text,
  city text,
  region text,
  country text,
  ip_hash text,
  user_agent text,
  cta_name text,
  form_name text,
  constraint activity_events_event_type_check check (event_type in ('page_view', 'cta_click', 'form_submit'))
);

create index if not exists activity_events_created_at_idx on beyon.activity_events (created_at desc);
create index if not exists activity_events_event_type_idx on beyon.activity_events (event_type);
create index if not exists activity_events_page_path_idx on beyon.activity_events (page_path);
create index if not exists activity_events_utm_campaign_idx on beyon.activity_events (utm_campaign);
create index if not exists activity_events_city_region_idx on beyon.activity_events (city, region);

-- ---------------------------------------------------------------------------
-- email_events (sends, failures, unsubscribes, Resend webhook payloads)
-- ---------------------------------------------------------------------------

create table if not exists beyon.email_events (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_events_email_created_at_idx
  on beyon.email_events (lower(email), created_at desc);

-- ---------------------------------------------------------------------------
-- email_campaigns + recipients (idempotent blasts)
-- ---------------------------------------------------------------------------

create table if not exists beyon.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  preview_text text,
  body text not null,
  audience_source text,
  idempotency_key text not null,
  status text not null default 'draft',
  sent_at timestamptz,
  total_recipients integer not null default 0,
  sent_count integer not null default 0,
  skipped_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_campaigns_idempotency_key_key unique (idempotency_key),
  constraint email_campaigns_status_check check (status in ('draft', 'sending', 'sent', 'failed'))
);

create table if not exists beyon.email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references beyon.email_campaigns (id) on delete cascade,
  email text not null,
  status text not null,
  reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint email_campaign_recipients_status_check check (status in ('sent', 'skipped'))
);

create index if not exists email_campaign_recipients_campaign_idx
  on beyon.email_campaign_recipients (campaign_id, created_at desc);

-- Plain-column unique: recordEmailCampaignRecipient() upserts with
-- ON CONFLICT (campaign_id, email), which cannot resolve against an expression
-- index on lower(email). Emails are lowercased before insert.
create unique index if not exists email_campaign_recipients_campaign_email_key
  on beyon.email_campaign_recipients (campaign_id, email);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists set_announcements_updated_at on beyon.announcements;
create trigger set_announcements_updated_at
  before update on beyon.announcements
  for each row execute function beyon.set_updated_at();

drop trigger if exists set_subscribers_updated_at on beyon.subscribers;
create trigger set_subscribers_updated_at
  before update on beyon.subscribers
  for each row execute function beyon.set_updated_at();

drop trigger if exists set_lead_notes_updated_at on beyon.lead_notes;
create trigger set_lead_notes_updated_at
  before update on beyon.lead_notes
  for each row execute function beyon.set_updated_at();

drop trigger if exists set_email_campaigns_updated_at on beyon.email_campaigns;
create trigger set_email_campaigns_updated_at
  before update on beyon.email_campaigns
  for each row execute function beyon.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: on everywhere, no policies (service role only)
-- ---------------------------------------------------------------------------

alter table beyon.announcements enable row level security;
alter table beyon.subscribers enable row level security;
alter table beyon.leads enable row level security;
alter table beyon.lead_notes enable row level security;
alter table beyon.activity_events enable row level security;
alter table beyon.email_events enable row level security;
alter table beyon.email_campaigns enable row level security;
alter table beyon.email_campaign_recipients enable row level security;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on schema beyon from public, anon, authenticated;
revoke all on all tables in schema beyon from public, anon, authenticated;
revoke all on all sequences in schema beyon from public, anon, authenticated;
revoke execute on all functions in schema beyon from public, anon, authenticated;

grant usage on schema beyon to service_role;
grant all privileges on all tables in schema beyon to service_role;
grant all privileges on all sequences in schema beyon to service_role;
grant all privileges on all routines in schema beyon to service_role;

alter default privileges in schema beyon grant all privileges on tables to service_role;
alter default privileges in schema beyon grant all privileges on sequences to service_role;
alter default privileges in schema beyon grant all privileges on routines to service_role;
alter default privileges in schema beyon revoke all on tables from public, anon, authenticated;
alter default privileges in schema beyon revoke all on sequences from public, anon, authenticated;
alter default privileges in schema beyon revoke execute on routines from public, anon, authenticated;

select pg_notify('pgrst', 'reload schema');
