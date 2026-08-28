// Commercial configuration for FlightSales.
//
// IMPORTANT: production billing is not wired yet. The marketplace therefore
// runs in launch-access mode: creating a listing is free and no dealer
// subscription is charged. Keeping this state explicit prevents UI/legal copy
// from advertising or collecting fees before a payment flow exists end-to-end.

export const BILLING_ENABLED = false;

// Retained as proposed commercial parameters for a future billing launch.
// They must not be presented as live prices while BILLING_ENABLED is false.
export const BASE_LISTING_FEE_AUD = 99;
export const PREMIUM_THRESHOLD_AUD = 500_000;
export const PREMIUM_RATE = 0.00025;

const FREE_CATEGORIES = new Set(['LSA', 'Ultralight']);
const RAAUS_REGO_RE = /^(10|19|24|25|28|32|55|95)-\d{2,4}\b/i;

export interface ListingFeeInput {
  category?: string | null;
  price?: number | null;
  rego?: string | null;
  isExperimental?: boolean;
}

export interface ListingFee {
  feeAud: number;
  free: boolean;
  breakdown: Array<{ label: string; amount: number }>;
  tier: 'launch' | 'free' | 'standard' | 'premium';
  reason: string;
}

export function calculateListingFee(input: ListingFeeInput): ListingFee {
  if (!BILLING_ENABLED) {
    return {
      feeAud: 0,
      free: true,
      tier: 'launch',
      reason: 'Launch access — no listing fee is currently charged.',
      breakdown: [{ label: 'Listing fee', amount: 0 }],
    };
  }

  const { category, price, rego, isExperimental } = input;
  if (isExperimental) return zeroFee('Experimental aircraft — free placement.');
  if (category && FREE_CATEGORIES.has(category)) return zeroFee(`${category} aircraft — free placement.`);
  if (rego && RAAUS_REGO_RE.test(rego.trim())) return zeroFee('RAAus-registered aircraft — free placement.');

  const p = Number.isFinite(price) ? Math.max(0, Math.round(price as number)) : 0;
  if (p < PREMIUM_THRESHOLD_AUD) {
    return {
      feeAud: BASE_LISTING_FEE_AUD,
      free: false,
      tier: 'standard',
      reason: `Certified aircraft under $${PREMIUM_THRESHOLD_AUD.toLocaleString()}.`,
      breakdown: [{ label: 'Base listing fee', amount: BASE_LISTING_FEE_AUD }],
    };
  }

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

export function fmtAud(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  if (n === 0) return 'Free';
  return n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export interface DealerPlan {
  key: 'dealer_lite' | 'pro';
  name: string;
  priceLabel: string;
  priceMonthlyAud: number;
  listingLimit: number | 'unlimited';
  desc: string;
  features: string[];
}

// Proposed future packaging only. Consumers must gate these behind
// BILLING_ENABLED; while false, business accounts use launch access.
export const DEALER_PLANS: DealerPlan[] = [
  {
    key: 'dealer_lite',
    name: 'Dealer Lite',
    priceLabel: '$49/mo',
    priceMonthlyAud: 49,
    listingLimit: 3,
    desc: 'Up to 3 active listings, verified badge, lead alerts',
    features: ['Up to 3 active listings', 'Verified business badge', 'Real-time lead alerts', 'ABR auto-verification'],
  },
  {
    key: 'pro',
    name: 'Pro',
    priceLabel: '$199/mo',
    priceMonthlyAud: 199,
    listingLimit: 'unlimited',
    desc: 'Unlimited listings, featured slots, bulk import, team access',
    features: ['Unlimited active listings', 'Featured listing slots', 'Bulk CSV import', 'Team access (3 seats)', 'Market-position analytics'],
  },
];
