# Monetization plan

Structured pricing model for FlightSales.com.au. Drafted around the
user's instinct (free up to $300k, $2/week above, $99/month dealer
starter) but tightened for unit economics, conversion psychology, and
operational simplicity.

## Pricing principles

1. **Free entry tier.** Sub-$300k aircraft list free. Drives marketplace
   volume → SEO → buyer trust. The opportunity cost of not having an
   LSA / older Cessna section visible is bigger than any fee revenue
   you'd capture from that band.
2. **Value-aligned listing fees.** Sellers of $300k+ aircraft can absorb
   a small fee trivially; the fee should feel like rounding error
   relative to the asking price (≤0.05%).
3. **Per-week price framing.** `$9.95 / week` reads cheaper than the
   equivalent `$40 / month` to the same buyer — same dollars, better
   conversion.
4. **Dealer tiers built on listing allowances + features.** Subscription
   is the only way to predict revenue and the only way to lock in the
   dealers who drive 80% of marketplace inventory.
5. **Add-ons that don't require a tier upgrade.** Featured Boost / Photo
   Pack are pure margin without forcing dealers off Lite.
6. **Lead routing as silent margin.** Finance / insurance / valuation
   lead fees go to partners, not sellers. Buyers don't see this; sellers
   don't see this; we get paid for the introduction.

---

## Tier structure

### 1. Hobby — Free
For private sellers, listing under $300k AUD.
- 1 active listing
- 60 days, manually renewable
- Up to 5 photos
- Standard search visibility
- Listed in category, not Featured

**Why free:** drives marketplace volume. Sub-$300k inventory (Cessnas,
Pipers, LSA, ultralights) makes up the bulk of the GA fleet by count.
You can't be Australia's GA marketplace if you're not visible at this
price point. Volume = SEO = buyer trust = dealer signups.

### 2. Premium Private — $9.95 / week (or $39 / month)
Private sellers, listing $300k–$2M AUD.
- 1 active listing
- 60 days, renewable
- Unlimited photos + drag-drop reorder
- Featured slot in their category for first 7 days
- Boosted in search ranking
- Saved-search alerts to matching buyers

**Why this price:** a seller with a $500k Cirrus SR22 absorbs a $40
listing fee without thinking. 4-week minimum charge ($40) avoids
$9-trial-and-quit. Per-week framing on the marketing page reads
softer than monthly.

### 3. Premium+ Private — $29 / week (or $99 / month)
Private sellers, listing > $2M AUD.
- 1 active listing
- 90 days, renewable
- Unlimited photos + virtual tour upload
- Front-page Featured rotation
- Dedicated micro-profile snippet on listing page
- Buyer-side concierge: enquiries pre-screened by us before reaching
  the seller (filters tire-kickers from PC-12 buyers)

**Why this price:** $99/mo on a $2M+ aircraft is 0.005% of asking. The
concierge tier justifies the price even though most of the cost is the
listing slot itself.

---

### 4. Dealer Lite — $149 / month
Hobby dealers, FBOs with side inventory.
- Up to 5 active listings
- 60 days each, renewable
- Verified dealer badge
- Dealer profile page
- Lead routing to dashboard inbox
- Saved-search alerts when you list

### 5. Dealer Pro — $399 / month
Real dealers with steady inventory.
- Up to 25 active listings
- All Lite features
- Featured rotation across categories
- Lead priority (shown first on matched alerts)
- Custom dealer profile (logo, bio, specialty, hero photo)
- Saved-search-match alerts pushed to opted-in buyers when you list
- Auto-renew listings (no manual reactivation)

### 6. Dealer Enterprise — Custom (from $999 / month)
Brokerages, FBOs with 50+ aircraft, anyone who needs API.
- Unlimited active listings
- API access (sync from inventory management system)
- Co-branded landing page (`/dealers/<slug>`)
- Dedicated account manager
- Premium support SLA (4 business hours)
- Annual contract + invoicing

---

## Add-ons (any tier, including Hobby)

| Add-on | Price | What it does |
|---|---|---|
| **Featured Boost** | $49 / week | Top of category for 1 listing |
| **Front-page Spotlight** | $99 / week | Hero rotation on home page |
| **Photo Pack** | $199 one-time | Pro photographer onsite (AU metro only — outsourced) |
| **Listing Audit** | $99 one-time | Editor critiques your copy + photos in 24h |
| **Bump** | $9 one-time | Pushes your listing back to the top of newest |

Add-ons unlock without changing tier. A free-tier seller can buy a
Featured Boost.

---

## Lead routing (revenue from third-party partners)

Buyers fill an enquiry form on /finance, /insurance, /valuation. Lead
goes to the seller AND to a partner network. Partners pay per qualified
lead.

| Lead type | Price to partner | Volume estimate |
|---|---|---|
| Aircraft finance | $25 / lead | Moderate — most buyers self-finance or have established relationships |
| Aircraft insurance | $25 / lead | High — every buyer needs a quote |
| Pre-purchase valuation | $50 / lead | Low — only $1M+ buyers, but high-intent |
| Pre-purchase inspection | $50 / lead | Moderate |
| Aircraft transport / ferry | $50 / lead | Moderate, often urgent |

This is pure margin — we're the introduction, not the service. Even at
50 leads/month across categories, that's $1,500–2,500 revenue with
zero customer-facing infrastructure beyond the form.

---

## Revenue mix forecast (Year 1)

Assumes ramp from 0 → 200 active listings + 30 dealer subscribers by
month 12.

| Source | Monthly @ Y1 end | % of total |
|---|---|---|
| Hobby (free) | $0 (~120 listings) | 0% |
| Premium Private ($39/mo × 50) | $1,950 | 27% |
| Premium+ Private ($99/mo × 8) | $792 | 11% |
| Dealer Lite ($149/mo × 18) | $2,682 | 37% |
| Dealer Pro ($399/mo × 8) | $3,192 | 44% |
| Dealer Enterprise ($1500/mo × 1) | $1,500 | 21% |
| Add-ons (Boost / Spotlight) | ~$800 | 11% |
| Lead routing (3 partners) | ~$1,200 | 17% |

(Percentages don't sum to 100 because of approximations; this is
back-of-envelope, not a commitment.) Mid-five-figures monthly run-rate
by month 12 is the target on this model — concentrated heavily in
dealer subscriptions, which is the right shape for a marketplace
business.

---

## Conversion levers

1. **Free-tier prompts.** When a free-tier seller hits 60 days without
   a sale, offer a "Premium Boost — list at $300k+ free for 30 days
   when you upgrade".
2. **First-listing-free** for new dealer applications. Get them in,
   get them listing, then convert at month 1 renewal.
3. **Dealer ladder.** Lite → Pro upgrade at 5 active listings (the
   Lite cap). Pro → Enterprise at 25 active.
4. **Annual prepay discount.** 10% off for annual on any subscription.
   Locks in revenue + reduces churn.
5. **Sold-fast credit.** If a Premium listing sells within 7 days,
   credit 50% of the listing fee toward their next listing within
   12 months. Encourages repeat sellers.

---

## What NOT to do (why)

- **Commission on sale.** Aircraft transactions happen off-platform via
  escrow / brokers / personal contracts. We can't track sale price
  reliably; sellers will just mark "off-platform sold" to evade.
- **Lead fees from sellers.** Charging the seller per enquiry creates
  perverse incentive (sellers want fewer enquiries). Lead fees only
  flow from partners.
- **Aggressive paywalls.** Hiding listings behind login degrades SEO
  + buyer trust. Free public browsing is essential to the marketplace
  flywheel.
- **Annual-only billing.** Locks out sellers testing the platform for
  a single sale. Monthly default.

---

## Implementation order (Stripe wiring)

When you approve this plan, the dev work is:

1. **Stripe account setup** — products + prices for each tier
   (~30 min)
2. **`/api/stripe/checkout`** — start a Checkout Session per tier
   (~1h)
3. **`/api/stripe/webhook`** — handle `checkout.session.completed`,
   `customer.subscription.deleted`, etc. → update profile.role +
   profile.subscription_tier (~2h)
4. **Subscription state on profile** — new columns: `subscription_tier`,
   `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
   (~30 min)
5. **Tier gating** — listing creation checks tier (`countActiveListings()
   < tier.maxListings`); SellPage routes free sellers > $300k to a
   paywall step (~2h)
6. **Billing page in dashboard** — show current plan, upgrade / cancel
   buttons that hit Stripe Customer Portal (~1h)

Total: ~7 hours dev once you greenlight pricing. Stripe Customer Portal
handles cancellation + payment-method updates without me writing it.
