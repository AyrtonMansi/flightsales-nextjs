'use client';
import { useState, useEffect, useMemo } from 'react';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import EnquiryModal from '../EnquiryModal';
import QuickLookModal from '../QuickLookModal';
import { useAircraft } from '../../lib/hooks';
import { MANUFACTURERS, CATEGORIES, STATES, CONDITIONS } from '../../lib/constants';
import { useRotatingPlaceholder, AI_SEARCH_EXAMPLES } from '../../lib/useRotatingPlaceholder';
import CardSkeleton from '../CardSkeleton';
import MobileFilterSheet from '../MobileFilterSheet';

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

  // Source-of-truth: always use the DB. Empty results render an empty state.
  const filtered = useMemo(() => {
    return dbAircraft;
  }, [dbAircraft]);

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

export default BuyPage;
