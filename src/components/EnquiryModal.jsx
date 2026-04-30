'use client';
import { useState } from 'react';
import { Icons } from './Icons';
import { formatPriceFull } from '../lib/format';

const EnquiryModal = ({ listing, onClose, user }) => {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: `Hi, I'm interested in the ${listing.title}${listing.rego ? ` (${listing.rego})` : ''}. Is it available for an inspection?`,
    financeStatus: '',
    hangarStatus: ''
  });

  if (sent) return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
            {Icons.check}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Enquiry Sent</h2>
          <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>
            Your enquiry about the {listing.title} has been sent to the seller. They should respond within 24 hours.
          </p>
          <button className="fs-detail-cta fs-detail-cta-primary" style={{ maxWidth: 200, margin: "0 auto" }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="fs-modal-header">
          <div>
            <h2>Contact Seller</h2>
            <p style={{ fontSize: 13, color: "var(--fs-gray-500)", marginTop: 4 }}>{listing.title} — {formatPriceFull(listing.price)}</p>
          </div>
          <button className="fs-modal-close" onClick={onClose}>{Icons.x}</button>
        </div>
        
        <div className="fs-modal-body">
              <div className="fs-form-group">
                <label className="fs-form-label">Full Name *</label>
                <input 
                  className="fs-form-input" 
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="fs-form-group">
                  <label className="fs-form-label">Email *</label>
                  <input 
                    className="fs-form-input" 
                    type="email" 
                    placeholder="john@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Phone *</label>
                  <input 
                    className="fs-form-input" 
                    type="tel" 
                    placeholder="04XX XXX XXX"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="fs-form-group">
                <label className="fs-form-label">Are you finance pre-approved?</label>
                <select 
                  className="fs-form-select"
                  value={formData.financeStatus}
                  onChange={e => setFormData({...formData, financeStatus: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="pre-approved">Yes, pre-approved</option>
                  <option value="interested">No, but interested in finance</option>
                  <option value="cash">Cash buyer</option>
                </select>
              </div>
              <div className="fs-form-group">
                <label className="fs-form-label">Message</label>
                <textarea 
                  className="fs-form-textarea" 
                  placeholder="I'm interested in this aircraft. Is it available for viewing?"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  rows={4}
                />
              </div>
              {sendError && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--fs-radius-sm)", marginBottom: 12, fontSize: 13, color: "#dc2626" }}>
                  {sendError}
                </div>
              )}
              <button
                className="fs-form-submit"
                disabled={sending}
                style={{ opacity: sending ? 0.7 : 1, cursor: sending ? "not-allowed" : "pointer" }}
                onClick={async () => {
                  if (!formData.name || !formData.email || !formData.message) {
                    setSendError("Please fill in your name, email, and message.");
                    return;
                  }
                  setSending(true);
                  setSendError(null);
                  try {
                    // POST to the server route — it persists the enquiry,
                    // emails the seller and the buyer, and creates the
                    // seller's in-app notification. Replaces the old
                    // direct-to-Supabase write that left the seller in
                    // the dark.
                    const res = await fetch('/api/enquiries', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        aircraftId: listing.id,
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        message: formData.message,
                        financeStatus: formData.financeStatus,
                      }),
                    });
                    const json = await res.json();
                    if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to send enquiry.');
                    setSent(true);
                  } catch (err) {
                    setSendError(err.message || "Failed to send enquiry. Please try again.");
                  } finally {
                    setSending(false);
                  }
                }}
              >
                {sending ? "Sending..." : "Send Enquiry"}
              </button>
              <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 16, textAlign: "center" }}>
                By submitting, you agree to our Terms and Privacy Policy. Your details will be shared with the seller.
              </p>
        </div>
      </div>
    </div>
  );
};

export default EnquiryModal;
