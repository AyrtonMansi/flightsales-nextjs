'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { Icons } from '../Icons';

// Full-screen wizard a brand-new business signup hits right after they
// confirm their email. Captures the dealer-application detail + flips
// profiles.pending_dealer = true so the rest of the app can show the
// "we're reviewing your application" banner until admin approves.
//
// Once submitted, the user lands on /dashboard. They can browse, save,
// even submit listings (status='pending') — but the BusinessDashboard
// proper unlocks only after the admin sets role='dealer'.

export default function BusinessOnboarding({ user, onComplete }) {
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState('dealer');
  const [annualListings, setAnnualListings] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !location.trim()) {
      setError('Business name and location are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1. Insert into dealer_applications. Admin's Dealer Apps tab
      //    surfaces pending rows for review.
      const { error: appErr } = await supabase
        .from('dealer_applications')
        .insert({
          user_id: user.id,
          business_name: businessName.trim(),
          abn: abn.trim() || null,
          location: location.trim(),
          message: [
            businessType ? `Type: ${businessType}` : null,
            annualListings ? `Est. annual listings: ${annualListings}` : null,
            phone ? `Phone: ${phone}` : null,
            message.trim() || null,
          ].filter(Boolean).join('\n') || null,
          status: 'pending',
        });
      if (appErr) throw appErr;

      // 2. Flip the user's profile to pending_dealer + business account
      //    type. Role stays 'private' until admin approves.
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          account_type: 'business',
          pending_dealer: true,
          phone: phone || null,
        })
        .eq('id', user.id);
      if (profErr) throw profErr;

      showToast('Application submitted — we\'ll review within 24-48h.');
      onComplete?.();
    } catch (err) {
      setError(err?.message || 'Submit failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fs-onboard-shell">
      <div className="fs-onboard-card">
        <div className="fs-onboard-header">
          <span className="fs-onboard-eyebrow">Business onboarding</span>
          <h1>Tell us about your business</h1>
          <p>We verify every dealer / brokerage to keep the marketplace trusted. Most applications are reviewed within 24–48 hours.</p>
        </div>

        <form onSubmit={handle} className="fs-onboard-form">
          <div className="fs-form-group">
            <label className="fs-form-label">Business name *</label>
            <input
              type="text"
              className="fs-form-input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Southern Aviation Group"
              required
            />
          </div>

          <div className="fs-grid-2">
            <div className="fs-form-group">
              <label className="fs-form-label">ABN</label>
              <input
                type="text"
                className="fs-form-input"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="11-digit ABN"
              />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Location *</label>
              <input
                type="text"
                className="fs-form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Moorabbin, VIC"
                required
              />
            </div>
          </div>

          <div className="fs-grid-2">
            <div className="fs-form-group">
              <label className="fs-form-label">Business type</label>
              <select
                className="fs-form-select"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              >
                <option value="dealer">Aircraft dealer</option>
                <option value="broker">Broker</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="maintenance">Maintenance / MRO</option>
                <option value="charter">Charter operator</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Estimated annual listings</label>
              <select
                className="fs-form-select"
                value={annualListings}
                onChange={(e) => setAnnualListings(e.target.value)}
              >
                <option value="">Choose…</option>
                <option value="1-5">1–5</option>
                <option value="6-20">6–20</option>
                <option value="21-50">21–50</option>
                <option value="50+">50+</option>
              </select>
            </div>
          </div>

          <div className="fs-form-group">
            <label className="fs-form-label">Business phone</label>
            <input
              type="tel"
              className="fs-form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="04XX XXX XXX"
            />
          </div>

          <div className="fs-form-group">
            <label className="fs-form-label">Anything else? (optional)</label>
            <textarea
              className="fs-form-input"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Years in business, primary categories sold, website…"
            />
          </div>

          {error && (
            <div className="fs-onboard-error" role="alert">{error}</div>
          )}

          <div className="fs-onboard-actions">
            <button
              type="button"
              className="fs-onboard-skip"
              onClick={() => onComplete?.({ skipped: true })}
              disabled={submitting}
            >
              Skip — set up later
            </button>
            <button
              type="submit"
              className="fs-onboard-submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit for review'} {Icons.arrowRight}
            </button>
          </div>
        </form>

        <p className="fs-onboard-foot">
          You&apos;ll get an email once approved. In the meantime, you can browse listings and save aircraft.
        </p>
      </div>
    </div>
  );
}
