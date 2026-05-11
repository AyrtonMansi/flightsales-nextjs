'use client';
import { DEALER_PLANS, BASE_LISTING_FEE_AUD, PREMIUM_THRESHOLD_AUD } from '../../lib/pricing';

// Public pricing page. Lays out the listing-fee tiers + the dealer
// subscription plans. Pure marketing content — pulls the actual
// numbers from lib/pricing.ts so this and the SellPage fee
// calculator never drift.

const LISTING_TIERS = [
  {
    title: 'Experimental, LSA, ultralight, RAAus-registered',
    price: 'Free',
    note: 'No listing fee on recreational class aircraft.',
    accent: '#1a7f37',
  },
  {
    title: `Certified aircraft under $${PREMIUM_THRESHOLD_AUD.toLocaleString()}`,
    price: `$${BASE_LISTING_FEE_AUD} flat`,
    note: 'One-off listing fee. Stays live until sold or 90 days, whichever comes first.',
  },
  {
    title: `Certified aircraft $${PREMIUM_THRESHOLD_AUD.toLocaleString()} and over`,
    price: `$${BASE_LISTING_FEE_AUD} + 0.025% above $${(PREMIUM_THRESHOLD_AUD / 1000).toFixed(0)}k`,
    note: 'Scales softly with price. A $1M listing pays $99 + $125 = $224.',
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="fs-about-hero">
        <div className="fs-container">
          <p className="fs-hero-eyebrow">
            <span className="fs-hero-eyebrow-dot" />
            Pricing
          </p>
          <h1>Honest, flat-rate pricing.</h1>
          <p className="fs-hero-sub" style={{ maxWidth: 640 }}>
            Recreational aircraft list free. Certified aircraft pay a small
            flat fee, with a fair % above the half-mil mark. No commission
            on the sale.
          </p>
        </div>
      </section>

      <section className="fs-section">
        <div className="fs-container">
          <h2 className="fs-section-title" style={{ marginBottom: 8 }}>Listing fees</h2>
          <p className="fs-section-sub" style={{ marginBottom: 32 }}>
            Pay once when you list. No commission on the sale, no monthly
            for private sellers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {LISTING_TIERS.map((t) => (
              <div
                key={t.title}
                style={{
                  border: '1px solid var(--fs-line)',
                  borderRadius: 14,
                  padding: 24,
                  background: '#fff',
                }}
              >
                <p style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--fs-ink-3)',
                  marginBottom: 10,
                }}>
                  {t.title}
                </p>
                <p style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: t.accent || 'var(--fs-ink)',
                  marginBottom: 8,
                }}>
                  {t.price}
                </p>
                <p style={{ fontSize: 13.5, color: 'var(--fs-ink-3)', lineHeight: 1.5, margin: 0 }}>
                  {t.note}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 28,
            padding: '14px 18px',
            background: 'var(--fs-bg-2)',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--fs-ink-3)',
          }}>
            <strong style={{ color: 'var(--fs-ink)' }}>Example.</strong>{' '}
            A 2018 Cirrus SR22 at $750,000 → $99 + 0.025% × $250,000 = $99 + $63 = <strong>$162</strong>.
          </div>
        </div>
      </section>

      <section className="fs-section fs-section-alt">
        <div className="fs-container">
          <h2 className="fs-section-title" style={{ marginBottom: 8 }}>Dealer subscriptions</h2>
          <p className="fs-section-sub" style={{ marginBottom: 32 }}>
            For businesses listing inventory. Dealer Lite starts at $49/mo and
            covers up to 5 active listings — perfect for boutique brokers and
            first-year dealers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {DEALER_PLANS.map((p) => (
              <div
                key={p.key}
                style={{
                  border: '1px solid var(--fs-line)',
                  borderRadius: 14,
                  padding: 24,
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <p style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--fs-ink-3)',
                  marginBottom: 10,
                }}>{p.name}</p>
                <p style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: 14,
                }}>{p.priceLabel}</p>
                <p style={{ fontSize: 13, color: 'var(--fs-ink-3)', marginBottom: 16, lineHeight: 1.5 }}>
                  {p.desc}
                </p>
                <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', flex: 1 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{
                      fontSize: 13,
                      color: 'var(--fs-ink-2)',
                      padding: '5px 0',
                      borderTop: '1px solid var(--fs-line)',
                    }}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 18, fontSize: 12, color: 'var(--fs-ink-4)' }}>
            All prices in AUD, GST inclusive where applicable. Cancel any time.
          </p>
        </div>
      </section>
    </>
  );
}
