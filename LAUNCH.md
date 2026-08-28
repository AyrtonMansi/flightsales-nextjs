# Go-live runbook — FlightSales.com.au

Last reviewed: 2026-08-20.

This is the ordered procedure to take the site from password-gated to
publicly live, plus the things that must be true before you do.

---

## 🔴 Do this first: two secrets are public right now

A previous version of this file had live values for `CRON_SECRET` and
`INTERNAL_API_TOKEN` pasted into it. That file is still in the git history
(commit `6a470d9`), **and this repository is public on GitHub** — so those
values are readable by anyone on the internet today. Deleting them from the
working copy does not remove them from history.

**`INTERNAL_API_TOKEN` has been removed from the code entirely.** It was an
auth path that granted full admin — approve/reject/feature any listing,
suspend or promote any user, approve dealer applications, send platform
email to any address — to anyone presenting that one header value, and it
was checked *before* any session lookup. API routes are not behind the
pre-launch password wall (that's a client-side component), so it was live in
production. Nothing in the app ever used it, so it was deleted rather than
rotated. Remove the variable from Vercel too.

**`CRON_SECRET` still needs rotating.** It is genuinely used — it's the only
thing between the public internet and the three cron endpoints
(expire-listings, saved-search-digest, onboarding-emails), and the current
value is public.

```bash
openssl rand -hex 32   # new CRON_SECRET -> set in Vercel, redeploy
```

Also change `SITE_PASSWORD` if you still rely on the pre-launch gate — that
value is in the history too.

Worth doing regardless: rotate the Supabase service-role key and check the
`admin_audit` table for actions you don't recognise.

---

## 1. Apply the pending SQL migrations

`supabase/schema.sql` is already applied. Since then, five migration files
have landed in `supabase/migrations/`. Paste each into the Supabase SQL
editor, oldest first, and confirm it succeeds:

| File | What it does | Severity |
|---|---|---|
| `2026_05_12_signup_metadata.sql` | signup metadata trigger | — |
| `2026_05_13_maintainability_pass.sql` | profile column-lock rewrite + 2 missing indexes | perf |
| `2026_08_20_affiliates_public_view.sql` | **stops serving partner API secrets to anonymous visitors** | 🔴 security |
| `2026_08_20_enquiry_status_pipeline.sql` | widens `enquiries.status` to the values the UI actually writes | 🟠 broken feature |
| `2026_08_20_views_and_casa_cache.sql` | adds the missing `increment_view_count()`; closes CASA cache poisoning | 🟠 security/perf |

The affiliates one is the important one. Until it runs, every logged-out
visitor to `/partners` receives each active partner's
`api_credential_secret`, `lead_webhook_url`, `commission_pct`,
`contract_url` and `contact_email` in the page's network response. The
application code already reads from the restricted view, so running this
migration is what actually closes the hole.

They're all idempotent — safe to re-run.

---

## 2. Environment variables

### Required — the site is broken without these

| Name | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ set |
| `NEXT_PUBLIC_SITE_URL` | ✅ set |
| `CRON_SECRET` | ✅ set — **rotate, see above** |
| ~~`INTERNAL_API_TOKEN`~~ | ❌ **removed from the code — delete it from Vercel** |
| `RESEND_API_KEY` | ❌ **still needed** — no transactional email without it |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` / `EMAIL_BCC_ADMIN` | ✅ set |
| `NEXT_PUBLIC_FS_ABN` | ❌ **still needed** — shown on the legal pages |

### Required *in production* — these now fail closed

Both of these used to fail **open**, which meant a missing variable
silently disabled a security control instead of announcing itself. They
now refuse the request instead. That's deliberate, but it does mean a
missing value is a hard outage on the affected forms rather than a quiet
downgrade — so set them before launch:

| Name | If missing in production |
|---|---|
| `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | every enquiry, contact, report and partner-lead submission is rejected |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | public write routes return 503 (`abuse_protection_unavailable`) |

Turnstile: cloudflare.com → Turnstile → add site → copy both keys.
Upstash: upstash.com → create a Redis database → REST URL + token.

### Optional

| Name | Why |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | error tracking (the app posts to Sentry's store API directly) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | privacy-friendly analytics |
| `ABR_GUID` | ABN verification for dealer accounts; route 503s without it |

After changing env vars, **redeploy** — Vercel does not hot-reload them,
and several are read at build time.

---

## 3. Resend domain verification

1. resend.com → add domain `flightsales.com.au`
2. Add the SPF + DKIM + return-path DNS records they show
3. Wait for **Verified**

Until verified, `EMAIL_FROM` must use Resend's sandbox
`onboarding@resend.dev`, and only the address you signed up with can
receive mail. Without it: no enquiry notifications, no dealer-approval
emails, no onboarding sequence.

---

## 4. Domain → Vercel

Project → Settings → Domains → add `flightsales.com.au` and
`www.flightsales.com.au`, update DNS at the registrar, wait for SSL.

Safe to do while still password-gated.

---

## 5. Make yourself admin

After signing up with your real email:

```sql
update profiles set role = 'admin' where email = 'you@flightsales.com.au';
```

Sign out and back in.

---

## 6. Confirm cron jobs

Vercel registers these from `vercel.json`. Project → **Cron Jobs**:

- `/api/cron/expire-listings` — 09:00 UTC daily
- `/api/cron/saved-search-digest` — 09:30 UTC daily
- `/api/cron/onboarding-emails` — 10:00 UTC daily

Hit **Run now** on each and confirm a 200. They fail closed if
`CRON_SECRET` is unset, so a 401 here means the env var didn't take.

---

## 7. Smoke test — while still gated

Do this on the real domain with the password wall still up.

1. Sign up with a real email → confirmation email arrives → click it →
   land on the dashboard **signed in**
2. Sign in with Google → land on the dashboard signed in
3. Edit profile → save → reload → persists
4. Create a listing with photos → submit
5. As admin, approve it in `/admin`
6. In an incognito window, find it on `/buy` and open `/listings/[id]`
7. Send an enquiry → both buyer and seller receive email
8. Save the listing → it appears under Saved
9. In `/admin`: approve, unpublish, and feature a listing — confirm each
   does what its label says, and that the Audit tab shows readable rows
10. Report a listing → captcha appears → submit → ops inbox receives it

Steps 1, 2 and 9 are the ones worth being fussy about — all three were
broken until recently and are easy to regress.

---

## 8. Go live

**One environment variable:**

```
SITE_PASSWORD_PROTECTED=false
```

Redeploy. That single change simultaneously:

- removes the password wall for visitors
- flips the site's robots meta from `noindex, nofollow` to `index, follow`
- switches `robots.txt` from `Disallow: /` to the real crawl rules
- starts advertising `sitemap.xml`

There is nothing else to revert by hand. (This used to be a three-step
manual process where the documented step didn't actually work — the gate
read a different variable than the one this file told you to set, so
following the runbook left the wall up for real users while the API
accepted any password.)

Verify immediately after the redeploy:

```bash
curl -s https://flightsales.com.au | grep -c "Coming soon"   # expect 0
curl -s https://flightsales.com.au/robots.txt                # expect Allow: /
curl -s https://flightsales.com.au | grep -o 'name="robots" content="[^"]*"'
```

To put the wall back up, set it to `true` (or remove it — it defaults to
protected) and redeploy.

---

## 9. After launch

- Submit `https://flightsales.com.au/sitemap.xml` in Google Search Console
- Watch Sentry (or the function logs) for the first hour
- Check Resend's dashboard for bounces on the first real enquiries

---

## Known caveats

### CASA rego lookup on `/sell`

Uses headless Chromium via `playwright-core`, which doesn't ship with
Vercel serverless functions. The route detects the missing executable and
returns `503 { available: false }`, and the sell form falls back to manual
entry without showing an error.

Users can list aircraft normally; only the rego auto-fill is disabled.
Fixing it properly means replacing the scraper with a fetch-based lookup
rather than bundling a 50 MB Chromium.

### Verification status of this document

`npm run build`, `npx tsc --noEmit` and the full Playwright suite (166
tests) all pass in CI as of the date at the top. Everything under
"Environment variables", Resend verification and DNS are external systems
that can only be confirmed on the live deployment.
