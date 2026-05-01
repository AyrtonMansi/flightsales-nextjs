'use client';

// Thin sub-header strip sitting directly below the main Nav on mobile.
// Hosts secondary actions that should stay one tap away without
// living inside the burger drawer — currently just the "Sell aircraft"
// CTA, but the row can hold more chips later (e.g. Saved, Compare).
//
// Hidden on desktop (≥768px) via CSS — the desktop nav already has
// a "List Aircraft" pill in the header actions area.

export default function MobileSubBar({ setPage }) {
  return (
    <div className="fs-mobile-subbar" aria-label="Quick actions">
      <button
        type="button"
        className="fs-mobile-subbar-link"
        onClick={() => setPage('sell')}
      >
        Sell aircraft →
      </button>
    </div>
  );
}
