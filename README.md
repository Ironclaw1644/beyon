# Beyon Vital Residential Group Home — website + admin

Marketing site and protected admin for **Beyon Vital, LLC** (North Chesterfield, VA): residential group home and Community Engagement. Next.js App Router, TypeScript, Tailwind, Supabase (schema `beyon`), Resend.

Site facts are limited to what the client provided. Every claim and its source is listed in [`docs/claims.md`](docs/claims.md); update that register before adding copy.

## Routes

Public: `/`, `/services`, `/services/residential-group-home`, `/services/community-engagement`, `/services/community-engagement/inquiry` (+ `/success`), `/our-home`, `/requirements`, `/resources`, `/faq`, `/announcements`, `/contact`, `/tour`, `/placement-inquiry` (+ `/success`), `/locations/north-chesterfield-va`, `/locations/chesterfield-county-va`, `/locations/richmond-va`, `/unsubscribe`, `/sitemap.xml`, `/robots.txt`.

Admin: `/admin/login`, `/admin` — leads with notes, status, archive/restore and lead emails; inbox (read, reply to and compose mail as hello@beyonvital.com); subscribers; CSV exports; activity analytics; announcements editor; email blasts with test send and idempotent campaigns.

API: `/api/submit`, `/api/track`, `/api/unsubscribe` (page POST, RFC 8058 one-click POST, GET redirect), `/api/resend/webhook`, `/api/resend/inbound`, `/api/leads`, `/api/admin/*`, `/api/cron/purge-archived`, `/api/debug-cms`.

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
| `RESEND_INBOUND_API_KEY` | Full-access Resend key: reads received mail, forwards it, fetches attachment links (the send-only `RESEND_API_KEY` cannot) |
| `RESEND_INBOUND_WEBHOOK_SECRET` | Signing secret (`whsec_…`) of the `email.received` webhook; verifies `/api/resend/inbound` |
| `FORWARD_INBOUND_TO` | Optional. If set, every received email is also forwarded there. Leave unset while ImprovMX delivers the Gmail copy, or she gets it twice |
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

Later migrations: `20260913_000002_newsletter_double_opt_in.sql` (double opt-in, `rate_limit_hits`) and `20260913_000003_inbox.sql` (`inbox_threads`, `inbox_messages`; RLS on, no policies, service role only).

## Admin inbox

Mail to `@beyonvital.com` reaches Resend Inbound. Setup (operator, in the Resend dashboard and DNS):

1. Get mail into Resend Inbound. Either point MX at Resend, or keep ImprovMX (current setup) and add the Resend receiving address as a second forwarding destination.
2. Create a webhook for `email.received` pointing at `https://beyonvital.com/api/resend/inbound`; put its signing secret in `RESEND_INBOUND_WEBHOOK_SECRET`.
3. Create a full-access API key for `RESEND_INBOUND_API_KEY`. Set `FORWARD_INBOUND_TO` only if nothing else delivers the Gmail copy.

Until `RESEND_INBOUND_API_KEY`, `RESEND_INBOUND_WEBHOOK_SECRET` and `RESEND_API_KEY` are all set, the Inbox tab shows "Inbox not connected yet", sending is refused, and the webhook rejects every request.

How it works:

- The webhook is verified with the Svix signature headers (HMAC-SHA256, 5-minute tolerance). Unsigned or invalid requests get 401.
- The full message is fetched from the Receiving API and stored. If `FORWARD_INBOUND_TO` is set, it is also forwarded (passthrough) there from `hello@beyonvital.com`; otherwise the message is marked `skipped`. Storage is idempotent on the Resend email id. A failed forward is recorded on the message and the webhook still returns 200.
- Forwarded mail (ImprovMX → Resend's `…@<id>.resend.app` address): the participant is the original `From`. The recipient shown is the @beyonvital.com address from the original `To`/`Cc`, then `Delivered-To`/`X-Original-To`, else hello@. The resend.app hop is never stored. Threading uses the original `Message-ID` header.
- Mail from an @beyonvital.com address whose subject matches something we sent in the last 3 days is treated as an echo and dropped. Bounces (MAILER-DAEMON/postmaster) and auto-replies (`Auto-Submitted`, `X-Autoreply`, `Precedence: auto_reply`) are stored but never mark a conversation unread.
- Thread matching: a message joins the thread whose stored Message-ID appears in its `In-Reply-To`/`References`; otherwise the newest thread with the same sender and the same subject (ignoring `Re:`/`Fwd:`) active in the last 30 days; otherwise a new thread.
- Attachments: only metadata is stored. Downloads go through `/api/admin/inbox/attachment`, which redirects to a fresh short-lived Resend URL.
- Received HTML is sanitized on the server (`sanitize-html`) and shown in a sandboxed iframe with a no-script CSP. Remote images are hidden until "Show images" is clicked.
- Replies and new messages send from `Beyon Vital <hello@beyonvital.com>` in the branded shell without the unsubscribe footer, always with a text part. Replies use `Re:` (never doubled), `In-Reply-To` and `References`. Sends are rate limited (30 per 15 minutes) and never touch the newsletter list.

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
npm test           # inbox unit tests (no network, no database)
npm run build && npm run start
```
