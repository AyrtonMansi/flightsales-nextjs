'use client';

export default function PricingPage() {
  return (
    <>
      <section className="fs-about-hero">
        <div className="fs-container">
          <p className="fs-hero-eyebrow"><span className="fs-hero-eyebrow-dot" />Pricing</p>
          <h1>Free during launch access.</h1>
          <p className="fs-hero-sub" style={{ maxWidth: 660 }}>
            FlightSales is not currently charging listing fees or dealer subscriptions. You can create an account, submit an aircraft for review and manage enquiries without entering payment details.
          </p>
        </div>
      </section>

      <section className="fs-section">
        <div className="fs-container" style={{ maxWidth: 980 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <div style={{ border: '1px solid var(--fs-line)', borderRadius: 14, padding: 26, background: '#fff' }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fs-ink-3)', marginBottom: 10 }}>Private sellers</p>
              <p style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Free</p>
              <p style={{ fontSize: 13.5, color: 'var(--fs-ink-3)', lineHeight: 1.55, margin: 0 }}>Submit aircraft listings for review, receive buyer enquiries and manage your listings from your account.</p>
            </div>

            <div style={{ border: '1px solid var(--fs-line)', borderRadius: 14, padding: 26, background: '#fff' }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fs-ink-3)', marginBottom: 10 }}>Aviation businesses</p>
              <p style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Free launch access</p>
              <p style={{ fontSize: 13.5, color: 'var(--fs-ink-3)', lineHeight: 1.55, margin: 0 }}>Business accounts can verify their ABN, publish approved inventory and use the currently available dealer tools without a subscription charge.</p>
            </div>
          </div>

          <div style={{ marginTop: 28, padding: '18px 20px', border: '1px solid var(--fs-line)', borderRadius: 12, background: 'var(--fs-bg-2)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 7px' }}>Before paid products launch</h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--fs-ink-3)', margin: 0 }}>
              Any future paid listing, subscription, boost or add-on will be presented with its price and material terms before purchase. FlightSales will not retrospectively charge for listings created while launch access is free.
            </p>
          </div>

          <div style={{ marginTop: 34 }}>
            <h2 className="fs-section-title" style={{ marginBottom: 8 }}>What is included now</h2>
            <p className="fs-section-sub" style={{ marginBottom: 22 }}>Current product capability, not future-plan promises.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[
                ['Marketplace listing', 'Structured aircraft details, photos and seller contact workflow.'],
                ['Search & filters', 'Aircraft-specific discovery across category, make, model, price, performance and equipment.'],
                ['Business verification', 'ABN verification for business accounts where the verification service is available.'],
                ['Enquiry management', 'Buyer enquiries routed through FlightSales with account and anti-abuse controls.'],
              ].map(([title, body]) => (
                <div key={title} style={{ padding: 18, border: '1px solid var(--fs-line)', borderRadius: 12, background: '#fff' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fs-ink-3)' }}>{body}</div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--fs-ink-4)' }}>All references to pricing on FlightSales should be read together with the Terms of Service. Current launch access requires no payment method.</p>
        </div>
      </section>
    </>
  );
}
