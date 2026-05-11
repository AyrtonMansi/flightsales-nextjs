// Single source of truth for FlightSales pricing.
//
// Listing fees
//   - Experimental / LSA / Ultralight / RAAus-registered: free
//   - Certified < $500k:          $99 flat
//   - Certified >= $500k:         $99 + 0.025% of (price - $500,000)
//
// Dealer subscription
//   - Dealer Lite:  $49/mo, up to 5 active listings (private-seller alternative)
//   - Pro:          unlimited, featured slots — future
//   - Enterprise:   bulk import, white-label — future

// ─── Listing fees ───────────────────────────────────────────────────

export const BASE_LISTING_FEE_AUD = 99;
export const PREMIUM_THRESHOLD_AUD = 500_000;
export const PREMIUM_RATE = 0.00025; // 0.025% of the amount above $500k

// Categories that get free listings. Match the user-facing category
// values in lib/constants.js. "Experimental" isn't a category in
// the picker today — we cover it via rego pattern below.
const FREE_CATEGORIES = new Set(['LSA', 'Ultralight']);

// RAAus (Recreational Aviation Australia) rego prefixes. These cover
// the recreational class — primarily ultralights and LSAs but also
// some experimentals. A rego starting with these digits + a hyphen
// (e.g. "24-1234") is RAAus-registered.
//
// Reference: RAAus member-registered aircraft use the 10-, 19-, 24-,
// 25-, 28-, 32-, 55-, 95- prefixes.
const RAAUS_REGO_RE = /^(10|19|24|25|28|32|55|95)-\d{2,4}\b/i;

export interface ListingFeeInput {
  category?: string | null;
  price?: number | null;
  rego?: string | null;
  /**
   * Future flag for an explicit "experimental" classification.
   * Falls back to the category + rego heuristic when unset.
   */
  isExperimental?: boolean;
}

export interface ListingFee {
  /** Total fee in AUD. Always an integer (cents rounded). */
  feeAud: number;
  /** True when this listing qualifies for free placement. */
  free: boolean;
  /** Human-readable line-by-line breakdown for the fee modal/summary. */
  breakdown: Array<{ label: string; amount: number }>;
  /** Internal tier key for analytics/Stripe metadata. */
  tier: 'free' | 'standard' | 'premium';
  /** Reason the listing was placed in this tier — useful for UI copy. */
  reason: string;
}

export function calculateListingFee(input: ListingFeeInput): ListingFee {
  const { category, price, rego, isExperimental } = input;

  // ─── Free tier checks (any one qualifies) ──────────────────────
  if (isExperimental) {
    return zeroFee('Experimental aircraft — free placement.');
  }
  if (category && FREE_CATEGORIES.has(category)) {
    return zeroFee(`${category} aircraft — free placement.`);
  }
  if (rego && RAAUS_REGO_RE.test(rego.trim())) {
    return zeroFee('RAAus-registered aircraft — free placement.');
  }

  // ─── Certified aircraft fee tier ───────────────────────────────
  const p = Number.isFinite(price) ? Math.max(0, Math.round(price as number)) : 0;
  if (p < PREMIUM_THRESHOLD_AUD) {
    return {
      feeAud: BASE_LISTING_FEE_AUD,
      free: false,
      tier: 'standard',
      reason: `Certified aircraft under $${PREMIUM_THRESHOLD_AUD.toLocaleString()}.`,
      breakdown: [
        { label: 'Base listing fee', amount: BASE_LISTING_FEE_AUD },
      ],
    };
  }

  // p >= PREMIUM_THRESHOLD_AUD
  const above = p - PREMIUM_THRESHOLD_AUD;
  const variable = Math.round(above * PREMIUM_RATE);
  return {
    feeAud: BASE_LISTING_FEE_AUD + variable,
    free: false,
    tier: 'premium',
    reason: `Certified aircraft at or above $${PREMIUM_THRESHOLD_AUD.toLocaleString()}.`,
    breakdown: [
      { label: 'Base listing fee', amount: BASE_LISTING_FEE_AUD },
      { label: `0.025% of $${above.toLocaleString()} (price above $500k)`, amount: variable },
    ],
  };
}

function zeroFee(reason: string): ListingFee {
  return {
    feeAud: 0,
    free: true,
    tier: 'free',
    reason,
    breakdown: [{ label: 'Free placement', amount: 0 }],
  };
}

// Pretty-print helper for AUD amounts. Uses tabular figures via the
// component's own font-feature-settings; this just produces the string.
export function fmtAud(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  if (n === 0) return 'Free';
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Dealer subscription plans ──────────────────────────────────────

export interface DealerPlan {
  key: 'dealer_lite' | 'pro' | 'enterprise';
  name: string;
  priceLabel: string;       // shown in the plan card
  priceMonthlyAud: number;  // for Stripe metadata + comparisons
  listingLimit: number | 'unlimited';
  desc: string;
  features: string[];
}

export const DEALER_PLANS: DealerPlan[] = [
  {
    key: 'dealer_lite',
    name: 'Dealer Lite',
    priceLabel: '$49/mo',
    priceMonthlyAud: 49,
    listingLimit: 5,
    desc: 'Up to 5 active listings, verified badge, lead alerts',
    features: [
      'Up to 5 active listings',
      'Verified business badge',
      'Real-time lead alerts',
      'ABR auto-verification',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    priceLabel: '$399/mo',
    priceMonthlyAud: 399,
    listingLimit: 'unlimited',
    desc: 'Unlimited listings, featured slots, market position, team (3 seats)',
    features: [
      'Unlimited active listings',
      'Featured listing slots',
      'Market-position analytics',
      'Team access (3 seats)',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    priceLabel: 'From $999/mo',
    priceMonthlyAud: 999,
    listingLimit: 'unlimited',
    desc: 'Bulk import, white-label dealer page, custom integrations',
    features: [
      'Bulk CSV import (200 rows/upload)',
      'White-label /dealers/[id] page',
      'Custom API integrations',
      'Priority support',
    ],
  },
];
