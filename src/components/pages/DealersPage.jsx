'use client';
import { Icons } from '../Icons';
import { useDealers } from '../../lib/hooks';

const DealersPage = ({ onSelectDealer, setPage }) => {
  const { dealers: dealersFromDB, loading } = useDealers();
  const dealers = dealersFromDB;

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontSize: 44 }}>Aircraft Dealers</h1>
          <p style={{ color: 'var(--fs-ink-3)', marginTop: 8, fontSize: 16 }}>Browse aviation businesses with active FlightSales profiles.</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container">
          {!loading && dealers.length === 0 && (
            <div style={{ padding: '48px 32px', textAlign: 'center', border: '1px solid var(--fs-line)', borderRadius: 'var(--fs-radius-lg)', background: 'var(--fs-bg-2)', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No dealer profiles are live yet</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-ink-3)', maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
                We&apos;re onboarding aviation businesses. Business accounts can sign up below and complete the available business-verification steps in their dashboard.
              </p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {loading ? [1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: 160, background: 'var(--fs-gray-100)', borderRadius: 'var(--fs-radius)', animation: 'fs-pulse 1.5s infinite' }} />) :
              dealers.map(d => {
                const verified = d.verified === true;
                return (
                  <button
                    key={d.id}
                    type="button"
                    className="fs-dealer-card"
                    onClick={() => onSelectDealer && onSelectDealer(d)}
                    style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}
                    aria-label={`View ${d.name}`}
                  >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', width: '100%', marginBottom: 12 }}>
                      <div className="fs-dealer-avatar" style={{ width: 56, height: 56, fontSize: 16 }}>{d.logo || d.name?.slice(0,2)?.toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div className="fs-dealer-name" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {d.name}
                          {verified && <span title="Dealer profile verified" aria-label="Verified dealer" style={{ color: 'var(--fs-green)', display: 'flex', alignItems: 'center' }}>{Icons.shield}</span>}
                        </div>
                        {d.location && <div className="fs-dealer-loc">{Icons.location} {d.location}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, width: '100%', paddingTop: 12, borderTop: '1px solid var(--fs-gray-100)', flexWrap: 'wrap' }}>
                      {Number.isFinite(Number(d.listings)) && <span>{d.listings} active listings</span>}
                      {d.rating && <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>}
                      {d.since && <span>Est. {d.since}</span>}
                      {verified && <span style={{ marginLeft: 'auto', color: 'var(--fs-ink-3)' }}>Verified profile</span>}
                    </div>
                  </button>
                );
              })
            }
          </div>

          <div style={{ textAlign: 'center', marginTop: 40, padding: '32px', background: 'var(--fs-gray-50)', borderRadius: 'var(--fs-radius-lg)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>List as an aviation business</h3>
            <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 16, maxWidth: 520, margin: '0 auto 16px', lineHeight: 1.5 }}>
              Create a business account, complete business verification, and manage listings and enquiries from your dashboard.
            </p>
            <button className="fs-form-submit" style={{ maxWidth: 280, margin: '0 auto' }} onClick={() => setPage?.('login')}>
              Create business account →
            </button>
            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginTop: 12 }}>
              Already have an account? <a href="/dashboard" style={{ color: 'var(--fs-ink)' }}>Go to your dashboard</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default DealersPage;