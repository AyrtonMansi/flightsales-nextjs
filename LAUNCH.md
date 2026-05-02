# Launch checklist — what's left for FlightSales.com.au

This file documents the state of the codebase right now (May 2026) and the
exact ops work outstanding to flip the site live for real users.

> What I (Claude) verified from inside this repo
> - `npm run build`     — clean, all 14 routes prerender or stream cleanly
> - `npm run lint`      — clean (3 pre-existing warnings, none blocking)
> - `npm run test:e2e`  — 19/19 unit + HTTP smoke tests pass; browser tests
>   need `npx playwright install chromium` locally to run
> - All 13 tables the code references exist in `supabase/schema.sql`
> - Every public route returns 200 against `next dev`
> - Every API route validates input + gates auth correctly
>
> ✅ COMPLETED (Sat 2026-05-02)
> - Vercel deployment fixed — redeployed from correct GitHub repo
> - Supabase schema applied — 13 tables + storage bucket created
> - Vercel env vars updated with correct Supabase project ref (gztdahwsfwybpzqcegty)
>
> What I cannot verify from here (you must check on the live deploy)
> - Resend domain verification
> - DNS pointing flightsales.com.au at Vercel

---

## 1. ✅ Apply the latest schema migration — DONE

Schema has been applied successfully. Verified:
- **13 tables** in public schema
- **aircraft-images bucket** exists and is public

If you need to re-run: `supabase/schema.sql` is idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

---

## 2. Vercel environment variables — PARTIALLY DONE

✅ Already set (updated with correct Supabase project ref gztdahwsfwybpzqcegty):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://gztdahwsfwybpzqcegty.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = set
- `NEXT_PUBLIC_SITE_URL` = set

❌ Still need to add:

| Name | Where it comes from |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (do **not** prefix with `NEXT_PUBLIC_`) |
| `RESEND_API_KEY` | Resend → API Keys |
| `EMAIL_FROM` | e.g. `FlightSales <noreply@flightsales.com.au>` |
| `EMAIL_REPLY_TO` | e.g. `support@flightsales.com.au` |
| `EMAIL_BCC_ADMIN` | your admin inbox |
| `CRON_SECRET` | random 32-char hex (generated below) |
| `INTERNAL_API_TOKEN` | random 32-char hex (generated below) |
| `NEXT_PUBLIC_FS_ABN` | your ABN (shown on legal pages) |

Optional but recommended:

| Name | Why |
|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | spam protection on contact / enquiry / signup |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | rate limiting on POST routes |
| `NEXT_PUBLIC_SENTRY_DSN` | error tracking |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | analytics |

After adding env vars → **Redeploy**. Vercel doesn't hot-reload them.

---

## 3. Resend domain verification

If not done already:

1. https://resend.com → sign up.
2. Add domain `flightsales.com.au`.
3. Add the DNS records they show (SPF + DKIM + return-path).
4. Wait for "Verified". Until verified, `EMAIL_FROM` must use Resend's
   sandbox `onboarding@resend.dev` and only the email you registered with
   can receive mail.

Without this, **no transactional email goes out** — buyers/sellers won't
get enquiry replies, dealer applications won't trigger approval emails,
the password-reset link relies on Supabase's default sender (which works
but looks unprofessional).

---

## 4. Domain → Vercel

Vercel project → Settings → Domains → add `flightsales.com.au` and
`www.flightsales.com.au`. Update DNS at your registrar per Vercel's
instructions. Wait for SSL provisioning (~minutes).

---

## 5. Make yourself admin

Once you've signed up with your real email:

```sql
update profiles set role = 'admin'
where email = 'you@flightsales.com.au';
```

Sign out + back in. `/admin` becomes reachable, and Nav auto-redirects
admin users away from `/dashboard`.

---

## 6. Cron jobs

Vercel automatically registers them from `vercel.json`. After deploy:
- Vercel project → **Cron Jobs** tab → confirm 3 entries:
  - `/api/cron/expire-listings` 09:00 UTC daily
  - `/api/cron/saved-search-digest` 09:30 UTC daily
  - `/api/cron/onboarding-emails` 10:00 UTC daily
- Click each → **Run now** → confirm 200 in logs.

---

## 7. Pre-launch smoke test (do this on the real domain)

Run through in order:

1. **Sign up** with a real email at `/login` → confirm email arrives → click
   link → land on dashboard.
2. **Edit profile** → save → reload → persists.
3. **Upload a test listing** with photos → submit.
4. As admin (`/admin`), approve it.
5. Open the listing as **anonymous** (incognito) → see it on `/buy` and
   `/listings/[id]`.
6. **Send an enquiry** → both buyer and seller receive emails.
7. **Save** the listing → appears on the dashboard's Saved tab.
8. From admin's **Cron Jobs** tab → fire each cron → check logs are clean.
9. Visit `/admin` → all 7 tabs load, no console errors.

If any step fails, paste the failing screen + the browser console error
into the next session.

### Quick verification commands

```bash
# Check site loads
curl -s https://flightsales-nextjs.vercel.app | head -5

# Check API responds (RLS error expected without auth)
curl -s -X POST https://flightsales-nextjs.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Test"}'

# Should return: {"ok":false,"error":"db_insert_failed",...}
# (This means DB is connected but RLS blocks anonymous inserts)
```

---

## Known caveats

### CASA rego lookup on `/sell`

The current implementation uses headless Chromium via `playwright-core`,
which doesn't ship with Vercel serverless functions. The route detects
the missing executable and returns a `503 { available: false }` so the
SellPage falls back to manual entry **without** showing a scary error.

This means: **users can list aircraft normally**, but the rego auto-fill
feature is silently disabled in production until we either:

  a. Switch to `@sparticuz/chromium-min` (heavy, ~50 MB cold start), or
  b. Replace the scraper with a fetch-based lookup against a CASA JSON
     endpoint (lighter, faster, but requires reverse-engineering or
     CASA's official API access).

Option (b) is the better long-term move and is tracked in the next
sprint.

---

## Generated secrets (rotate before paste-into-Vercel)

```
CRON_SECRET=8c4161ec0d6e4a9cbad0e4cf2667ba4e544847939eb88737246af66da682a4ff
INTERNAL_API_TOKEN=8547722bede062de5e554b29c6404b1771761a2a7e2138b35d519fe306fb0ea4
```

These were generated locally just now. Either paste directly or run
`openssl rand -hex 32` twice to roll your own.
