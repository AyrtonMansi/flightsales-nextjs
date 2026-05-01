'use client';

// Tiny pill that flips between Classic and Pro hero cards. Sits above the
// search card during the A/B-test phase so we can compare the two designs
// at a glance. Once we pick a winner this component (and the unused
// variant) gets removed in one PR.

export default function HeroVariantToggle({ variant, setVariant }) {
  return (
    <div className="fs-hero-variant" role="tablist" aria-label="Hero search design">
      <button
        type="button"
        role="tab"
        aria-selected={variant === 'classic'}
        className={`fs-hero-variant-btn${variant === 'classic' ? ' on' : ''}`}
        onClick={() => setVariant('classic')}
      >
        Classic
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={variant === 'pro'}
        className={`fs-hero-variant-btn${variant === 'pro' ? ' on' : ''}`}
        onClick={() => setVariant('pro')}
      >
        New <span className="fs-hero-variant-badge">2026</span>
      </button>
    </div>
  );
}
