'use client';
import { useState } from 'react';
import { showToast } from '../../lib/toast';

// Inline form a logged-in user fills to apply for verified dealer status.
// Designed to be embedded in the user's Dashboard or on the /sell page.
//
// The form is deliberately small: business name, ABN (optional but encouraged
// for verification), location, and an optional message. We avoid asking for
// uploads in v1 — admin can request docs out-of-band on review.
export default function DealerApplyForm({ userId, onSubmitted, submit }) {
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !location.trim()) {
      showToast('Business name and location are required');
      return;
    }
    setSubmitting(true);
    try {
      await submit(userId, {
        business_name: businessName.trim(),
        abn: abn.trim() || null,
        location: location.trim(),
        message: message.trim() || null,
      });
      setDone(true);
      showToast('Application submitted');
      onSubmitted?.();
    } catch (err) {
      showToast(err?.message ? `Submit failed: ${err.message}` : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="fs-dealer-apply done">
        <h3>Application received</h3>
        <p>An admin will review and respond by email. Most applications are reviewed within 2 business days.</p>
      </div>
    );
  }

  return (
    <form className="fs-dealer-apply" onSubmit={handle}>
      <h3>Apply for verified dealer status</h3>
      <p className="fs-dealer-apply-sub">Verified dealers get a "Verified" badge on their listings and a dealer profile page. Approval is manual — usually within 2 business days.</p>

      <label className="fs-form-label" htmlFor="dapply-name">Business name *</label>
      <input
        id="dapply-name" type="text"
        className="fs-form-input"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Southern Aviation Group"
        required
      />

      <label className="fs-form-label" htmlFor="dapply-abn">ABN</label>
      <input
        id="dapply-abn" type="text"
        className="fs-form-input"
        value={abn}
        onChange={(e) => setAbn(e.target.value)}
        placeholder="11 digit ABN (optional but speeds up verification)"
      />

      <label className="fs-form-label" htmlFor="dapply-location">Location *</label>
      <input
        id="dapply-location" type="text"
        className="fs-form-input"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Moorabbin, VIC"
        required
      />

      <label className="fs-form-label" htmlFor="dapply-message">Anything else?</label>
      <textarea
        id="dapply-message"
        className="fs-form-input"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Years in business, primary categories sold, etc. (optional)"
      />

      <button
        type="submit"
        className="fs-form-submit"
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}
