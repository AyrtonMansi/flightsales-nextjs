'use client';

const EmptyState = ({ title, description, searchQuery, activeFilters, onClearFilters, onBrowseAll }) => (
  <div className="fs-empty" style={{ padding: "60px 20px", textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fs-ink)", marginBottom: 8, letterSpacing: "-0.02em" }}>
      {title}
    </div>

    <p style={{
      color: 'var(--fs-ink-3)',
      fontSize: 14,
      maxWidth: 400,
      // margin shorthand previously read '0 auto 20' — missing the
      // unit on `20` made the whole declaration invalid in the
      // browser, which silently dropped the horizontal `auto`
      // margins and left-aligned the block inside its centred
      // parent. Explicit px fixes the centering.
      margin: '0 auto 20px',
      lineHeight: 1.5,
      // Balance line breaks so a 2-line wrap doesn't leave a single
      // short orphan word on the second line.
      textWrap: 'balance',
    }}>
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
