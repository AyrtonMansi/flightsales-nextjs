'use client';
import { useMemo, useState } from 'react';

// Vertical checkbox list with optional inline counts and a "Show N more"
// truncation. The pattern is consistent across every multi-pick filter in
// the column — Category, Make, Engine type, Avionics, etc. — so the column
// reads as one rhythm top to bottom.
//
// Props:
//   options          — [{ value, label, count? }]
//   selected         — array of currently selected values
//   onToggle         — (value) => void
//   maxVisible       — collapse beyond this many; user clicks "Show N more"
//   searchable       — render a small "Filter <name>" input above the list
//   searchKey        — placeholder for the filter input ("Filter makes" etc.)
//   collapseZero     — when true, options with count===0 sink behind the
//                      "Show more" toggle even if maxVisible isn't hit.
//                      Selected options always stay visible.
export default function CheckboxList({
  options,
  selected,
  onToggle,
  maxVisible = 5,
  searchable = false,
  searchKey = '',
  collapseZero = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Split active vs zero-count when collapseZero is on. Selected entries
  // are pinned into "active" so the user can always see / uncheck them.
  const { active, dormant } = useMemo(() => {
    if (!collapseZero) return { active: options, dormant: [] };
    const selectedSet = new Set(selected);
    const a = [];
    const d = [];
    for (const opt of options) {
      const c = opt.count ?? 0;
      if (c > 0 || selectedSet.has(opt.value)) a.push(opt);
      else d.push(opt);
    }
    return { active: a, dormant: d };
  }, [options, selected, collapseZero]);

  const visible = useMemo(() => {
    // When user has expanded OR is searching, show everything from active
    // + dormant that matches. Otherwise show first `maxVisible` from active.
    if (filterText) {
      const q = filterText.toLowerCase();
      return [...active, ...dormant].filter(o => o.label.toLowerCase().includes(q));
    }
    if (expanded) return [...active, ...dormant];
    // Empty-marketplace fallback: with zero stock, collapseZero would sink
    // EVERY option behind "Show N more" and the rail would render nothing
    // but toggle buttons — which reads as broken. Show the first
    // `maxVisible` dormant options (grayed via the zero style) instead.
    if (active.length === 0) return dormant.slice(0, maxVisible);
    return active.slice(0, maxVisible);
  }, [active, dormant, filterText, expanded, maxVisible]);

  // "Show N more" button reveals whatever the default view truncated.
  const moreCount = (expanded || filterText)
    ? 0
    : active.length === 0
      ? Math.max(0, dormant.length - maxVisible)
      : Math.max(0, active.length - maxVisible) + dormant.length;

  return (
    <div className="fs-fc-checklist">
      {searchable && options.length > maxVisible && (
        <div className="fs-fc-checklist-search">
          <input
            type="text"
            placeholder={searchKey || 'Filter'}
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            aria-label={searchKey || 'Filter list'}
          />
        </div>
      )}
      {visible.map(opt => {
        const isOn = selected.includes(opt.value);
        const isZero = typeof opt.count === 'number' && opt.count === 0 && !isOn;
        return (
          <label
            key={opt.value}
            className={`fs-fc-checkrow${isOn ? ' on' : ''}${isZero ? ' zero' : ''}`}
          >
            <input
              type="checkbox"
              checked={isOn}
              onChange={() => onToggle(opt.value)}
            />
            <span className="fs-fc-checkrow-label">{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span className="fs-fc-checkrow-count" aria-label={`${opt.count} listings`}>
                {opt.count.toLocaleString()}
              </span>
            )}
          </label>
        );
      })}
      {visible.length === 0 && filterText && (
        <p className="fs-fc-empty">No matches</p>
      )}
      {moreCount > 0 && (
        <button
          type="button"
          className="fs-fc-more"
          onClick={() => setExpanded(true)}
        >
          Show {moreCount} more
        </button>
      )}
      {expanded && options.length > maxVisible && (
        <button
          type="button"
          className="fs-fc-more"
          onClick={() => setExpanded(false)}
        >
          Show less
        </button>
      )}
    </div>
  );
}
