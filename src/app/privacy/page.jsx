export const metadata = {
  title: 'Privacy Policy | Flightsales.com.au',
  description: 'Privacy Policy for Flightsales.com.au - Australia\'s aircraft marketplace'
};

export default function PrivacyPage() {
  return (
    <div className="fs-container" style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--fs-gray-500)', marginBottom: '32px' }}>Last updated: March 22, 2026</p>
      
      <div style={{ lineHeight: 1.7, color: 'var(--fs-gray-700)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>1. Introduction</h2>
        <p style={{ marginBottom: '16px' }}>
          Flightsales Pty Ltd ("we", "us", "our") is committed to protecting your privacy 
          in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>2. Information We Collect</h2>
        <p style={{ marginBottom: '16px' }}>
          We collect personal information that is necessary for our business functions, including:
        </p>
        <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
          <li>Name and contact details (email, phone)</li>
          <li>Account login credentials</li>
          <li>Aircraft listing information</li>
          <li>Enquiry and communication history</li>
          <li>Payment information (processed securely via Stripe)</li>
          <li>Usage data and analytics</li>
        </ul>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>3. How We Collect Information</h2>
        <p style={{ marginBottom: '16px' }}>
          We collect personal information directly from you when you: (a) create an account; (b) list an aircraft; 
          (c) submit an enquiry; (d) contact us; or (e) use our services.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>4. Purpose of Collection</h2>
        <p style={{ marginBottom: '16px' }}>
          We collect, hold, use, and disclose personal information for the following purposes:
        </p>
        <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
          <li>To provide our marketplace services</li>
          <li>To facilitate communication between buyers and sellers</li>
          <li>To process payments and listings</li>
          <li>To verify dealer accounts and aircraft listings</li>
          <li>To improve our services and user experience</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>5. Disclosure of Information</h2>
        <p style={{ marginBottom: '16px' }}>
          We may disclose your personal information to: (a) aircraft sellers when you submit an enquiry; 
          (b) service providers who assist us (e.g., payment processors, hosting); (c) regulatory authorities 
          when required by law.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>6. Data Security</h2>
        <p style={{ marginBottom: '16px' }}>
          We take reasonable steps to protect your personal information from misuse, interference, loss, 
          unauthorised access, modification, or disclosure. We use industry-standard encryption and security measures.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>7. Access and Correction</h2>
        <p style={{ marginBottom: '16px' }}>
          You have the right to access and correct your personal information. Contact us at privacy@flightsales.com.au 
          to request access or correction.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>8. Cookies</h2>
        <p style={{ marginBottom: '16px' }}>
          We use cookies to enhance your experience on our Platform. You can manage cookie preferences through 
          your browser settings.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>9. Complaints</h2>
        <p style={{ marginBottom: '16px' }}>
          If you believe we have breached the Australian Privacy Principles, please contact us at 
          privacy@flightsales.com.au. If you are not satisfied with our response, you may complain to the 
          Office of the Australian Information Commissioner (OAIC).
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', marginBottom: '16px' }}>10. Contact Us</h2>
        <p>
          For privacy-related questions, please contact:<br />
          Privacy Officer<br />
          Flightsales Pty Ltd<br />
          Email: privacy@flightsales.com.au
        </p>
      </div>
    </div>
  );
}
