export const metadata = {
  title: 'Terms of Service | Flightsales.com.au',
  description: 'Terms of Service for Flightsales.com.au - Australia\'s aircraft marketplace'
};

export default function TermsPage() {
  return (
    <div className="fs-container" style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>Terms of Service</h1>
      <p style={{ color: 'var(--fs-gray-500)', marginBottom: '32px' }}>Last updated: March 22, 2026</p>
      
      <div style={{ lineHeight: 1.7, color: 'var(--fs-gray-700)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
        <p style={{ marginBottom: '16px' }}>
          By accessing or using Flightsales.com.au ("the Platform"), you agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use the Platform.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>2. Description of Service</h2>
        <p style={{ marginBottom: '16px' }}>
          Flightsales.com.au is an online marketplace that connects aircraft buyers and sellers in Australia. 
          We provide a platform for listing aircraft, searching for aircraft, and facilitating enquiries between parties.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>3. User Accounts</h2>
        <p style={{ marginBottom: '16px' }}>
          To access certain features of the Platform, you must register for an account. You agree to provide accurate, 
          current, and complete information during registration and to update such information to keep it accurate, 
          current, and complete.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>4. Listing Aircraft</h2>
        <p style={{ marginBottom: '16px' }}>
          When listing an aircraft on the Platform, you represent and warrant that: (a) you are the legal owner or 
          authorised agent of the aircraft; (b) all information provided is accurate and truthful; (c) you have the 
          right to sell the aircraft; and (d) the aircraft complies with all applicable CASA regulations.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>5. Fees and Payments</h2>
        <p style={{ marginBottom: '16px' }}>
          Listing fees are as specified on the Platform at the time of listing. All fees are in Australian Dollars (AUD) 
          and are non-refundable unless otherwise stated.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>6. Prohibited Activities</h2>
        <p style={{ marginBottom: '16px' }}>
          Users may not: (a) list fraudulent or misleading information; (b) use the Platform for illegal purposes; 
          (c) interfere with the Platform's security features; (d) scrape or copy content without permission; 
          (e) harass other users.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>7. Limitation of Liability</h2>
        <p style={{ marginBottom: '16px' }}>
          Flightsales Pty Ltd acts as a platform provider only and is not responsible for the accuracy of listings, 
          the condition of aircraft, or the conduct of users. All transactions are between buyers and sellers directly.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>8. Contact</h2>
        <p>
          For questions about these Terms, please contact us at legal@flightsales.com.au
        </p>
      </div>
    </div>
  );
}
