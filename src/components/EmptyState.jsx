'use client';

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

export default EmptyState;
