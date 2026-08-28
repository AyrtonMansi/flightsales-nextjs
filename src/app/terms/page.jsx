export const metadata = {
  title: 'Terms of Service | FlightSales.com.au',
  description: 'Terms of Service for FlightSales.com.au, an Australian aircraft marketplace.',
  alternates: { canonical: 'https://flightsales.com.au/terms' },
};

const H2 = { fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '12px' };
const P = { marginBottom: '16px' };

export default function TermsPage() {
  return (
    <div className="fs-container" style={{ maxWidth: 820, margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>Terms of Service</h1>
      <p style={{ color: 'var(--fs-gray-500)', marginBottom: '32px' }}>Last updated: August 2026</p>

      <div style={{ lineHeight: 1.7, color: 'var(--fs-gray-700)' }}>
        <h2 style={H2}>1. Using FlightSales</h2>
        <p style={P}>By using FlightSales.com.au you agree to these Terms. You must use the marketplace lawfully, provide accurate account information and keep your account secure.</p>

        <h2 style={H2}>2. Marketplace role</h2>
        <p style={P}>FlightSales provides software that allows aircraft sellers to publish listings and prospective buyers to search listings and make enquiries. Unless FlightSales expressly states otherwise for a particular service, FlightSales is not the seller, buyer, broker, financier, insurer, maintenance provider, aircraft inspector, escrow provider or party to an aircraft sale.</p>
        <p style={P}>A listing, seller badge, business verification result or aircraft-data lookup does not amount to a warranty by FlightSales about ownership, title, airworthiness, maintenance status, condition, value, regulatory compliance or the identity or conduct of a transaction party.</p>

        <h2 style={H2}>3. Accounts and business verification</h2>
        <p style={P}>Some features require an account and verified email address. Business accounts may also be required to complete an ABN verification step. A successful ABN lookup means the marketplace matched submitted business details to information returned by the verification service; it does not constitute endorsement of that business or its inventory.</p>

        <h2 style={H2}>4. Seller obligations</h2>
        <p style={P}>If you submit a listing, you represent that you are the owner or are authorised to act for the owner, and that the information and images you provide are accurate and not materially misleading. You must promptly update or remove a listing that is sold, withdrawn or materially changes.</p>
        <p style={P}>You must not misrepresent registration, maintenance history, hours, damage history, equipment, title, finance or encumbrances, location, price or any other material aircraft information. FlightSales may review, reject, suspend or remove listings where reasonably required to protect users, operate the service or address suspected misuse.</p>

        <h2 style={H2}>5. Buyer due diligence</h2>
        <p style={P}>Aircraft transactions can involve significant technical, regulatory and financial risk. Buyers should independently verify the seller's authority, aircraft identity and registration, title and encumbrances, maintenance records, logbooks, hours, damage history, airworthiness and transaction documents and should obtain appropriate professional advice or inspection before committing funds.</p>

        <h2 style={H2}>6. Enquiries and communications</h2>
        <p style={P}>When you submit an enquiry, the information you enter may be provided to the relevant seller or dealer so they can respond. You must not use FlightSales messaging or enquiry tools for spam, harassment, scraping, credential theft, payment diversion or other abusive conduct.</p>

        <h2 style={H2}>7. Fees and launch access</h2>
        <p style={P}>FlightSales is currently operating launch access without charging listing fees or dealer subscription fees and does not require a payment method to submit a listing. If paid products are introduced, the applicable price and material purchase terms will be presented before you agree to a charge. FlightSales will not retrospectively charge for listings created while the service states that launch access is free.</p>

        <h2 style={H2}>8. Prohibited conduct</h2>
        <p style={P}>You must not publish fraudulent or deceptive content, impersonate another person or business, interfere with service security, attempt unauthorised access, automate abusive traffic, harvest personal information, distribute malware, manipulate marketplace metrics, evade moderation, or use FlightSales to facilitate unlawful conduct.</p>

        <h2 style={H2}>9. Reports, moderation and suspension</h2>
        <p style={P}>Users can report listings or conduct for review. FlightSales may investigate reports and may limit, suspend or terminate access, remove content, preserve relevant records or refer matters to appropriate authorities where reasonably necessary. Moderation decisions may rely on automated signals and human review and are not a substitute for buyer due diligence.</p>

        <h2 style={H2}>10. Availability and third-party services</h2>
        <p style={P}>FlightSales depends on third-party infrastructure and data services. We do not promise uninterrupted availability or that third-party data is complete or current. Features may change, be suspended or be withdrawn as the service evolves.</p>

        <h2 style={H2}>11. Liability and Australian Consumer Law</h2>
        <p style={P}>Nothing in these Terms excludes, restricts or modifies any guarantee, right or remedy that cannot lawfully be excluded under the Australian Consumer Law or other applicable law. Subject to those rights, FlightSales is not responsible for losses arising from the condition or sale of an aircraft, inaccurate seller-supplied information, a user's conduct, or decisions made without independent verification.</p>

        <h2 style={H2}>12. Privacy</h2>
        <p style={P}>Our <a href="/privacy">Privacy Policy</a> explains how personal information is handled. By submitting an enquiry or listing, you acknowledge the disclosures necessary to provide those marketplace functions.</p>

        <h2 style={H2}>13. Changes to these Terms</h2>
        <p style={P}>We may update these Terms as the product or law changes. Material changes will apply prospectively from the updated effective date, except where a different approach is required by law.</p>

        <h2 style={H2}>14. Contact</h2>
        <p style={P}>Questions about these Terms can be sent to <a href="mailto:legal@flightsales.com.au">legal@flightsales.com.au</a>.</p>

        <div style={{ marginTop: 36, padding: 16, border: '1px solid var(--fs-line)', borderRadius: 10, background: 'var(--fs-bg-2)', fontSize: 12.5, color: 'var(--fs-ink-3)' }}>
          Launch-readiness note: these Terms should receive final Australian legal review before public commercial launch or before payment functionality is enabled.
        </div>
      </div>
    </div>
  );
}
