# Launch checklist

Operational steps to flip FlightSales from "deployable code" to "live business".
Wave A code is shipped — these are the human/console steps to activate it.

## 1. Apply the database schema

`supabase/schema.sql` has accumulated a lot of additive changes (advanced
filter columns, dealer_applications, admin_audit, notifications, email_log,
suspended_at, RPC). None of it is on your live Supabase project until you
run it.

1. Open Supabase project → SQL Editor → New query
2. Paste the entire contents of `supabase/schema.sql`
3. Run

All statements are `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `CREATE OR REPLACE`,
so re-running is safe.

## 2. Set up Resend (transactional email)

1. Sign up at https://resend.com (free up to 3,000 emails/month)
2. **Domains** → Add domain → `flightsales.com.au`
3. Resend gives you 4 DNS records (SPF, DKIM x2, return-path). Add them in
   your registrar. SPF should look like `v=spf1 include:_spf.resend.com ~all`.
4. Wait 5-30 min for verification, then click **Verify**.
5. **API Keys** → Create API Key → copy.

Add to Vercel project env vars (Production scope):
- `RESEND_API_KEY` = the key from step 5
- `EMAIL_FROM` = `FlightSales <noreply@flightsales.com.au>`
- `EMAIL_REPLY_TO` = `support@flightsales.com.au`
- `EMAIL_BCC_ADMIN` = `ops@flightsales.com.au` (or your inbox)
- `SUPABASE_SERVICE_ROLE_KEY` = from Supabase project settings → API

Redeploy.

## 3. Branded auth emails (optional but recommended)

Supabase's default auth emails are unbranded and rate-limited. To use Resend
for them too:

1. Supabase project → Authentication → SMTP Settings → enable custom SMTP
2. Host: `smtp.resend.com`
3. Port: `587`
4. Username: `resend`
5. Password: your Resend API key
6. Sender: `noreply@flightsales.com.au`
7. Templates → Confirm signup / Magic link / Reset password — replace the
   default HTML with your branded version (you can copy the shell from
   `src/lib/emailTemplates.js`)

## 4. Set up Google OAuth for production

The /login page has Google sign-in but it'll fail in production until you
configure it in the Supabase Auth provider:

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth
   2.0 Client ID
2. Application type: Web application
3. Authorized redirect URIs:
   - `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret
5. Supabase → Authentication → Providers → Google → enable, paste creds

## 5. Domain + DNS

If `flightsales.com.au` isn't already pointed at Vercel:
1. Vercel project → Settings → Domains → Add `flightsales.com.au`
2. Vercel gives you an A record (or CNAME for subdomain) — paste in registrar
3. SSL provisions automatically

Update env vars:
- `NEXT_PUBLIC_SITE_URL=https://flightsales.com.au`

## 6. Set up the support mailbox

Decide whether `support@flightsales.com.au` is:
- A Google Workspace mailbox (paid, ~$10 AUD / user / month) — recommended
- A forwarding alias on your registrar (free, no outbound)

If forwarding alias, set the destination to your personal email. Replies
won't go from @flightsales.com.au though, which buyers will notice.

## 7. Smoke-test the customer flows

Once Resend + schema + domain are live:

| Flow | What to check |
|---|---|
| Sign up with email | Confirmation email arrives, branded |
| Reset password | Reset email arrives, link works |
| Submit a contact form | Both you and the user get emails within ~5s |
| Submit an enquiry on a listing (as a different user) | Listing owner gets the seller email; buyer gets the auto-reply |
| Approve a listing in admin | Seller gets `listing.approved` email + bell notification |
| Reject a listing with reason | Seller gets `listing.rejected` email with the reason |
| Approve a dealer application | Applicant gets `dealer_app.approved` email |
| Bell icon shows unread count for a signed-in user with new notifications | Click → marks read |

Check Resend dashboard → Emails to see delivery status. Bounces / complaints
will show there too.

## 8. Pick a monetization model (decision required)

Currently the site makes zero revenue. Pick one before launch announcements:
- **Listing fee per aircraft** (one-time per 30/60/90 days)
- **Featured listing upsell** (paid bump)
- **Dealer subscription** (monthly fee for verified badge + extras)
- **Lead fee** (sell finance / insurance / valuation leads to providers)

Stripe wiring is ~6 hours of dev work for any of these. Code path doesn't exist yet.

## 9. Legal + business

- ABN visible on Privacy / Terms / Contact pages (legal requirement for AU
  businesses)
- Public liability insurance (advised)
- ACCC review — ensure "verified dealer" claims are backed by a documented
  verification process
- Notifiable Data Breach plan documented (Privacy Act 1988)

## 10. Optional v1.1

- Saved-search digest emails (template `search.digest` is ready, no scheduler yet)
- Listing alert emails to buyers when new matches appear
- 2FA for admin accounts (Supabase TOTP factors built in)
- Admin audit log writes (table seeded; no writes wired)
- Cloudflare Turnstile on signup + contact (anti-bot)
- Analytics — Plausible (`<script async src="…">` in layout, ~5 min)
