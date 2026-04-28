'use client';

const CardSkeleton = () => (
  <div className="fs-card" style={{ pointerEvents: 'none' }}>
    <div className="fs-card-image-wrap" style={{ height: '180px', background: 'var(--fs-bg-2)', position: 'relative', overflow: 'hidden' }}>
      <div className="fs-skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
    </div>
    <div className="fs-card-body" style={{ padding: '16px 18px 18px' }}>
      <div className="fs-skeleton-line" style={{ width: '40%', height: 12, marginBottom: 8 }} />
      <div className="fs-skeleton-line" style={{ width: '85%', height: 20, marginBottom: 12 }} />
      <div className="fs-skeleton-line" style={{ width: '60%', height: 28, marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="fs-skeleton-line" style={{ width: '100%', height: 16 }} />
        <div className="fs-skeleton-line" style={{ width: '100%', height: 16 }} />
        <div className="fs-skeleton-line" style={{ width: '100%', height: 16 }} />
        <div className="fs-skeleton-line" style={{ width: '100%', height: 16 }} />
      </div>
    </div>
  </div>
);

export default CardSkeleton;
