'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  useAuth, useProfile, useAircraft, useFeaturedAircraft, useLatestAircraft,
  useDealers, useNews, useSavedAircraft, useMyListings, useMyEnquiries,
  useAdminListings, useAdminUsers, useAdminEnquiries,
  submitEnquiry, createListing, uploadImage, submitLead
} from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { Icons } from "./Icons";
import Nav from "./Nav";
import Footer from "./Footer";
import AircraftImage from "./AircraftImage";
import ListingCard from "./ListingCard";
import QuickLookModal from "./QuickLookModal";
import EnquiryModal from "./EnquiryModal";
import { formatPriceFull, formatHours, timeAgo, isJustListed } from "../lib/format";
import {
  MANUFACTURERS, CATEGORIES, STATES, CONDITIONS, PRICE_RANGES, YEAR_RANGES,
  TTAF_RANGES, SEAT_COUNTS, ENGINE_TYPES, AVIONICS_TYPES,
  SAMPLE_LISTINGS, DEALERS, NEWS_ARTICLES,
} from "../lib/constants";

// ============================================================
// FLIGHTSALES.COM.AU — PRODUCTION AVIATION MARKETPLACE
// ============================================================

// --- DATA LAYER ---

// --- UTILITY FUNCTIONS ---
const formatPrice = (p) => p >= 1000000 ? `$${(p/1000000).toFixed(1)}M` : `$${(p/1000).toFixed(0)}K`;

const getCategoryDisplayName = (category) => {
  const mapping = {
    "Single Engine Piston": "Piston",
    "Multi Engine Piston": "Piston",
    "Turboprop": "Turboprop",
    "Light Jet": "Jet",
    "Midsize Jet": "Jet",
    "Heavy Jet": "Jet",
    "Helicopter": "Helicopter",
    "Gyrocopter": "Gyrocopter",
    "Ultralight": "Ultralight",
    "LSA": "LSA",
    "Warbird": "Warbird",
    "Glider": "Glider",
    "Amphibious/Seaplane": "Amphibious"
  };
  return mapping[category] || category;
};

// --- SVG ICONS ---

// --- AIRCRAFT IMAGES (verified aviation only) ---

// --- AIRCRAFT IMAGE COMPONENT ---


// --- CSS ---
// Note: web fonts (Inter, Fraunces) are loaded via <link> tags in src/app/layout.jsx.
// They cannot be @import'd here because React server-renders the apostrophes as
// HTML entities (&#x27;) inside <style> tags, which breaks the CSS parser AND
// causes a hydration mismatch.

// --- LOADING SKELETON COMPONENTS ---
const CardSkeleton = () => (
  <div className="fs-card" style={{ pointerEvents: 'none' }}>
    <div className="fs-card-image-wrap" style={{ height: '180px', background: 'var(--fs-bg-2)', position: 'relative', overflow: 'hidden' }}>
      <div className="fs-skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
    </div>
    <div className="fs-card-body" style={{ padding: '16px 18px 18px' }}>
      <div className="fs-skeleton-line" style={{ width: '40%', height: 12, marginBottom: 8 }} />
      <div className="fs-skeleton-line" style={{ width: '85%', height: 20, marginBottom: 12 }} />
      <div className="fs-skeleton-line" style={{ width: '60%', height: 28, marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="fs-skeleton-line" style={{ width: '100%', height: 16 }} />
        <div className="fs-skeleton-line" style={{ width: '100%', height: 16 }} />
        <div className="fs-skeleton-line" style={{ width: '100%', height: 16 }} />
        <div className="fs-skeleton-line" style={{ width: '100%', height: 16 }} />
      </div>
    </div>
  </div>
);

// --- EMPTY STATE COMPONENT ---
// --- MOBILE FILTER BOTTOM SHEET ---
const MobileFilterSheet = ({ isOpen, onClose, children, filteredCount, onClear }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '85vh',
        background: 'var(--fs-white)',
        borderRadius: '16px 16px 0 0',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Sticky header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--fs-line)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Filters</span>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--fs-bg-2)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close filters"
          >
            {Icons.x}
          </button>
        </div>

        {/* Scrollable filter body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
          {children}
        </div>

        {/* Sticky footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderTop: '1px solid var(--fs-line)',
          gap: 16,
          flexShrink: 0,
          background: 'var(--fs-white)'
        }}>
          <button
            onClick={onClear}
            style={{
              fontSize: 14, fontWeight: 500, color: 'var(--fs-ink-3)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 0', textDecoration: 'underline'
            }}
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: 'var(--fs-ink)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--fs-radius-pill)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 48
            }}
          >
            Show {filteredCount} {filteredCount === 1 ? 'aircraft' : 'aircraft'}
          </button>
        </div>
      </div>
    </>
  );
};

const EmptyState = ({ title, description, searchQuery, activeFilters, onClearFilters, onBrowseAll }) => (
  <div className="fs-empty" style={{ padding: "60px 20px", textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fs-ink)", marginBottom: 8, letterSpacing: "-0.02em" }}>
      {title}
    </div>
    
    <p style={{ color: "var(--fs-ink-3)", fontSize: 14, marginBottom: 20, maxWidth: 400, margin: '0 auto 20', lineHeight: 1.5 }}>
      {searchQuery ? (
        <>We couldn't find any aircraft for "<strong>{searchQuery}</strong>". {description}</>
      ) : (
        description
      )}
    </p>
    
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {activeFilters > 0 && (
        <button 
          className="fs-btn fs-btn-primary" 
          onClick={onClearFilters}
        >
          Clear all filters
        </button>
      )}
      <button 
        className="fs-btn fs-btn-secondary" 
        onClick={onBrowseAll}
      >
        Browse all aircraft
      </button>
    </div>
  </div>
);


// QUICK-LOOK MODAL — preview a listing without leaving the grid

// COMPARE DRAWER — sticky bottom bar with up to 3 listings

// Rotating placeholder examples for the AI search input.
// Kept short and concrete so users immediately see the kinds of queries that work.
const AI_SEARCH_EXAMPLES = [
  "Diamond DA40 with glass cockpit",
  "Cirrus SR22 under $700k",
  "Low-hours Robinson R44",
  "IFR turboprop in QLD",
];

function useRotatingPlaceholder(examples, intervalMs = 2800) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!examples || examples.length < 2) return undefined;
    const t = setInterval(() => setIndex(i => (i + 1) % examples.length), intervalMs);
    return () => clearInterval(t);
  }, [examples, intervalMs]);
  return examples[index];
}

// --- PAGES ---
const HomePage = ({ setPage, setSelectedListing, savedIds, onSave, setSearchFilters }) => {
  const [searchCat, setSearchCat] = useState("");
  const [searchMake, setSearchMake] = useState("");
  const [searchState, setSearchState] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const rotatingPlaceholder = useRotatingPlaceholder(AI_SEARCH_EXAMPLES);

  const { aircraft: featuredFromDB, loading: featuredLoading } = useFeaturedAircraft();
  const { aircraft: latestFromDB, loading: latestLoading } = useLatestAircraft();
  const { dealers: dealersFromDB } = useDealers();
  const { articles: newsFromDB } = useNews(3);
  const { total: totalListings } = useAircraft({});

  const featured = featuredFromDB;
  const latest = latestFromDB;
  const displayDealers = dealersFromDB.length > 0 ? dealersFromDB : DEALERS;
  const displayNews = newsFromDB.length > 0 ? newsFromDB : NEWS_ARTICLES;

  // Parse AI search query and extract filters
  const parseAiQuery = (query) => {
    const q = query.toLowerCase().trim();
    const filters = {
      cat: "",
      make: "",
      state: "",
      minPrice: "",
      maxPrice: "",
      maxHours: "",
      ifrOnly: false,
      glassOnly: false,
      cond: "",
      query: query
    };

    // Location / State
    if (/\b(vic|victoria|melbourne)\b/.test(q)) filters.state = "VIC";
    else if (/\b(nsw|new south wales|sydney)\b/.test(q)) filters.state = "NSW";
    else if (/\b(qld|queensland|brisbane)\b/.test(q)) filters.state = "QLD";
    else if (/\b(wa|western australia|perth)\b/.test(q)) filters.state = "WA";
    else if (/\b(sa|south australia|adelaide)\b/.test(q)) filters.state = "SA";
    else if (/\b(tas|tasmania|hobart)\b/.test(q)) filters.state = "TAS";
    else if (/\b(nt|northern territory|darwin)\b/.test(q)) filters.state = "NT";
    else if (/\b(act|canberra)\b/.test(q)) filters.state = "ACT";

    // Manufacturer
    if (/\b(cessna|182|172|152|206)\b/.test(q)) filters.make = "Cessna";
    else if (/\b(cirrus|sr22|sr20)\b/.test(q)) filters.make = "Cirrus";
    else if (/\b(piper|pa-28|pa28|archer|warrior)\b/.test(q)) filters.make = "Piper";
    else if (/\b(diamond|da40|da42)\b/.test(q)) filters.make = "Diamond";
    else if (/\b(robinson|r44|r22)\b/.test(q)) filters.make = "Robinson";
    else if (/\b(sling|tsi)\b/.test(q)) filters.make = "Sling";
    else if (/\b(pilatus|pc-12|pc12)\b/.test(q)) filters.make = "Pilatus";
    else if (/\b(beech|beechcraft|baron|bonanza)\b/.test(q)) filters.make = "Beechcraft";
    else if (/\b(jabiru)\b/.test(q)) filters.make = "Jabiru";
    else if (/\b(mooney)\b/.test(q)) filters.make = "Mooney";
    else if (/\b(tecnama?)\b/.test(q)) filters.make = "Tecnam";
    else if (/\b(bristell)\b/.test(q)) filters.make = "BRM Aero";
    else if (/\b(pipistrel)\b/.test(q)) filters.make = "Pipistrel";

    // Category
    if (/\b(helicopter|heli|chopper|rotor)\b/.test(q)) filters.cat = "Helicopter";
    else if (/\b(single.engine|singleengine|single-engine|sep)\b/.test(q)) filters.cat = "Single Engine Piston";
    else if (/\b(multi.engine|multiengine|multi-engine|twin.engine|twin-engine|twin)\b/.test(q)) filters.cat = "Multi Engine Piston";
    else if (/\b(turboprop)\b/.test(q)) filters.cat = "Turboprop";
    else if (/\b(light.jet|midsize.jet|heavy.jet|business.jet|jet)\b/.test(q)) {
      if (/\bmidsize\b/.test(q)) filters.cat = "Midsize Jet";
      else if (/\bheavy\b/.test(q)) filters.cat = "Heavy Jet";
      else filters.cat = "Light Jet";
    }
    else if (/\b(lsa|light.sport|sport.aircraft|ultralight|trainer)\b/.test(q)) filters.cat = "LSA";
    else if (/\b(glider|sailplane)\b/.test(q)) filters.cat = "Glider";
    else if (/\b(gyrocopter|gyro|autogyro)\b/.test(q)) filters.cat = "Gyrocopter";

    // Price - Under
    const underPriceK = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+)\s*k/i);
    const underPriceM = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
    if (underPriceK) filters.maxPrice = String(parseInt(underPriceK[1]) * 1000);
    else if (underPriceM) filters.maxPrice = String(Math.round(parseFloat(underPriceM[1]) * 1000000));

    // Price - Over
    const overPriceK = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+)\s*k/i);
    const overPriceM = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
    if (overPriceK) filters.minPrice = String(parseInt(overPriceK[1]) * 1000);
    else if (overPriceM) filters.minPrice = String(Math.round(parseFloat(overPriceM[1]) * 1000000));

    // Price Range
    const priceRange = q.match(/\$?(\d+(?:\.\d+)?)\s*k?\s*(?:to|-|)\s*\$?(\d+(?:\.\d+)?)\s*(k|m)?/i);
    if (priceRange && !underPriceK && !underPriceM && !overPriceK && !overPriceM) {
      let min = parseFloat(priceRange[1]);
      let max = parseFloat(priceRange[2]);
      const suffix = (priceRange[3] || '').toLowerCase();
      if (suffix === 'k' || (min < 100 && !suffix)) { min *= 1000; max *= 1000; }
      else if (suffix === 'm' || min > 100) { min *= 1000000; max *= 1000000; }
      else { min *= 1000; max *= 1000; }
      filters.minPrice = String(Math.round(min));
      filters.maxPrice = String(Math.round(max));
    }

    // Relative price terms
    if (/\b(cheap|budget|affordable|inexpensive)\b/.test(q) && !filters.maxPrice) {
      filters.maxPrice = "300000";
    } else if (/\b(expensive|luxury|premium|high.end)\b/.test(q) && !filters.minPrice) {
      filters.minPrice = "1000000";
    }

    // Hours
    const underHours = q.match(/(?:under|less than|below|max|maximum)\s*(\d+)\s*(?:hours?|hrs?|ttaf)/i);
    if (underHours) filters.maxHours = underHours[1];
    else if (/\b(low hours?|low.time)\b/i.test(q)) filters.maxHours = "1000";

    // Features
    if (/\bifr|instrument\b/i.test(q)) filters.ifrOnly = true;
    if (/\bglass|g1000|garmin\b/i.test(q)) filters.glassOnly = true;
    if (/\bnew\b/i.test(q) && !/\bnews\b/i.test(q)) filters.cond = "New";
    if (/\b(pre-owned|used|second.hand)\b/i.test(q)) filters.cond = "Pre-Owned";

    return filters;
  };

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
              <div className="fs-search-ai-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16a5 5 0 1 1-4.995-5.217L9.6 7.6l-2.3.77a1 1 0 0 1-1.264-1.264l.77-2.3L7.6 3.4a5 5 0 0 1 9.9 1.005L18 4v2h2l1.005.005a5 5 0 1 1-9.9 0L12 6h-2l-1.005-.005a5 5 0 0 1 1.005-9.9L10 2v2"/><path d="m9 15 3 3"/><path d="m12 18 3-3"/></svg>
              </div>
              <input
                className="fs-search-ai-input"
                placeholder={rotatingPlaceholder}
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAiSearch(e.target.value); }}
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
                  <option value="">All Australia</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="fs-search-field">
                <span className="fs-search-label">Year</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                  <span style={{ color: "var(--fs-ink-4)", fontSize: 12 }}>→</span>
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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                  <span style={{ color: "var(--fs-ink-4)", fontSize: 12 }}>→</span>
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

          <div className="fs-stats">
            <div className="fs-stat"><div className="fs-stat-num">{totalListings > 0 ? totalListings.toLocaleString() : SAMPLE_LISTINGS.length}</div><div className="fs-stat-label">Aircraft Listed</div></div>
            <div className="fs-stat"><div className="fs-stat-num">{displayDealers.length}</div><div className="fs-stat-label">Verified Dealers</div></div>
            <div className="fs-stat"><div className="fs-stat-num">{new Set(SAMPLE_LISTINGS.map(l => l.state)).size}</div><div className="fs-stat-label">States Covered</div></div>
          </div>
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
            <span className="fs-section-link" onClick={() => setPage("buy")}>View all {Icons.arrowRight}</span>
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
                <ListingCard key={l.id} listing={l} onClick={setSelectedListing} onSave={onSave} saved={savedIds.has(l.id)} />
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
            <span className="fs-section-link" onClick={() => setPage("buy")}>View all {Icons.arrowRight}</span>
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
                <ListingCard key={l.id} listing={l} onClick={setSelectedListing} onSave={onSave} saved={savedIds.has(l.id)} />
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
            <span className="fs-section-link" onClick={() => setPage("dealers")}>All dealers {Icons.arrowRight}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {displayDealers.slice(0, 6).map(d => (
              <div key={d.id} className="fs-dealer-card" onClick={() => setPage("dealers")} style={{ cursor: "pointer" }}>
                <div className="fs-dealer-avatar">{d.logo}</div>
                <div className="fs-dealer-info">
                  <div className="fs-dealer-name">{d.name}</div>
                  <div className="fs-dealer-loc">{Icons.location} {d.location}</div>
                  <div className="fs-dealer-stats">
                    <span>{d.listings} listings</span>
                    <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>
                  </div>
                </div>
              </div>
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
            <span className="fs-section-link" onClick={() => setPage("news")}>All articles {Icons.arrowRight}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {displayNews.slice(0, 3).map(a => (
              <div key={a.id} className="fs-news-card" onClick={() => setPage("news")}>
                <span className={`fs-news-tag ${a.category.toLowerCase()}`}>{a.category}</span>
                <div className="fs-news-title">{a.title}</div>
                <div className="fs-news-excerpt">{a.excerpt}</div>
                <div className="fs-news-footer">
                  <span>{a.date}</span>
                  <span>{a.read_time} min read</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

const BuyPage = ({ setSelectedListing, savedIds, onSave, initialFilters, user, setPage }) => {
  const [search, setSearch] = useState(initialFilters?.query || "");
  const [aiQuery, setAiQuery] = useState(initialFilters?.query || "");
  const [sortBy, setSortBy] = useState("newest");
  const [resultPage, setResultPage] = useState(1);
  const PAGE_SIZE = 12;
  const rotatingPlaceholder = useRotatingPlaceholder(AI_SEARCH_EXAMPLES);
  const [catFilter, setCatFilter] = useState(initialFilters?.cat || "");
  const [stateFilter, setStateFilter] = useState(initialFilters?.state || "");
  const [makeFilter, setMakeFilter] = useState(initialFilters?.make || "");
  const [condFilter, setCondFilter] = useState(initialFilters?.cond || "");
  const [minPrice, setMinPrice] = useState(initialFilters?.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice || "");
  const [maxHours, setMaxHours] = useState(initialFilters?.maxHours || "");
  const [ifrOnly, setIfrOnly] = useState(initialFilters?.ifrOnly || false);
  const [glassOnly, setGlassOnly] = useState(initialFilters?.glassOnly || false);
  const [yearFrom, setYearFrom] = useState(initialFilters?.yearFrom || "");
  const [yearTo, setYearTo] = useState(initialFilters?.yearTo || "");
  const [autopilot, setAutopilot] = useState(initialFilters?.autopilot || false);
  const [airCon, setAirCon] = useState(initialFilters?.airCon || false);
  const [deIce, setDeIce] = useState(initialFilters?.deIce || false);
  const [retractable, setRetractable] = useState(initialFilters?.retractable || false);
  const [sideOpen, setSideOpen] = useState(false);
  const [quickLook, setQuickLook] = useState(null);
  const [enquireFor, setEnquireFor] = useState(null);
  // Compare mode removed — pilots open multiple tabs to compare instead.

  // Reset to page 1 whenever any filter changes — prevents empty page state
  useEffect(() => { setResultPage(1); }, [search, catFilter, makeFilter, stateFilter, condFilter, minPrice, maxPrice, maxHours, ifrOnly, glassOnly]);

  const handleAiSearch = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return;
    
    // Reset filters first for a clean search
    resetFilters();
    
    // ===== LOCATION / STATE DETECTION =====
    const statePatterns = [
      { pattern: /\b(vic|victoria|melbourne)\b/, state: "VIC" },
      { pattern: /\b(nsw|new south wales|sydney)\b/, state: "NSW" },
      { pattern: /\b(qld|queensland|brisbane)\b/, state: "QLD" },
      { pattern: /\b(wa|western australia|perth)\b/, state: "WA" },
      { pattern: /\b(sa|south australia|adelaide)\b/, state: "SA" },
      { pattern: /\b(tas|tasmania|hobart)\b/, state: "TAS" },
      { pattern: /\b(nt|northern territory|darwin)\b/, state: "NT" },
      { pattern: /\b(act|canberra)\b/, state: "ACT" }
    ];
    
    for (const { pattern, state } of statePatterns) {
      if (pattern.test(q)) {
        setStateFilter(state);
        break;
      }
    }
    
    // ===== MANUFACTURER DETECTION =====
    const makePatterns = [
      { pattern: /\b(cessna|182|172|152|206)\b/, make: "Cessna" },
      { pattern: /\b(cirrus|sr22|sr20)\b/, make: "Cirrus" },
      { pattern: /\b(piper|pa-28|pa28|archer|warrior)\b/, make: "Piper" },
      { pattern: /\b(diamond|da40|da42)\b/, make: "Diamond" },
      { pattern: /\b(robinson|r44|r22)\b/, make: "Robinson" },
      { pattern: /\b(sling|tsi)\b/, make: "Sling" },
      { pattern: /\b(pilatus|pc-12|pc12)\b/, make: "Pilatus" },
      { pattern: /\b(beech|beechcraft|baron|bonanza)\b/, make: "Beechcraft" },
      { pattern: /\b(jabiru)\b/, make: "Jabiru" },
      { pattern: /\b(mooney)\b/, make: "Mooney" },
      { pattern: /\b(tecnama?)\b/, make: "Tecnam" },
      { pattern: /\b(bristell)\b/, make: "BRM Aero" },
      { pattern: /\b(pipistrel)\b/, make: "Pipistrel" }
    ];
    
    for (const { pattern, make } of makePatterns) {
      if (pattern.test(q)) {
        setMakeFilter(make);
        break;
      }
    }
    
    // ===== CATEGORY DETECTION =====
    const explicitCategoryUsed = /\b(single.engine|singleengine|single-engine|multi.engine|multiengine|multi-engine|twin.engine|twin-engine|twin|turboprop|light.jet|midsize.jet|heavy.jet|business.jet|helicopter|heli|chopper|rotor|lsa|light.sport|sport.aircraft|ultralight|glider|sailplane|gyrocopter|gyro|autogyro)\b/.test(q);
    if (/\b(helicopter|heli|chopper|rotor)\b/.test(q)) {
      setCatFilter("Helicopter");
    } else if (/\b(single.engine|singleengine|single-engine|sep)\b/.test(q)) {
      setCatFilter("Single Engine Piston");
    } else if (/\b(multi.engine|multiengine|multi-engine|twin.engine|twin-engine|twin)\b/.test(q)) {
      setCatFilter("Multi Engine Piston");
    } else if (/\b(turboprop)\b/.test(q)) {
      setCatFilter("Turboprop");
    } else if (/\b(light.jet|midsize.jet|heavy.jet|business.jet)\b/.test(q)) {
      setCatFilter(/\bmidsize\b/.test(q) ? "Midsize Jet" : /\bheavy\b/.test(q) ? "Heavy Jet" : "Light Jet");
    } else if (/\b(lsa|light.sport|sport.aircraft|ultralight)\b/.test(q)) {
      setCatFilter("LSA");
    } else if (/\b(glider|sailplane)\b/.test(q)) {
      setCatFilter("Glider");
    } else if (/\b(gyrocopter|gyro|autogyro)\b/.test(q)) {
      setCatFilter("Gyrocopter");
    }

    // Smart defaults: when a recognised model is mentioned without an explicit
    // category keyword, infer the category from the model. "Cessna 172" → SEP.
    if (!explicitCategoryUsed) {
      const modelToCategory = [
        { pattern: /\b(172|152|182|206|cherokee|warrior|archer|sr20|sr22|da40|bonanza|mooney|tsi|sling|jabiru|cirrus)\b/, category: "Single Engine Piston" },
        { pattern: /\b(da42|baron|seneca|310|aztec|seminole|duchess|navajo)\b/, category: "Multi Engine Piston" },
        { pattern: /\b(pc-12|pc12|king.air|caravan|tbm|meridian|cheyenne|conquest)\b/, category: "Turboprop" },
        { pattern: /\b(citation|hondajet|phenom|legacy|cj1|cj2|cj3|cj4|m2|mustang)\b/, category: "Light Jet" },
        { pattern: /\b(r22|r44|r66|bell.206|bell.407|jetranger|longranger|ec120|ec130)\b/, category: "Helicopter" },
        { pattern: /\b(tecnam|bristell|pipistrel|virus|sport.cruiser)\b/, category: "LSA" },
      ];
      for (const { pattern, category } of modelToCategory) {
        if (pattern.test(q)) { setCatFilter(category); break; }
      }
    }
    
    // ===== PRICE DETECTION =====
    // "under $500k", "less than 300k", "up to $1m"
    const underPriceK = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+)\s*k/i);
    const underPriceM = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
    const overPriceK = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+)\s*k/i);
    const overPriceM = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
    const priceRange = q.match(/\$?(\d+(?:\.\d+)?)\s*k?\s*(?:to|-|)\s*\$?(\d+(?:\.\d+)?)\s*(k|m)?/i);
    
    if (underPriceK) {
      setMaxPrice(String(parseInt(underPriceK[1]) * 1000));
    } else if (underPriceM) {
      setMaxPrice(String(Math.round(parseFloat(underPriceM[1]) * 1000000)));
    }
    
    if (overPriceK) {
      setMinPrice(String(parseInt(overPriceK[1]) * 1000));
    } else if (overPriceM) {
      setMinPrice(String(Math.round(parseFloat(overPriceM[1]) * 1000000)));
    }
    
    // Price range: "$200k to $500k" or "300k-600k"
    if (priceRange && !underPriceK && !underPriceM && !overPriceK && !overPriceM) {
      let min = parseFloat(priceRange[1]);
      let max = parseFloat(priceRange[2]);
      const suffix = (priceRange[3] || '').toLowerCase();
      
      // Determine scale from suffix or magnitude
      if (suffix === 'k' || (min < 100 && !suffix)) {
        min *= 1000;
        max *= 1000;
      } else if (suffix === 'm' || min > 100) {
        min *= 1000000;
        max *= 1000000;
      } else if (!suffix && max > 1000) {
        // Already in dollars
      } else {
        min *= 1000;
        max *= 1000;
      }
      
      setMinPrice(String(Math.round(min)));
      setMaxPrice(String(Math.round(max)));
    }
    
    // "Cheap" or "expensive" relative terms
    if (/\bcheap|budget|affordable|inexpensive\b/.test(q) && !minPrice && !maxPrice) {
      setMaxPrice("300000"); // Under $300k
    } else if (/\bexpensive|luxury|premium|high.end\b/.test(q) && !minPrice) {
      setMinPrice("1000000"); // Over $1M
    }
    
    // ===== HOURS / TIME DETECTION =====
    const underHours = q.match(/(?:under|less than|below|max|maximum)\s*(\d+)\s*(?:hours?|hrs?|ttaf)/i);
    const overHours = q.match(/(?:over|more than|above)\s*(\d+)\s*(?:hours?|hrs?|ttaf)/i);
    const lowHours = /\blow hours?|low.time\b/i.test(q);
    
    if (underHours) {
      setMaxHours(underHours[1]);
    } else if (lowHours) {
      setMaxHours("1000"); // Low hours = under 1000
    }
    
    // ===== YEAR DETECTION =====
    const yearMatch = q.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      // Could implement year filtering when available
    }
    
    // ===== FEATURE DETECTION =====
    if (/\bifr|instrument\b/i.test(q)) {
      setIfrOnly(true);
    }
    if (/\bglass|cirrus|g1000|garmin\b/i.test(q)) {
      setGlassOnly(true);
    }
    if (/\bnew\b/i.test(q) && !/\bnews\b/i.test(q)) {
      setCondFilter("New");
    }
    if (/\b(pre-owned|used|second.hand)\b/i.test(q)) {
      setCondFilter("Pre-Owned");
    }
    
    // ===== SEAT COUNT =====
    const seatMatch = q.match(/\b(\d)[\s-]?(?:seat|passenger|pax|place)\b/i);
    if (seatMatch) {
      // Could add seat count filter when available
    }
    
    // Set the display query
    setAiQuery(query);
    
    // Also set the text search for title/manufacturer matching
    setSearch(query);
  };

  const resetFilters = () => {
    setSearch(""); setCatFilter(""); setStateFilter(""); setMakeFilter("");
    setCondFilter(""); setMinPrice(""); setMaxPrice(""); setMaxHours("");
    setIfrOnly(false); setGlassOnly(false); setAiQuery(""); setYearFrom(""); setYearTo("");
    setAutopilot(false); setAirCon(false); setDeIce(false); setRetractable(false);
  };

  const hasActiveFilters = !!(catFilter || stateFilter || makeFilter || condFilter || minPrice || maxPrice || maxHours || ifrOnly || glassOnly || yearFrom || yearTo || autopilot || airCon || deIce || retractable);
  const activeFilterCount = [catFilter, stateFilter, makeFilter, condFilter, minPrice, maxPrice, maxHours, ifrOnly, glassOnly, yearFrom, yearTo, autopilot, airCon, deIce, retractable].filter(Boolean).length;

  const dbFilters = useMemo(() => ({
    category: catFilter || undefined,
    manufacturer: makeFilter || undefined,
    state: stateFilter || undefined,
    condition: condFilter || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    maxHours: maxHours || undefined,
    ifrOnly: ifrOnly || undefined,
    glassOnly: glassOnly || undefined,
    search: search || undefined,
    sortBy,
  }), [catFilter, makeFilter, stateFilter, condFilter, minPrice, maxPrice, maxHours, ifrOnly, glassOnly, search, sortBy]);

  const { aircraft: dbAircraft, loading: dbLoading, total: dbTotal } = useAircraft(dbFilters);
  // Separate unfiltered count to know if the system is genuinely empty (vs. just filtered to nothing)
  const { total: systemTotal } = useAircraft({});

  const hasFilters = activeFilterCount > 0 || !!search;

  // Source-of-truth selection:
  // - If system has any aircraft → trust DB (even when filters return 0)
  // - If system is empty AND no filters active → show SAMPLE_LISTINGS as demo
  // - If system is empty AND filters active → show empty state (no fake fallback)
  const filtered = useMemo(() => {
    if (systemTotal > 0) return dbAircraft;
    if (hasFilters) return [];
    let results = [...SAMPLE_LISTINGS];
    if (sortBy === "price-asc") results.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") results.sort((a, b) => b.price - a.price);
    if (sortBy === "newest") results.sort((a, b) => new Date(b.created_at || b.created) - new Date(a.created_at || a.created));
    if (sortBy === "hours-low") results.sort((a, b) => a.ttaf - b.ttaf);
    return results;
  }, [dbAircraft, systemTotal, hasFilters, sortBy]);

  // Active filter chips — compute labels for display
  const activeChips = [
    catFilter && { key: 'cat', label: catFilter, clear: () => setCatFilter("") },
    makeFilter && { key: 'make', label: makeFilter, clear: () => setMakeFilter("") },
    stateFilter && { key: 'state', label: stateFilter, clear: () => setStateFilter("") },
    condFilter && { key: 'cond', label: condFilter, clear: () => setCondFilter("") },
    (minPrice || maxPrice) && { key: 'price', label: `$${minPrice ? `${(minPrice/1000).toFixed(0)}k` : '0'}–${maxPrice ? `${(maxPrice/1000).toFixed(0)}k` : '∞'}`, clear: () => { setMinPrice(""); setMaxPrice(""); } },
    maxHours && { key: 'hours', label: `< ${maxHours} hrs`, clear: () => setMaxHours("") },
    ifrOnly && { key: 'ifr', label: 'IFR', clear: () => setIfrOnly(false) },
    glassOnly && { key: 'glass', label: 'Glass cockpit', clear: () => setGlassOnly(false) },
    autopilot && { key: 'autopilot', label: 'Autopilot', clear: () => setAutopilot(false) },
    airCon && { key: 'airCon', label: 'Air conditioning', clear: () => setAirCon(false) },
    deIce && { key: 'deIce', label: 'De-ice', clear: () => setDeIce(false) },
    retractable && { key: 'retractable', label: 'Retractable gear', clear: () => setRetractable(false) },
  ].filter(Boolean);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (resultPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(resultPage * PAGE_SIZE, filtered.length);

  // Category-aware predicates: only show certain equipment filters when the
  // selected category implies them. Drives the smart Equipment section below.
  const TURBINE_OR_TWIN = ['Multi Engine Piston', 'Turboprop', 'Light Jet', 'Midsize Jet', 'Heavy Jet'];
  const FIXED_WING_POWERED = ['Single Engine Piston', 'Multi Engine Piston', 'Turboprop'];
  const canBePressurised = !catFilter || TURBINE_OR_TWIN.includes(catFilter);
  const canBeRetractable = !catFilter || FIXED_WING_POWERED.includes(catFilter);

  // Price preset handler — toggle preset chips
  const setPricePreset = (min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
  };
  const isPricePreset = (min, max) =>
    String(minPrice || '') === String(min || '') && String(maxPrice || '') === String(max || '');

  // Hours preset handler
  const setHoursPreset = (max) => setMaxHours(max);
  const isHoursPreset = (max) => String(maxHours || '') === String(max || '');

  return (
    <>
      <div className="fs-container">
        <div className="fs-buy-shell">
        {/* SIDEBAR — flush left, sticky full-page rail */}
        <aside className={`fs-buy-sidebar${sideOpen ? " open" : ""}`}>
          <div className="fs-buy-sidebar-inner">

            {/* Header bar */}
            <div className="fs-sidebar-header">
              <span className="fs-sidebar-title">Filters</span>
              {hasActiveFilters && (
                <button className="fs-sidebar-clear" onClick={resetFilters}>Clear all</button>
              )}
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="fs-sidebar-active">
                {activeChips.map(chip => (
                  <button key={chip.key} onClick={chip.clear} className="fs-sidebar-active-chip" title="Remove filter">
                    {chip.label}
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.6 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                ))}
              </div>
            )}

            {/* Live result count */}
            <div style={{ fontSize: 13, color: "var(--fs-ink-3)", padding: "8px 0 16px", borderBottom: "1px solid var(--fs-line)" }}>
              <span style={{ color: "var(--fs-ink)", fontWeight: 600 }}>{filtered.length}</span> of {systemTotal || filtered.length} aircraft
            </div>

            {/* Category */}
            <div className="fs-sidebar-section">
              <label className="fs-sidebar-label">Category</label>
              <select className="fs-sidebar-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Location */}
            <div className="fs-sidebar-section">
              <label className="fs-sidebar-label">Location</label>
              <select className="fs-sidebar-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                <option value="">All states</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Manufacturer */}
            <div className="fs-sidebar-section">
              <label className="fs-sidebar-label">Manufacturer</label>
              <select className="fs-sidebar-select" value={makeFilter} onChange={e => setMakeFilter(e.target.value)}>
                <option value="">All manufacturers</option>
                {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div className="fs-sidebar-section">
              <label className="fs-sidebar-label">Condition</label>
              <select className="fs-sidebar-select" value={condFilter} onChange={e => setCondFilter(e.target.value)}>
                <option value="">Any condition</option>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Price */}
            <div className="fs-sidebar-section">
              <label className="fs-sidebar-label">Price</label>
              <div className="fs-sidebar-presets">
                <button onClick={() => setPricePreset('', '100000')} className={`fs-sidebar-preset${isPricePreset('', '100000') ? ' active' : ''}`}>&lt;$100k</button>
                <button onClick={() => setPricePreset('', '300000')} className={`fs-sidebar-preset${isPricePreset('', '300000') ? ' active' : ''}`}>&lt;$300k</button>
                <button onClick={() => setPricePreset('', '1000000')} className={`fs-sidebar-preset${isPricePreset('', '1000000') ? ' active' : ''}`}>&lt;$1M</button>
                <button onClick={() => setPricePreset('1000000', '')} className={`fs-sidebar-preset${isPricePreset('1000000', '') ? ' active' : ''}`}>$1M+</button>
              </div>
            </div>

            {/* Total time */}
            <div className="fs-sidebar-section">
              <label className="fs-sidebar-label">Total time</label>
              <div className="fs-sidebar-presets">
                <button onClick={() => setHoursPreset('500')} className={`fs-sidebar-preset${isHoursPreset('500') ? ' active' : ''}`}>&lt;500</button>
                <button onClick={() => setHoursPreset('1000')} className={`fs-sidebar-preset${isHoursPreset('1000') ? ' active' : ''}`}>&lt;1,000</button>
                <button onClick={() => setHoursPreset('2000')} className={`fs-sidebar-preset${isHoursPreset('2000') ? ' active' : ''}`}>&lt;2,000</button>
              </div>
            </div>

            {/* Year */}
            <div className="fs-sidebar-section">
              <label className="fs-sidebar-label">Year</label>
              <div className="fs-year-range">
                <select
                  className="fs-sidebar-select"
                  value={yearFrom}
                  onChange={e => setYearFrom(e.target.value)}
                >
                  <option value="">From</option>
                  {Array.from({ length: 51 }, (_, i) => 2026 - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="fs-year-arrow">→</span>
                <select
                  className="fs-sidebar-select"
                  value={yearTo}
                  onChange={e => setYearTo(e.target.value)}
                >
                  <option value="">To</option>
                  {Array.from({ length: 51 }, (_, i) => 2026 - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced filters */}
            <details className="fs-sidebar-advanced">
              <summary>
                Advanced filters
                <span className="fs-sidebar-advanced-chev">{Icons.chevronDown}</span>
              </summary>
              <div className="fs-sidebar-advanced-body">
                {/* Equipment */}
                <div className="fs-sidebar-section">
                  <label className="fs-sidebar-label">Equipment</label>
                  <div className="fs-sidebar-presets">
                    <button onClick={() => setIfrOnly(!ifrOnly)} className={`fs-sidebar-preset${ifrOnly ? ' active' : ''}`}>IFR</button>
                    <button onClick={() => setGlassOnly(!glassOnly)} className={`fs-sidebar-preset${glassOnly ? ' active' : ''}`}>Glass cockpit</button>
                    <button onClick={() => setAutopilot(!autopilot)} className={`fs-sidebar-preset${autopilot ? ' active' : ''}`}>Autopilot</button>
                    <button onClick={() => setAirCon(!airCon)} className={`fs-sidebar-preset${airCon ? ' active' : ''}`}>Air conditioning</button>
                    <button onClick={() => setDeIce(!deIce)} className={`fs-sidebar-preset${deIce ? ' active' : ''}`}>De-ice</button>
                    <button onClick={() => setRetractable(!retractable)} className={`fs-sidebar-preset${retractable ? ' active' : ''}`}>Retractable gear</button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </aside>

        {/* MAIN CONTENT — shifted right */}
        <main className="fs-buy-main">

          {/* Header */}
          <div style={{ padding: "24px 0 16px", borderBottom: "1px solid var(--fs-line)", marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Aircraft for sale</h1>
            <p style={{ fontSize: 14, color: "var(--fs-ink-3)", margin: 0 }}>
              {systemTotal > 0 ? `${systemTotal.toLocaleString()}+ verified listings` : 'Verified listings from dealers and private sellers'}
            </p>
          </div>

          {/* Search bar — sticky inside main column */}
          <div className="fs-buy-main-search">
            <div className="fs-buy-search-input-wrap">
              <span className="fs-buy-search-icon">{Icons.search}</span>
              <input
                className="fs-search-inline-input"
                placeholder={rotatingPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.target.value) handleAiSearch(e.target.value); }}
              />
              {search ? (
                <button onClick={() => { setSearch(""); setAiQuery(""); }} className="fs-buy-search-clear" aria-label="Clear search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              ) : (
                <span className="fs-buy-search-hint">↵ Search</span>
              )}
            </div>
            <button className="fs-mobile-filter-btn" onClick={() => setSideOpen(!sideOpen)}>
              {Icons.filter} Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
            </button>
          </div>

          {/* Toolbar */}
          <div className="fs-buy-main-toolbar">
            <span className="fs-results-count">
              {dbLoading ? (
                <span style={{ color: 'var(--fs-ink-3)' }}>Searching…</span>
              ) : (
                <>
                  <span style={{ color: "var(--fs-ink)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>{filtered.length}</span>
                  <span style={{ marginLeft: 6 }}>aircraft</span>
                  {aiQuery && <span style={{ color: "var(--fs-ink-3)", marginLeft: 8, fontStyle: 'italic' }}>for "{aiQuery}"</span>}
                </>
              )}
            </span>
            {filtered.length > 0 && (
              <div className="fs-results-sort">
                <span className="fs-results-sort-label">Sort by</span>
                <select className="fs-sort-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setResultPage(1); }}>
                  <option value="newest">Newest first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="hours-low">Hours: low to high</option>
                </select>
              </div>
            )}
          </div>

          {/* Grid */}
          {dbLoading ? (
            <div className="fs-grid">
              {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No aircraft match your filters"
              description="Try widening your price range, removing a feature, or clearing filters."
              searchQuery={aiQuery}
              activeFilters={activeFilterCount}
              onClearFilters={resetFilters}
              onBrowseAll={() => { resetFilters(); setPage && setPage('buy'); }}
              onSetAlert={() => setPage && setPage('login')}
              user={user}
            />
          ) : (
            <>
              <div className="fs-grid">
                {filtered.slice((resultPage - 1) * PAGE_SIZE, resultPage * PAGE_SIZE).map(l => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    onClick={setSelectedListing}
                    onSave={onSave}
                    saved={savedIds.has(l.id)}
                    onQuickLook={setQuickLook}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--fs-line)", flexWrap: "wrap", gap: 16 }}>
                  <span style={{ fontSize: 13, color: "var(--fs-ink-3)", fontWeight: 500 }}>
                    Page {resultPage} of {totalPages}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => { setResultPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                      disabled={resultPage === 1}
                      style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--fs-line)", background: resultPage === 1 ? "var(--fs-bg-2)" : "white", cursor: resultPage === 1 ? "default" : "pointer", color: resultPage === 1 ? "var(--fs-ink-4)" : "var(--fs-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fs-font)" }}
                      aria-label="Previous"
                    >{Icons.chevronLeft}</button>
                    {(() => {
                      const pages = [];
                      const showRange = 5;
                      let start = Math.max(1, resultPage - Math.floor(showRange / 2));
                      let end = Math.min(totalPages, start + showRange - 1);
                      start = Math.max(1, end - showRange + 1);
                      for (let p = start; p <= end; p++) pages.push(p);
                      return pages.map(p => (
                        <button key={p} onClick={() => { setResultPage(p); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                          style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: p === resultPage ? "var(--fs-ink)" : "transparent", color: p === resultPage ? "white" : "var(--fs-ink)", fontWeight: p === resultPage ? 600 : 500, fontSize: 14, cursor: "pointer", fontFamily: "var(--fs-font)", letterSpacing: "-0.005em" }}
                        >{p}</button>
                      ));
                    })()}
                    <button
                      onClick={() => { setResultPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                      disabled={resultPage === totalPages}
                      style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--fs-line)", background: resultPage === totalPages ? "var(--fs-bg-2)" : "white", cursor: resultPage === totalPages ? "default" : "pointer", color: resultPage === totalPages ? "var(--fs-ink-4)" : "var(--fs-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fs-font)" }}
                      aria-label="Next"
                    >{Icons.chevronRight}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      </div>

      {/* Quick-look modal */}
      {quickLook && (
        <QuickLookModal
          listing={quickLook}
          onClose={() => setQuickLook(null)}
          onViewFull={(l) => { setQuickLook(null); setSelectedListing(l); }}
          onSave={onSave}
          saved={savedIds.has(quickLook.id)}
          onEnquire={(l) => { setQuickLook(null); setEnquireFor(l); }}
        />
      )}

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        isOpen={sideOpen}
        onClose={() => setSideOpen(false)}
        filteredCount={filtered.length}
        onClear={resetFilters}
      >
        <div className="fs-buy-sidebar-inner">

          {/* Live result count */}
          <div style={{ fontSize: 13, color: "var(--fs-ink-3)", padding: "8px 0 16px", borderBottom: "1px solid var(--fs-line)" }}>
            <span style={{ color: "var(--fs-ink)", fontWeight: 600 }}>{filtered.length}</span> of {systemTotal || filtered.length} aircraft
          </div>

          {/* Category */}
          <div className="fs-sidebar-section">
            <label className="fs-sidebar-label">Category</label>
            <select className="fs-sidebar-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Location */}
          <div className="fs-sidebar-section">
            <label className="fs-sidebar-label">Location</label>
            <select className="fs-sidebar-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
              <option value="">All states</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Manufacturer */}
          <div className="fs-sidebar-section">
            <label className="fs-sidebar-label">Manufacturer</label>
            <select className="fs-sidebar-select" value={makeFilter} onChange={e => setMakeFilter(e.target.value)}>
              <option value="">All manufacturers</option>
              {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Condition */}
          <div className="fs-sidebar-section">
            <label className="fs-sidebar-label">Condition</label>
            <select className="fs-sidebar-select" value={condFilter} onChange={e => setCondFilter(e.target.value)}>
              <option value="">Any condition</option>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="fs-sidebar-section">
            <label className="fs-sidebar-label">Price</label>
            <div className="fs-sidebar-presets">
              <button onClick={() => setPricePreset('', '100000')} className={`fs-sidebar-preset${isPricePreset('', '100000') ? ' active' : ''}`}>&lt;$100k</button>
              <button onClick={() => setPricePreset('', '300000')} className={`fs-sidebar-preset${isPricePreset('', '300000') ? ' active' : ''}`}>&lt;$300k</button>
              <button onClick={() => setPricePreset('', '1000000')} className={`fs-sidebar-preset${isPricePreset('', '1000000') ? ' active' : ''}`}>&lt;$1M</button>
              <button onClick={() => setPricePreset('1000000', '')} className={`fs-sidebar-preset${isPricePreset('1000000', '') ? ' active' : ''}`}>$1M+</button>
            </div>
          </div>

          {/* Total time */}
          <div className="fs-sidebar-section">
            <label className="fs-sidebar-label">Total time</label>
            <div className="fs-sidebar-presets">
              <button onClick={() => setHoursPreset('500')} className={`fs-sidebar-preset${isHoursPreset('500') ? ' active' : ''}`}>&lt;500</button>
              <button onClick={() => setHoursPreset('1000')} className={`fs-sidebar-preset${isHoursPreset('1000') ? ' active' : ''}`}>&lt;1,000</button>
              <button onClick={() => setHoursPreset('2000')} className={`fs-sidebar-preset${isHoursPreset('2000') ? ' active' : ''}`}>&lt;2,000</button>
            </div>
          </div>

          {/* Year */}
          <div className="fs-sidebar-section">
            <label className="fs-sidebar-label">Year</label>
            <div className="fs-year-range">
              <select
                className="fs-sidebar-select"
                value={yearFrom}
                onChange={e => setYearFrom(e.target.value)}
              >
                <option value="">From</option>
                {Array.from({ length: 51 }, (_, i) => 2026 - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="fs-year-arrow">→</span>
              <select
                className="fs-sidebar-select"
                value={yearTo}
                onChange={e => setYearTo(e.target.value)}
              >
                <option value="">To</option>
                {Array.from({ length: 51 }, (_, i) => 2026 - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced filters */}
          <details className="fs-sidebar-advanced">
            <summary>
              Advanced filters
              <span className="fs-sidebar-advanced-chev">{Icons.chevronDown}</span>
            </summary>
            <div className="fs-sidebar-advanced-body">
              {/* Equipment */}
              <div className="fs-sidebar-section">
                <label className="fs-sidebar-label">Equipment</label>
                <div className="fs-sidebar-presets">
                  <button onClick={() => setIfrOnly(!ifrOnly)} className={`fs-sidebar-preset${ifrOnly ? ' active' : ''}`}>IFR</button>
                  <button onClick={() => setGlassOnly(!glassOnly)} className={`fs-sidebar-preset${glassOnly ? ' active' : ''}`}>Glass cockpit</button>
                  <button onClick={() => setAutopilot(!autopilot)} className={`fs-sidebar-preset${autopilot ? ' active' : ''}`}>Autopilot</button>
                  <button onClick={() => setAirCon(!airCon)} className={`fs-sidebar-preset${airCon ? ' active' : ''}`}>Air conditioning</button>
                  <button onClick={() => setDeIce(!deIce)} className={`fs-sidebar-preset${deIce ? ' active' : ''}`}>De-ice</button>
                  <button onClick={() => setRetractable(!retractable)} className={`fs-sidebar-preset${retractable ? ' active' : ''}`}>Retractable gear</button>
                </div>
              </div>
            </div>
          </details>
        </div>
      </MobileFilterSheet>

      {/* Inline enquiry from quick-look */}
      {enquireFor && <EnquiryModal listing={enquireFor} onClose={() => setEnquireFor(null)} user={user} />}
    </>
  );
};

const ListingDetail = ({ listing, onBack, savedIds, onSave, user, onSelectDealer }) => {
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);
  const { aircraft: similar } = useAircraft({ category: listing?.category, sortBy: 'newest' });
  if (!listing) return null;
  const l = listing;
  const rawDealer = l.dealer;
  const dealerName = (rawDealer && typeof rawDealer === 'object') ? rawDealer.name : (typeof rawDealer === 'string' ? rawDealer : null);
  // Resolve a navigable dealer object: prefer joined object, else fall back to DEALERS lookup by id/name
  const dealerObj = (rawDealer && typeof rawDealer === 'object')
    ? rawDealer
    : (DEALERS.find(d => d.id === l.dealer_id) || DEALERS.find(d => d.name === dealerName) || (dealerName ? { name: dealerName } : {}));
  const canOpenDealer = !!(onSelectDealer && (dealerObj.id || dealerObj.name));
  const isSaved = savedIds.has(l.id);
  // monthlyEst removed — was a naive l.price * 0.008 multiplier, not real amortisation

  const casaSpecs = [
    ["Year", l.year],
    ["Manufacturer", l.manufacturer],
    ["Model", l.model],
    l.rego && ["Registration", l.rego],
    ["Category", l.category],
    ["Condition", l.condition],
  ].filter(Boolean);

  const detailSpecs = [
    l.ttaf != null && ["Total Time Airframe", formatHours(l.ttaf)],
    l.eng_hours != null && ["Engine Hours (SMOH)", formatHours(l.eng_hours)],
    l.eng_tbo && ["Engine TBO", formatHours(l.eng_tbo)],
    l.specs?.engine && ["Engine", l.specs.engine],
    l.specs?.propeller && ["Propeller", l.specs.propeller],
    l.avionics && ["Avionics", l.avionics],
    l.specs?.seats && ["Seats", l.specs.seats],
    l.specs?.mtow_kg && ["MTOW", l.specs.mtow_kg + " kg"],
    l.specs?.wingspan_m && ["Wingspan", l.specs.wingspan_m + " m"],
    l.useful_load && ["Useful Load", l.useful_load + " kg"],
    l.range_nm && ["Range", l.range_nm + " nm"],
    l.cruise_kts && ["Cruise Speed", l.cruise_kts + " kts"],
    l.fuel_burn && ["Fuel Burn", l.fuel_burn + " L/hr"],
    ["IFR Capable", l.ifr ? "✓" : "—"],
    ["Retractable Gear", l.retractable ? "✓" : "—"],
    l.pressurised !== undefined && ["Pressurised", l.pressurised ? "✓" : "—"],
    ["Glass Cockpit", l.glass_cockpit ? "✓" : "—"],
    l.specs?.parachute && ["Parachute", l.specs.parachute],
  ].filter(Boolean);

  const similarListings = similar.filter(s => s.id !== l.id).slice(0, 3);

  return (
    <>
      <div className="fs-detail-header">
        <div className="fs-container">
          <div className="fs-detail-breadcrumb">
            <span onClick={onBack} style={{ cursor: "pointer" }}>Buy</span> {Icons.chevronRight}
            <span>{l.category}</span> {Icons.chevronRight}
            <span style={{ color: "var(--fs-ink)" }}>{l.title}</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.03em", color: "var(--fs-ink)" }}>{l.title}</h1>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--fs-ink-3)", alignItems: "center", flexWrap: "wrap", fontWeight: 500, marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--fs-ink)", letterSpacing: "-0.02em" }}>{formatPriceFull(l.price)}</span>
            <span>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.location} {[l.city, l.state].filter(Boolean).join(', ')}</span>
            <span>·</span>
            <span>Listed {timeAgo(l.created_at || l.created)}</span>
            {dealerName && <span className="fs-tag">{Icons.shield} Verified Dealer</span>}
            {l.rego && <span className="fs-tag">CASA {l.rego}</span>}
            {l.ifr && <span className="fs-tag">IFR</span>}
            {isJustListed(l) && <span className="fs-tag" style={{ background: "var(--fs-green)", color: "#fff" }}>Just Listed</span>}
          </div>
        </div>
      </div>

      <div className="fs-container">
        <div className="fs-detail-layout">
          {/* Main content */}
          <div>
            <AircraftImage listing={l} size="lg" style={{ borderRadius: "var(--fs-radius)", marginBottom: 20 }} showGallery={true} />

            {l.description && (
              <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
                <h3>Description</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fs-gray-600)", whiteSpace: "pre-line" }}>{l.description}</p>
              </div>
            )}

            <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
              <h3>Aircraft Details</h3>
              {casaSpecs.map(([label, value]) => (
                <div key={label} className="fs-detail-spec-row">
                  <span className="fs-detail-spec-label">{label}</span>
                  <span className="fs-detail-spec-value">{value}</span>
                </div>
              ))}
            </div>

            {detailSpecs.length > 0 && (
              <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
                <button
                  onClick={() => setShowDetailedSpecs(!showDetailedSpecs)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid var(--fs-line)",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "var(--fs-font)",
                    color: "var(--fs-ink)",
                  }}
                >
                  <span>Key Specifications</span>
                  <span style={{ fontSize: 12, color: "var(--fs-ink-3)", fontWeight: 500 }}>
                    {showDetailedSpecs ? "Hide" : `Show ${detailSpecs.length} specs`}
                  </span>
                </button>
                {showDetailedSpecs && detailSpecs.map(([label, value]) => (
                  <div key={label} className="fs-detail-spec-row">
                    <span className="fs-detail-spec-label">{label}</span>
                    <span className="fs-detail-spec-value" style={{ color: String(value).startsWith('✓') ? "var(--fs-green)" : undefined }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
              <h3>Cost of Ownership (est.)</h3>
              {[
                ["Annual Insurance", l.category === "Helicopter" ? "$12,000–$25,000" : l.category === "Turboprop" ? "$25,000–$60,000" : l.category === "Light Jet" ? "$40,000–$100,000" : "$5,000–$15,000"],
                ["Annual Inspection", l.category === "Helicopter" ? "$8,000–$15,000" : l.category === "Turboprop" ? "$15,000–$30,000" : l.category === "Light Jet" ? "$20,000–$50,000" : "$3,000–$8,000"],
                ["Hangar (monthly)", "$400–$1,200"],
                l.fuel_burn && ["Fuel per hour", `$${(l.fuel_burn * 2.8).toFixed(0)}`],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="fs-detail-spec-row">
                  <span className="fs-detail-spec-label">{label}</span>
                  <span className="fs-detail-spec-value">{value}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 12 }}>Estimates only. Based on Australian averages. Actual costs vary.</p>
            </div>

            {/* Similar aircraft */}
            {similarListings.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Similar {l.category} Aircraft</h3>
                <div className="fs-grid">
                  {similarListings.map(s => (
                    <ListingCard key={s.id} listing={s} onClick={() => { window.scrollTo(0,0); }} onSave={onSave} saved={savedIds.has(s.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="fs-detail-sidebar">
            <div className="fs-detail-price-card fs-detail-sticky">
              {l.rego && <div className="fs-detail-rego">{l.rego} &middot; {l.condition}</div>}

              <button className="fs-detail-cta fs-detail-cta-primary" onClick={() => setShowEnquiry(true)}>
                {Icons.mail}&nbsp; Contact Seller
              </button>
              <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => onSave(l.id)}>
                {isSaved ? Icons.heartFull : Icons.heart}&nbsp; {isSaved ? "Saved ✓" : "Save to Watchlist"}
              </button>

              {/* Trust signals — only show what's backed by real data */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--fs-line)", display: "flex", flexDirection: "column", gap: 10 }}>
                {l.rego && <div style={{ fontSize: 13, color: "var(--fs-ink-2)", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}><span style={{ color: "var(--fs-green)" }}>{Icons.check}</span> CASA registered ({l.rego})</div>}
                {dealerName && <div style={{ fontSize: 13, color: "var(--fs-ink-2)", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}><span style={{ color: "var(--fs-green)" }}>{Icons.check}</span> Verified dealer listing</div>}
              </div>
            </div>

            {dealerName && (
              <div className="fs-detail-specs">
                <h3>Seller</h3>
                <div
                  role={canOpenDealer ? "button" : undefined}
                  tabIndex={canOpenDealer ? 0 : undefined}
                  onClick={canOpenDealer ? () => onSelectDealer(dealerObj) : undefined}
                  onKeyDown={canOpenDealer ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDealer(dealerObj); } } : undefined}
                  style={{
                    display: "block",
                    margin: "-8px",
                    padding: "8px",
                    borderRadius: "var(--fs-radius-lg)",
                    cursor: canOpenDealer ? "pointer" : "default",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (canOpenDealer) e.currentTarget.style.background = "var(--fs-gray-50, #f6f6f6)"; }}
                  onMouseLeave={(e) => { if (canOpenDealer) e.currentTarget.style.background = "transparent"; }}
                  aria-label={canOpenDealer ? `View ${dealerName} profile` : undefined}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                    <div className="fs-dealer-avatar" style={{ width: 48, height: 48, fontSize: 14 }}>{(dealerObj.logo || dealerName?.slice(0,2))?.toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>{dealerName}</div>
                        {canOpenDealer && <span style={{ fontSize: 12, color: "var(--fs-ink-3)" }}>›</span>}
                      </div>
                      {dealerObj.location && <div style={{ fontSize: 13, color: "var(--fs-ink-3)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>{Icons.location} {dealerObj.location}</div>}
                    </div>
                  </div>
                  {dealerObj.rating && (
                    <div style={{ display: "flex", gap: 14, fontSize: 13, color: "var(--fs-ink-3)", fontWeight: 500 }}>
                      <span className="fs-dealer-rating">{Icons.star} {dealerObj.rating}</span>
                      {dealerObj.listings && <span>{dealerObj.listings} active listings</span>}
                    </div>
                  )}
                  {canOpenDealer && (
                    <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "var(--fs-ink-2)" }}>
                      View seller profile →
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEnquiry && <EnquiryModal listing={l} onClose={() => setShowEnquiry(false)} user={user} />}
    </>
  );
};

const SellPage = ({ user, setPage }) => {
  // Require login to sell
  if (!user) {
    return (
      <>
        <div className="fs-about-hero">
          <div className="fs-container">
            <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Sell Your Aircraft</h1>
            <p style={{ color: "var(--fs-ink-3)", marginTop: 8, fontSize: 16 }}>Reach thousands of qualified buyers across Australia</p>
          </div>
        </div>
        <section className="fs-section">
          <div className="fs-container" style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="fs-detail-specs" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'var(--fs-bg-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 36
              }}>
                {Icons.user}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Sign in to List Your Aircraft</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 24 }}>
                Create an account or sign in to list your aircraft for sale. 
                It's free to create a basic listing.
              </p>
              <button 
                className="fs-form-submit"
                onClick={() => setPage('login')}
                style={{ maxWidth: 280, margin: '0 auto 12px' }}
              >
                Sign In / Create Account
              </button>
              <button 
                className="fs-detail-cta fs-detail-cta-secondary"
                onClick={() => setPage('buy')}
                style={{ maxWidth: 280, margin: '0 auto' }}
              >
                Browse Aircraft Instead
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Featured');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    manufacturer: '',
    model: '',
    year: '',
    category: '',
    rego: '',
    condition: 'Pre-Owned',
    price: '',
    state: '',
    city: '',
    ttaf: '',
    eng_hours: '',
    eng_tbo: '',
    engineType: '',
    propeller: '',
    avionics: '',
    description: ''
  });
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const lookupCASA = async () => {
    const rego = formData.rego.toUpperCase().trim();
    
    // Validate format
    if (!rego.match(/^VH-[A-Z]{3}$/)) {
      setLookupError('Invalid format. Use VH-ABC (3 letters after VH-)');
      return;
    }
    
    setIsLookingUp(true);
    setLookupError(null);
    setAutoFilled(false);
    
    try {
      const response = await fetch(`/api/casa-lookup?rego=${rego}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lookup failed');
      }
      
      // Map CASA data to form fields - comprehensive mapping
      const updates = { rego };
      if (data.manufacturer) updates.manufacturer = data.manufacturer;
      if (data.model) updates.model = data.model;
      if (data.year) updates.year = data.year.toString();
      if (data.category) updates.category = data.category;
      if (data.engineType) updates.engineType = data.engineType;
      if (data.mtow_kg) updates.mtow = data.mtow_kg.toString();
      if (data.seats) updates.seats = data.seats.toString();
      if (data.serialNumber) updates.serialNumber = data.serialNumber;
      if (data.propeller) updates.propeller = data.propeller;
      if (data.registration) updates.rego = data.registration;
      
      setFormData(prev => ({ ...prev, ...updates }));
      setAutoFilled(true);
      setShowManualForm(true);
      
      // Show toast
      setToast?.('Aircraft details found and auto-filled!');
      
    } catch (error) {
      setLookupError(error.message || 'Aircraft not found in CASA register');
      // Still show form so they can enter manually
      setShowManualForm(true);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'rego') {
      setLookupError(null);
      setAutoFilled(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && formData.rego.length >= 6) {
      lookupCASA();
    }
  };

  const validateStep1 = () => {
    const errors = [];
    if (!formData.manufacturer) errors.push('Manufacturer is required');
    if (!formData.model) errors.push('Model is required');
    if (!formData.year) errors.push('Year is required');
    if (!formData.category) errors.push('Category is required');
    if (!formData.rego) errors.push('Registration is required');
    if (!formData.condition) errors.push('Condition is required');
    if (!formData.price) errors.push('Price is required');
    if (!formData.state) errors.push('Location is required');
    return errors;
  };

  const validateStep2 = () => {
    const errors = [];
    if (!formData.ttaf) errors.push('Total Time Airframe is required');
    if (!formData.eng_hours) errors.push('Engine Hours is required');
    return errors;
  };

  const [errors, setErrors] = useState([]);

  const handleContinue = (nextStep, validateFn) => {
    const validationErrors = validateFn();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo(0, 0);
    } else {
      setErrors([]);
      setStep(nextStep);
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Sell Your Aircraft</h1>
          <p style={{ color: "var(--fs-ink-3)", marginTop: 8, fontSize: 16 }}>Reach thousands of qualified buyers across Australia</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container" style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "var(--fs-ink)" : "var(--fs-gray-200)", transition: "background 0.3s" }} />
            ))}
          </div>
          
          {step === 1 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              <h3 style={{ fontSize: 18, marginBottom: 24 }}>Step 1: Aircraft Details</h3>
              
              {errors.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--fs-radius-sm)', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Please fix the following:</p>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#dc2626' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              
              {/* CASA Rego Lookup - SLIMLINE */}
              <div style={{ marginBottom: 24 }}>
                <label className="fs-form-label">Aircraft Registration</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input 
                    className="fs-form-input" 
                    placeholder="VH-ABC"
                    value={formData.rego}
                    onChange={e => handleInputChange('rego', e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    style={{ 
                      textTransform: 'uppercase', 
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      flex: 1
                    }}
                    maxLength={6}
                  />
                  <button 
                    type="button"
                    onClick={lookupCASA}
                    disabled={isLookingUp || formData.rego.length < 6}
                    className="fs-nav-btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isLookingUp ? '...' : 'Lookup'}
                  </button>
                </div>
                
                {lookupError && (
                  <p style={{ fontSize: 12, color: 'var(--fs-red)', marginTop: 8 }}>
                    {lookupError} — <button onClick={() => setShowManualForm(true)} style={{ textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>enter manually</button>
                  </p>
                )}
                
                {autoFilled && (
                  <p style={{ fontSize: 12, color: 'var(--fs-green)', marginTop: 8 }}>
                    {Icons.check} Found in CASA — details loaded below
                  </p>
                )}
                
                {!showManualForm && !lookupError && !autoFilled && (
                  <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginTop: 8 }}>
                    Or <button onClick={() => setShowManualForm(true)} style={{ textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>skip and enter manually</button>
                  </p>
                )}
              </div>
              
              {/* Aircraft Details Form - Shows after lookup or manual entry */}
              {showManualForm && (
                <>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--fs-gray-200)'
                  }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Aircraft Details</h4>
                    {autoFilled && (
                      <span style={{ 
                        fontSize: 11, 
                        color: '#16a34a', 
                        background: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        Auto-filled from CASA
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="fs-form-group">
                      <label className="fs-form-label">Manufacturer *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.manufacturer}
                    onChange={e => handleInputChange('manufacturer', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Model *</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. SR22T, C182T"
                    value={formData.model}
                    onChange={e => handleInputChange('model', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Year *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="2020"
                    value={formData.year}
                    onChange={e => handleInputChange('year', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Category *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.category}
                    onChange={e => handleInputChange('category', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Registration *</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="VH-XXX"
                    value={formData.rego}
                    onChange={e => handleInputChange('rego', e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Condition *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.condition}
                    onChange={e => handleInputChange('condition', e.target.value)}
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Asking Price (AUD) *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="350000"
                    value={formData.price}
                    onChange={e => handleInputChange('price', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Location (State) *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              </>
            )}
              <button className="fs-form-submit" onClick={() => handleContinue(2, validateStep1)} style={{ marginTop: 16 }}>Continue to Specs</button>
            </div>
          )}
          
          {step === 2 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              <h3 style={{ fontSize: 18 }}>Step 2: Specifications & Hours</h3>
              
              {errors.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--fs-radius-sm)', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Please fix the following:</p>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#dc2626' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="fs-form-group">
                  <label className="fs-form-label">Total Time Airframe *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="Hours"
                    value={formData.ttaf}
                    onChange={e => handleInputChange('ttaf', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Engine Hours (SMOH) *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="Hours"
                    value={formData.eng_hours}
                    onChange={e => handleInputChange('eng_hours', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Engine Type</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. Lycoming IO-540"
                    value={formData.engineType}
                    onChange={e => handleInputChange('engineType', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Propeller</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. Hartzell 3-blade"
                    value={formData.propeller}
                    onChange={e => handleInputChange('propeller', e.target.value)}
                  />
                </div>
                <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="fs-form-label">Avionics</label>
                  <input
                    className="fs-form-input"
                    placeholder="e.g. Garmin G1000 NXi, GFC700 autopilot"
                    value={formData.avionics || ''}
                    onChange={e => handleInputChange('avionics', e.target.value)}
                  />
                </div>
                <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="fs-form-label">Description *</label>
                  <textarea
                    className="fs-form-textarea"
                    placeholder="Describe the aircraft condition, history, notable features..."
                    style={{ minHeight: 120 }}
                    value={formData.description || ''}
                    onChange={e => handleInputChange('description', e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                <button className="fs-form-submit" onClick={() => handleContinue(3, validateStep2)} style={{ flex: 2, marginTop: 0 }}>Continue to Photos</button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              {!user ? (
                /* LOGIN PROMPT */
                <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '50%', 
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: 28
                  }}>
                    {Icons.user}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to continue</h3>
                  <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                    Create an account or sign in to submit your aircraft listing and manage your ads.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto' }}>
                    <button 
                      className="fs-form-submit"
                      onClick={() => setPage && setPage('login')}
                      style={{ marginTop: 0 }}
                    >
                      Sign In / Create Account
                    </button>
                    <button 
                      className="fs-detail-cta fs-detail-cta-secondary"
                      onClick={() => setStep(2)}
                    >
                      Back to Edit
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginTop: 20 }}>
                    Free to list. No credit card required.
                  </p>
                </div>
              ) : (
                /* LOGGED IN - SHOW SUBMIT FORM */
                <>
                  <h3 style={{ fontSize: 18 }}>Photos & Submit</h3>
                  {submitSuccess ? (
                    <div style={{ textAlign: "center", padding: "40px 24px" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>{Icons.check}</div>
                      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Listing Submitted!</h3>
                      <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>Your listing is under review and will go live within 24 hours. You'll receive an email confirmation shortly.</p>
                      <button className="fs-form-submit" style={{ maxWidth: 220, margin: "0 auto" }} onClick={() => setPage('dashboard')}>Go to Dashboard</button>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ fontSize: 18 }}>Photos & Submit</h3>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (!files.length) return;
                        setUploadingImages(true);
                        try {
                          const tempId = `temp-${Date.now()}`;
                          const urls = await Promise.all(files.map(f => uploadImage(f, tempId)));
                          setUploadedImages(prev => [...prev, ...urls]);
                        } catch (err) {
                          setSubmitError('Image upload failed: ' + err.message);
                        } finally {
                          setUploadingImages(false);
                        }
                      }} />
                      <div style={{ border: "2px dashed var(--fs-gray-200)", borderRadius: "var(--fs-radius)", padding: 32, textAlign: "center", marginBottom: 20 }}>
                        <div style={{ color: "var(--fs-gray-400)", marginBottom: 8 }}>{Icons.camera}</div>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Upload Photos</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-400)" }}>Minimum 4 photos recommended. Include exterior, cockpit, panel, and engine bay.</p>
                        {uploadedImages.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "12px 0" }}>
                            {uploadedImages.map((url, i) => (
                              <div key={i} style={{ position: "relative" }}>
                                <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--fs-radius)", border: "2px solid var(--fs-green)" }} />
                                <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button className="fs-detail-cta fs-detail-cta-secondary" style={{ maxWidth: 200, margin: "16px auto 0" }} onClick={() => fileInputRef.current?.click()} disabled={uploadingImages}>
                          {uploadingImages ? "Uploading..." : `Choose Files${uploadedImages.length > 0 ? ` (${uploadedImages.length} added)` : ''}`}
                        </button>
                      </div>
                      <div style={{ background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius)", padding: 20, marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Listing Plan</h4>
                        {[
                          { name: "Basic", price: "Free", features: ["30-day listing", "Up to 8 photos", "Standard placement"] },
                          { name: "Featured", price: "$149", features: ["60-day listing", "Up to 20 photos", "Homepage featured", "Priority in search"], recommended: true },
                          { name: "Premium", price: "$299", features: ["90-day listing", "Unlimited photos", "Top placement", "Dedicated support"] },
                        ].map(plan => (
                          <label key={plan.name} style={{ display: "flex", gap: 12, padding: "12px", marginBottom: 8, borderRadius: "var(--fs-radius-sm)", border: selectedPlan === plan.name ? "2px solid var(--fs-ink)" : "1px solid var(--fs-gray-200)", cursor: "pointer", background: "white" }}>
                            <input type="radio" name="plan" checked={selectedPlan === plan.name} onChange={() => setSelectedPlan(plan.name)} style={{ marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{plan.name}</span>
                                <span style={{ fontWeight: 700, color: "var(--fs-ink)" }}>{plan.price}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--fs-gray-500)", marginTop: 4 }}>{plan.features.join(" · ")}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {submitError && (
                        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--fs-radius-sm)", marginBottom: 12, fontSize: 13, color: "#dc2626" }}>{submitError}</div>
                      )}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                        <button
                          className="fs-form-submit"
                          style={{ flex: 2, marginTop: 0, opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                          disabled={submitting}
                          onClick={async () => {
                            setSubmitting(true);
                            setSubmitError(null);
                            try {
                              await createListing({
                                title: `${formData.year} ${formData.manufacturer} ${formData.model}`.trim(),
                                manufacturer: formData.manufacturer,
                                model: formData.model,
                                year: parseInt(formData.year),
                                category: formData.category,
                                rego: formData.rego,
                                condition: formData.condition,
                                price: parseInt(formData.price),
                                state: formData.state,
                                city: formData.city || formData.state,
                                ttaf: parseInt(formData.ttaf) || 0,
                                eng_hours: parseInt(formData.eng_hours) || null,
                                avionics: formData.avionics,
                                description: formData.description,
                                images: uploadedImages,
                                specs: { engine: formData.engineType, propeller: formData.propeller },
                                featured: selectedPlan !== 'Basic',
                              }, user.id);
                              setSubmitSuccess(true);
                            } catch (err) {
                              setSubmitError(err.message || 'Failed to submit listing. Please try again.');
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                        >
                          {submitting ? "Submitting..." : "Submit Listing for Review"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

const DealersPage = ({ onSelectDealer }) => {
  const { dealers: dealersFromDB, loading } = useDealers();
  const dealers = dealersFromDB.length > 0 ? dealersFromDB : DEALERS;
  const [applyForm, setApplyForm] = useState({ name: '', email: '', business: '', phone: '' });
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [showApply, setShowApply] = useState(false);

  const handleApply = async () => {
    if (!applyForm.name || !applyForm.email || !applyForm.business) { setApplyError('Please fill in all required fields.'); return; }
    setApplying(true); setApplyError(null);
    try {
      await submitLead('contact', { name: applyForm.name, email: applyForm.email, phone: applyForm.phone, message: `[DEALER APPLICATION] Business: ${applyForm.business}` });
      setApplied(true);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit. Please try again.');
    } finally { setApplying(false); }
  };

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Verified Dealers</h1>
          <p style={{ color: "var(--fs-ink-3)", marginTop: 8, fontSize: 16 }}>Trusted aviation businesses across Australia</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
            {loading ? [1,2,3,4,5,6].map(i => <div key={i} style={{ height: 160, background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />) :
              dealers.map(d => (
                <div key={d.id} className="fs-dealer-card" onClick={() => onSelectDealer && onSelectDealer(d)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 0, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", marginBottom: 12 }}>
                    <div className="fs-dealer-avatar" style={{ width: 56, height: 56, fontSize: 16 }}>{d.logo}</div>
                    <div style={{ flex: 1 }}>
                      <div className="fs-dealer-name" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
                        {d.name}
                        <span style={{ color: "var(--fs-green)", display: "flex", alignItems: "center" }}>{Icons.shield}</span>
                      </div>
                      <div className="fs-dealer-loc">{Icons.location} {d.location}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, width: "100%", paddingTop: 12, borderTop: "1px solid var(--fs-gray-100)" }}>
                    <span>{d.listings} active listings</span>
                    <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>
                    <span>Est. {d.since}</span>
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{ textAlign: "center", marginTop: 40, padding: "32px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius-lg)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Become a Flightsales Dealer</h3>
            <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 16, maxWidth: 500, margin: "0 auto 16px" }}>
              Get a branded storefront, lead management tools, and access to Australia's largest aviation audience.
            </p>
            {applied ? (
              <p style={{ color: "var(--fs-ink)", fontWeight: 600 }}>✓ Application received — we'll be in touch within 2 business days.</p>
            ) : showApply ? (
              <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "left" }}>
                {applyError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{applyError}</p>}
                <div className="fs-form-group"><label className="fs-form-label">Your Name *</label><input className="fs-form-input" value={applyForm.name} onChange={e => setApplyForm(f => ({...f, name: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Business Name *</label><input className="fs-form-input" value={applyForm.business} onChange={e => setApplyForm(f => ({...f, business: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Email *</label><input className="fs-form-input" type="email" value={applyForm.email} onChange={e => setApplyForm(f => ({...f, email: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Phone</label><input className="fs-form-input" type="tel" value={applyForm.phone} onChange={e => setApplyForm(f => ({...f, phone: e.target.value}))} /></div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="fs-form-submit" onClick={handleApply} disabled={applying} style={{ opacity: applying ? 0.7 : 1 }}>{applying ? 'Submitting...' : 'Submit Application'}</button>
                  <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setShowApply(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="fs-form-submit" style={{ maxWidth: 240, margin: "0 auto" }} onClick={() => setShowApply(true)}>Apply Now</button>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

// DEALER DETAIL — storefront page with all the dealer's listings
const DealerDetailPage = ({ dealer, onBack, setSelectedListing, savedIds, onSave }) => {
  const { aircraft: dealerListings, loading } = useAircraft({ dealerId: dealer?.id });
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactErr, setContactErr] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: `Hi, I'd like to know more about the aircraft you have available at ${dealer?.name || 'your dealership'}.` });

  if (!dealer) return null;
  // Filter sample listings to dealer if no DB results yet
  const listings = dealerListings.length > 0
    ? dealerListings
    : SAMPLE_LISTINGS.filter(l => l.dealer_id === dealer.id);

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



const NewsPage = () => {
  const { articles: dbArticles, loading } = useNews(20);
  const articles = dbArticles.length > 0 ? dbArticles : NEWS_ARTICLES;
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Market', 'Regulation', 'Industry', 'Technology', 'Reviews'];
  const filteredArticles = activeCategory === 'All' ? articles : articles.filter(a => a.category === activeCategory);
  
  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Aviation News</h1>
          <p style={{ color: "var(--fs-ink-3)", marginTop: 8, fontSize: 16 }}>Market reports, CASA updates, and industry news</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container" style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`fs-cat-pill${activeCategory === cat ? ' active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="fs-news-card" style={{ marginBottom: 16, height: 120, background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s ease-in-out infinite" }} />)
          ) : filteredArticles.map(a => (
            <div key={a.id} className="fs-news-card" style={{ marginBottom: 16 }}>
              <span className={`fs-news-tag ${a.category.toLowerCase()}`}>{a.category}</span>
              <div className="fs-news-title" style={{ fontSize: 20 }}>{a.title}</div>
              <div className="fs-news-excerpt">{a.excerpt}</div>
              <div className="fs-news-footer">
                <span>{a.date}</span>
                <span>{a.read_time} min read</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

const AboutPage = () => (
  <>
    <div className="fs-about-hero" style={{ padding: "72px 0" }}>
      <div className="fs-container">
        <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, marginBottom: 12 }}>About Flightsales</h1>
        <p style={{ color: "var(--fs-ink-3)", maxWidth: 600, margin: "0 auto", fontSize: 16, lineHeight: 1.5 }}>
          We're building Australia's most trusted aircraft marketplace. A place where pilots, owners, and dealers can buy and sell with transparency, confidence, and fair pricing.
        </p>
      </div>
    </div>
    <section className="fs-section">
      <div className="fs-container">
        <div className="fs-about-grid">
          {[
            { title: "Transparency First", desc: "Every listing has structured data — hours, specs, maintenance history. No more guessing from vague classifieds." },
            { title: "Verified Dealers", desc: "We vet every dealer on the platform. Look for the verified badge for added confidence." },
            { title: "Market Intelligence", desc: "Our valuation tools and market reports give you the data to make informed decisions." },
            { title: "Built by Pilots", desc: "We're aviators ourselves. We know what matters when you're buying or selling an aircraft." },
          ].map((c, i) => (
            <div key={i} className="fs-about-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.name || !form.email || !form.message) { setError('Please fill in your name, email, and message.'); return; }
    setSending(true); setError(null);
    try {
      await submitLead('contact', { name: form.name, email: form.email, message: `[${form.subject}] ${form.message}` });
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

const LoginPage = ({ setPage, signIn, signUp, signInWithGoogle, resetPassword, loginDemo }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Google OAuth redirects — page will reload
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (!email) throw new Error('Enter your email');
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset link.');
    } finally { setLoading(false); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        setPage('dashboard');
      } else if (mode === 'register') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        await signUp(email, password, {
          full_name: fullName,
          phone,
          account_type: accountType
        });
        setRegisterSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fs-login-shell">
      <aside className="fs-login-brand">
        <div className="fs-login-brand-inner">
          <div className="fs-login-brand-wordmark">FlightSales</div>
          <p className="fs-login-brand-tagline">Australia's marketplace for aircraft.</p>
        </div>
      </aside>
      <div className="fs-login-form-col">
        <div className="fs-login-form-inner">
        {/* Back Button */}
        <button 
          onClick={() => setPage('home')}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 6, 
            fontSize: 14, 
            color: "var(--fs-gray-500)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 24,
            padding: "8px 0",
            transition: "color 0.15s ease"
          }}
          onMouseEnter={e => e.target.style.color = "var(--fs-gray-900)"}
          onMouseLeave={e => e.target.style.color = "var(--fs-gray-500)"}
        >
          <span style={{ fontSize: 12 }}>←</span> Back to home
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 28, marginBottom: 8, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 15, color: "var(--fs-gray-500)", lineHeight: 1.5 }}>
            {mode === 'login' ? 'Sign in to manage your listings and saved aircraft' : 'Join Flightsales to buy and sell aircraft across Australia'}
          </p>
        </div>

        <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-lg)", padding: "32px", borderRadius: "var(--fs-radius)", background: "white" }}>
          {/* Google Auth */}
          <button 
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "14px", 
              border: "1px solid var(--fs-gray-200)", 
              borderRadius: "var(--fs-radius-sm)", 
              background: "white", 
              fontSize: 15, 
              fontWeight: 600, 
              cursor: loading ? "not-allowed" : "pointer", 
              fontFamily: "var(--fs-font)", 
              marginBottom: 24, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 12,
              opacity: loading ? 0.6 : 1,
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={e => { if (!loading) { e.target.style.borderColor = "var(--fs-gray-400)"; e.target.style.background = "var(--fs-gray-50)"; }}}
            onMouseLeave={e => { e.target.style.borderColor = "var(--fs-gray-200)"; e.target.style.background = "white"; }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ 
                  width: 18, 
                  height: 18, 
                  border: "2px solid var(--fs-gray-300)", 
                  borderTopColor: "var(--fs-gray-600)", 
                  borderRadius: "50%", 
                  animation: "fs-spin 1s linear infinite",
                  display: "inline-block"
                }} />
                Connecting...
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </>
            )}
          </button>

          <div style={{ textAlign: "center", color: "var(--fs-gray-400)", fontSize: 13, margin: "20px 0", position: "relative" }}>
            <span style={{ background: "white", padding: "0 12px", position: "relative", zIndex: 1 }}>or continue with email</span>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--fs-gray-200)" }} />
          </div>

          {error && (
            <div className="fs-form-error" style={{ 
              padding: "12px 16px", 
              background: "#fef2f2", 
              borderRadius: "var(--fs-radius-sm)", 
              marginBottom: 20,
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          {mode === 'forgot' ? (
            <form onSubmit={handleResetPassword}>
              {resetSent ? (
                <div style={{ padding: "32px 20px", textAlign: "center", background: "var(--fs-bg-2)", borderRadius: "var(--fs-radius)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--fs-ink)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>{Icons.check}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>Check your email</h3>
                  <p style={{ fontSize: 14, color: "var(--fs-ink-3)" }}>We've sent a password reset link to <strong>{email}</strong>. The link expires in 1 hour.</p>
                  <button type="button" onClick={() => { setMode('login'); setResetSent(false); setError(null); }} style={{ marginTop: 16, background: "none", border: "none", color: "var(--fs-ink)", fontSize: 14, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: "var(--fs-ink-3)", marginBottom: 16 }}>Enter your email and we'll send you a link to reset your password.</p>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Email *</label>
                    <input className="fs-form-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={{ fontSize: 15 }} />
                  </div>
                  <button type="submit" className="fs-form-submit" disabled={loading || !email} style={{ opacity: loading || !email ? 0.6 : 1 }}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                  <p style={{ fontSize: 14, textAlign: "center", marginTop: 20, color: "var(--fs-ink-3)" }}>
                    Remembered it?{' '}
                    <button type="button" onClick={() => { setMode('login'); setError(null); }} style={{ background: "none", border: "none", color: "var(--fs-ink)", fontWeight: 600, fontSize: 14, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                      Back to sign in
                    </button>
                  </p>
                </>
              )}
            </form>
          ) : (
          <form onSubmit={handleEmailAuth}>
            {mode === 'register' && (
              <>
                <div className="fs-form-group">
                  <label className="fs-form-label">Account Type *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div
                      onClick={() => setAccountType('private')}
                      style={{ 
                        padding: "14px 12px", 
                        borderRadius: "var(--fs-radius-sm)",
                        border: accountType === 'private' ? "2px solid var(--fs-ink)" : "1px solid var(--fs-gray-200)",
                        background: accountType === 'private' ? "#eff6ff" : "white",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 20 }}>👤</span>
                      <span style={{ fontSize: 14, fontWeight: accountType === 'private' ? 600 : 400, color: accountType === 'private' ? "var(--fs-ink)" : "var(--fs-gray-700)" }}>
                        Private Seller
                      </span>
                      <span style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>Individual owner</span>
                    </div>
                    <div
                      onClick={() => setAccountType('dealer')}
                      style={{ 
                        padding: "14px 12px", 
                        borderRadius: "var(--fs-radius-sm)",
                        border: accountType === 'dealer' ? "2px solid var(--fs-ink)" : "1px solid var(--fs-gray-200)",
                        background: accountType === 'dealer' ? "#eff6ff" : "white",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 20 }}>🏢</span>
                      <span style={{ fontSize: 14, fontWeight: accountType === 'dealer' ? 600 : 400, color: accountType === 'dealer' ? "var(--fs-ink)" : "var(--fs-gray-700)" }}>
                        Dealer
                      </span>
                      <span style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>Business account</span>
                    </div>
                  </div>
                  <input type="hidden" name="accountType" value={accountType} />
                </div>

                <div className="fs-form-group">
                  <label className="fs-form-label">Full Name *</label>
                  <input 
                    className="fs-form-input" 
                    type="text" 
                    placeholder="John Smith"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required={mode === 'register'}
                    style={{ fontSize: 15 }}
                  />
                </div>

                <div className="fs-form-group">
                  <label className="fs-form-label">Phone Number</label>
                  <input 
                    className="fs-form-input" 
                    type="tel" 
                    placeholder="04XX XXX XXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ fontSize: 15 }}
                  />
                </div>
              </>
            )}

            <div className="fs-form-group">
              <label className="fs-form-label">Email *</label>
              <input 
                className="fs-form-input" 
                type="email" 
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ fontSize: 15 }}
              />
            </div>

            <div className="fs-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="fs-form-label" style={{ marginBottom: 0 }}>Password *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setPassword(''); }}
                    style={{ background: "none", border: "none", color: "var(--fs-ink)", fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                className="fs-form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? "current-password" : "new-password"}
                style={{ fontSize: 15 }}
              />
              {mode === 'register' && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: password.length >= 8 ? "var(--fs-green)" : password.length > 0 ? "var(--fs-amber)" : "var(--fs-line-2)",
                    transition: "all 0.2s"
                  }} />
                  <span style={{ fontSize: 11, color: password.length >= 8 ? "var(--fs-green)" : password.length > 0 ? "var(--fs-amber)" : "var(--fs-ink-4)" }}>
                    {password.length >= 8 ? "Password looks good" : password.length > 0 ? "At least 8 characters required" : "Must be at least 8 characters"}
                  </span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="fs-form-submit"
              disabled={loading || (mode === 'register' && password.length < 8)}
              style={{ 
                opacity: loading || (mode === 'register' && password.length < 8) ? 0.6 : 1,
                cursor: loading || (mode === 'register' && password.length < 8) ? "not-allowed" : "pointer",
                marginTop: 8
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ 
                    width: 16, 
                    height: 16, 
                    border: "2px solid rgba(255,255,255,0.3)", 
                    borderTopColor: "white", 
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite",
                    display: "inline-block"
                  }} />
                  Please wait...
                </span>
              ) : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
          )}

          {mode !== 'forgot' && (
          <p style={{ fontSize: 14, textAlign: "center", marginTop: 24, color: "var(--fs-gray-500)" }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setPassword('');
              }}
              style={{ 
                color: "var(--fs-ink)", 
                fontWeight: 600, 
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: "4px 8px",
                fontSize: 14,
                borderRadius: "var(--fs-radius-sm)",
                transition: "all 0.15s ease",
                marginLeft: 4
              }}
              onMouseEnter={e => e.target.style.background = "var(--fs-gray-100)"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
          )}

          {mode === 'register' && !registerSuccess && (
            <p style={{ fontSize: 12, textAlign: "center", marginTop: 20, color: "var(--fs-gray-400)", lineHeight: 1.6, padding: "0 16px" }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              <br />Dealer accounts require verification before listings go live.
            </p>
          )}
        </div>

        {registerSuccess && (
          <div style={{ marginTop: 24, padding: "20px", background: "#d1fae5", borderRadius: "var(--fs-radius)", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✉️</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#065f46", marginBottom: 4 }}>Check your email!</p>
            <p style={{ fontSize: 13, color: "#065f46" }}>We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          </div>
        )}

        {/* Demo Access */}
        <div style={{ marginTop: 32, padding: "24px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius)", border: "1px dashed var(--fs-gray-300)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fs-gray-700)", marginBottom: 12, textAlign: "center" }}>Demo Access (No login required)</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => loginDemo('private')}
              style={{
                flex: 1,
                minWidth: 120,
                padding: "10px 16px",
                background: "white",
                border: "1px solid var(--fs-gray-200)",
                borderRadius: "var(--fs-radius-sm)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                color: "var(--fs-gray-700)"
              }}
            >
              👤 Private Seller
            </button>
            <button
              onClick={() => loginDemo('dealer')}
              style={{
                flex: 1,
                minWidth: 120,
                padding: "10px 16px",
                background: "white",
                border: "1px solid var(--fs-gray-200)",
                borderRadius: "var(--fs-radius-sm)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                color: "var(--fs-gray-700)"
              }}
            >
              🏢 Dealer
            </button>
            <button
              onClick={() => loginDemo('admin')}
              style={{
                flex: 1,
                minWidth: 120,
                padding: "10px 16px",
                background: "white",
                border: "1px solid var(--fs-gray-200)",
                borderRadius: "var(--fs-radius-sm)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                color: "var(--fs-gray-700)"
              }}
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({ user, setPage, signOut, savedIds, savedListings, onSave, onSelectListing }) => {
  // Note: caller (App) gates rendering so user is always defined and not an admin here.
  const isDealer = user?.role === 'dealer';
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('overview');
  const [editProfile, setEditProfile] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || ''
  });

  const { listings: myListingsRaw, loading: listingsLoading, updateListingStatus, deleteListing } = useMyListings(user.id);
  const { enquiries: myEnquiriesRaw, loading: enquiriesLoading, updateStatus: updateEnquiryStatus } = useMyEnquiries(user.id);
  const { updateProfile } = useProfile(user.id);

  const savedAircraft = savedListings || [];

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  // Normalise DB rows into the shape the existing UI expects.
  // DB row → { id, name, email, phone, message, status, created_at, aircraft: { id, title, ... } }
  // UI expects → { id, from, email, phone, message, status, date, aircraft: <title string>, aircraftId, hasReplied }
  const myEnquiries = useMemo(() => (myEnquiriesRaw || []).map(e => ({
    id: e.id,
    from: e.name || 'Unknown',
    email: e.email,
    phone: e.phone || '',
    message: e.message || '',
    status: e.status || 'new',
    date: e.created_at,
    aircraft: e.aircraft?.title || '(Listing removed)',
    aircraftId: e.aircraft?.id || e.aircraft_id,
    hasReplied: e.status === 'replied',
    raw: e,
  })), [myEnquiriesRaw]);

  // Listings: derive image, daysListed, views (0 until analytics table), enquiries count from real data
  const myListings = useMemo(() => {
    const enquiryCounts = (myEnquiriesRaw || []).reduce((acc, e) => {
      const key = e.aircraft?.id || e.aircraft_id;
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return (myListingsRaw || []).map(l => ({
      ...l,
      image: (Array.isArray(l.images) && l.images[0]) || null,
      daysListed: l.created_at ? Math.max(1, Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000)) : 0,
      views: l.view_count || 0,
      enquiries: enquiryCounts[l.id] || 0,
    }));
  }, [myListingsRaw, myEnquiriesRaw]);

  // Recent activity feed: derive from real enquiries + listings (no more undefined `activities`)
  const activities = useMemo(() => {
    const fromEnquiries = (myEnquiriesRaw || []).slice(0, 5).map(e => ({
      id: `enq-${e.id}`,
      type: 'enquiry',
      icon: Icons.mail,
      message: `${e.name || 'Someone'} enquired about ${e.aircraft?.title || 'your listing'}`,
      time: formatTimeAgo(e.created_at),
      ts: new Date(e.created_at).getTime(),
    }));
    const fromListings = (myListingsRaw || []).slice(0, 3).map(l => ({
      id: `lst-${l.id}`,
      type: 'listing',
      icon: Icons.plane,
      message: `${l.title || 'Listing'} ${l.status === 'active' ? 'is live' : `is ${l.status || 'pending'}`}`,
      time: formatTimeAgo(l.created_at),
      ts: new Date(l.created_at || 0).getTime(),
    }));
    return [...fromEnquiries, ...fromListings].sort((a, b) => b.ts - a.ts).slice(0, 6);
  }, [myEnquiriesRaw, myListingsRaw]);

  const stats = {
    totalViews: myListings.reduce((sum, l) => sum + (l.views || 0), 0),
    totalEnquiries: myEnquiries.length,
    activeListings: myListings.filter(l => l.status === 'active').length,
    pendingListings: myListings.filter(l => l.status === 'pending').length,
    totalWatchers: 0,
    newEnquiries: myEnquiries.filter(e => e.status === 'new').length,
  };

  const handleLogout = async () => {
    await signOut();
    setPage('home');
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
        location: profileData.location
      });
      setEditProfile(false);
    } catch (err) {
      console.error('Profile save failed:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEnquiryStatusChange = (enquiryId, newStatus) => {
    updateEnquiryStatus(enquiryId, newStatus);
    if (selectedEnquiry?.id === enquiryId) {
      setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleReplySubmit = (enquiryId) => {
    if (!replyText.trim()) return;
    setReplyText('');
    updateEnquiryStatus(enquiryId, 'replied');
  };

  const handleMarkSpam = (enquiryId) => {
    updateEnquiryStatus(enquiryId, 'spam');
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: { bg: '#dcfce7', color: '#166534', label: 'New' },
      contacted: { bg: '#dbeafe', color: '#1e40af', label: 'Contacted' },
      negotiating: { bg: '#fef3c7', color: '#92400e', label: 'Negotiating' },
      sold: { bg: '#e0e7ff', color: '#3730a3', label: 'Sold' },
      archived: { bg: '#f3f4f6', color: '#6b7280', label: 'Archived' },
      spam: { bg: '#fee2e2', color: '#991b1b', label: 'Spam' }
    };
    const s = styles[status] || styles.new;
    return (
      <span style={{ 
        padding: "4px 12px", 
        borderRadius: 4, 
        fontSize: 12,
        fontWeight: 500,
        background: s.bg,
        color: s.color
      }}>
        {s.label}
      </span>
    );
  };

  // Local state for sections that don't have a DB table yet — start empty so the
  // UI shows real empty states instead of seeded fakes. Wire to DB when tables land.
  const [savedSearches, setSavedSearches] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [drafts, setDrafts] = useState([]);

  const [notifications, setNotifications] = useState({
    emailEnquiries: true,
    emailOffers: true,
    emailSavedSearch: true,
    smsEnquiries: false,
    smsOffers: false,
    pushNotifications: true,
    marketingEmails: false,
  });

  const [discounts] = useState([]);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Icons.home },
    { section: 'My Selling', items: [
      { id: 'listings', label: 'My Aircraft', icon: Icons.plane, count: myListings.length },
      { id: 'drafts', label: 'Manage Ad or Draft', icon: Icons.file, count: drafts.length },
      { id: 'receivedOffers', label: 'Manage Your Offers', icon: Icons.tag, count: receivedOffers.length },
    ]},
    { section: 'My Buying', items: [
      { id: 'saved', label: 'Saved Aircraft', icon: Icons.heart, count: savedAircraft.length },
      { id: 'savedSearches', label: 'Saved Searches', icon: Icons.search, count: savedSearches.length },
      { id: 'myOffers', label: 'My Instant Offers', icon: Icons.dollar, count: myOffers.length },
    ]},
    { section: 'Messages', items: [
      { id: 'enquiries', label: 'Messages', icon: Icons.mail, count: stats.newEnquiries },
    ]},
    { section: 'Account', items: [
      { id: 'profile', label: 'Profile', icon: Icons.user },
      { id: 'notifications', label: 'Notification Preferences', icon: Icons.bell },
      { id: 'discounts', label: 'Discounts', icon: Icons.gift, count: discounts.filter(d => !d.used).length },
    ]},
  ];

  return (
    <>
      {/* Header */}
      <div className="fs-about-hero" style={{ padding: "40px 0" }}>
        <div className="fs-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'User')}&background=0a0a0a&color=fff`}
                  alt={user.full_name || user.email}
                  style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid white" }}
                />
                {isDealer && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#10b981',
                    color: 'white',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: "var(--fs-radius-lg)",
                    fontWeight: 600
                  }}>✓</span>
                )}
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 28, marginBottom: 6 }}>
                  Welcome back, {user.full_name?.split(' ')[0]}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
                  {isDealer ? 'Verified Dealer Account' : 'Private Seller'} • Member since 2026
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                className="fs-nav-btn-primary"
                onClick={() => setPage('sell')}
                style={{ background: 'white', color: 'var(--fs-gray-900)' }}
              >
                + List Aircraft
              </button>
              <button 
                onClick={handleLogout}
                style={{ 
                  padding: "12px 20px", 
                  background: "rgba(255,255,255,0.1)", 
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "var(--fs-radius-sm)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="fs-section" style={{ padding: "32px 0" }}>
        <div className="fs-container">
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }}>
            {/* Sidebar */}
            <div>
              <div className="fs-detail-specs" style={{ padding: 0, overflow: "hidden", borderRadius: 12 }}>
                <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)" }}>
                  <p style={{ fontSize: 12, color: "var(--fs-gray-500)", marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account Type</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{isDealer ? 'Verified Dealer' : 'Private Seller'}</p>
                    {isDealer && <span style={{ color: '#10b981' }}>✓</span>}
                  </div>
                </div>
                
                <nav style={{ padding: "8px 0" }}>
                  {sidebarItems.map((section, idx) => (
                    <div key={idx}>
                      {section.section && (
                        <p style={{ 
                          fontSize: 10, 
                          color: 'var(--fs-gray-400)', 
                          textTransform: 'uppercase', 
                          letterSpacing: 0.8,
                          padding: '16px 20px 8px',
                          fontWeight: 600
                        }}>
                          {section.section}
                        </p>
                      )}
                      {section.items ? section.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setSelectedEnquiry(null); }}
                          style={{
                            width: "100%",
                            padding: "10px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: activeTab === item.id ? '#eff6ff' : 'none',
                            border: "none",
                            borderLeft: activeTab === item.id ? '3px solid var(--fs-ink)' : '3px solid transparent',
                            cursor: "pointer",
                            fontSize: 14,
                            color: activeTab === item.id ? "var(--fs-ink)" : "var(--fs-gray-700)",
                            fontWeight: activeTab === item.id ? 600 : 400,
                            textAlign: "left",
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ color: activeTab === item.id ? "var(--fs-ink)" : "var(--fs-gray-400)", width: 20 }}>{item.icon}</span>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.count > 0 && (
                            <span style={{ 
                              background: activeTab === item.id ? 'var(--fs-ink)' : 'var(--fs-gray-200)', 
                              color: activeTab === item.id ? 'white' : 'var(--fs-gray-600)', 
                              fontSize: 11, 
                              padding: '2px 8px', 
                              borderRadius: "var(--fs-radius-lg)",
                              fontWeight: 600
                            }}>
                              {item.count}
                            </span>
                          )}
                        </button>
                      )) : (
                        <button
                          key={section.id}
                          onClick={() => { setActiveTab(section.id); setSelectedEnquiry(null); }}
                          style={{
                            width: "100%",
                            padding: "10px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: activeTab === section.id ? '#eff6ff' : 'none',
                            border: "none",
                            borderLeft: activeTab === section.id ? '3px solid var(--fs-ink)' : '3px solid transparent',
                            cursor: "pointer",
                            fontSize: 14,
                            color: activeTab === section.id ? "var(--fs-ink)" : "var(--fs-gray-700)",
                            fontWeight: activeTab === section.id ? 600 : 400,
                            textAlign: "left",
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ color: activeTab === section.id ? "var(--fs-ink)" : "var(--fs-gray-400)", width: 20 }}>{section.icon}</span>
                          <span style={{ flex: 1 }}>{section.label}</span>
                          {section.count > 0 && (
                            <span style={{ 
                              background: activeTab === section.id ? 'var(--fs-ink)' : 'var(--fs-gray-200)', 
                              color: activeTab === section.id ? 'white' : 'var(--fs-gray-600)', 
                              fontSize: 11, 
                              padding: '2px 8px', 
                              borderRadius: "var(--fs-radius-lg)",
                              fontWeight: 600
                            }}>
                              {section.count}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Sign Out */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--fs-gray-100)', marginTop: 8 }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: 'none',
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "var(--fs-gray-500)",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ color: "var(--fs-gray-400)", width: 20 }}>{Icons.logout}</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </nav>

                {isDealer && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid var(--fs-gray-100)", background: '#fafafa' }}>
                    <p style={{ fontSize: 11, color: "var(--fs-gray-500)", marginBottom: 8 }}>Plan: Professional</p>
                    <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ height: '100%', width: '65%', background: 'var(--fs-ink)', borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>13 of 20 listings used</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  {/* Stats Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Total Views', value: stats.totalViews.toLocaleString(), change: stats.totalViews === 0 ? 'Tracking soon' : null, color: 'var(--fs-ink)' },
                      { label: 'Enquiries', value: stats.totalEnquiries, change: stats.newEnquiries > 0 ? `${stats.newEnquiries} new` : (stats.totalEnquiries > 0 ? 'All read' : null), color: 'var(--fs-green)' },
                      { label: 'Active Listings', value: stats.activeListings, change: stats.pendingListings > 0 ? `${stats.pendingListings} pending` : null, color: 'var(--fs-gray-900)' },
                      { label: 'Saved by buyers', value: stats.totalWatchers, change: null, color: 'var(--fs-amber)' },
                    ].map((stat, i) => (
                      <div key={i} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                        <p style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-500)", marginBottom: 4 }}>{stat.label}</p>
                        {stat.change && <p style={{ fontSize: 11, color: "var(--fs-gray-500)", fontWeight: 500 }}>{stat.change}</p>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                    {/* Recent Activity */}
                    <div className="fs-detail-specs" style={{ padding: 0, borderRadius: "var(--fs-radius-lg)", overflow: 'hidden' }}>
                      <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Activity</h3>
                        <button style={{ fontSize: 13, color: 'var(--fs-ink)', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                      </div>
                      <div style={{ padding: "8px 0" }}>
                        {activities.map(activity => (
                          <div key={activity.id} style={{ padding: "16px 20px", display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: "1px solid var(--fs-gray-50)" }}>
                            <div style={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: "var(--fs-radius)", 
                              background: activity.type === 'enquiry' ? '#dcfce7' : activity.type === 'alert' ? '#fef3c7' : '#eff6ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: activity.type === 'enquiry' ? '#166534' : activity.type === 'alert' ? '#92400e' : 'var(--fs-ink)',
                              flexShrink: 0
                            }}>
                              {activity.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, marginBottom: 2 }}>{activity.message}</p>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <button 
                            onClick={() => setPage('sell')}
                            style={{ 
                              padding: "12px 16px", 
                              background: "var(--fs-gray-900)", 
                              color: "white",
                              border: "none",
                              borderRadius: "var(--fs-radius)",
                              fontSize: 14,
                              cursor: "pointer",
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10
                            }}
                          >
                            <span>+</span> List New Aircraft
                          </button>
                          <button 
                            onClick={() => setActiveTab('enquiries')}
                            style={{ 
                              padding: "12px 16px", 
                              background: "var(--fs-gray-100)", 
                              color: "var(--fs-gray-900)",
                              border: "none",
                              borderRadius: "var(--fs-radius)",
                              fontSize: 14,
                              cursor: "pointer",
                              textAlign: 'left'
                            }}
                          >
                            {stats.newEnquiries > 0 ? `📬 ${stats.newEnquiries} New Enquiries` : '📬 View Enquiries'}
                          </button>
                        </div>
                      </div>

                      {/* Tips Card */}
                      <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>💡 Selling Tip</h3>
                        <p style={{ fontSize: 13, color: 'var(--fs-gray-600)', lineHeight: 1.5 }}>
                          Aircraft with 10+ photos get 3x more enquiries. Add more photos to your listings to increase visibility.
                        </p>
                        <button 
                          onClick={() => setActiveTab('listings')}
                          style={{ 
                            marginTop: 12,
                            fontSize: 13, 
                            color: 'var(--fs-ink)', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Update Listings →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* LISTINGS TAB - TABLE VIEW */}
              {activeTab === 'listings' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>My Listings</h3>
                    <button 
                      className="fs-nav-btn-primary"
                      onClick={() => setPage('sell')}
                    >
                      + Add Listing
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No active listings</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                        Get started by listing your first aircraft. It only takes a few minutes and you'll reach thousands of qualified buyers.
                      </p>
                      <button 
                        className="fs-nav-btn-primary"
                        onClick={() => setPage('sell')}
                        style={{ fontSize: 15, padding: '14px 28px' }}
                      >
                        List Your Aircraft
                      </button>
                    </div>
                  ) : (
                    <div className="fs-detail-specs" style={{ padding: 0, borderRadius: "var(--fs-radius-lg)", overflow: 'hidden' }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--fs-gray-200)", background: '#fafafa' }}>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Aircraft</th>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Price</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Views</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Enquiries</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                            <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myListings.map(listing => (
                            <tr key={listing.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                              <td style={{ padding: "16px" }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  {listing.image ? (
                                    <img src={listing.image} alt={listing.title} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                  ) : (
                                    <div style={{ width: 60, height: 40, borderRadius: 6, background: 'var(--fs-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fs-gray-400)', fontSize: 16 }}>{Icons.plane}</div>
                                  )}
                                  <div>
                                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{listing.title}</p>
                                    <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{listing.daysListed} {listing.daysListed === 1 ? 'day' : 'days'} listed</p>
                                  </div>
                                  {listing.featured && (
                                    <span style={{ 
                                      padding: "2px 8px", 
                                      borderRadius: 4, 
                                      fontSize: 10,
                                      background: '#fef3c7',
                                      color: '#92400e',
                                      fontWeight: 600
                                    }}>FEATURED</span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "16px", fontWeight: 600 }}>${listing.price.toLocaleString()}</td>
                              <td style={{ padding: "16px", textAlign: "center" }}>{listing.views.toLocaleString()}</td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <span style={{ 
                                  padding: "4px 10px", 
                                  borderRadius: "var(--fs-radius-lg)", 
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: listing.enquiries > 0 ? '#dcfce7' : 'transparent',
                                  color: listing.enquiries > 0 ? '#166534' : 'var(--fs-gray-500)'
                                }}>
                                  {listing.enquiries}
                                </span>
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <span style={{ 
                                  padding: "4px 12px", 
                                  borderRadius: 4, 
                                  fontSize: 12, 
                                  fontWeight: 500,
                                  background: listing.status === 'active' ? '#dcfce7' : '#fef3c7',
                                  color: listing.status === 'active' ? '#166534' : '#92400e',
                                  textTransform: 'capitalize'
                                }}>
                                  {listing.status}
                                </span>
                              </td>
                              <td style={{ padding: "16px", textAlign: "right" }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button style={{ padding: "6px 12px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Edit</button>
                                  <button style={{ padding: "6px 12px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Boost</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* SAVED AIRCRAFT TAB */}
              {activeTab === 'saved' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Saved Aircraft</h3>
                  {savedAircraft.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "48px", textAlign: "center" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>{Icons.heart}</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No saved aircraft</h3>
                      <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>
                        Browse our listings and save aircraft you're interested in.
                      </p>
                      <button 
                        className="fs-nav-btn-primary"
                        onClick={() => setPage('buy')}
                      >
                        Browse Aircraft
                      </button>
                    </div>
                  ) : (
                    <div className="fs-grid">
                      {savedAircraft.map(listing => (
                        <ListingCard key={listing.id} listing={listing} onClick={onSelectListing} onSave={onSave} saved={true} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ENQUIRIES TAB - CRM STYLE */}
              {activeTab === 'enquiries' && (
                <>
                  {!selectedEnquiry ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Enquiries</h3>
                          <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Manage leads and respond to buyer questions</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['all', 'new', 'contacted', 'negotiating'].map(filter => (
                            <button 
                              key={filter}
                              style={{ 
                                padding: "8px 16px", 
                                background: "var(--fs-gray-100)", 
                                border: "none",
                                borderRadius: 6,
                                fontSize: 13,
                                cursor: "pointer",
                                textTransform: 'capitalize'
                              }}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </div>

                      {myEnquiries.filter(e => e.status !== 'spam').length === 0 ? (
                        <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                          <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.mail}</div>
                          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No enquiries yet</h3>
                          <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                            When buyers contact you about your listings, they'll appear here. Make sure your listings have great photos and descriptions!
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {myEnquiries.filter(e => e.status !== 'spam').map(enquiry => (
                            <div 
                              key={enquiry.id} 
                              className="fs-detail-specs" 
                              style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", cursor: 'pointer', transition: 'all 0.15s' }}
                              onClick={() => setSelectedEnquiry(enquiry)}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--fs-shadow)'}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ 
                                    width: 44, 
                                    height: 44, 
                                    borderRadius: '50%', 
                                    background: 'var(--fs-gray-100)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: 'var(--fs-gray-600)'
                                  }}>
                                    {enquiry.from.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{enquiry.from}</h4>
                                    <p style={{ fontSize: 13, color: "var(--fs-gray-500)" }}>Re: {enquiry.aircraft}</p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  {getStatusBadge(enquiry.status)}
                                  <span style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{formatTimeAgo(enquiry.date)}</span>
                                </div>
                              </div>
                              <p style={{ fontSize: 14, color: "var(--fs-gray-700)", marginBottom: 16, lineHeight: 1.5, paddingLeft: 56 }}>
                                "{enquiry.message.substring(0, 120)}{enquiry.message.length > 120 ? '...' : ''}"
                              </p>
                              {enquiry.hasReplied && (
                                <div style={{ paddingLeft: 56, marginTop: 8 }}>
                                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>
                                    ✓ You've replied
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Enquiry Detail View */
                    <div>
                      <button 
                        onClick={() => setSelectedEnquiry(null)}
                        style={{ 
                          marginBottom: 16,
                          fontSize: 14, 
                          color: 'var(--fs-gray-500)', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        ← Back to enquiries
                      </button>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
                        {/* Message Thread */}
                        <div className="fs-detail-specs" style={{ padding: 0, borderRadius: "var(--fs-radius-lg)", overflow: 'hidden' }}>
                          <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              <div style={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                background: 'var(--fs-gray-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                fontWeight: 600,
                                color: 'var(--fs-gray-600)'
                              }}>
                                {selectedEnquiry.from.charAt(0)}
                              </div>
                              <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selectedEnquiry.from}</h3>
                                <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Re: {selectedEnquiry.aircraft}</p>
                              </div>
                            </div>
                            {getStatusBadge(selectedEnquiry.status)}
                          </div>

                          <div style={{ padding: "20px", maxHeight: 400, overflowY: 'auto' }}>
                            {/* Original Message */}
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: '50%', 
                                  background: 'var(--fs-gray-100)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: 'var(--fs-gray-600)',
                                  flexShrink: 0
                                }}>
                                  {selectedEnquiry.from.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ background: '#f3f4f6', padding: 12, borderRadius: "var(--fs-radius-lg)", borderBottomLeftRadius: 4 }}>
                                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>{selectedEnquiry.message}</p>
                                  </div>
                                  <p style={{ fontSize: 11, color: 'var(--fs-gray-400)', marginTop: 4 }}>{formatTimeAgo(selectedEnquiry.date)}</p>
                                </div>
                              </div>
                            </div>

                            {selectedEnquiry.hasReplied && (
                              <div style={{ padding: "12px 16px", background: '#ecfdf5', borderRadius: "var(--fs-radius)", fontSize: 13, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>✓</span>
                                <span>You've replied to this enquiry. Future replies are tracked by status only — full message threads are coming soon.</span>
                              </div>
                            )}
                          </div>

                          {/* Reply Input */}
                          <div style={{ padding: "20px", borderTop: "1px solid var(--fs-gray-100)" }}>
                            <textarea
                              className="fs-form-textarea"
                              placeholder="Type your reply..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              style={{ minHeight: 80, marginBottom: 12 }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>Buyer will be notified by email</span>
                              <button 
                                onClick={() => handleReplySubmit(selectedEnquiry.id)}
                                disabled={!replyText.trim()}
                                className="fs-form-submit"
                                style={{ width: 'auto', padding: '10px 24px' }}
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sidebar */}
                        <div>
                          {/* Buyer Info */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Buyer Details</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <a href={`mailto:${selectedEnquiry.email}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fs-ink)" }}>
                                {Icons.mail} {selectedEnquiry.email}
                              </a>
                              <a href={`tel:${selectedEnquiry.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fs-ink)" }}>
                                {Icons.phone} {selectedEnquiry.phone}
                              </a>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Actions</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {['new', 'contacted', 'negotiating', 'sold', 'archived'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleEnquiryStatusChange(selectedEnquiry.id, status)}
                                  style={{ 
                                    padding: "10px 16px", 
                                    background: selectedEnquiry.status === status ? '#eff6ff' : 'var(--fs-gray-100)', 
                                    color: selectedEnquiry.status === status ? 'var(--fs-ink)' : 'var(--fs-gray-700)',
                                    border: selectedEnquiry.status === status ? '1px solid var(--fs-ink)' : 'none',
                                    borderRadius: "var(--fs-radius)",
                                    fontSize: 13,
                                    cursor: "pointer",
                                    textAlign: 'left',
                                    textTransform: 'capitalize',
                                    fontWeight: selectedEnquiry.status === status ? 600 : 400
                                  }}
                                >
                                  {status === 'new' && '✨ '} 
                                  {status === 'contacted' && '✓ '} 
                                  {status === 'negotiating' && '💬 '} 
                                  {status === 'sold' && ''}
                                  {status === 'archived' && '📁 '}
                                  Mark as {status}
                                </button>
                              ))}
                              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--fs-gray-200)' }} />
                              <button
                                onClick={() => handleMarkSpam(selectedEnquiry.id)}
                                style={{ 
                                  padding: "10px 16px", 
                                  background: 'transparent', 
                                  color: '#ef4444',
                                  border: 'none',
                                  borderRadius: "var(--fs-radius)",
                                  fontSize: 13,
                                  cursor: "pointer",
                                  textAlign: 'left'
                                }}
                              >
                                🚫 Mark as spam
                              </button>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Private Notes</h4>
                            <textarea
                              className="fs-form-textarea"
                              placeholder="Add notes about this buyer (only visible to you)..."
                              style={{ minHeight: 100, fontSize: 13 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PROFILE SETTINGS TAB */}
              {/* DRAFTS TAB */}
              {activeTab === 'drafts' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Manage Ad or Draft</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Continue editing your saved drafts</p>
                    </div>
                    <button 
                      className="fs-nav-btn-primary"
                      onClick={() => setPage('sell')}
                    >
                      + New Draft
                    </button>
                  </div>

                  {drafts.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.file}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No drafts</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Start creating a listing and save it as a draft to finish later.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {drafts.map(draft => (
                        <div key={draft.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{draft.title}</h4>
                            <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Last edited: {draft.lastEdited}</p>
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 120, height: 6, background: '#e5e5e5', borderRadius: 3 }}>
                                <div style={{ width: `${draft.progress}%`, height: '100%', background: 'var(--fs-ink)', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--fs-gray-500)' }}>{draft.progress}% complete</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ padding: "8px 16px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Delete</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Continue</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* RECEIVED OFFERS TAB */}
              {activeTab === 'receivedOffers' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Manage Your Offers</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offers received on your listings</p>
                    </div>
                  </div>

                  {receivedOffers.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.tag}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No offers yet</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        When buyers make offers on your aircraft, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {receivedOffers.map(offer => (
                        <div key={offer.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{offer.aircraft}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>From: {offer.from}</p>
                            </div>
                            <span style={{ 
                              padding: "4px 12px", 
                              borderRadius: 4, 
                              fontSize: 12,
                              background: offer.status === 'pending' ? '#fef3c7' : '#dcfce7',
                              color: offer.status === 'pending' ? '#92400e' : '#166534',
                              textTransform: 'capitalize'
                            }}>
                              {offer.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "12px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius)", marginBottom: 12 }}>
                            <span style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offer Amount</span>
                            <span style={{ fontSize: 18, fontWeight: 700 }}>${offer.amount.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button style={{ padding: "8px 16px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Decline</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Accept</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* MY OFFERS (MADE) TAB */}
              {activeTab === 'myOffers' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>My Instant Offers</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offers you've made on aircraft</p>
                    </div>
                  </div>

                  {myOffers.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.dollar}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No offers made</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        When you make offers on aircraft, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {myOffers.map(offer => (
                        <div key={offer.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{offer.aircraft}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>To: {offer.to}</p>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-400)', marginTop: 4 }}>Made: {offer.date}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 18, fontWeight: 700 }}>${offer.amount.toLocaleString()}</p>
                              <span style={{ 
                                padding: "4px 12px", 
                                borderRadius: 4, 
                                fontSize: 12,
                                background: offer.status === 'pending' ? '#fef3c7' : offer.status === 'accepted' ? '#dcfce7' : '#fee2e2',
                                color: offer.status === 'pending' ? '#92400e' : offer.status === 'accepted' ? '#166534' : '#991b1b',
                                textTransform: 'capitalize'
                              }}>
                                {offer.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SAVED SEARCHES TAB */}
              {activeTab === 'savedSearches' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Saved Searches</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Get alerts for new matching aircraft</p>
                    </div>
                  </div>

                  {savedSearches.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.search}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No saved searches</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Save your searches to get notified when new aircraft match your criteria.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {savedSearches.map(search => (
                        <div key={search.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{search.name}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-ink)' }}>{search.count} new matches</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, color: search.alerts ? '#10b981' : 'var(--fs-gray-400)' }}>
                                {search.alerts ? '🔔 Alerts on' : '🔕 Alerts off'}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {Object.entries(search.filters).map(([key, value]) => (
                              <span key={key} style={{ padding: "4px 10px", background: "var(--fs-gray-100)", borderRadius: 4, fontSize: 12 }}>
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--fs-gray-200)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Delete</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>View Results</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Notification Preferences</h3>
                  <div className="fs-detail-specs" style={{ padding: "24px", borderRadius: 12 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Email Notifications</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                      {[
                        { key: 'emailEnquiries', label: 'New enquiries on my listings', desc: 'When someone contacts you about your aircraft' },
                        { key: 'emailOffers', label: 'Offers on my listings', desc: 'When someone makes an offer on your aircraft' },
                        { key: 'emailSavedSearch', label: 'Saved search alerts', desc: 'When new aircraft match your saved searches' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: "var(--fs-radius-lg)",
                              background: notifications[item.key] ? 'var(--fs-ink)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>SMS Notifications</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                      {[
                        { key: 'smsEnquiries', label: 'New enquiries', desc: 'Text message for urgent enquiries' },
                        { key: 'smsOffers', label: 'New offers', desc: 'Text message when you receive an offer' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: "var(--fs-radius-lg)",
                              background: notifications[item.key] ? 'var(--fs-ink)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Other</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { key: 'marketingEmails', label: 'Marketing emails', desc: 'Promotions, tips, and news from Flightsales' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: "var(--fs-radius-lg)",
                              background: notifications[item.key] ? 'var(--fs-ink)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* DISCOUNTS TAB */}
              {activeTab === 'discounts' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Discounts</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Your available promo codes</p>
                    </div>
                  </div>

                  {discounts.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.gift}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No discounts</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Check back for special offers and promotions.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                      {discounts.map(discount => (
                        <div key={discount.id} className="fs-detail-specs" style={{ padding: "24px", borderRadius: "var(--fs-radius-lg)", position: 'relative', opacity: discount.used ? 0.6 : 1 }}>
                          {discount.used && (
                            <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 8px', background: 'var(--fs-gray-200)', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>USED</div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: "var(--fs-radius-lg)", background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                              🎁
                            </div>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 700 }}>{discount.discount}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Expires: {discount.expiry}</p>
                            </div>
                          </div>
                          <div style={{ padding: "12px", background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <code style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>{discount.code}</code>
                            {!discount.used && (
                              <button style={{ padding: "6px 12px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Copy</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'profile' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Profile Settings</h3>
                  <div className="fs-detail-specs" style={{ padding: "24px" }}>
                    {!editProfile ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                          <img src={user.avatar} alt={user.full_name} style={{ width: 80, height: 80, borderRadius: "50%" }} />
                          <div>
                            <h4 style={{ fontSize: 18, fontWeight: 600 }}>{profileData.full_name}</h4>
                            <p style={{ fontSize: 14, color: "var(--fs-gray-500)" }}>{profileData.email}</p>
                          </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Phone</span>
                            <span>{profileData.phone || 'Not set'}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Location</span>
                            <span>{profileData.location || 'Not set'}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Account Type</span>
                            <span style={{ textTransform: "capitalize" }}>{user.role}</span>
                          </div>
                        </div>
                        <button 
                          className="fs-detail-cta fs-detail-cta-primary"
                          onClick={() => setEditProfile(true)}
                        >
                          Edit Profile
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Full Name</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.full_name}
                            onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                          />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Email</label>
                          <input className="fs-form-input" value={profileData.email} disabled />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Phone</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.phone}
                            onChange={e => setProfileData({...profileData, phone: e.target.value})}
                            placeholder="04XX XXX XXX"
                          />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Location</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.location}
                            onChange={e => setProfileData({...profileData, location: e.target.value})}
                            placeholder="e.g. Sydney, NSW"
                          />
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button
                            className="fs-form-submit"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            style={{ opacity: savingProfile ? 0.7 : 1 }}
                          >
                            {savingProfile ? "Saving..." : "Save Changes"}
                          </button>
                          <button 
                            className="fs-detail-cta fs-detail-cta-secondary"
                            onClick={() => setEditProfile(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const AdminPage = ({ user, setPage, signOut }) => {
  // Caller (App) already gates rendering on admin role; no render-time setPage here.
  const [activeTab, setActiveTab] = useState('listings');
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  const { listings: adminListings, loading: listingsLoading, updateStatus: updateListingStatus } = useAdminListings();
  const { users: adminUsers, loading: usersLoading, promoteToDealer } = useAdminUsers();
  const { enquiries: adminEnquiries, updateStatus: updateEnquiryStatus } = useAdminEnquiries();

  // Real listings rows mapped to the existing table's expected shape
  const listingsView = useMemo(() => (adminListings || []).map(l => ({
    id: l.id,
    title: l.title || `${l.year || ''} ${l.manufacturer || ''} ${l.model || ''}`.trim(),
    price: l.price || 0,
    seller: l.dealer?.name || (l.user_id ? 'Private seller' : 'Unknown'),
    status: l.status || 'pending',
    date: l.created_at,
  })), [adminListings]);

  const usersView = useMemo(() => (adminUsers || []).map(u => ({
    id: u.id,
    name: u.full_name || u.email?.split('@')[0] || 'Unnamed',
    email: u.email,
    role: u.is_dealer ? 'dealer' : 'private',
    listings: u.listings_count || 0,
  })), [adminUsers]);

  // Split enquiries into platform-leads (finance/insurance/valuation/contact) vs listing enquiries
  const leads = useMemo(() => (adminEnquiries || [])
    .filter(e => e.type && e.type !== 'enquiry')
    .map(e => ({
      id: e.id,
      type: e.type,
      name: e.name,
      email: e.email,
      phone: e.phone || '',
      aircraft: e.aircraft?.title || '—',
      amount: null,
      status: e.status || 'new',
      provider: null,
      notes: e.message || '',
      date: e.created_at,
      assignedTo: null,
    })), [adminEnquiries]);

  const listingEnquiries = useMemo(() => (adminEnquiries || [])
    .filter(e => !e.type || e.type === 'enquiry'), [adminEnquiries]);

  const handleLeadStatusChange = (leadId, newStatus) => {
    updateEnquiryStatus(leadId, newStatus);
  };

  const handleAssignProvider = (leadId, provider) => {
    // Provider assignment isn't in the schema yet — record as a status change for now
    updateEnquiryStatus(leadId, 'assigned');
  };

  // Live stats from real DB rows
  const adminStats = {
    totalListings: adminListings?.length || 0,
    pendingReview: (adminListings || []).filter(l => l.status === 'pending').length,
    activeUsers: adminUsers?.length || 0,
    dealers: (adminUsers || []).filter(u => u.is_dealer).length,
  };

  const getLeadTypeLabel = (type) => {
    const labels = { finance: 'Finance', insurance: 'Insurance', valuation: 'Valuation' };
    return labels[type] || type;
  };

  const getLeadStatusBadge = (status) => {
    const styles = {
      new: { bg: '#dcfce7', color: '#166534', label: 'New' },
      contacted: { bg: '#dbeafe', color: '#1e40af', label: 'Contacted' },
      qualified: { bg: '#fef3c7', color: '#92400e', label: 'Qualified' },
      assigned: { bg: '#e0e7ff', color: '#3730a3', label: 'Assigned' },
      converted: { bg: '#d1fae5', color: '#065f46', label: 'Converted' },
      lost: { bg: '#fee2e2', color: '#991b1b', label: 'Lost' }
    };
    const s = styles[status] || styles.new;
    return <span style={{ padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <>
      <div className="fs-about-hero" style={{ padding: "32px 0", background: "#1a1a1a" }}>
        <div className="fs-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                background: "var(--fs-red)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: 20
              }}>
                {Icons.shield}
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 24, marginBottom: 4 }}>
                  Admin Dashboard
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                  Manage listings, users, and platform settings
                </p>
              </div>
            </div>
            <button 
              onClick={async () => { await signOut(); setPage('home'); }}
              style={{ 
                padding: "8px 16px", 
                background: "rgba(255,255,255,0.1)", 
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "var(--fs-radius-sm)",
                color: "white",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <section className="fs-section" style={{ padding: "32px 0" }}>
        <div className="fs-container">
          {/* Stats Row — live from DB */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Listings', value: adminStats.totalListings, color: 'var(--fs-ink)' },
              { label: 'Pending Review', value: adminStats.pendingReview, color: 'var(--fs-amber)' },
              { label: 'Active Users', value: adminStats.activeUsers, color: 'var(--fs-green)' },
              { label: 'Dealers', value: adminStats.dealers, color: 'var(--fs-gray-900)' },
            ].map(stat => (
              <div key={stat.label} className="fs-detail-specs" style={{ padding: "20px" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: "var(--fs-gray-500)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--fs-gray-200)", flexWrap: 'wrap' }}>
            {[
              { id: 'listings', label: 'Listings' },
              { id: 'users', label: 'Users' },
              { id: 'dealers', label: 'Dealer Applications' },
              { id: 'enquiries', label: 'Enquiries' },
              { id: 'leads', label: 'Lead Management', badge: leads.filter(l => l.status === 'new').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedLead(null); }}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid var(--fs-ink)" : "2px solid transparent",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? "var(--fs-ink)" : "var(--fs-gray-500)",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{ 
                    background: activeTab === tab.id ? 'var(--fs-ink)' : 'var(--fs-gray-200)', 
                    color: activeTab === tab.id ? 'white' : 'var(--fs-gray-600)', 
                    fontSize: 11, 
                    padding: '2px 8px', 
                    borderRadius: "var(--fs-radius-lg)",
                    fontWeight: 600
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="fs-detail-specs" style={{ padding: 0 }}>
            {activeTab === 'listings' && (
              listingsLoading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--fs-gray-500)' }}>Loading listings…</div>
              ) : listingsView.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No listings yet</h3>
                  <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 24 }}>List your first aircraft to start receiving enquiries.</p>
                  <button className="fs-nav-btn-primary" onClick={() => setPage('sell')}>List Aircraft</button>
                </div>
              ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--fs-gray-200)" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Aircraft</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Price</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Seller</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listingsView.map(listing => (
                    <tr key={listing.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                      <td style={{ padding: "16px", fontWeight: 500 }}>{listing.title}</td>
                      <td style={{ padding: "16px" }}>${(listing.price || 0).toLocaleString()}</td>
                      <td style={{ padding: "16px", color: "var(--fs-gray-600)" }}>{listing.seller}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          background: listing.status === 'active' ? '#dcfce7' : listing.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                          color: listing.status === 'active' ? '#166534' : listing.status === 'pending' ? '#92400e' : 'var(--fs-gray-600)',
                          textTransform: 'capitalize',
                        }}>
                          {listing.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {listing.status !== 'active' && (
                            <button onClick={() => updateListingStatus(listing.id, 'active')} style={{ padding: "6px 12px", background: "var(--fs-green)", color: "white", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Approve</button>
                          )}
                          {listing.status === 'active' && (
                            <button onClick={() => updateListingStatus(listing.id, 'pending')} style={{ padding: "6px 12px", background: "var(--fs-gray-100)", color: "var(--fs-gray-700)", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Unpublish</button>
                          )}
                          <button onClick={() => updateListingStatus(listing.id, 'sold')} style={{ padding: "6px 12px", background: "var(--fs-gray-100)", color: "var(--fs-gray-700)", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Mark Sold</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )
            )}

            {activeTab === 'users' && (
              usersLoading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--fs-gray-500)' }}>Loading users…</div>
              ) : usersView.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--fs-gray-500)' }}>No users yet.</div>
              ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--fs-gray-200)" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>User</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Role</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Listings</th>
                    <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersView.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                      <td style={{ padding: "16px" }}>
                        <p style={{ fontWeight: 500 }}>{u.name}</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-500)" }}>{u.email}</p>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          background: u.role === 'dealer' ? '#eff6ff' : '#f3f4f6',
                          color: u.role === 'dealer' ? 'var(--fs-ink)' : 'var(--fs-gray-600)',
                          textTransform: "capitalize"
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>{u.listings}</td>
                      <td style={{ padding: "16px", textAlign: 'right' }}>
                        {u.role !== 'dealer' && (
                          <button onClick={() => promoteToDealer(u.id)} style={{ padding: "6px 12px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Promote to dealer</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )
            )}

            {activeTab === 'dealers' && (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ color: "var(--fs-gray-500)" }}>No pending dealer applications</p>
              </div>
            )}

            {activeTab === 'enquiries' && (
              listingEnquiries.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center" }}>
                  <p style={{ color: "var(--fs-gray-500)" }}>No listing enquiries yet.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--fs-gray-200)" }}>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>From</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Aircraft</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Received</th>
                      <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listingEnquiries.map(e => (
                      <tr key={e.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                        <td style={{ padding: "16px" }}>
                          <p style={{ fontWeight: 500 }}>{e.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--fs-gray-500)' }}>{e.email}</p>
                        </td>
                        <td style={{ padding: "16px", color: "var(--fs-gray-700)" }}>{e.aircraft?.title || '—'}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: e.status === 'new' ? '#dcfce7' : '#f3f4f6', color: e.status === 'new' ? '#166534' : 'var(--fs-gray-600)', textTransform: 'capitalize' }}>{e.status}</span>
                        </td>
                        <td style={{ padding: "16px", fontSize: 13, color: 'var(--fs-gray-500)' }}>{new Date(e.created_at).toLocaleString()}</td>
                        <td style={{ padding: "16px", textAlign: 'right' }}>
                          <a href={`mailto:${e.email}`} style={{ fontSize: 12, color: 'var(--fs-ink)', marginRight: 12 }}>Email</a>
                          {e.status === 'new' && (
                            <button onClick={() => updateEnquiryStatus(e.id, 'read')} style={{ padding: "6px 12px", background: "var(--fs-gray-100)", color: 'var(--fs-gray-700)', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Mark read</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* LEAD MANAGEMENT TAB */}
            {activeTab === 'leads' && (
              <>
                {!selectedLead ? (
                  <>
                    <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Lead Management</h3>
                        <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Finance, Insurance & Valuation inquiries</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['all', 'finance', 'insurance', 'valuation'].map(filter => (
                          <button 
                            key={filter}
                            onClick={() => setLeadStatusFilter(filter)}
                            style={{ 
                              padding: "6px 12px", 
                              background: leadStatusFilter === filter ? 'var(--fs-ink)' : 'var(--fs-gray-100)', 
                              color: leadStatusFilter === filter ? 'white' : 'var(--fs-gray-700)',
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: "pointer",
                              textTransform: 'capitalize'
                            }}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--fs-gray-200)", background: '#fafafa' }}>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Type</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Contact</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Aircraft/Amount</th>
                          <th style={{ padding: "16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Provider</th>
                          <th style={{ padding: "16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads
                          .filter(l => leadStatusFilter === 'all' || l.type === leadStatusFilter)
                          .map(lead => (
                          <tr key={lead.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <td style={{ padding: "16px" }}>
                              <span style={{ fontSize: 13 }}>{getLeadTypeLabel(lead.type)}</span>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <p style={{ fontWeight: 500, fontSize: 14 }}>{lead.name}</p>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{lead.email}</p>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <p style={{ fontSize: 14 }}>{lead.aircraft}</p>
                              {lead.amount && <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>${lead.amount.toLocaleString()}</p>}
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              {getLeadStatusBadge(lead.status)}
                            </td>
                            <td style={{ padding: "16px" }}>
                              {lead.provider ? (
                                <span style={{ fontSize: 13 }}>{lead.provider}</span>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--fs-gray-400)', fontStyle: 'italic' }}>Unassigned</span>
                              )}
                            </td>
                            <td style={{ padding: "16px", textAlign: "right" }}>
                              <button 
                                onClick={() => setSelectedLead(lead)}
                                style={{ 
                                  padding: "6px 12px", 
                                  background: "var(--fs-ink)", 
                                  color: "white",
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: "pointer"
                                }}
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  /* Lead Detail View */
                  <div style={{ padding: "24px" }}>
                    <button 
                      onClick={() => setSelectedLead(null)}
                      style={{ 
                        marginBottom: 16,
                        fontSize: 14, 
                        color: 'var(--fs-gray-500)', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      ← Back to leads
                    </button>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                      {/* Main Info */}
                      <div>
                        <div className="fs-detail-specs" style={{ padding: "24px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{selectedLead.name}</h2>
                              <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>{getLeadTypeLabel(selectedLead.type)} • {selectedLead.aircraft}</p>
                            </div>
                            {getLeadStatusBadge(selectedLead.status)}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Email</p>
                              <a href={`mailto:${selectedLead.email}`} style={{ fontSize: 14, color: 'var(--fs-ink)' }}>{selectedLead.email}</a>
                            </div>
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Phone</p>
                              <a href={`tel:${selectedLead.phone}`} style={{ fontSize: 14, color: 'var(--fs-ink)' }}>{selectedLead.phone}</a>
                            </div>
                            {selectedLead.amount && (
                              <div>
                                <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Amount</p>
                                <p style={{ fontSize: 14, fontWeight: 600 }}>${selectedLead.amount.toLocaleString()}</p>
                              </div>
                            )}
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Received</p>
                              <p style={{ fontSize: 14 }}>{new Date(selectedLead.date).toLocaleString()}</p>
                            </div>
                          </div>

                          <div>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 8 }}>Notes</p>
                            <p style={{ fontSize: 14, lineHeight: 1.6, padding: 12, background: '#f9fafb', borderRadius: 8 }}>{selectedLead.notes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar Actions */}
                      <div>
                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Update Status</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['new', 'contacted', 'qualified', 'assigned', 'converted', 'lost'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleLeadStatusChange(selectedLead.id, status)}
                                style={{ 
                                  padding: "10px 16px", 
                                  background: selectedLead.status === status ? '#eff6ff' : 'var(--fs-gray-100)', 
                                  color: selectedLead.status === status ? 'var(--fs-ink)' : 'var(--fs-gray-700)',
                                  border: selectedLead.status === status ? '1px solid var(--fs-ink)' : 'none',
                                  borderRadius: "var(--fs-radius)",
                                  fontSize: 13,
                                  cursor: "pointer",
                                  textAlign: 'left',
                                  textTransform: 'capitalize',
                                  fontWeight: selectedLead.status === status ? 600 : 400
                                }}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Assign Provider</h4>
                          <select 
                            className="fs-form-select"
                            value={selectedLead.provider || ''}
                            onChange={(e) => handleAssignProvider(selectedLead.id, e.target.value)}
                            style={{ marginBottom: 12 }}
                          >
                            <option value="">Select Provider...</option>
                            {selectedLead.type === 'finance' && (
                              <>
                                <option value="Aviation Finance Australia">Aviation Finance Australia</option>
                                <option value="Aircraft Lending Centre">Aircraft Lending Centre</option>
                                <option value="Bank of Queensland Aviation">Bank of Queensland Aviation</option>
                              </>
                            )}
                            {selectedLead.type === 'insurance' && (
                              <>
                                <option value="Avemco Insurance">Avemco Insurance</option>
                                <option value="QBE Aviation">QBE Aviation</option>
                                <option value="Allianz Aircraft Insurance">Allianz Aircraft Insurance</option>
                              </>
                            )}
                            {selectedLead.type === 'valuation' && (
                              <>
                                <option value="Aircraft Valuations Pty Ltd">Aircraft Valuations Pty Ltd</option>
                                <option value="ASA Accredited Appraiser">ASA Accredited Appraiser</option>
                              </>
                            )}
                          </select>
                          <button className="fs-form-submit" style={{ width: '100%' }}>
                            Send to Provider
                          </button>
                        </div>

                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Staff Notes</h4>
                          <textarea
                            className="fs-form-textarea"
                            placeholder="Add internal notes..."
                            style={{ minHeight: 100, fontSize: 13 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

// --- APP ---
export default function FlightSalesApp({
  initialPage = "home",
  initialListing = null,
  initialListingId = null,
  initialDealer = null,
  initialDealerId = null,
} = {}) {
  const [page, setPage] = useState(initialPage);
  // Seed selected entities from server-side props when the route provides them
  // (e.g. /listings/[id] passes the full listing). Falls back to a client fetch
  // when only an id was given.
  const [selectedListing, setSelectedListingRaw] = useState(initialListing);
  const [selectedDealer, setSelectedDealer] = useState(initialDealer);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchFilters, setSearchFilters] = useState(null);

  // Real auth
  const { user: authUser, loading: authLoading, signIn, signUp, signInWithGoogle, signOut, resetPassword } = useAuth();
  const { profile } = useProfile(authUser?.id);

  // Client-side fallback: when a route gave us only the id (no full row),
  // fetch the entity once on mount.
  useEffect(() => {
    let cancelled = false;
    if (initialListingId && !selectedListing) {
      supabase
        .from('aircraft')
        .select(`*, dealer:dealers(id, name, location, rating, verified)`)
        .eq('id', initialListingId)
        .maybeSingle()
        .then(({ data }) => { if (!cancelled && data) setSelectedListingRaw(data); });
    }
    if (initialDealerId && !selectedDealer) {
      supabase
        .from('dealers')
        .select('*')
        .eq('id', initialDealerId)
        .maybeSingle()
        .then(({ data }) => { if (!cancelled && data) setSelectedDealer(data); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Construct a user object compatible with all child components
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email,
    full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
    phone: profile?.phone || '',
    location: profile?.location || '',
    role: profile?.is_dealer ? 'dealer' : (authUser.email === 'admin@flightsales.com.au' ? 'admin' : 'private'),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || authUser.email || 'User')}&background=0a0a0a&color=fff`,
    created_at: authUser.created_at
  } : null;

  // Real saved aircraft
  const { savedIds, savedListings, toggleSave } = useSavedAircraft(authUser?.id);

  const setSelectedListing = (l) => {
    setSelectedListingRaw(l);
    setPage("detail");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/listings/${l.id}`);
      window.scrollTo(0, 0);
    }
  };

  // Mapping from internal page state to real URLs. Used to keep the browser
  // URL in sync as the user navigates inside the SPA so each page has a
  // shareable, refreshable address.
  const PAGE_URL = {
    home: "/",
    buy: "/buy",
    sell: "/sell",
    dealers: "/dealers",
    news: "/news",
    about: "/about",
    contact: "/contact",
    login: "/login",
    dashboard: "/dashboard",
    admin: "/admin",
  };

  const setPageWrap = (p) => {
    setPage(p);
    setSelectedListingRaw(null);
    setMobileOpen(false);
    if (typeof window !== "undefined") {
      const url = PAGE_URL[p];
      if (url && window.location.pathname !== url) {
        window.history.pushState({}, "", url);
      }
      window.scrollTo(0, 0);
    }
  };

  // Demo mode for testing dashboards without auth
  const [demoUser, setDemoUser] = useState(null);
  const effectiveUser = demoUser || user;
  
  const loginDemo = (role) => {
    setDemoUser({
      id: 'demo-' + role,
      email: role + '@flightsales.demo',
      full_name: 'Demo ' + role.charAt(0).toUpperCase() + role.slice(1),
      role: role,
      created_at: new Date().toISOString(),
    });
    setPage(role === 'admin' ? 'admin' : 'dashboard');
  };

  // Auth-gate redirects (run as side effects, never during render)
  useEffect(() => {
    if (authLoading && !demoUser) return; // wait for session to resolve
    if (page === 'dashboard' && !authUser && !demoUser) setPage('login');
    if (page === 'dashboard' && effectiveUser?.role === 'admin') setPage('admin');
    if (page === 'admin' && effectiveUser?.role !== 'admin') setPage(authUser || demoUser ? 'dashboard' : 'login');
  }, [page, authUser, authLoading, effectiveUser?.role, demoUser]);

  const onSave = async (id) => {
    if (!authUser) { setToast("Sign in to save aircraft"); return; }
    const isSaved = await toggleSave(id);
    setToast(isSaved ? "Added to watchlist ❤️" : "Removed from watchlist");
  };

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }
  }, [toast]);

  const getBreadcrumbs = () => {
    const crumbs = { home: [], buy: [['home', 'Home'], ['buy', 'Buy Aircraft']], detail: [['home', 'Home'], ['buy', 'Buy Aircraft'], ['detail', 'Aircraft Details']], sell: [['home', 'Home'], ['sell', 'Sell Aircraft']], dealers: [['home', 'Home'], ['dealers', 'Dealers']], news: [['home', 'Home'], ['news', 'News']], about: [['home', 'Home'], ['about', 'About Us']], contact: [['home', 'Home'], ['contact', 'Contact']], login: [['home', 'Home'], ['login', 'Sign In']], dashboard: [['home', 'Home'], ['dashboard', 'Dashboard']], admin: [['home', 'Home'], ['admin', 'Admin']] };
    return crumbs[page] || [];
  };

  const Breadcrumbs = () => {
    const crumbs = getBreadcrumbs();
    if (crumbs.length === 0) return null;
    return (
      <div className="fs-container" style={{ paddingTop: 12, paddingBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--fs-gray-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {crumbs.map(([p, label], i) => (
            <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span>{Icons.chevronRight}</span>}
              <button onClick={() => setPageWrap(p)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: i === crumbs.length - 1 ? 'var(--fs-gray-900)' : 'var(--fs-gray-500)', fontWeight: i === crumbs.length - 1 ? 600 : 400, fontSize: 13 }}>{label}</button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Nav page={page} setPage={setPageWrap} setMobileOpen={setMobileOpen} mobileOpen={mobileOpen} user={user} />
      {page !== 'home' && page !== 'detail' && <Breadcrumbs />}

      {page === "home" && <HomePage setPage={setPageWrap} setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} setSearchFilters={setSearchFilters} />}
      {page === "buy" && <BuyPage setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} initialFilters={searchFilters} user={user} setPage={setPageWrap} />}
      {page === "detail" && <ListingDetail listing={selectedListing} onBack={() => setPageWrap("buy")} savedIds={savedIds} onSave={onSave} user={user} onSelectDealer={(d) => { setSelectedDealer(d); setPage("dealer-detail"); if (typeof window !== "undefined" && d?.id) { window.history.pushState({}, "", `/dealers/${d.id}`); } window.scrollTo(0, 0); }} />}
      {page === "sell" && <SellPage user={user} setPage={setPageWrap} />}
      {page === "dealers" && <DealersPage onSelectDealer={(d) => { setSelectedDealer(d); setPage("dealer-detail"); if (typeof window !== "undefined" && d?.id) { window.history.pushState({}, "", `/dealers/${d.id}`); } window.scrollTo(0, 0); }} />}
      {page === "dealer-detail" && <DealerDetailPage dealer={selectedDealer} onBack={() => setPageWrap("dealers")} setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} />}
      {page === "news" && <NewsPage />}
      {page === "about" && <AboutPage />}
      {page === "contact" && <ContactPage />}
      {page === "login" && <LoginPage setPage={setPageWrap} signIn={signIn} signUp={signUp} signInWithGoogle={signInWithGoogle} resetPassword={resetPassword} loginDemo={loginDemo} />}
      {page === "dashboard" && effectiveUser && effectiveUser.role !== 'admin' && <DashboardPage user={effectiveUser} setPage={setPageWrap} signOut={signOut} savedIds={savedIds} savedListings={savedListings} onSave={onSave} onSelectListing={setSelectedListing} />}
      {page === "admin" && effectiveUser?.role === 'admin' && <AdminPage user={effectiveUser} setPage={setPageWrap} signOut={signOut} />}
      {page === "insurance" && <ContactPage />}

      <Footer setPage={setPageWrap} />

      {toast && (
        <div className="fs-toast">
          {Icons.check} {toast}
        </div>
      )}
    </>
  );
}
