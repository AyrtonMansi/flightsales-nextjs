'use client';

const RefundsPage = () => (
  <>
    <div className="fs-about-hero">
      <div className="fs-container">
        <h1 style={{ fontFamily: 'var(--fs-font)', fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em' }}>Refunds & Cancellations</h1>
        <p style={{ color: 'var(--fs-ink-3)', marginTop: 8, fontSize: 16 }}>Current launch-access policy. Last updated August 2026.</p>
      </div>
    </div>

    <section className="fs-section">
      <div className="fs-container fs-legal">
        <h2>No payments are currently collected</h2>
        <p>FlightSales is currently operating with free launch access. The live marketplace does not currently charge listing fees or dealer subscription fees, so there is no listing or subscription payment to refund.</p>

        <h2>Listings</h2>
        <ul>
          <li>You can withdraw or remove your own listing through the available account controls.</li>
          <li>FlightSales may reject, suspend or remove a listing that does not meet marketplace requirements or that raises safety, fraud, legal or data-quality concerns.</li>
          <li>Removing a free listing does not create a monetary credit or refund because no listing fee was charged.</li>
        </ul>

        <h2>Future paid products</h2>
        <p>If FlightSales introduces a paid listing, subscription, boost or add-on, the applicable price, billing period, cancellation terms and any product-specific refund conditions will be shown before purchase. This page and the Terms of Service will be updated before paid functionality is made generally available.</p>

        <h2>Incorrect or unauthorised charges</h2>
        <p>If you believe FlightSales has charged you in error, contact <a href="mailto:support@flightsales.com.au">support@flightsales.com.au</a> with the relevant transaction details. Because the current launch product does not collect listing or subscription payments, any apparent FlightSales charge should be investigated promptly.</p>

        <h2>Australian Consumer Law</h2>
        <p>Nothing in this policy excludes, restricts or modifies a consumer guarantee, right or remedy that cannot lawfully be excluded under the Australian Consumer Law or other applicable law.</p>

        <h2>Questions</h2>
        <p>Email <a href="mailto:support@flightsales.com.au">support@flightsales.com.au</a>.</p>
      </div>
    </section>
  </>
);

export default RefundsPage;
