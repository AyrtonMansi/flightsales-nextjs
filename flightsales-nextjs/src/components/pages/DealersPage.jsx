'use client';
import { useState } from 'react';
import { Icons } from '../Icons';
import { useDealers, submitLead } from '../../lib/hooks';
import { DEALERS } from '../../lib/constants';

const DealersPage = ({ onSelectDealer }) => {
  const { dealers: dealersFromDB, loading } = useDealers();
  const dealers = dealersFromDB.length > 0 ? dealersFromDB : DEALERS;
  const [applyForm, setApplyForm] = useState({ name: '', email: '', business: '', phone: '' });
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [showApply, setShowApply] = useState(false);

  const handleApply = async () => {
    if (!applyForm.name || !applyForm.email || !applyForm.business) { setApplyError('Please fill in all required fields.'); return; }
    setApplying(true); setApplyError(null);
    try {
      await submitLead('contact', { name: applyForm.name, email: applyForm.email, phone: applyForm.phone, message: `[DEALER APPLICATION] Business: ${applyForm.business}` });
      setApplied(true);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit. Please try again.');
    } finally { setApplying(false); }
  };

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Verified Dealers</h1>
          <p style={{ color: "var(--fs-ink-3)", marginTop: 8, fontSize: 16 }}>Trusted aviation businesses across Australia</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
            {loading ? [1,2,3,4,5,6].map(i => <div key={i} style={{ height: 160, background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />) :
              dealers.map(d => (
                <div key={d.id} className="fs-dealer-card" onClick={() => onSelectDealer && onSelectDealer(d)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 0, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", marginBottom: 12 }}>
                    <div className="fs-dealer-avatar" style={{ width: 56, height: 56, fontSize: 16 }}>{d.logo}</div>
                    <div style={{ flex: 1 }}>
                      <div className="fs-dealer-name" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
                        {d.name}
                        <span style={{ color: "var(--fs-green)", display: "flex", alignItems: "center" }}>{Icons.shield}</span>
                      </div>
                      <div className="fs-dealer-loc">{Icons.location} {d.location}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, width: "100%", paddingTop: 12, borderTop: "1px solid var(--fs-gray-100)" }}>
                    <span>{d.listings} active listings</span>
                    <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>
                    <span>Est. {d.since}</span>
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{ textAlign: "center", marginTop: 40, padding: "32px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius-lg)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Become a Flightsales Dealer</h3>
            <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 16, maxWidth: 500, margin: "0 auto 16px" }}>
              Get a branded storefront, lead management tools, and access to Australia's largest aviation audience.
            </p>
            {applied ? (
              <p style={{ color: "var(--fs-ink)", fontWeight: 600 }}>✓ Application received — we'll be in touch within 2 business days.</p>
            ) : showApply ? (
              <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "left" }}>
                {applyError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{applyError}</p>}
                <div className="fs-form-group"><label className="fs-form-label">Your Name *</label><input className="fs-form-input" value={applyForm.name} onChange={e => setApplyForm(f => ({...f, name: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Business Name *</label><input className="fs-form-input" value={applyForm.business} onChange={e => setApplyForm(f => ({...f, business: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Email *</label><input className="fs-form-input" type="email" value={applyForm.email} onChange={e => setApplyForm(f => ({...f, email: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Phone</label><input className="fs-form-input" type="tel" value={applyForm.phone} onChange={e => setApplyForm(f => ({...f, phone: e.target.value}))} /></div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="fs-form-submit" onClick={handleApply} disabled={applying} style={{ opacity: applying ? 0.7 : 1 }}>{applying ? 'Submitting...' : 'Submit Application'}</button>
                  <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setShowApply(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="fs-form-submit" style={{ maxWidth: 240, margin: "0 auto" }} onClick={() => setShowApply(true)}>Apply Now</button>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default DealersPage;
