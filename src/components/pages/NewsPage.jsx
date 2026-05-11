'use client';
import { useState } from 'react';
import { useNews } from '../../lib/hooks';

const NewsPage = () => {
  const { articles: dbArticles, loading } = useNews(20);
  // Real DB articles only — the placeholder NEWS_ARTICLES seed was
  // retired pre-launch. Empty state below covers the no-articles case.
  const articles = dbArticles;
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
          ) : filteredArticles.length === 0 ? (
            <div style={{
              padding: '48px 32px',
              textAlign: 'center',
              border: '1px solid var(--fs-line)',
              borderRadius: 'var(--fs-radius-lg)',
              background: 'var(--fs-bg-2)',
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No articles yet</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-ink-3)', maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
                We&apos;re lining up the first wave of aviation news. Check back
                soon for market reports, regulatory updates, and industry stories.
              </p>
            </div>
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

export default NewsPage;
