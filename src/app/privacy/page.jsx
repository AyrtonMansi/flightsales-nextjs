export const metadata = {
  title: 'Privacy Policy | FlightSales.com.au',
  description: 'Privacy Policy for FlightSales.com.au - Australia\'s aircraft marketplace'
};

export default function PrivacyPage() {
  return (
    <div className="fs-container" style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--fs-gray-500)', marginBottom: '32px' }}>Last updated: August 2026</p>

      <div style={{ lineHeight: 1.7, color: 'var(--fs-gray-700)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>1. Introduction</h2>
        <p style={{ marginBottom: '16px' }}>
          FlightSales Pty Ltd ("we", "us", "our") handles personal information in accordance with applicable Australian privacy law, including the Privacy Act 1988 (Cth) and Australian Privacy Principles where they apply.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>2. Information we collect</h2>
        <p style={{ marginBottom: '16px' }}>Depending on how you use FlightSales, information we handle may include:</p>
        <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
          <li>Name and contact details such as email and phone number</li>
          <li>Account and authentication information</li>
          <li>Aircraft listing information and images you submit</li>
          <li>Enquiries and communications submitted through the marketplace</li>
          <li>Usage, security and analytics information generated when you use the service</li>
          <li>
            For business accounts: Australian Business Number (ABN) and public business details returned by the Australian Business Register lookup used by the service, such as entity name, ABN status, GST status, state and postcode.
          </li>
          <li>
            Approximate country derived at request time from hosting-platform geolocation data to improve location ordering. The application does not intentionally persist this value as a user-profile field.
          </li>
        </ul>
        <p style={{ marginBottom: '16px' }}>
          If paid products are enabled in the future, this policy should be updated before launch to identify the payment processor and the payment information that processor handles.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>3. How we collect information</h2>
        <p style={{ marginBottom: '16px' }}>
          We collect information you provide when creating an account, submitting or managing a listing, making an enquiry, contacting us, or completing a business-verification step. We also receive technical information when the service is used.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>4. Why we use information</h2>
        <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
          <li>Operate, secure and support the marketplace</li>
          <li>Publish and manage aircraft listings</li>
          <li>Facilitate enquiries between prospective buyers and sellers</li>
          <li>Perform business-account verification where that feature is used</li>
          <li>Prevent abuse, investigate reports and administer accounts</li>
          <li>Measure and improve service performance and user experience</li>
          <li>Meet applicable legal obligations</li>
        </ul>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>5. Disclosure</h2>
        <p style={{ marginBottom: '16px' }}>
          We may disclose information to the seller or dealer you contact, technology providers used to operate FlightSales, professional advisers, and regulators or law-enforcement bodies where disclosure is authorised or required by law. An aircraft enquiry necessarily shares the details you submit with the relevant seller or dealer.
        </p>
        <p style={{ marginBottom: '16px' }}>
          Some technology providers may process information outside Australia. Before public launch, FlightSales should maintain an up-to-date provider register and this policy should identify material overseas processing locations where required by the Australian Privacy Principles.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>6. Security and retention</h2>
        <p style={{ marginBottom: '16px' }}>
          We take reasonable technical and organisational steps to protect personal information from misuse, loss and unauthorised access. We retain information only for as long as reasonably required for the purposes above, dispute and security handling, and applicable record-keeping obligations. Retention periods may differ by record type.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>7. Access and correction</h2>
        <p style={{ marginBottom: '16px' }}>
          You may request access to or correction of personal information we hold about you by contacting privacy@flightsales.com.au. We may need to verify your identity before acting on a request.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>8. Cookies, local storage and analytics</h2>
        <p style={{ marginBottom: '16px' }}>
          FlightSales uses browser storage and authentication technologies required to operate account and site-access features. Where analytics is enabled, the site may also send usage events to the configured analytics provider. Browser controls can restrict some storage, but doing so may prevent account or protected-site features from working correctly.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>9. Complaints</h2>
        <p style={{ marginBottom: '16px' }}>
          Privacy complaints can be sent to privacy@flightsales.com.au. If an applicable privacy complaint is not resolved to your satisfaction, you may be entitled to contact the Office of the Australian Information Commissioner.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>10. Contact</h2>
        <p>
          Privacy Officer<br />
          FlightSales Pty Ltd<br />
          Email: privacy@flightsales.com.au
        </p>

        <p style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--fs-line)', fontSize: 12, color: 'var(--fs-gray-500)' }}>
          This policy must be reviewed by Australian legal counsel against FlightSales' final production data flows, suppliers and commercial features before unrestricted public launch.
        </p>
      </div>
    </div>
  );
}