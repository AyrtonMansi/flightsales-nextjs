'use client';
import { useReducer, useEffect, useMemo, useState } from 'react';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import EnquiryModal from '../EnquiryModal';
import QuickLookModal from '../QuickLookModal';
import { useAircraft } from '../../lib/hooks';
import { useRotatingPlaceholder, AI_SEARCH_EXAMPLES } from '../../lib/useRotatingPlaceholder';
import { parseAiQuery } from '../../lib/parseAiQuery';
import CardSkeleton from '../CardSkeleton';
import MobileFilterSheet from '../MobileFilterSheet';
import EmptyState from '../EmptyState';
import FilterColumn from '../filters/FilterColumn';
import {
  initialFilters, filterReducer, toQueryFilters, countActiveTotal,
} from '../../lib/filterReducer';

const PAGE_SIZE = 12;

// Map a parseAiQuery result (with single-string fields) onto reducer state
// (with array-shaped multi-select fields). AI search seeds the column.
function aiResultToState(parsed, base) {
  return {
    ...base,
    search: parsed.query || base.search,
    categories: parsed.cat ? [parsed.cat] : base.categories,
    manufacturers: parsed.make ? [parsed.make] : base.manufacturers,
    states: parsed.state ? [parsed.state] : base.states,
    conditions: parsed.cond ? [parsed.cond] : base.conditions,
    minPrice: parsed.minPrice || base.minPrice,
    maxPrice: parsed.maxPrice || base.maxPrice,
    ifrOnly: parsed.ifrOnly || base.ifrOnly,
    glassOnly: parsed.glassOnly || base.glassOnly,
  };
}

const BuyPage = ({ setSelectedListing, savedIds, onSave, initialFilters: initialFiltersProp, user, setPage }) => {
  // Hydrate from initialFilters prop (passed in when navigating from Home or
  // a category pill) — translates the old single-string shape into our
  // reducer state.
  const seeded = useMemo(() => {
    if (!initialFiltersProp) return initialFilters;
    return aiResultToState({
      cat: initialFiltersProp.cat,
      make: initialFiltersProp.make,
      state: initialFiltersProp.state,
      cond: initialFiltersProp.cond,
      minPrice: initialFiltersProp.minPrice,
      maxPrice: initialFiltersProp.maxPrice,
      ifrOnly: initialFiltersProp.ifrOnly,
      glassOnly: initialFiltersProp.glassOnly,
      query: initialFiltersProp.query || '',
    }, initialFilters);
  }, [initialFiltersProp]);

  const [state, dispatch] = useReducer(filterReducer, seeded);
  const [resultPage, setResultPage] = useState(1);
  const [sideOpen, setSideOpen] = useState(false);
  const [quickLook, setQuickLook] = useState(null);
  const [enquireFor, setEnquireFor] = useState(null);
  const [aiQuery, setAiQuery] = useState(initialFiltersProp?.query || '');
  const rotatingPlaceholder = useRotatingPlaceholder(AI_SEARCH_EXAMPLES);

  // Reset to page 1 whenever filters change so we don't land on an empty page.
  useEffect(() => { setResultPage(1); }, [
    state.search, state.categories, state.manufacturers, state.states,
    state.conditions, state.minPrice, state.maxPrice, state.yearFrom,
    state.yearTo, state.ifrOnly, state.glassOnly, state.retractable,
    state.pressurised, state.cruiseMin, state.rangeMin, state.usefulLoadMin,
    state.fuelBurnMax, state.smohMax, state.tboPctMin,
    state.dealerOnly, state.privateOnly, state.featuredOnly,
  ]);

  const queryFilters = useMemo(() => toQueryFilters(state), [state]);
  const { aircraft: dbAircraft, loading: dbLoading, total: dbTotal } = useAircraft(queryFilters);
  const { total: systemTotal } = useAircraft({});

  const handleAiSearch = (query) => {
    if (!query.trim()) return;
    const parsed = parseAiQuery(query);
    dispatch({ type: 'HYDRATE', payload: aiResultToState(parsed, initialFilters) });
    setAiQuery(query);
  };

  const activeFilterCount = countActiveTotal(state);
  const totalPages = Math.max(1, Math.ceil(dbAircraft.length / PAGE_SIZE));
  const pageRows = dbAircraft.slice((resultPage - 1) * PAGE_SIZE, resultPage * PAGE_SIZE);

  return (
    <>
      <div className="fs-container">
        <div className="fs-buy-shell">
          {/* SIDEBAR — same column as before; FilterColumn renders all sections */}
          <aside className={`fs-buy-sidebar${sideOpen ? ' open' : ''}`}>
            <div className="fs-buy-sidebar-inner">
              <FilterColumn
                state={state}
                dispatch={dispatch}
                total={dbAircraft.length}
                user={user}
              />
            </div>
          </aside>

          <main className="fs-buy-main">
            {/* Header */}
            <div style={{ padding: "24px 0 16px", borderBottom: "1px solid var(--fs-line)", marginBottom: 20 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Aircraft for sale</h1>
              <p style={{ fontSize: 14, color: "var(--fs-ink-3)", margin: 0 }}>
                {systemTotal > 0 ? `${systemTotal.toLocaleString()}+ verified listings` : 'Verified listings from dealers and private sellers'}
              </p>
            </div>

            {/* AI search bar */}
            <div className="fs-buy-main-search">
              <div className="fs-buy-search-input-wrap">
                <span className="fs-buy-search-icon">{Icons.search}</span>
                <input
                  className="fs-search-inline-input"
                  placeholder={rotatingPlaceholder}
                  value={state.search}
                  onChange={e => dispatch({ type: 'SET', field: 'search', value: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter' && e.target.value) handleAiSearch(e.target.value); }}
                  aria-label="AI search"
                />
                {state.search ? (
                  <button
                    onClick={() => { dispatch({ type: 'SET', field: 'search', value: '' }); setAiQuery(''); }}
                    className="fs-buy-search-clear"
                    aria-label="Clear search"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                ) : (
                  <span className="fs-buy-search-hint">↵ Search</span>
                )}
              </div>
              <button className="fs-mobile-filter-btn" onClick={() => setSideOpen(!sideOpen)}>
                {Icons.filter} Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
              </button>
            </div>

            {/* Toolbar */}
            <div className="fs-buy-main-toolbar">
              <span className="fs-results-count">
                {dbLoading ? (
                  <span style={{ color: 'var(--fs-ink-3)' }}>Searching…</span>
                ) : (
                  <>
                    <span style={{ color: 'var(--fs-ink)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>{dbAircraft.length}</span>
                    <span style={{ marginLeft: 6 }}>aircraft</span>
                    {aiQuery && <span style={{ color: 'var(--fs-ink-3)', marginLeft: 8, fontStyle: 'italic' }}>for "{aiQuery}"</span>}
                  </>
                )}
              </span>
              {dbAircraft.length > 0 && (
                <div className="fs-results-sort">
                  <span className="fs-results-sort-label">Sort by</span>
                  <select
                    className="fs-sort-select"
                    value={state.sortBy}
                    onChange={e => { dispatch({ type: 'SET', field: 'sortBy', value: e.target.value }); setResultPage(1); }}
                  >
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
            ) : dbAircraft.length === 0 ? (
              <EmptyState
                title="No aircraft match your filters"
                description="Try widening your price range, removing a feature, or clearing filters."
                searchQuery={aiQuery}
                activeFilters={activeFilterCount}
                onClearFilters={() => dispatch({ type: 'RESET' })}
                onBrowseAll={() => dispatch({ type: 'RESET' })}
                onSetAlert={() => setPage && setPage('login')}
                user={user}
              />
            ) : (
              <>
                <div className="fs-grid">
                  {pageRows.map(l => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      onSave={onSave}
                      saved={savedIds.has(l.id)}
                      onQuickLook={setQuickLook}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--fs-line)', flexWrap: 'wrap', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--fs-ink-3)', fontWeight: 500 }}>
                      Page {resultPage} of {totalPages}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => { setResultPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                        disabled={resultPage === 1}
                        style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--fs-line)', background: resultPage === 1 ? 'var(--fs-bg-2)' : 'white', cursor: resultPage === 1 ? 'default' : 'pointer', color: resultPage === 1 ? 'var(--fs-ink-4)' : 'var(--fs-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fs-font)' }}
                        aria-label="Previous page"
                      >{Icons.chevronLeft}</button>
                      {(() => {
                        const pages = [];
                        const showRange = 5;
                        let start = Math.max(1, resultPage - Math.floor(showRange / 2));
                        let end = Math.min(totalPages, start + showRange - 1);
                        start = Math.max(1, end - showRange + 1);
                        for (let p = start; p <= end; p++) pages.push(p);
                        return pages.map(p => (
                          <button
                            key={p}
                            onClick={() => { setResultPage(p); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: p === resultPage ? 'var(--fs-ink)' : 'transparent', color: p === resultPage ? 'white' : 'var(--fs-ink)', fontWeight: p === resultPage ? 600 : 500, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--fs-font)', letterSpacing: '-0.005em' }}
                            aria-label={`Page ${p}`}
                            aria-current={p === resultPage ? 'page' : undefined}
                          >{p}</button>
                        ));
                      })()}
                      <button
                        onClick={() => { setResultPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                        disabled={resultPage === totalPages}
                        style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--fs-line)', background: resultPage === totalPages ? 'var(--fs-bg-2)' : 'white', cursor: resultPage === totalPages ? 'default' : 'pointer', color: resultPage === totalPages ? 'var(--fs-ink-4)' : 'var(--fs-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fs-font)' }}
                        aria-label="Next page"
                      >{Icons.chevronRight}</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

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

      {/* Mobile filter sheet — renders the same FilterColumn body */}
      <MobileFilterSheet
        isOpen={sideOpen}
        onClose={() => setSideOpen(false)}
        filteredCount={dbAircraft.length}
        onClear={() => dispatch({ type: 'RESET' })}
      >
        <div className="fs-buy-sidebar-inner">
          <FilterColumn
            state={state}
            dispatch={dispatch}
            total={dbAircraft.length}
            user={user}
          />
        </div>
      </MobileFilterSheet>

      {enquireFor && <EnquiryModal listing={enquireFor} onClose={() => setEnquireFor(null)} user={user} />}
    </>
  );
};

export default BuyPage;
