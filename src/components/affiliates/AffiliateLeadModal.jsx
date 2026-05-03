'use client';
import { useState } from 'react';
import { Icons } from '../Icons';
import { showToast } from '../../lib/toast';

// Lead-capture modal opened when the user clicks a partner CTA. Pre-
// fills name + email if they're signed in. Discloses what's being
// shared (per AU privacy norms) and requires explicit consent before
// the lead row is created and dispatched.
//
// On success we show a confirmation panel inside the modal so the
// user gets immediate feedback without losing context — they can
// close when ready.

export default function AffiliateLeadModal({ partner, listing, user, onClose }) {
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!consent) {
      showToast('Please tick consent to continue.');
      return;
    }
    if (!name.trim() || !email.trim()) {
      showToast('Name and email are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/affiliate-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: partner.id,
          userId: user?.id || null,
          listingId: listing?.id || null,
          userName: name.trim(),
          userEmail: email.trim(),
          userPhone: phone.trim() || null,
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'submit_failed');
      }
      setDone(true);
    } catch (err) {
      showToast(err.message === 'rate_limited'
        ? 'Too many requests — please wait a minute.'
        : 'Submit failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fs-modal-backdrop" onClick={onClose}>
      <div className="fs-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="fs-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {partner.logo_url && (
              <img src={partner.logo_url} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: '#fff', border: '1px solid var(--fs-line)' }} />
            )}
            <div>
              <h3 style={{ margin: 0 }}>{partner.cta_text || 'Get a quote'}</h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--fs-ink-3)' }}>via {partner.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close">{Icons.x}</button>
        </div>

        {done ? (
          <div className="fs-modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--fs-accent-50)', color: 'var(--fs-accent-700)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontSize: 28 }}>✓</div>
            <h4 style={{ margin: '0 0 8px', fontSize: 18 }}>Enquiry sent</h4>
            <p style={{ margin: '0 0 4px', color: 'var(--fs-ink-3)', fontSize: 14, lineHeight: 1.5 }}>
              We&apos;ve forwarded your details to <strong>{partner.name}</strong>.
              They&apos;ll typically be in touch within 24 hours.
            </p>
            <p style={{ margin: '12px 0 24px', color: 'var(--fs-ink-4)', fontSize: 12 }}>
              We&apos;ve also emailed you a copy.
            </p>
            <button type="button" className="fs-form-submit" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="fs-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {partner.description && (
              <p style={{ margin: 0, color: 'var(--fs-ink-3)', fontSize: 14, lineHeight: 1.5 }}>
                {partner.description}
              </p>
            )}

            <label className="fs-form-group">
              <span className="fs-form-label">Your name *</span>
              <input
                type="text"
                className="fs-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="fs-form-group">
              <span className="fs-form-label">Email *</span>
              <input
                type="email"
                className="fs-form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="fs-form-group">
              <span className="fs-form-label">Phone (optional but speeds up contact)</span>
              <input
                type="tel"
                className="fs-form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="04XX XXX XXX"
              />
            </label>

            <label className="fs-form-group">
              <span className="fs-form-label">Anything they should know? (optional)</span>
              <textarea
                rows={3}
                className="fs-form-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Budget, timeline, financing already in place, etc."
              />
            </label>

            {/* Consent disclosure — explicit + visible. AU privacy law
                expects this for third-party data sharing. */}
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--fs-bg-2)', borderRadius: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--fs-ink-3)' }}>
                I agree to share my name, email{phone ? ', phone' : ''}{listing ? `, and the aircraft I'm enquiring about (${listing.title || `#${listing.id}`})` : ''} with <strong style={{ color: 'var(--fs-ink)' }}>{partner.name}</strong> so they can contact me about {prettyTypeLong(partner.type)}. They will only use my details for this enquiry.
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" className="fs-form-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="fs-form-submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send enquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function prettyTypeLong(t) {
  switch (t) {
    case 'finance':     return 'aircraft finance';
    case 'insurance':   return 'aircraft insurance';
    case 'escrow':      return 'escrow services';
    case 'maintenance': return 'maintenance / MRO services';
    case 'training':    return 'flight training';
    case 'inspection':  return 'pre-purchase inspection';
    case 'transport':   return 'aircraft transport / ferry services';
    default:            return 'their services';
  }
}
