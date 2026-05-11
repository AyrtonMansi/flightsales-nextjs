'use client';
import { Icons } from '../Icons';
import { useDealers } from '../../lib/hooks';

// Public dealer directory + "become a dealer" CTA. The signup path
// now goes through /login (business account type) and is gated
// behind ABN verification — no separate manual application form
// anymore. The previous "Apply Now" inline form on this page sent
// a contact-form email and led nowhere, which trapped users.

const DealersPage = ({ onSelectDealer, setPage }) => {
  const { dealers: dealersFromDB, loading } = useDealers();
  const dealers = dealersFromDB;

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: 'var(--fs-font)', fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em' }}>Verified Dealers</h1>
          <p style={{ color: 'var(--fs-ink-3)', marginTop: 8, fontSize: 16 }}>Trusted aviation businesses across Australia</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container">
          {!loading && dealers.length === 0 && (
            <div style={{
              padding: '48px 32px',
              textAlign: 'center',
              border: '1px solid var(--fs-line)',
              borderRadius: 'var(--fs-radius-lg)',
              background: 'var(--fs-bg-2)',
              marginBottom: 24,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No verified dealers yet</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-ink-3)', maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
                We&apos;re onboarding the first wave of aviation dealers. Run a
                business? Sign up below — verified dealers get a branded
                storefront and lead alerts.
              </p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {loading ? [1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: 160, background: 'var(--fs-gray-100)', borderRadius: 'var(--fs-radius)', animation: 'fs-pulse 1.5s infinite' }} />) :
              dealers.map(d => (
                <div key={d.id} className="fs-dealer-card" onClick={() => onSelectDealer && onSelectDealer(d)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', width: '100%', marginBottom: 12 }}>
                    <div className="fs-dealer-avatar" style={{ width: 56, height: 56, fontSize: 16 }}>{d.logo}</div>
                    <div style={{ flex: 1 }}>
                      <div className="fs-dealer-name" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {d.name}
                        <span style={{ color: 'var(--fs-green)', display: 'flex', alignItems: 'center' }}>{Icons.shield}</span>
                      </div>
                      <div className="fs-dealer-loc">{Icons.location} {d.location}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, width: '100%', paddingTop: 12, borderTop: '1px solid var(--fs-gray-100)' }}>
                    <span>{d.listings} active listings</span>
                    <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>
                    <span>Est. {d.since}</span>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Become-a-dealer CTA. Routes straight into signup. The
              actual dealer-approval step is automatic via ABN
              verification once they're signed up — no separate
              admin-review form here. */}
          <div style={{
            textAlign: 'center',
            marginTop: 40,
            padding: '32px',
            background: 'var(--fs-gray-50)',
            borderRadius: 'var(--fs-radius-lg)',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Become a verified dealer</h3>
            <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 16, maxWidth: 520, margin: '0 auto 16px', lineHeight: 1.5 }}>
              Get a branded storefront, lead alerts, and bulk-import tools.
              Sign up as a business and verify your ABN — automatic, takes about
              five seconds, no admin review.
            </p>
            <button
              className="fs-form-submit"
              style={{ maxWidth: 280, margin: '0 auto' }}
              onClick={() => setPage?.('login')}
            >
              Sign up as a business →
            </button>
            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginTop: 12 }}>
              Already have an account? <a href="/dashboard" style={{ color: 'var(--fs-ink)' }}>Go to your dashboard</a> to verify your ABN.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default DealersPage;
