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
  const listings = dealerListings;
  const isVerifiedDealer = dealer.verified === true;

  const handleContact = async (event) => {
    event?.preventDefault?.();
    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const message = contactForm.message.trim();
    if (!name || !email) { setContactErr('Name and email are required.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setContactErr('Enter a valid email address.'); return; }
    if (!message) { setContactErr('Add a short message for the dealer.'); return; }
    setContactSending(true); setContactErr(null);
    try {
      await submitLead('contact', { name, email, phone: contactForm.phone.trim(), message: `[DEALER ENQUIRY: ${dealer.name}] ${message}` });
      setContactSent(true);
    } catch (err) { setContactErr(err.message || 'Could not send your message. Please try again.'); } finally { setContactSending(false); }
  };

  return (
    <>
      <div style={{ background: "var(--fs-bg-2)", borderBottom: "1px solid var(--fs-line)" }}>
        <div className="fs-container" style={{ paddingTop: 32, paddingBottom: 32 }}>
          {onBack && (
            <button type="button" onClick={onBack} style={{ background: 'none', border: 0, padding: 0, marginBottom: 18, cursor: 'pointer', font: 'inherit', color: 'var(--fs-ink-3)', fontSize: 13, fontWeight: 600 }}>
              ← All dealers
            </button>
          )}
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div className="fs-dealer-avatar" style={{ width: 80, height: 80, fontSize: 22, borderRadius: 16 }}>{dealer.logo || dealer.name?.slice(0,2)?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>{dealer.name}</h1>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14, color: "var(--fs-ink-3)", fontWeight: 500 }}>
                {dealer.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.location} {dealer.location}</span>}
                {isVerifiedDealer && <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--fs-ink)" }}>{Icons.shield} Verified dealer</span>}
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
                  <p style={{ fontSize: 14, color: "var(--fs-ink-3)" }}>Contact {dealer.name} about upcoming inventory.</p>
                </div>
              ) : (
                <div className="fs-grid">
                  {listings.map(l => (
                    <ListingCard key={l.id} listing={l} onSave={onSave} saved={savedIds.has(l.id)} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ position: "sticky", top: 88, background: "var(--fs-white)", border: "1px solid var(--fs-line)", borderRadius: "var(--fs-radius)", padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Contact {dealer.name}</h3>
                <p style={{ fontSize: 13, color: "var(--fs-ink-3)", marginBottom: 16 }}>Your enquiry is sent through FlightSales to the dealer.</p>
                {contactSent ? (
                  <div style={{ padding: "20px 16px", background: "var(--fs-bg-2)", borderRadius: "var(--fs-radius)", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fs-ink)" }}>{Icons.check} Message sent</div>
                    <p style={{ fontSize: 13, color: "var(--fs-ink-3)", marginTop: 6 }}>Your enquiry has been delivered. Response timing is set by the dealer.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContact} noValidate>
                    {contactErr && <p role="alert" style={{ color: "var(--fs-red)", fontSize: 13, marginBottom: 8 }}>{contactErr}</p>}
                    <div className="fs-form-group">
                      <label className="fs-form-label" htmlFor="dealer-contact-name">Your name</label>
                      <input id="dealer-contact-name" className="fs-form-input" autoComplete="name" required value={contactForm.name} onChange={e => setContactForm(f => ({...f, name: e.target.value}))} />
                    </div>
                    <div className="fs-form-group">
                      <label className="fs-form-label" htmlFor="dealer-contact-email">Email</label>
                      <input id="dealer-contact-email" className="fs-form-input" type="email" autoComplete="email" required value={contactForm.email} onChange={e => setContactForm(f => ({...f, email: e.target.value}))} />
                    </div>
                    <div className="fs-form-group">
                      <label className="fs-form-label" htmlFor="dealer-contact-phone">Phone (optional)</label>
                      <input id="dealer-contact-phone" className="fs-form-input" type="tel" autoComplete="tel" value={contactForm.phone} onChange={e => setContactForm(f => ({...f, phone: e.target.value}))} />
                    </div>
                    <div className="fs-form-group">
                      <label className="fs-form-label" htmlFor="dealer-contact-message">Message</label>
                      <textarea id="dealer-contact-message" className="fs-form-textarea" rows={4} required value={contactForm.message} onChange={e => setContactForm(f => ({...f, message: e.target.value}))} />
                    </div>
                    <button className="fs-form-submit" type="submit" disabled={contactSending}>
                      {contactSending ? 'Sending…' : 'Send message'}
                    </button>
                    <p style={{ margin: '10px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--fs-ink-4)' }}>
                      FlightSales is the marketplace platform, not the seller. Verify aircraft records, ownership, condition and transaction terms independently before purchase.
                    </p>
                  </form>
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