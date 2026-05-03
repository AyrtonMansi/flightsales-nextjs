'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import HomeTypeRow from '../HomeTypeRow';
import HeroSearchPro from '../hero/HeroSearchPro';
import HeroIllustration from '../hero/HeroIllustration';
import { useAircraft, useFeaturedAircraft, useLatestAircraft, useDealers, useNews } from '../../lib/hooks';
import { DEALERS, NEWS_ARTICLES } from '../../lib/constants';
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

  // Animated typewriter placeholder for the AI input — rotates through
  // example queries (Cirrus SR22 under $700k, low-hours R44, etc.) so
  // the field reads as inviting rather than empty.
  const rotatingPlaceholder = useRotatingPlaceholder(AI_SEARCH_EXAMPLES);

  // Bundle every search-card input + handler into one model object so
  // HeroSearchPro stays a thin presentation layer over real handlers.
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
      {/* HERO — v3 two-column Uber-style layout. Left: H1 + subtitle +
          search card. Right: aircraft illustration. Below the columns:
          the type-icon scroll (replaces what would have been Uber's
          "Explore what you can do" feature cards). Mobile collapses to
          single column with the illustration hidden. */}
      <section className="fs-hero fs-hero-v3">
        <div className="fs-container">
          <div className="fs-hero-v3-grid">
            <div className="fs-hero-v3-left">
              <h1>Find your next aircraft.</h1>
              <HeroSearchPro model={searchModel} count={totalListings} />
            </div>
            <div className="fs-hero-v3-right" aria-hidden="true">
              <HeroIllustration />
            </div>
          </div>

          {/* Type quick-pick — clicking an icon pre-fills the Type
              dropdown above. Stays within the same hero so the user
              sees their selection reflected immediately. */}
          <HomeTypeRow activeType={searchCat} onPick={setSearchCat} />

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
