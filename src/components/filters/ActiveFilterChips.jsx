'use client';
import { getActiveFilterChips } from '../../lib/activeFilterChips';

// Removable-pill summary of every active filter, rendered in the main
// results column (not the sidebar) so it's visible without scrolling a
// 40-field rail. This is the single biggest gap in the pre-2026 filter
// UX: applying "Category: Turboprop" + "Price: $500k+" + "IFR equipped"
// left zero visible trace outside the sidebar — a user landing mid-scroll
// on the results grid had no way to see (or undo) what was narrowing
// their search.
//
// Fully data-driven from getActiveFilterChips — covers all 40+ reducer
// fields including the auth-gated advanced sections, so nothing that can
// be filtered is invisible here.
export default function ActiveFilterChips({ state, dispatch, onClearAll }) {
  const chips = getActiveFilterChips(state);
  if (chips.length === 0) return null;

  return (
    // Real <ul>/<li> rather than role="list"/"listitem" on the buttons
    // themselves — an explicit role="listitem" on a <button> would
    // override its implicit button role, so screen readers would announce
    // "list item" instead of "button" for something that's clickable.
    <ul className="fs-chips" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.id}>
          <button
            type="button"
            className="fs-chip"
            onClick={() => dispatch(chip.action)}
            aria-label={`Remove filter: ${chip.label}`}
          >
            <span className="fs-chip-label" aria-hidden="true">{chip.label}</span>
            <span className="fs-chip-x" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          </button>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <button type="button" className="fs-chip fs-chip-clear-all" onClick={onClearAll}>
            Clear all
          </button>
        </li>
      )}
    </ul>
  );
}
