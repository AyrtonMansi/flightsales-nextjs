'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import HomeTypeRow from '../HomeTypeRow';
import HeroSearchPro from '../hero/HeroSearchPro';
import HeroIllustration from '../hero/HeroIllustration';
import { useAircraft, useFeaturedAircraft, useLatestAircraft, useDealers, useNews } from '../../lib/hooks';
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

  const hasServerData = !!initialHomeData;
  const { aircraft: featuredFromDB, loading: featuredLoading } = useFeaturedAircraft();
  const { aircraft: latestFromDB, loading: latestLoading } = useLatestAircraft();
  const { dealers: dealersFromDB } = useDealers();
  const { articles: newsFromDB } = useNews(3);
  const { total: clientTotal } = useAircraft({});

  const featured = hasServerData ? initialHomeData.featured : featuredFromDB;
  const latest = hasServerData ? initialHomeData.latest : latestFromDB;
  const totalListings = hasServerData ? initialHomeData.totalListings : clientTotal;
  const displayDealers = dealersFromDB;
  const displayNews = newsFromDB;
  const showFeaturedLoading = !hasServerData && featuredLoading;
  const showLatestLoading = !hasServerData && latestLoading;

  const handleAiSearch = (query) => {
    if (!query.trim()) return;
    const filters = parseAiQuery(query);
    if (setSearchFilters) setSearchFilters(filters);
    setPage("buy");
  };

  const handleManualSearch = () => {
    let stateCode = '';
    let countryCode = '';
    if (typeof searchState === 'string') {
      if (searchState.startsWith('state:')) stateCode = searchState.slice(6);
      else if (searchState.startsWith('country:')) countryCode = searchState.slice(8);
      else if (searchState) stateCode = searchState;
    }

    const filters = {
      cat: searchCat,
      make: searchMake,
      state: stateCode,
      country: countryCode,
      yearFrom,
      yearTo,
      priceFrom,
      priceTo,
      query: ""
    };
    if (setSearchFilters) setSearchFilters(filters);
    setPage("buy");
  };

  const rotatingPlaceholder = useRotatingPlaceholder(AI_SEARCH_EXAMPLES);

  const searchModel = {
    searchCat, setSearchCat,
    searchMake, setSearchMake,
    searchState, setSearchState,
    yearFrom, setYearFrom, yearTo, setYearTo,
    priceFrom, setPriceFrom, priceTo, setPriceTo,
    aiQuery, setAiQuery,
    rotatingPlaceholder,
    onAiSearch: handleAiSearch,
    onManualSearch: handleManualSearch,
  };

  return (
    <>
      <section className="fs-hero fs-hero-v3">
        <div className="fs-container">
          <div className="fs-hero-v3-grid">
            <div className="fs-hero-v3-left">
              <h1>Find your <em>next</em> aircraft.</h1>
              <p className="fs-hero-sub">
                Browse aircraft listings from aviation businesses and private sellers.
              </p>
              <HeroSearchPro model={searchModel} />
            </div>
            <div className="fs-hero-v3-right" aria-hidden="true">
              <HeroIllustration />
            </div>
          </div>

          <HomeTypeRow activeType={searchCat} onPick={setSearchCat} />

          {totalListings > 0 && (
            <div className="fs-stats">
              <div className="fs-stat"><div className="fs-stat-num">{totalListings.toLocaleString()}</div><div className="fs-stat-label">Listings</div></div>
              {displayDealers.length > 0 && (
                <>
                  <div className="fs-stat"><div className="fs-stat-num">{displayDealers.length}</div><div className="fs-stat-label">Verified dealers</div></div>
                  <div className="fs-stat"><div className="fs-stat-num">{new Set(displayDealers.map(d => (d.location || '').split(',').pop().trim()).filter(Boolean)).size}</div><div className="fs-stat-label">States</div></div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="fs-section">
        <div className="fs-container">
          <div className="fs-section-header">
            <div>
              <h2 className="fs-section-title">Featured aircraft</h2>
              <p className="fs-section-sub">Selected listings from across the marketplace.</p>
            </div>
            <Link href="/buy" className="fs-section-link">View all {Icons.arrowRight}</Link>
          </div>
          {showFeaturedLoading ? (
            <div className="fs-grid">{[1,2,3].map(i => <div key={i} style={{ height: 360, background: "var(--fs-bg-2)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />)}</div>
          ) : featured.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fs-ink-3)", fontSize: 14, border: "1px dashed var(--fs-line)", borderRadius: "var(--fs-radius)" }}>No featured listings yet.</div>
          ) : (
            <div className="fs-grid">{featured.map(l => <ListingCard key={l.id} listing={l} onSave={onSave} saved={savedIds.has(l.id)} />)}</div>
          )}
        </div>
      </section>

      <section className="fs-section fs-section-alt">
        <div className="fs-container">
          <div className="fs-section-header">
            <div>
              <h2 className="fs-section-title">Just listed</h2>
              <p className="fs-section-sub">The latest aircraft to hit the market.</p>
            </div>
            <Link href="/buy" className="fs-section-link">View all {Icons.arrowRight}</Link>
          </div>
          {showLatestLoading ? (
            <div className="fs-grid">{[1,2,3].map(i => <div key={i} style={{ height: 360, background: "var(--fs-line)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />)}</div>
          ) : latest.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fs-ink-3)", fontSize: 14, border: "1px dashed var(--fs-line)", borderRadius: "var(--fs-radius)" }}>No listings yet.</div>
          ) : (
            <div className="fs-grid">{latest.map(l => <ListingCard key={l.id} listing={l} onSave={onSave} saved={savedIds.has(l.id)} />)}</div>
          )}
        </div>
      </section>

      {displayDealers.length > 0 && (
        <section className="fs-section">
          <div className="fs-container">
            <div className="fs-section-header">
              <div>
                <h2 className="fs-section-title">Verified dealers</h2>
                <p className="fs-section-sub">Aviation businesses with verified FlightSales dealer profiles.</p>
              </div>
              <Link href="/dealers" className="fs-section-link">All dealers {Icons.arrowRight}</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {displayDealers.slice(0, 6).map(d => (
                <Link key={d.id} href={`/dealers/${d.id}`} className="fs-dealer-card" style={{ cursor: "pointer", textDecoration: 'none', color: 'inherit', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div className="fs-dealer-avatar">{d.logo || d.name?.slice(0,2)?.toUpperCase()}</div>
                  <div className="fs-dealer-info">
                    <div className="fs-dealer-name">{d.name}</div>
                    {d.location && <div className="fs-dealer-loc">{Icons.location} {d.location}</div>}
                    <div className="fs-dealer-stats">
                      {Number.isFinite(Number(d.listings)) && <span>{d.listings} listings</span>}
                      {d.rating && <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {displayNews.length > 0 && (
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
                  <div className="fs-news-footer"><span>{a.date}</span><span>{a.read_time} min read</span></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default HomePage;