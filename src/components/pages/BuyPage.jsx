'use client';
import { useReducer, useEffect, useMemo, useState, useRef } from 'react';
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
import ActiveFilterChips from '../filters/ActiveFilterChips';
import { track } from '../../lib/analytics';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import {
  initialFilters, filterReducer, toQueryFilters, countActiveTotal,
  filtersToSearchParams, searchParamsToFilters, hasFilterParams,
} from '../../lib/filterReducer';

const PAGE_SIZE = 12;

function aiResultToState(parsed, base) {
  return {
    ...base,
    search: parsed.query || base.search,
    categories: parsed.cat ? [parsed.cat] : base.categories,
    manufacturers: parsed.make ? [parsed.make] : base.manufacturers,
    states: parsed.state ? [parsed.state] : base.states,
    countries: parsed.country ? [parsed.country] : base.countries,
    conditions: parsed.cond ? [parsed.cond] : base.conditions,
    minPrice: parsed.minPrice || base.minPrice,
    maxPrice: parsed.maxPrice || base.maxPrice,
    maxHours: parsed.maxHours || base.maxHours,
    ifrOnly: parsed.ifrOnly || base.ifrOnly,
    glassOnly: parsed.glassOnly || base.glassOnly,
  };
}

const BuyPage = ({ setSelectedListing, savedIds, onSave, initialFilters: initialFiltersProp, user, setPage }) => {
  const seeded = useMemo(() => {
    if (!initialFiltersProp) return initialFilters;
    return aiResultToState({
      cat: initialFiltersProp.cat,
      make: initialFiltersProp.make,
      state: initialFiltersProp.state,
      country: initialFiltersProp.country,
      cond: initialFiltersProp.cond,
      minPrice: initialFiltersProp.minPrice,
      maxPrice: initialFiltersProp.maxPrice,
      maxHours: initialFiltersProp.maxHours,
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

  const urlHydratedRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (hasFilterParams(params)) {
      dispatch({ type: 'HYDRATE', payload: searchParamsToFilters(params, initialFilters) });
      const q = params.get('q');
      if (q) setAiQuery(q);
    }
    urlHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!urlHydratedRef.current) return;
    const t = setTimeout(() => {
      const qs = filtersToSearchParams(state).toString();
      const url = qs ? `/buy?${qs}` : '/buy';
      if (url !== window.location.pathname + window.location.search) {
        window.history.replaceState(null, '', url);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [state]);

  const filterSignature = filtersToSearchParams(state).toString();
  useEffect(() => { setResultPage(1); }, [filterSignature]);

  const debouncedSearch = useDebouncedValue(state.search, 300);
  // Most searches page in Supabase instead of loading the entire matching
  // catalogue into the browser. TBO-remaining is currently a derived client
  // calculation in useAircraft; until it moves to a DB expression/RPC, that
  // one advanced filter deliberately falls back to the full result set so it
  // remains correct rather than presenting a false server count.
  const clientPagedTboFilter = !!state.tboPctMin;
  const queryFilters = useMemo(
    () => ({
      ...toQueryFilters(state),
      search: debouncedSearch || undefined,
      ...(clientPagedTboFilter ? {} : { page: resultPage, pageSize: PAGE_SIZE }),
    }),
    [state, debouncedSearch, resultPage, clientPagedTboFilter],
  );
  const { aircraft: dbAircraft, loading: dbLoading, total: dbTotal, error: dbError } = useAircraft(queryFilters);
  const { total: systemTotal } = useAircraft({ page: 1, pageSize: 1 });

  const handleAiSearch = (query) => {
    if (!query.trim()) return;
    const parsed = parseAiQuery(query);
    dispatch({ type: 'HYDRATE', payload: aiResultToState(parsed, initialFilters) });
    setAiQuery(query);
    track('search_submit', { source: 'buy_ai', len: query.trim().length });
  };

  const activeFilterCount = countActiveTotal(state);
  const resultTotal = clientPagedTboFilter ? dbAircraft.length : dbTotal;
  const totalPages = Math.max(1, Math.ceil(resultTotal / PAGE_SIZE));
  const pageRows = clientPagedTboFilter
    ? dbAircraft.slice((resultPage - 1) * PAGE_SIZE, resultPage * PAGE_SIZE)
    : dbAircraft;

  // If catalogue changes underneath a paged search and the current page is
  // now beyond the end, recover automatically instead of displaying an empty
  // result grid with a non-zero total.
  useEffect(() => {
    if (!dbLoading && resultPage > totalPages) setResultPage(totalPages);
  }, [dbLoading, resultPage, totalPages]);

  return (
    <>
      <div className="fs-container">
        <div className="fs-buy-shell">
          <aside className={`fs-buy-sidebar${sideOpen ? ' open' : ''}`}>
            <div className="fs-buy-sidebar-inner">
              <FilterColumn state={state} dispatch={dispatch} total={resultTotal} user={user} />
            </div>
          </aside>

          <main className="fs-buy-main">
            <div style={{ padding: "24px 0 16px", borderBottom: "1px solid var(--fs-line)", marginBottom: 20 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Aircraft for sale</h1>
              <p style={{ fontSize: 14, color: "var(--fs-ink-3)", margin: 0 }}>
                {systemTotal > 0 ? `${systemTotal.toLocaleString()} active listings` : 'Browse active dealer and private listings'}
              </p>
            </div>

            <div className="fs-buy-main-search">
              <div className="fs-buy-search-input-wrap">
                <span className="fs-buy-search-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.8 11.8 19 13" /><path d="M15 9h.01" /><path d="M17.8 6.2 19 5" /><path d="M3 21l9-9" /><path d="M12.2 6.2 11 5" />
                  </svg>
                </span>
                <input
                  className="fs-search-inline-input"
                  placeholder={rotatingPlaceholder || 'Search make, model or aircraft'}
                  value={state.search}
                  onChange={e => dispatch({ type: 'SET', field: 'search', value: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter' && e.target.value) handleAiSearch(e.target.value); }}
                  aria-label="Search aircraft"
                />
                {state.search ? (
                  <button type="button" onClick={() => { dispatch({ type: 'SET', field: 'search', value: '' }); setAiQuery(''); }} className="fs-buy-search-clear" aria-label="Clear search">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                ) : <span className="fs-buy-search-hint">↵ Search</span>}
              </div>
              <button type="button" className="fs-mobile-filter-btn" onClick={() => setSideOpen(!sideOpen)} aria-expanded={sideOpen}>
                {Icons.filter} Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
              </button>
            </div>

            <ActiveFilterChips state={state} dispatch={dispatch} onClearAll={() => { track('filter_reset', { via: 'chips', count: activeFilterCount }); dispatch({ type: 'RESET' }); }} />

            <div className="fs-buy-main-toolbar">
              <span className="fs-results-count" aria-live="polite">
                {dbLoading ? <span style={{ color: 'var(--fs-ink-3)' }}>Searching…</span> : (
                  <>
                    <span style={{ color: 'var(--fs-ink)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>{resultTotal.toLocaleString()}</span>
                    <span style={{ marginLeft: 6 }}>aircraft</span>
                    {aiQuery && <span style={{ color: 'var(--fs-ink-3)', marginLeft: 8, fontStyle: 'italic' }}>for "{aiQuery}"</span>}
                  </>
                )}
              </span>
              {resultTotal > 0 && (
                <div className="fs-results-sort">
                  <label className="fs-results-sort-label" htmlFor="aircraft-sort">Sort by</label>
                  <select id="aircraft-sort" className="fs-sort-select" value={state.sortBy} onChange={e => { dispatch({ type: 'SET', field: 'sortBy', value: e.target.value }); track('sort_change', { sort: e.target.value }); }}>
                    <option value="newest">Newest first</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    <option value="hours-low">Hours: low to high</option>
                  </select>
                </div>
              )}
            </div>

            {dbError ? (
              <div role="alert" style={{ padding: '28px 24px', border: '1px solid var(--fs-line)', borderRadius: 'var(--fs-radius)', marginBottom: 24 }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>Search is temporarily unavailable</strong>
                <span style={{ color: 'var(--fs-ink-3)', fontSize: 14 }}>Please retry in a moment. Your filters are preserved.</span>
              </div>
            ) : dbLoading ? (
              <div className="fs-grid">{[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}</div>
            ) : resultTotal === 0 ? (
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
                    <ListingCard key={l.id} listing={l} onSave={onSave} saved={savedIds.has(l.id)} onQuickLook={(listing) => { track('quicklook_open', { id: listing.id }); setQuickLook(listing); }} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav aria-label="Aircraft results pages" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--fs-line)', flexWrap: 'wrap', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--fs-ink-3)', fontWeight: 500 }}>Page {resultPage} of {totalPages}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button type="button" onClick={() => { setResultPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }} disabled={resultPage === 1} aria-label="Previous page" style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--fs-line)', background: resultPage === 1 ? 'var(--fs-bg-2)' : 'white', cursor: resultPage === 1 ? 'default' : 'pointer', color: resultPage === 1 ? 'var(--fs-ink-4)' : 'var(--fs-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fs-font)' }}>{Icons.chevronLeft}</button>
                      {(() => {
                        const pages = [];
                        const showRange = 5;
                        let start = Math.max(1, resultPage - Math.floor(showRange / 2));
                        let end = Math.min(totalPages, start + showRange - 1);
                        start = Math.max(1, end - showRange + 1);
                        for (let p = start; p <= end; p++) pages.push(p);
                        return pages.map(p => (
                          <button key={p} type="button" onClick={() => { setResultPage(p); window.scrollTo({ top: 200, behavior: 'smooth' }); }} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: p === resultPage ? 'var(--fs-ink)' : 'transparent', color: p === resultPage ? 'white' : 'var(--fs-ink)', fontWeight: p === resultPage ? 600 : 500, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--fs-font)', letterSpacing: '-0.005em' }} aria-label={`Page ${p}`} aria-current={p === resultPage ? 'page' : undefined}>{p}</button>
                        ));
                      })()}
                      <button type="button" onClick={() => { setResultPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }} disabled={resultPage === totalPages} aria-label="Next page" style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--fs-line)', background: resultPage === totalPages ? 'var(--fs-bg-2)' : 'white', cursor: resultPage === totalPages ? 'default' : 'pointer', color: resultPage === totalPages ? 'var(--fs-ink-4)' : 'var(--fs-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fs-font)' }}>{Icons.chevronRight}</button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <MobileFilterSheet open={sideOpen} onClose={() => setSideOpen(false)} state={state} dispatch={dispatch} total={resultTotal} user={user} />
      {quickLook && <QuickLookModal listing={quickLook} onClose={() => setQuickLook(null)} onViewFull={() => { setSelectedListing(quickLook); setQuickLook(null); }} onEnquire={() => { setEnquireFor(quickLook); setQuickLook(null); }} />}
      {enquireFor && <EnquiryModal listing={enquireFor} onClose={() => setEnquireFor(null)} user={user} />}
    </>
  );
};

export default BuyPage;