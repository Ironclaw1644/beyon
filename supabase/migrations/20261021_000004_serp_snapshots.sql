-- Weekly Google rank tracker (app/api/cron/serp-sync). One row per tracked
-- query per day: where beyonvital.com ranked in the top 20 of a SERP pinned to
-- Richmond, VA, which of our URLs Google chose, and the top organic domains so a
-- drop can be read against who replaced us. Additive only; service-role only,
-- like every other beyon table.

create table if not exists beyon.serp_snapshots (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  captured_on date not null default (now() at time zone 'America/New_York')::date,
  source text not null default 'apify',
  location text not null,
  position integer,
  url text,
  pages_checked integer not null default 0,
  top_results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint serp_snapshots_query_day_source_key unique (query, captured_on, source)
);

create index if not exists serp_snapshots_captured_on_idx
  on beyon.serp_snapshots (captured_on desc);

alter table beyon.serp_snapshots enable row level security;

revoke all on beyon.serp_snapshots from public, anon, authenticated;
grant all privileges on beyon.serp_snapshots to service_role;

select pg_notify('pgrst', 'reload schema');
