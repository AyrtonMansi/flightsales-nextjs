'use client';
import { useState } from 'react';

// Small modal opened from the listing detail's "Report listing" link.
// Sends the report to /api/reports which persists + emails admin.
// Anonymous reporters can submit by providing an email; logged-in
// users have their reporter_user_id stamped automatically server-side
// (well, we still pass it from the client — the API uses whichever
// is present).
const REASONS = [
  { value: 'fake_listing', label: 'Looks fake / scam' },
  { value: 'wrong_price', label: 'Price is misleading' },
  { value: 'sold_elsewhere', label: 'Already sold elsewhere' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

export default function ReportListingModal({ aircraftId, user, onClose }) {
  const [reason, setReason] = useState('fake_listing');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aircraftId,
          reason,
          details: details.trim() || null,
          reporterUserId: user?.id || null,
          reporterEmail: reporterEmail.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to submit');
      setDone(true);
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fs-confirm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="fs-confirm-card" style={{ maxWidth: 460 }}>
        {done ? (
          <>
            <h3 className="fs-confirm-title">Report submitted</h3>
            <p className="fs-confirm-message">
              Thanks. Our team reviews every report within 24 hours and will follow up by email if needed.
            </p>
            <div className="fs-confirm-actions">
              <button type="button" className="fs-confirm-btn fs-confirm-btn-primary" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <h3 className="fs-confirm-title">Report this listing</h3>
            <p className="fs-confirm-message">
              Help us keep FlightSales clean. Reports are anonymous to the seller; admin reviews each within 24 hours.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {REASONS.map(r => (
                <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>

            <textarea
              className="fs-confirm-reason"
              rows={3}
              placeholder="Optional: any details (won't be shown to the seller)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            {!user && (
              <input
                type="email"
                className="fs-form-input"
                style={{ marginBottom: 12 }}
                placeholder="Your email (so we can follow up)"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
              />
            )}

            {error && (
              <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
            )}

            <div className="fs-confirm-actions">
              <button type="button" className="fs-confirm-btn fs-confirm-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="fs-confirm-btn fs-confirm-btn-destructive" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
