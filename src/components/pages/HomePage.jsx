'use client';
import { useState } from 'react';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import { useAircraft, useFeaturedAircraft, useLatestAircraft, useDealers, useNews } from '../../lib/hooks';
import { MANUFACTURERS, CATEGORIES, STATES, DEALERS, NEWS_ARTICLES } from '../../lib/constants';
import { useRotatingPlaceholder, AI_SEARCH_EXAMPLES } from '../../lib/useRotatingPlaceholder';

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
            <div className="fs-stat"><div className="fs-stat-num">{totalListings.toLocaleString()}</div><div className="fs-stat-label">Aircraft Listed</div></div>
            <div className="fs-stat"><div className="fs-stat-num">{displayDealers.length}</div><div className="fs-stat-label">Verified Dealers</div></div>
            <div className="fs-stat"><div className="fs-stat-num">{new Set(displayDealers.map(d => (d.location || '').split(',').pop().trim())).size}</div><div className="fs-stat-label">States Covered</div></div>
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

export default HomePage;
