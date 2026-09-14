# Claim register — beyonvital.com

Every factual statement the site (pages, metadata, JSON-LD, emails) makes about Beyon Vital, LLC, with its source. Source files live in `assets/source/` (git-ignored).

**Sources**

- **Flyer**: `assets/source/beyon_vital_flyer_old.jpg`, the client's tri-fold flyer.
- **Text A**: `assets/source/Screenshot_20260913-125318_WhatsApp.png`, a client WhatsApp thread from 2026-09-13.
- **Text B**: `assets/source/Screenshot_20260913-125321_WhatsApp.png`, the same thread, continued.
- **Logo**: `assets/source/beyon_logo.png`.
- **Brief**: the project brief from the site operator. This is not the client; items sourced only here should be confirmed with the client.

Copy lives in `lib/content.ts`. If a statement is not listed here, it should not be on the site.

## Identity and contact

| Claim | Where | Source |
| --- | --- | --- |
| Business name "Beyon Vital, LLC" | Everywhere, JSON-LD `name` | Flyer (title panel, mission, vision) |
| Brand line "Beyon Vital Community Services" | Header, footer, OG image, email header, JSON-LD `alternateName` | Logo |
| Phone (804) 366-3442 | Header CTAs, footer, contact, emails, JSON-LD `telephone` | Flyer ("Contact us") |
| Email beyonvitalllc@gmail.com | Footer, contact, emails, JSON-LD `email` | Flyer ("Contact us") |
| Address 8120 Clovertree Ct, North Chesterfield, VA 23235 | Footer, contact, locations, emails, JSON-LD `address` | Flyer ("Contact us") |
| Website beyonvital.com | Canonicals, emails, OG image | Text A 11:36 (proposed) and Text B 11:48 ("That name is fine") |

## Mission, vision, values

| Claim | Where | Source |
| --- | --- | --- |
| Mission statement (verbatim) | Home, Services hero (first sentence), Residential page and Richmond page (second sentence), FAQ | Flyer "OUR MISSION" |
| Vision statement (verbatim, including "clients lives") | Home, Richmond page | Flyer "VISION" |
| Home hero "Bringing positivity and remarkable services into our clients' lives" | Home `h1` | Paraphrase of the Flyer "VISION" |
| Core value: effective tools, strategies, and services needed to improve the lives of our clients | Home, Residential page, Richmond page | Flyer "CORE VALUES" |
| Core value: personalized goals to meet the specific needs of mature and young adult clients | Same | Flyer "CORE VALUES" |
| Core value: a healthy mindset and a positive future for each client | Same | Flyer "CORE VALUES" |
| Clients are mature and young adults | Services, FAQ, footer blurb, descriptions | Flyer (mission, core values) |
| Services are therapeutic, behavioral, and psycho-educational | Services, meta descriptions, JSON-LD `description` | Flyer (mission) |

## Residential group home

| Claim | Where | Source |
| --- | --- | --- |
| "A safe and comfortable environment" | Home, Our Home, Residential page, Tour page | Flyer "OUR HOME" |
| 4 beds | Same, Our Home meta title | Flyer "OUR HOME" |
| 3 bedrooms | Same | Flyer "OUR HOME" |
| 1 1/2 bathrooms | Same | Flyer "OUR HOME" |
| Updated appliances | Same | Flyer "OUR HOME" |
| TV area | Same | Flyer "OUR HOME" |
| Hardwood flooring | Same | Flyer "OUR HOME" |
| Outdoor sitting area | Same | Flyer "OUR HOME" |
| Requirements intro "To ensure the comfort of staff and potential residents, you must meet the following criteria:" | Requirements, Our Home, Residential page | Flyer "REQUIREMENTS" |
| Client must be at least 18 years of age | Requirements, Our Home, Residential page, Chesterfield County page, inquiry sidebar, FAQ | Flyer "REQUIREMENTS" |
| Client must have acceptable insurance (no insurers named) | Same | Flyer "REQUIREMENTS" |
| Client must be willing to live with other residents | Same | Flyer "REQUIREMENTS" |
| "Accepting ID/DD Waivers" | Main print flyer only (`assets/flyers/beyon-vital-flyer.html`, Requirements list). Not on the website yet | Client request relayed by the operator, 2026-09-13 ("at the bottom for requirements can you put accepting ID-DD Waivers") |
| The service is called "Residential Group Home" | Service page title and URL; main print flyer heading (middle panel, replacing "Beyon Vital Community Services") | Brief, then confirmed by the client 2026-09-13 ("put Residential Group Home right at the top in the middle") |
| Photos on the site are of this home | Our Home carousel, photo grids, Location page, JSON-LD `image` | Text A 11:28 ("I will send you the pictures") and 11:37 (photos sent) |

Photo alt text describes what is visible in each picture (for example "queen bed", "stamped concrete patio"). It makes no claims beyond the images themselves.

## Community Engagement

| Claim | Where | Source |
| --- | --- | --- |
| "A service similar to day support for individuals" | Community Engagement page, inquiry page, FAQ, meta descriptions | Text B 11:49 |
| Hours 9am–3pm (no days of the week given, so none shown) | Same, JSON-LD `hoursAvailable` (opens 09:00, closes 15:00) | Text B 11:49 |
| Includes community outings | Same | Text B 11:52 |
| Includes volunteer work | Same | Text B 11:52 |
| Includes life coaching | Same | Text B 11:52 ("etc." is not expanded) |

## Service areas (Brief)

| Claim | Where | Source |
| --- | --- | --- |
| Serves North Chesterfield, VA | `/locations/north-chesterfield-va`, footer, JSON-LD `areaServed` | Flyer (address); page requested in the Brief |
| Serves Chesterfield County, VA | `/locations/chesterfield-county-va`, footer, JSON-LD `areaServed` | Brief — confirm with client |
| Serves the Richmond, VA area | `/locations/richmond-va`, footer, JSON-LD `areaServed` | Brief — confirm with client |

## Site operations (not client facts; confirm before launch)

| Statement | Where | Note |
| --- | --- | --- |
| Tours can be requested ("we will follow up to schedule") | `/tour`, header and footer CTAs, home hero | The brief kept the tour flow from the source codebase. The client has not said they offer tours. |
| "We will follow up at your preferred contact time" | Inquiry forms and success pages | Describes the form workflow |
| Optional email updates opt-in | Inquiry, tour, and contact forms | Feeds the subscriber list used by admin email blasts. Single opt-in (the person is already contacting us); stored with `consent_source = inquiry_form_checkbox:<form>` |
| Newsletter headline "Get updates from Beyon Vital" | Floating card (desktop), bottom sheet (mobile), band above the footer | Describes the sign-up, not the business |
| Newsletter copy "News, community engagement updates and announcements from Beyon Vital, LLC." | Same, confirmation email, `/newsletter/confirm` | Names content types only. Makes no promise of frequency, offers, or health information. Community Engagement is sourced above (Text B) |
| "We’ll email you a link to confirm. Unsubscribe anytime." | Under every newsletter form | Describes the double opt-in flow below. Every blast carries an unsubscribe link and RFC 8058 one-click headers (`lib/email/service.ts`) |
| "This link expires in 7 days." | Confirmation email, expired-link page | `CONFIRM_TOKEN_TTL_MS` in `lib/subscribers.ts` |

## Newsletter consent flow

1. The visitor submits `POST /api/subscribe` (email, optional first name). The endpoint checks a honeypot, a 3-second minimum time on the form, and a per-IP rate limit, then normalizes and validates the email.
2. The subscriber row is created or kept as `pending`, with a random confirm token. Only its SHA-256 hash and a 7-day expiry are stored. One short transactional "Confirm your subscription" email is sent (HTML plus text, no user-supplied text). Pending addresses get at most one email per 10 minutes.
3. `GET /newsletter/confirm?token=…` (noindex) sets `status = active`, `confirmed_at`, `consent_at`, and `consent_source = double_opt_in:newsletter_<widget|sheet|footer>`.
4. The response is identical for new, pending, already-active, and suppressed addresses, so the form never reveals who is on the list. Bounced and complaint addresses are never mailed. An unsubscribe that happens after a link was issued overrides that link.
5. Blasts go only to `status = active`, non-archived subscribers (`listSubscribersForBlast`). Pending, unsubscribed, bounced, and complaint rows are excluded.
| "Please do not include medical details…" | Every form, Resources, FAQ | Privacy policy for a non-HIPAA stack, not a claim about care |

## AI-generated lifestyle images

These paths hold AI-generated lifestyle images:

- `public/images/people/hero.webp`
- `community-outing.webp`
- `life-coaching.webp`
- `volunteer.webp`
- `staff-care.webp`

The "Illustrative image" caption was removed at the operator's request on 2026-09-13. Alt text describes the scene only. Copy and alt text must still never present these people as Beyon Vital staff, residents, or activities.

## Deliberately not claimed

Removed from the source codebase, or never added:

- round-the-clock or overnight support
- a developmental-disability or other diagnosis focus
- licensure or license numbers
- Medicaid, waivers, private pay, or named insurers
- trained or credentialed staff, direct support professionals, staff names
- medication support
- placement-process steps and timelines
- testimonials, ratings, years in business, statistics
- social media profiles
- Midlothian and Colonial Heights pages
- opening hours for the residence
- geo coordinates
