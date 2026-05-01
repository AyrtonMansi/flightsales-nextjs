'use client';
import { Icons } from '../Icons';
import { CATEGORIES, MANUFACTURERS, STATES } from '../../lib/constants';

// Original hero search card — exact extraction of the markup that shipped
// first. Kept around side-by-side with HeroSearchPro so we can A/B them
// from a toggle pill above the card.

export default function HeroSearchClassic({ model }) {
  const {
    searchCat, setSearchCat,
    searchMake, setSearchMake,
    searchState, setSearchState,
    yearFrom, setYearFrom, yearTo, setYearTo,
    priceFrom, setPriceFrom, priceTo, setPriceTo,
    aiQuery, setAiQuery,
    rotatingPlaceholder,
    onAiSearch,
    onManualSearch,
  } = model;

  return (
    <div className="fs-search-bar">
      <div className="fs-search-ai">
        <span className="fs-search-ai-wand" aria-hidden="true">
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
          onKeyDown={e => { if (e.key === 'Enter') onAiSearch(e.target.value); }}
          aria-label="AI search — describe the aircraft you're looking for"
        />
      </div>

      <div className="fs-search-fields-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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

      <div className="fs-search-fields-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="fs-search-field">
          <span className="fs-search-label" style={{ textAlign: 'center' }}>Year</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <select
              className="fs-search-select"
              value={yearFrom}
              onChange={e => setYearFrom(e.target.value)}
              style={{ flex: 1, textAlign: 'center', textAlignLast: 'center' }}
            >
              <option value="">From</option>
              {Array.from({ length: 50 }, (_, i) => 2026 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span style={{ color: 'var(--fs-ink-4)', fontSize: 12 }}>—</span>
            <select
              className="fs-search-select"
              value={yearTo}
              onChange={e => setYearTo(e.target.value)}
              style={{ flex: 1, textAlign: 'center', textAlignLast: 'center' }}
            >
              <option value="">To</option>
              {Array.from({ length: 50 }, (_, i) => 2026 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="fs-search-field">
          <span className="fs-search-label" style={{ textAlign: 'center' }}>Price</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <select
              className="fs-search-select"
              value={priceFrom}
              onChange={e => setPriceFrom(e.target.value)}
              style={{ flex: 1, textAlign: 'center', textAlignLast: 'center' }}
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
            <span style={{ color: 'var(--fs-ink-4)', fontSize: 12 }}>—</span>
            <select
              className="fs-search-select"
              value={priceTo}
              onChange={e => setPriceTo(e.target.value)}
              style={{ flex: 1, textAlign: 'center', textAlignLast: 'center' }}
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

      <button className="fs-search-btn" onClick={onManualSearch}>
        {Icons.search} Search Aircraft
      </button>
    </div>
  );
}
