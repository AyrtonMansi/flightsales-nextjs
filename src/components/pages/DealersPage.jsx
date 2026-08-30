'use client';
import { useMemo, useState } from 'react';
import { Icons } from '../Icons';
import { useDealers } from '../../lib/hooks';

const DealersPage = ({ onSelectDealer, setPage }) => {
  const { dealers: dealersFromDB, loading } = useDealers();
  const [query, setQuery] = useState('');

  const dealers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dealersFromDB;
    return dealersFromDB.filter((dealer) =>
      [dealer.name, dealer.location, dealer.speciality]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [dealersFromDB, query]);

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontSize: 44 }}>Aircraft dealers</h1>
          <p style={{ color: 'var(--fs-ink-3)', marginTop: 8, fontSize: 16, maxWidth: 620 }}>
            Find aviation businesses with active FlightSales profiles and browse their aircraft inventory.
          </p>
        </div>
      </div>

      <section className="fs-section">
        <div className="fs-container">
          {!loading && dealersFromDB.length > 0 && (
            <div className="fs-dealer-directory-toolbar">
              <input
                className="fs-dealer-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dealer, location or speciality"
                aria-label="Search aircraft dealers"
              />
              <span className="fs-dealer-count">{dealers.length} {dealers.length === 1 ? 'dealer' : 'dealers'}</span>
            </div>
          )}

          {!loading && dealersFromDB.length === 0 && (
            <div style={{ padding: '48px 0', borderTop: '1px solid var(--fs-line)', borderBottom: '1px solid var(--fs-line)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No dealer profiles are live yet</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-ink-3)', maxWidth: 520, lineHeight: 1.6 }}>
                We&apos;re onboarding aviation businesses now. Business accounts can create a profile and complete verification from their dashboard.
              </p>
            </div>
          )}

          {!loading && dealersFromDB.length > 0 && dealers.length === 0 && (
            <div style={{ padding: '40px 0', color: 'var(--fs-ink-3)', borderTop: '1px solid var(--fs-line)' }}>
              No dealers match “{query}”. Try a business name, city or state.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {loading ? [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="fs-card-skeleton" style={{ height: 150 }} />
            )) : dealers.map(d => {
              const verified = d.verified === true;
              return (
                <button
                  key={d.id}
                  type="button"
                  className="fs-dealer-card fs-home-dealer-card"
                  onClick={() => onSelectDealer?.(d)}
                  style={{ width: '100%', cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}
                  aria-label={`View ${d.name}`}
                >
                  <div className="fs-dealer-avatar" style={{ width: 56, height: 56, fontSize: 16 }}>{d.logo || d.name?.slice(0,2)?.toUpperCase()}</div>
                  <div className="fs-dealer-info" style={{ minWidth: 0 }}>
                    <div className="fs-dealer-name" style={{ fontSize: 17 }}>{d.name}</div>
                    {d.location && <div className="fs-dealer-loc">{Icons.location} {d.location}</div>}
                    <div className="fs-home-dealer-meta">
                      {Number.isFinite(Number(d.listings)) && <span>{d.listings} active {Number(d.listings) === 1 ? 'listing' : 'listings'}</span>}
                      {verified && <span className="fs-home-verified">{Icons.shield} Verified profile</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--fs-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sell aircraft as an aviation business</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-ink-3)', maxWidth: 560, lineHeight: 1.55 }}>
                Create a business account, complete verification, and manage inventory and buyer enquiries in one place.
              </p>
            </div>
            <button className="fs-form-submit" style={{ width: 'auto', minWidth: 220 }} onClick={() => setPage?.('login')}>
              Create business account
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default DealersPage;
