'use client';
import { useState } from 'react';
import { Icons } from '../Icons';
import Turnstile from '../Turnstile';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.name || !form.email || !form.message) { setError('Please fill in your name, email, and message.'); return; }
    setSending(true); setError(null);
    try {
      // POSTs to the server route which persists the lead AND fires
      // email to admin (so nothing falls through cracks) AND auto-reply
      // to the user. Replaces the silent direct-to-Supabase write.
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', name: form.name, email: form.email, subject: form.subject, message: form.message, turnstileToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to send.');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally { setSending(false); }
  };

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Contact Us</h1>
          <p style={{ color: "var(--fs-ink-3)", marginTop: 8 }}>Get in touch with the Flightsales team</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container">
          <div className="fs-contact-layout">
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { icon: Icons.mail, title: "Email", detail: "hello@flightsales.com.au", sub: "We respond within 24 hours" },
                ].map((c, i) => (
                  <div key={i} className="fs-contact-info-card">
                    <div className="fs-contact-icon">{c.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{c.title}</div>
                      <div style={{ fontSize: 14, color: "var(--fs-ink)", fontWeight: 500 }}>{c.detail}</div>
                      <div style={{ fontSize: 12, color: "var(--fs-gray-400)" }}>{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>Message Sent</h3>
                  <p style={{ color: "var(--fs-gray-500)", fontSize: 14 }}>We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: 18 }}>Send a Message</h3>
                  {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
                  <div className="fs-form-group">
                    <label className="fs-form-label">Name *</label>
                    <input className="fs-form-input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Email *</label>
                    <input className="fs-form-input" type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Subject</label>
                    <select className="fs-form-select" value={form.subject} onChange={e => set('subject', e.target.value)}>
                      <option>General Enquiry</option>
                      <option>Selling My Aircraft</option>
                      <option>Dealer Account</option>
                      <option>Advertising</option>
                      <option>Bug Report</option>
                    </select>
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Message *</label>
                    <textarea className="fs-form-textarea" placeholder="How can we help?" value={form.message} onChange={e => set('message', e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <Turnstile onToken={setTurnstileToken} action="contact" />
                  </div>
                  <button className="fs-form-submit" onClick={handleSend} disabled={sending} style={{ opacity: sending ? 0.7 : 1 }}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
