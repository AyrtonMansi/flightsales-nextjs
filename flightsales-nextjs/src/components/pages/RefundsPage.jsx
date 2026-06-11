'use client';

// Plain-English refund + cancellation policy. Same legal-page
// styling as Privacy/Terms (.fs-legal class) for visual consistency.

const RefundsPage = () => (
  <>
    <div className="fs-about-hero">
      <div className="fs-container">
        <h1 style={{ fontFamily: 'var(--fs-font)', fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Refunds & Cancellations
        </h1>
        <p style={{ color: 'var(--fs-ink-3)', marginTop: 8, fontSize: 16 }}>
          Plain English. Last updated April 2026.
        </p>
      </div>
    </div>

    <section className="fs-section">
      <div className="fs-container fs-legal">
        <h2>Quick answers</h2>
        <ul>
          <li><strong>Free listings</strong> — no money changes hands; cancel any time by deleting the listing.</li>
          <li><strong>Paid listings</strong> — refundable in full within 24 hours of payment if the listing hasn't yet been published. After that, see below.</li>
          <li><strong>Dealer subscriptions</strong> — cancel any time. Listings stay live until the end of the paid period; no refund on unused days.</li>
          <li><strong>Boosts and add-ons</strong> — non-refundable once placed.</li>
        </ul>

        <h2>Paid listings (single-listing fees)</h2>
        <p>Paid listings are charged at time of publication.</p>
        <ul>
          <li><strong>Within 24 hours of payment, before publication:</strong> full refund, no questions.</li>
          <li><strong>After publication:</strong> no refund. The listing remains live for the full purchased period (e.g. 30 days).</li>
          <li><strong>If we reject the listing for policy reasons</strong> (e.g. inaccurate registration, prohibited content) AND don't allow you to resubmit a corrected version: full refund within 5 business days.</li>
          <li><strong>"Sold-fast" credit</strong>: if you mark the aircraft sold within 7 days of going live on a Premium tier, we'll credit 50% of the listing fee toward your next listing within 12 months. Apply via your dashboard.</li>
        </ul>

        <h2>Dealer subscriptions (Lite, Pro, Enterprise)</h2>
        <ul>
          <li><strong>Cancel any time</strong> from your dashboard. Cancellation is immediate.</li>
          <li><strong>Active listings</strong> remain live for the rest of the paid period — they're not pulled down on cancellation.</li>
          <li><strong>No refund on unused days</strong> within a billing period (monthly or annual).</li>
          <li><strong>Annual prepay</strong> — prorated refund of the unused months only if you cancel within the first 30 days of a new annual term.</li>
          <li><strong>If we discontinue a feature</strong> central to your tier, you'll get a prorated refund or the option to downgrade.</li>
        </ul>

        <h2>Boosts and add-ons</h2>
        <p>Boosts (Featured, Spotlight) and one-off add-ons (Photo Pack, Listing Audit) are <strong>non-refundable once placed</strong>. They're delivered immediately on payment.</p>
        <p>Exception: if a Photo Pack shoot is cancelled by us (weather, photographer unavailable), full refund or reschedule at your option.</p>

        <h2>Disputes & chargebacks</h2>
        <p>Talk to us first. Email <a href="mailto:support@flightsales.com.au">support@flightsales.com.au</a> with your order number and we'll resolve it within 3 business days. If you initiate a chargeback before contacting us, we'll suspend your account pending resolution.</p>

        <h2>Account closure</h2>
        <p>You can close your account from your dashboard at any time. We'll keep your data for 30 days in case you change your mind, then permanently delete it (excluding records we're legally required to retain — see our <a href="/privacy">Privacy Policy</a>).</p>

        <h2>Australian Consumer Law</h2>
        <p>Nothing in this policy excludes, restricts or modifies any right or remedy implied by Australian Consumer Law (ACL). If a service is not delivered as described or contains a major failure, you're entitled to a refund or replacement under the ACL regardless of the rules above.</p>

        <h2>Questions</h2>
        <p>Email <a href="mailto:support@flightsales.com.au">support@flightsales.com.au</a>. We reply within 24 business hours.</p>
      </div>
    </section>
  </>
);

export default RefundsPage;
