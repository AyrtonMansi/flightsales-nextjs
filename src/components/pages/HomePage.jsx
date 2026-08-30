'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import HeroSearchPro from '../hero/HeroSearchPro';
import HeroIllustration from '../hero/HeroIllustration';
import { useAircraft, useFeaturedAircraft, useLatestAircraft, useDealers, useNews } from '../../lib/hooks';
import { useRotatingPlaceholder, AI_SEARCH_EXAMPLES } from '../../lib/useRotatingPlaceholder';
import { parseAiQuery } from '../../lib/parseAiQuery';

const COLD_CTA_BASE = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 48,
  padding: '0 26px', borderRadius: 'var(--fs-radius)', fontSize: 15, fontWeight: 600,
  letterSpacing: '-0.01em', textDecoration: 'none', whiteSpace: 'nowrap',
};
const COLD_CTA_PRIMARY = { ...COLD_CTA_BASE, background: 'var(--fs-ink)', color: '#fff', border: '1px solid var(--fs-ink)' };
const COLD_CTA_SECONDARY = { ...COLD_CTA_BASE, background: 'var(--fs-bg-2)', color: 'var(--fs-ink)', border: '1px solid var(--fs-line)' };

const SectionHead = ({ title, subtitle, href = '/buy', linkLabel = 'View all' }) => (
  <div className="fs-section-header">
    <div>
      <h2 className="fs-section-title">{title}</h2>
      {subtitle && <p className="fs-section-sub">{subtitle}</p>}
    </div>
    <Link href={href} className="fs-section-link">{linkLabel} {Icons.arrowRight}</Link>
  </div>
);

const HomePage = ({ setPage, savedIds, onSave, setSearchFilters, initialHomeData }) => {
  const [searchCat, setSearchCat] = useState('');
  const [searchMake, setSearchMake] = useState('');
  const [searchState, setSearchState] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [aiQuery, setAiQuery] = useState('');

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

  const handleAiSearch = (query) => {
    if (!query.trim()) return;
    if (setSearchFilters) setSearchFilters(parseAiQuery(query));
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
    if (setSearchFilters) setSearchFilters({ cat: searchCat, make: searchMake, state: stateCode, country: countryCode, yearFrom, yearTo, priceFrom, priceTo, query: '' });
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
      {/* Hero is intentionally frozen: headline, copy, search and artwork are unchanged. */}
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
