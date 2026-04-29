'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import { useAircraft, useFeaturedAircraft, useLatestAircraft, useDealers, useNews } from '../../lib/hooks';
import { MANUFACTURERS, CATEGORIES, STATES, DEALERS, NEWS_ARTICLES } from '../../lib/constants';
import { useRotatingPlaceholder, AI_SEARCH_EXAMPLES } from '../../lib/useRotatingPlaceholder';
import { parseAiQuery } from '../../lib/parseAiQuery';

const HomePage = ({ setPage, setSelectedListing, savedIds, onSave, setSearchFilters, initialHomeData }) => {
  const [searchCat, setSearchCat] = useState("");
  const [searchMake, setSearchMake] = useState("");
  const [searchState, setSearchState] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const rotatingPlaceholder = useRotatingPlaceholder(AI_SEARCH_EXAMPLES);

  // Server-fetched home data when present (eliminates the skeleton flash on
  // first paint and makes the content crawlable without JS execution).
  // Falls back to client hooks if the route was rendered without server data
  // — e.g. when navigating in via setPage('home') after first load.
  const hasServerData = !!initialHomeData;
  const { aircraft: featuredFromDB, loading: featuredLoading } = useFeaturedAircraft();
  const { aircraft: latestFromDB, loading: latestLoading } = useLatestAircraft();
  const { dealers: dealersFromDB } = useDealers();
  const { articles: newsFromDB } = useNews(3);
  const { total: clientTotal } = useAircraft({});

  const featured = hasServerData ? initialHomeData.featured : featuredFromDB;
  const latest = hasServerData ? initialHomeData.latest : latestFromDB;
  const totalListings = hasServerData ? initialHomeData.totalListings : clientTotal;
  const displayDealers = dealersFromDB.length > 0 ? dealersFromDB : DEALERS;
  const displayNews = newsFromDB.length > 0 ? newsFromDB : NEWS_ARTICLES;
  // Skeleton flag — server data is never loading
  void featuredLoading; void latestLoading;

  const handleAiSearch = (query) => {
    if (!query.trim()) return;
    const filters = parseAiQuery(query);
    // Pass filters to parent to persist across page navigation
    if (setSearchFilters) setSearchFilters(filters);
    setPage("buy");
  };

  const handleManualSearch = () => {
    const filters = {
      cat: searchCat,
      make: searchMake,
      state: searchState,
      yearFrom,
      yearTo,
      priceFrom,
      priceTo,
      query: ""
    };
    if (setSearchFilters) setSearchFilters(filters);
    setPage("buy");
  };

  return (
    <>
      {/* HERO */}
      <section className="fs-hero">
        <div className="fs-container fs-hero-content">
          <h1>Find your next aircraft.</h1>
          <p className="fs-hero-sub">
            Australia's marketplace for aircraft. Search thousands of listings from verified dealers and private sellers.
          </p>

          <div className="fs-search-bar">
            <div className="fs-search-ai">
              <span className="fs-search-ai-wand" aria-hidden="true">
                {/* Inline SVG wand — uses currentColor so it matches the
                    placeholder/text color rather than living in a separate
                    coloured badge. */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 4V2" />
                  <path d="M15 16v-2" />
                  <path d="M8 9h2" />
                  <path d="M20 9h2" />
                  <path d="M17.8 11.8 19 13" />
                  <path d="M15 9h.01" />
                  <path d="M17.8 6.2 19 5" />
                  <path d="M3 21l9-9" />
                  <path d="M12.2 6.2 11 5" />
                </svg>
              </span>
              <input
                className="fs-search-ai-input"
                placeholder={rotatingPlaceholder || 'AI quick search'}
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAiSearch(e.target.value); }}
                aria-label="AI search — describe the aircraft you're looking for"
              />
            </div>
            {/* Row 1: Simple filters */}
            <div className="fs-search-fields-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="fs-search-field">
                <span className="fs-search-label">Type</span>
                <select className="fs-search-select" value={searchCat} onChange={e => setSearchCat(e.target.value)}>
                  <option value="">All types</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="fs-search-field">
                <span className="fs-search-label">Make</span>
                <select className="fs-search-select" value={searchMake} onChange={e => setSearchMake(e.target.value)}>
                  <option value="">All makes</option>
                  {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="fs-search-field">
                <span className="fs-search-label">Location</span>
                <select className="fs-search-select" value={searchState} onChange={e => setSearchState(e.target.value)}>
                  <option value="">Australia</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="fs-search-fields-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="fs-search-field">
                <span className="fs-search-label">Year</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <select
                    className="fs-search-select"
                    value={yearFrom}
                    onChange={e => setYearFrom(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">From</option>
                    {Array.from({ length: 50 }, (_, i) => 2026 - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <span style={{ color: "var(--fs-ink-4)", fontSize: 12 }}>—</span>
                  <select
                    className="fs-search-select"
                    value={yearTo}
                    onChange={e => setYearTo(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">To</option>
                    {Array.from({ length: 50 }, (_, i) => 2026 - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="fs-search-field">
                <span className="fs-search-label">Price</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <select
                    className="fs-search-select"
                    value={priceFrom}
                    onChange={e => setPriceFrom(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Min</option>
                    <option value="50000">$50k</option>
                    <option value="100000">$100k</option>
                    <option value="200000">$200k</option>
                    <option value="300000">$300k</option>
                    <option value="500000">$500k</option>
                    <option value="1000000">$1M</option>
                    <option value="2000000">$2M</option>
                    <option value="5000000">$5M</option>
                  </select>
                  <span style={{ color: "var(--fs-ink-4)", fontSize: 12 }}>—</span>
                  <select
                    className="fs-search-select"
                    value={priceTo}
                    onChange={e => setPriceTo(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Max</option>
                    <option value="100000">$100k</option>
                    <option value="200000">$200k</option>
                    <option value="300000">$300k</option>
                    <option value="500000">$500k</option>
                    <option value="1000000">$1M</option>
                    <option value="2000000">$2M</option>
                    <option value="5000000">$5M</option>
                    <option value="10000000">$10M+</option>
                  </select>
                </div>
              </div>
            </div>
            <button className="fs-search-btn" onClick={handleManualSearch}>
              {Icons.search} Search Aircraft
            </button>
          </div>

          <div className="fs-categories">
            {["Piston", "Turboprop", "Jet", "Helicopter", "LSA"].map(c => (
              <button key={c} className="fs-cat-pill" onClick={() => {
                const catMap = {
                  "Piston": "Single Engine Piston",
                  "Turboprop": "Turboprop",
                  "Jet": "Light Jet",
                  "Helicopter": "Helicopter",
                  "LSA": "LSA"
                };
                if (setSearchFilters) setSearchFilters({ cat: catMap[c] });
                setPage("buy");
              }}>{c}</button>
            ))}
          </div>

          {totalListings > 0 && (
            <div className="fs-stats">
              <div className="fs-stat"><div className="fs-stat-num">{totalListings.toLocaleString()}</div><div className="fs-stat-label">Listings</div></div>
              <div className="fs-stat"><div className="fs-stat-num">{displayDealers.length}</div><div className="fs-stat-label">Dealers</div></div>
              <div className="fs-stat"><div className="fs-stat-num">{new Set(displayDealers.map(d => (d.location || '').split(',').pop().trim())).size}</div><div className="fs-stat-label">States</div></div>
            </div>
          )}
        </div>
      </section>

      {/* FEATURED */}
      <section className="fs-section">
        <div className="fs-container">
          <div className="fs-section-header">
            <div>
              <h2 className="fs-section-title">Featured aircraft</h2>
              <p className="fs-section-sub">Hand-picked by our team. Verified by their dealers.</p>
            </div>
            <Link href="/buy" className="fs-section-link">View all {Icons.arrowRight}</Link>
          </div>
          {featuredLoading ? (
            <div className="fs-grid">
              {[1,2,3].map(i => <div key={i} style={{ height: 360, background: "var(--fs-bg-2)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />)}
            </div>
          ) : featured.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fs-ink-3)", fontSize: 14, border: "1px dashed var(--fs-line)", borderRadius: "var(--fs-radius)" }}>
              No featured listings yet.
            </div>
          ) : (
            <div className="fs-grid">
              {featured.map(l => (
                <ListingCard key={l.id} listing={l} onSave={onSave} saved={savedIds.has(l.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LATEST */}
      <section className="fs-section fs-section-alt">
        <div className="fs-container">
          <div className="fs-section-header">
            <div>
              <h2 className="fs-section-title">Just listed</h2>
              <p className="fs-section-sub">The latest aircraft to hit the market.</p>
            </div>
            <Link href="/buy" className="fs-section-link">View all {Icons.arrowRight}</Link>
          </div>
          {latestLoading ? (
            <div className="fs-grid">
              {[1,2,3].map(i => <div key={i} style={{ height: 360, background: "var(--fs-line)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />)}
            </div>
          ) : latest.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fs-ink-3)", fontSize: 14, border: "1px dashed var(--fs-line)", borderRadius: "var(--fs-radius)" }}>
              No listings yet.
            </div>
          ) : (
            <div className="fs-grid">
              {latest.map(l => (
                <ListingCard key={l.id} listing={l} onSave={onSave} saved={savedIds.has(l.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DEALERS */}
      <section className="fs-section">
        <div className="fs-container">
          <div className="fs-section-header">
            <div>
              <h2 className="fs-section-title">Verified dealers</h2>
              <p className="fs-section-sub">Trusted aviation specialists across Australia.</p>
            </div>
            <Link href="/dealers" className="fs-section-link">All dealers {Icons.arrowRight}</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {displayDealers.slice(0, 6).map(d => (
              <Link key={d.id} href="/dealers" className="fs-dealer-card" style={{ cursor: "pointer", textDecoration: 'none', color: 'inherit', display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="fs-dealer-avatar">{d.logo}</div>
                <div className="fs-dealer-info">
                  <div className="fs-dealer-name">{d.name}</div>
                  <div className="fs-dealer-loc">{Icons.location} {d.location}</div>
                  <div className="fs-dealer-stats">
                    <span>{d.listings} listings</span>
                    <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section className="fs-section fs-section-alt">
        <div className="fs-container">
          <div className="fs-section-header">
            <div>
              <h2 className="fs-section-title">Aviation news</h2>
              <p className="fs-section-sub">Industry updates, market trends, and regulatory news.</p>
            </div>
            <Link href="/news" className="fs-section-link">All articles {Icons.arrowRight}</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {displayNews.slice(0, 3).map(a => (
              <Link key={a.id} href="/news" className="fs-news-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <span className={`fs-news-tag ${a.category.toLowerCase()}`}>{a.category}</span>
                <div className="fs-news-title">{a.title}</div>
                <div className="fs-news-excerpt">{a.excerpt}</div>
                <div className="fs-news-footer">
                  <span>{a.date}</span>
                  <span>{a.read_time} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
