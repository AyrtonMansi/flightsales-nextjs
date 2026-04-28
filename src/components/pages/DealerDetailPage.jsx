'use client';
import { useState } from 'react';
import { Icons } from '../Icons';
import { useAircraft, submitLead } from '../../lib/hooks';
import ListingCard from '../ListingCard';

const DealerDetailPage = ({ dealer, onBack, setSelectedListing, savedIds, onSave }) => {
  const { aircraft: dealerListings, loading } = useAircraft({ dealerId: dealer?.id });
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactErr, setContactErr] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: `Hi, I'd like to know more about the aircraft you have available at ${dealer?.name || 'your dealership'}.` });

  if (!dealer) return null;
  // Source of truth: DB only. Empty result renders an empty grid.
  const listings = dealerListings;

  const handleContact = async () => {
    if (!contactForm.name || !contactForm.email) { setContactErr('Name and email required.'); return; }
    setContactSending(true); setContactErr(null);
    try {
      await submitLead('contact', { name: contactForm.name, email: contactForm.email, phone: contactForm.phone, message: `[DEALER ENQUIRY: ${dealer.name}] ${contactForm.message}` });
      setContactSent(true);
    } catch (err) { setContactErr(err.message || 'Send failed'); } finally { setContactSending(false); }
  };

  return (
    <>
      {/* Header */}
      <div style={{ background: "var(--fs-bg-2)", borderBottom: "1px solid var(--fs-line)" }}>
        <div className="fs-container" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div className="fs-dealer-avatar" style={{ width: 80, height: 80, fontSize: 22, borderRadius: 16 }}>{dealer.logo}</div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>{dealer.name}</h1>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14, color: "var(--fs-ink-3)", fontWeight: 500 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.location} {dealer.location}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--fs-ink)" }}>{Icons.shield} Verified dealer</span>
                {dealer.rating && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.star} {dealer.rating} rating</span>}
                {dealer.since && <span>Trading since {dealer.since}</span>}
              </div>
              {dealer.speciality && <p style={{ marginTop: 10, fontSize: 14, color: "var(--fs-ink-3)" }}>Specialising in <strong style={{ color: "var(--fs-ink)" }}>{dealer.speciality}</strong></p>}
            </div>
          </div>
        </div>
      </div>

      <section className="fs-section" style={{ paddingTop: 48 }}>
        <div className="fs-container">
          <div className="fs-dealer-layout">
            {/* Listings */}
            <div>
              <div className="fs-section-header" style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em" }}>
                  {listings.length} aircraft
                </h2>
              </div>
              {loading ? (
                <div className="fs-grid">
                  {[1,2,3].map(i => <div key={i} style={{ height: 360, background: "var(--fs-bg-2)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />)}
                </div>
              ) : listings.length === 0 ? (
                <div style={{ padding: "48px 24px", border: "1px solid var(--fs-line)", borderRadius: "var(--fs-radius)", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No active listings right now</div>
                  <p style={{ fontSize: 14, color: "var(--fs-ink-3)" }}>Get in touch with {dealer.name} for upcoming inventory.</p>
                </div>
              ) : (
                <div className="fs-grid">
                  {listings.map(l => (
                    <ListingCard key={l.id} listing={l} onClick={setSelectedListing} onSave={onSave} saved={savedIds.has(l.id)} />
                  ))}
                </div>
              )}
            </div>

            {/* Contact sidebar */}
            <div>
              <div style={{ position: "sticky", top: 88, background: "var(--fs-white)", border: "1px solid var(--fs-line)", borderRadius: "var(--fs-radius)", padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Contact {dealer.name}</h3>
                <p style={{ fontSize: 13, color: "var(--fs-ink-3)", marginBottom: 16 }}>Send a message and we'll forward it to the dealer.</p>
                {contactSent ? (
                  <div style={{ padding: "20px 16px", background: "var(--fs-bg-2)", borderRadius: "var(--fs-radius)", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fs-ink)" }}>{Icons.check} Message sent</div>
                    <p style={{ fontSize: 13, color: "var(--fs-ink-3)", marginTop: 6 }}>{dealer.name} will be in touch within 1 business day.</p>
                  </div>
                ) : (
                  <>
                    {contactErr && <p style={{ color: "var(--fs-red)", fontSize: 13, marginBottom: 8 }}>{contactErr}</p>}
                    <div className="fs-form-group">
                      <label className="fs-form-label">Your name</label>
                      <input className="fs-form-input" value={contactForm.name} onChange={e => setContactForm(f => ({...f, name: e.target.value}))} />
                    </div>
                    <div className="fs-form-group">
                      <label className="fs-form-label">Email</label>
                      <input className="fs-form-input" type="email" value={contactForm.email} onChange={e => setContactForm(f => ({...f, email: e.target.value}))} />
                    </div>
                    <div className="fs-form-group">
                      <label className="fs-form-label">Phone (optional)</label>
                      <input className="fs-form-input" type="tel" value={contactForm.phone} onChange={e => setContactForm(f => ({...f, phone: e.target.value}))} />
                    </div>
                    <div className="fs-form-group">
                      <label className="fs-form-label">Message</label>
                      <textarea className="fs-form-textarea" rows={4} value={contactForm.message} onChange={e => setContactForm(f => ({...f, message: e.target.value}))} />
                    </div>
                    <button className="fs-form-submit" onClick={handleContact} disabled={contactSending}>
                      {contactSending ? 'Sending...' : 'Send message'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DealerDetailPage;
