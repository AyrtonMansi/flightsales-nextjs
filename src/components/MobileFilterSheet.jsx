'use client';

const MobileFilterSheet = ({ isOpen, onClose, children, filteredCount, onClear }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '85vh',
        background: 'var(--fs-white)',
        borderRadius: '16px 16px 0 0',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Sticky header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--fs-line)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Filters</span>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--fs-bg-2)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close filters"
          >
            {Icons.x}
          </button>
        </div>

        {/* Scrollable filter body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
          {children}
        </div>

        {/* Sticky footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderTop: '1px solid var(--fs-line)',
          gap: 16,
          flexShrink: 0,
          background: 'var(--fs-white)'
        }}>
          <button
            onClick={onClear}
            style={{
              fontSize: 14, fontWeight: 500, color: 'var(--fs-ink-3)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 0', textDecoration: 'underline'
            }}
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: 'var(--fs-ink)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--fs-radius-pill)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 48
            }}
          >
            Show {filteredCount} {filteredCount === 1 ? 'aircraft' : 'aircraft'}
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileFilterSheet;
