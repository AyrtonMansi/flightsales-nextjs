'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import AircraftImage from '../AircraftImage';
import HeroSearchPro from '../hero/HeroSearchPro';
import HeroIllustration from '../hero/HeroIllustration';
import { useAircraft, useFeaturedAircraft, useLatestAircraft, useDealers, useNews } from '../../lib/hooks';
import { useRotatingPlaceholder, AI_SEARCH_EXAMPLES } from '../../lib/useRotatingPlaceholder';
import { parseAiQuery } from '../../lib/parseAiQuery';
import { formatPriceFull } from '../../lib/format';

const RECENT_SEARCHES_KEY = 'flightsales.recentSearches.v1';

const COLD_CTA_BASE = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 48,
  padding: '0 26px', borderRadius: 'var(--fs-radius)', fontSize: 15, fontWeight: 600,
  letterSpacing: '-0.01em', textDecoration: 'none', whiteSpace: 'nowrap',
};
const COLD_CTA_PRIMARY = { ...COLD_CTA_BASE, background: 'var(--fs-ink)', color: '#fff', border: '1px solid var(--fs-ink)' };
const COLD_CTA_SECONDARY = { ...COLD_CTA_BASE, background: 'var(--fs-bg-2)', color: 'var(--fs-ink)', border: '1px solid var(--fs-line)' };

const SUGGESTED_SEARCHES = [
  { id: 'suggest-r44-au', label: 'Robinson R44 Australia', filters: { query: 'Robinson R44' } },
  { id: 'suggest-sr22-budget', label: 'Cirrus SR22 under $900k', filters: { query: 'Cirrus SR22', maxPrice: '900000' } },
  { id: 'suggest-turboprop-qld', label: 'Turboprop Queensland', filters: { cat: 'Turboprop', state: 'QLD', query: '' } },
];

const SectionHead = ({ title, subtitle, href = '/buy', linkLabel = 'View all' }) => (
  <div className="fs-section-header">
    <div>
      <h2 className="fs-section-title">{title}</h2>
      {subtitle && <p className="fs-section-sub">{subtitle}</p>}
    </div>
    <Link href={href} className="fs-section-link">{linkLabel} {Icons.arrowRight}</Link>
  </div>
);

function cleanText(value) {
  return String(value || '').replace(/^(state:|country:)/, '').trim();
}

function buildManualSearchLabel({ cat, make, state, country, yearFrom, yearTo, priceFrom, priceTo }) {
  const parts = [];
  if (make) parts.push(make);
  if (cat && !make) parts.push(cat);
  if (state) parts.push(state);
  if (country) parts.push(country);
  if (yearFrom || yearTo) parts.push(`${yearFrom || 'Any'}–${yearTo || 'Now'}`);
  if (priceFrom || priceTo) {
    const min = priceFrom ? `$${Number(priceFrom).toLocaleString()}` : 'Any';
    const max = priceTo ? `$${Number(priceTo).toLocaleString()}` : 'Any';
    parts.push(`${min}–${max}`);
  }
  return parts.length ? parts.join(' · ') : 'All aircraft';
}

const ThinSectionShell = ({ title, action, children, mutedLabel }) => (
  <section className="fs-home-thin-section">
    <div className="fs-container">
      <div className="fs-home-thin-shell">
        <div className="fs-home-thin-head">
          <div className="fs-home-thin-title-wrap">
            <h2>{title}</h2>
            {mutedLabel && <span>{mutedLabel}</span>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  </section>
);

const RecentSearchesRail = ({ recentSearches, onRun, onClear }) => {
  const hasRecent = recentSearches.length > 0;
  const cards = hasRecent ? recentSearches.slice(0, 5) : SUGGESTED_SEARCHES;
  return (
    <ThinSectionShell
      title="Recent searches"
      mutedLabel={hasRecent ? null : 'Suggested'}
      action={hasRecent ? <button type="button" className="fs-home-thin-action" onClick={onClear}>Clear</button> : <span className="fs-home-thin-action is-muted">Builds as you search</span>}
    >
      <div className="fs-recent-search-row" role="list" aria-label={hasRecent ? 'Recent aircraft searches' : 'Suggested aircraft searches'}>
        {cards.map((item) => (
          <button
            key={item.id || item.label}
            type="button"
            role="listitem"
            className="fs-recent-search-card"
            onClick={() => onRun(item)}
          >
            <span className="fs-recent-search-icon">{Icons.search}</span>
            <span className="fs-recent-search-text">{item.label}</span>
            <span className="fs-recent-search-arrow" aria-hidden="true">{Icons.arrowRight}</span>
          </button>
        ))}
      </div>
    </ThinSectionShell>
  );
};

const SavedAircraftRail = ({ savedListings = [], onBrowse }) => {
  const savedPreview = savedListings.filter(Boolean).slice(0, 4);
  return (
    <ThinSectionShell
      title="Saved aircraft"
      action={savedPreview.length > 0
        ? <Link href="/dashboard" className="fs-home-thin-action">View saved</Link>
        : <button type="button" className="fs-home-thin-action" onClick={onBrowse}>Browse aircraft</button>}
    >
      {savedPreview.length > 0 ? (
        <div className="fs-saved-aircraft-row" role="list" aria-label="Saved aircraft">
          {savedPreview.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`} className="fs-saved-aircraft-card" role="listitem">
              <AircraftImage listing={listing} size="sm" className="fs-saved-aircraft-thumb" />
              <div className="fs-saved-aircraft-copy">
                <div className="fs-saved-aircraft-title">{listing.title}</div>
                <div className="fs-saved-aircraft-price">{formatPriceFull(listing.price)}</div>
                <div className="fs-saved-aircraft-meta">{[listing.city, listing.state].filter(Boolean).join(', ') || 'Location on listing'}</div>
              </div>
              <span className="fs-saved-aircraft-heart" aria-hidden="true">{Icons.heartFull}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="fs-saved-empty-strip">
          <span className="fs-saved-empty-icon">{Icons.heart}</span>
          <div>
            <strong>Save aircraft to compare and revisit later.</strong>
            <span> Your shortlist will appear here when you start saving listings.</span>
          </div>
        </div>
      )}
    </ThinSectionShell>
  );
};

const HomePage = ({ setPage, savedIds, savedListings = [], onSave, setSearchFilters, initialHomeData }) => {
  const [searchCat, setSearchCat] = useState('');
  const [searchMake, setSearchMake] = useState('');
  const [searchState, setSearchState] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

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

  const marketplaceIsEmpty = !showFeaturedLoading && !showLatestLoading && featured.length === 0 && latest.length === 0 && totalListings === 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setRecentSearches(parsed.filter(item => item?.label && item?.filters).slice(0, 8));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const saveRecentSearch = (entry) => {
    if (!entry?.label) return;
    const nextEntry = { ...entry, id: entry.id || `${entry.label}-${Date.now()}`, updatedAt: Date.now() };
    setRecentSearches(prev => {
      const next = [nextEntry, ...prev.filter(item => item.label !== nextEntry.label)].slice(0, 8);
      if (typeof window !== 'undefined') {
        try { window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  };

  const runSearch = (item) => {
    if (!item?.filters) return;
    if (setSearchFilters) setSearchFilters(item.filters);
    if (!String(item.id || '').startsWith('suggest-')) saveRecentSearch(item);
    setPage('buy');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(RECENT_SEARCHES_KEY); } catch {}
    }
  };

  const handleAiSearch = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const filters = parseAiQuery(trimmed);
    if (setSearchFilters) setSearchFilters(filters);
    saveRecentSearch({ label: trimmed, filters });
    setPage('buy');
  };

  const handleManualSearch = () => {
    let stateCode = '';
    let countryCode = '';
    if (typeof searchState === 'string') {
      if (searchState.startsWith('state:')) stateCode = searchState.slice(6);
      else if (searchState.startsWith('country:')) countryCode = searchState.slice(8);
      else if (searchState) stateCode = searchState;
    }
    const filters = { cat: searchCat, make: searchMake, state: stateCode, country: countryCode, yearFrom, yearTo, priceFrom, priceTo, query: '' };
    if (setSearchFilters) setSearchFilters(filters);
    saveRecentSearch({
      label: buildManualSearchLabel({ cat: searchCat, make: searchMake, state: cleanText(stateCode), country: cleanText(countryCode), yearFrom, yearTo, priceFrom, priceTo }),
      filters,
    });
    setPage('buy');
  };

  const rotatingPlaceholder = useRotatingPlaceholder(AI_SEARCH_EXAMPLES);
  const searchModel = {
    searchCat, setSearchCat, searchMake, setSearchMake, searchState, setSearchState,
    yearFrom, setYearFrom, yearTo, setYearTo, priceFrom, setPriceFrom, priceTo, setPriceTo,
    aiQuery, setAiQuery, rotatingPlaceholder, onAiSearch: handleAiSearch, onManualSearch: handleManualSearch,
  };

  return (
    <>
      {/* Hero search/copy are intentionally unchanged; only the campaign SVG asset changed. */}
      <section className="fs-hero fs-hero-v3">
        <div className="fs-container">
          <div className="fs-hero-v3-grid">
            <div className="fs-hero-v3-left">
              <h1>Find your <em>next</em> aircraft.</h1>
              <p className="fs-hero-sub">Browse aircraft listings from aviation businesses and private sellers.</p>
              <HeroSearchPro model={searchModel} />
            </div>
            <div className="fs-hero-v3-right" aria-hidden="true"><HeroIllustration /></div>
          </div>
        </div>
      </section>

      <div className="fs-home-utility-stack">
        <RecentSearchesRail recentSearches={recentSearches} onRun={runSearch} onClear={clearRecentSearches} />
        <SavedAircraftRail savedListings={savedListings} onBrowse={() => setPage('buy')} />
      </div>

      {marketplaceIsEmpty ? (
        <section className="fs-section fs-home-first-section">
          <div className="fs-container">
            <div className="fs-home-launch-panel">
              <span className="fs-home-kicker">FlightSales is now onboarding</span>
              <h2 className="fs-section-title">The first aircraft listed here could be yours</h2>
              <p>List free during launch, reach aviation buyers directly, and manage enquiries from one account.</p>
              <div className="fs-home-launch-actions">
                <Link href="/sell" style={COLD_CTA_PRIMARY}>List your aircraft</Link>
                <Link href="/login" style={COLD_CTA_SECONDARY}>Create free account</Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="fs-section fs-home-first-section">
            <div className="fs-container">
              <SectionHead title="Just listed" subtitle="Fresh aircraft from across the marketplace." />
              {showLatestLoading ? (
                <div className="fs-grid">{[1,2,3].map(i => <div key={i} className="fs-card-skeleton" />)}</div>
              ) : latest.length === 0 ? (
                <div className="fs-home-empty">No new listings yet.</div>
              ) : (
                <div className="fs-grid">{latest.map(l => <ListingCard key={l.id} listing={l} onSave={onSave} saved={savedIds.has(l.id)} />)}</div>
              )}
            </div>
          </section>

          {featured.length > 0 && (
            <section className="fs-section fs-section-alt">
              <div className="fs-container">
                <SectionHead title="Featured aircraft" subtitle="A small selection of highlighted listings." />
                {showFeaturedLoading ? <div className="fs-grid">{[1,2,3].map(i => <div key={i} className="fs-card-skeleton" />)}</div> :
                  <div className="fs-grid">{featured.map(l => <ListingCard key={l.id} listing={l} onSave={onSave} saved={savedIds.has(l.id)} />)}</div>}
              </div>
            </section>
          )}
        </>
      )}

      {displayDealers.length > 0 && (
        <section className="fs-section">
          <div className="fs-container">
            <SectionHead title="Verified aviation businesses" subtitle="Dealer profiles verified through FlightSales business checks." href="/dealers" linkLabel="Browse dealers" />
            <div className="fs-home-dealer-grid">
              {displayDealers.slice(0, 6).map(d => (
                <Link key={d.id} href={`/dealers/${d.id}`} className="fs-dealer-card fs-home-dealer-card">
                  <div className="fs-dealer-avatar">{d.logo || d.name?.slice(0,2)?.toUpperCase()}</div>
                  <div className="fs-dealer-info">
                    <div className="fs-dealer-name">{d.name}</div>
                    {d.location && <div className="fs-dealer-loc">{Icons.location} {d.location}</div>}
                    <div className="fs-home-dealer-meta">
                      {Number.isFinite(Number(d.listings)) && <span>{d.listings} active {Number(d.listings) === 1 ? 'listing' : 'listings'}</span>}
                      {d.verified === true && <span className="fs-home-verified">{Icons.shield} Verified profile</span>}
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
            <SectionHead title="Aviation news" subtitle="Selected market, industry and regulatory updates." href="/news" linkLabel="All articles" />
            <div className="fs-home-news-grid">
              {displayNews.slice(0, 3).map(a => (
                <Link key={a.id} href="/news" className="fs-news-card fs-home-news-card">
                  <span className={`fs-news-tag ${String(a.category || '').toLowerCase()}`}>{a.category}</span>
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
