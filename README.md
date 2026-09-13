# Beyon Vital Community Services — website + admin

Marketing site and protected admin for **Beyon Vital, LLC** (North Chesterfield, VA): residential group home and Community Engagement. Next.js App Router, TypeScript, Tailwind, Supabase (schema `beyon`), Resend.

Site facts are limited to what the client provided. Every claim and its source is listed in [`docs/claims.md`](docs/claims.md); update that register before adding copy.

## Routes

Public: `/`, `/services`, `/services/residential-group-home`, `/services/community-engagement`, `/services/community-engagement/inquiry` (+ `/success`), `/our-home`, `/requirements`, `/resources`, `/faq`, `/announcements`, `/contact`, `/tour`, `/placement-inquiry` (+ `/success`), `/locations/north-chesterfield-va`, `/locations/chesterfield-county-va`, `/locations/richmond-va`, `/unsubscribe`, `/sitemap.xml`, `/robots.txt`.

Admin: `/admin/login`, `/admin` — leads with notes, status, archive/restore and lead emails; subscribers; CSV exports; activity analytics; announcements editor; email blasts with test send and idempotent campaigns.

API: `/api/submit`, `/api/track`, `/api/unsubscribe` (page POST, RFC 8058 one-click POST, GET redirect), `/api/resend/webhook`, `/api/leads`, `/api/admin/*`, `/api/cron/purge-archived`, `/api/debug-cms`.

## Environment variables

Names only (see `.env.example`):

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, email links (defaults to `https://beyonvital.com`) |
| `CMS_SUPABASE_URL` or `SUPABASE_URL` | Supabase project URL |
| `CMS_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Server-only service key |
| `CMS_SCHEMA` | Optional; must be `beyon` if set |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password (production) |
| `ADMIN_PASSWORD` | Plain password, development only |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie |
| `RESEND_API_KEY` | Sending email |
| `RESEND_FROM` | Sender, e.g. `Beyon Vital <hello@beyonvital.com>` |
| `RESEND_TO` | Recipient for admin test sends |
| `RESEND_REPLY_TO` | Reply-to address(es); also receives new-lead notifications |
| `RESEND_WEBHOOK_SECRET` | Verifies `/api/resend/webhook` |
| `EMAIL_TOKEN_SECRET` | Signs unsubscribe tokens |
| `CRON_SECRET` | Authorizes the archive purge cron |
| `DEBUG_TOKEN`, `ADMIN_ALLOWLIST` | Optional `/api/admin/whoami` diagnostics |
| `LEADOPS_API_ROUTE`, `LEADOPS_TOKEN`, `LEADOPS_SOURCE`, `LEADOPS_INGEST_KEY`, `LEADOPS_SOURCE_PROJECT`, `LEADOPS_SOURCE_CHANNEL` | Optional LeadOps forwarding; leads are always stored locally |

## Database

One migration: `supabase/migrations/20260913_000001_create_beyon_schema.sql`. It creates schema `beyon` with `announcements`, `subscribers`, `leads`, `lead_notes`, `activity_events`, `email_events`, `email_campaigns` and `email_campaign_recipients`, plus their indexes, the `set_updated_at` trigger function, RLS (enabled, no policies), and service-role grants.

It has **not** been applied. To apply it:

1. Run it against the WalkPerro project.
2. Add `beyon` under Project Settings → Data API → Exposed schemas.

If the database is unreachable, public pages still render (announcements are skipped), and the admin shows the load error.

## Email deliverability

- The template uses 600px table layout, inline styles, and a logo from `https://beyonvital.com/brand/email-logo.png` on a white tile. Every message has a plain-text part.
- Blasts include `List-Unsubscribe` (one-click HTTPS link and mailto) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
- Blasts send about 1.6 messages per second. They retry on 429 and 5xx with a per-recipient `Idempotency-Key`. Campaigns are idempotent by key, and a retried campaign skips recipients who were already sent.
- Before sending: verify `beyonvital.com` in Resend (SPF, DKIM) and publish a DMARC record. Point a Resend webhook for bounces and complaints at `/api/resend/webhook`, with header `x-webhook-secret`.

## Brand assets and images

`npm run generate:brand` (Python 3 + Pillow) rebuilds everything from `assets/source/` (git-ignored):

- `public/brand/`: logo lockup, logo mark, email logo, OG image
- favicons, `app/icon.png`, `app/apple-icon.png`, `public/site.webmanifest`
- `public/images/home/*.webp`: real photos of the home

Placeholder slots for illustrative lifestyle images are written only if the files are missing:

- `public/images/people/hero.webp` (1600×1000)
- `public/images/people/community-outing.webp` (1200×800)
- `public/images/people/life-coaching.webp` (1200×800)
- `public/images/people/volunteer.webp` (1200×800)
- `public/images/people/staff-care.webp` (1200×800)

Drop real images in at the same paths. These images always render with an "Illustrative image" caption; never caption them as Beyon Vital staff or residents.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npx tsc --noEmit
npm run build && npm run start
```
