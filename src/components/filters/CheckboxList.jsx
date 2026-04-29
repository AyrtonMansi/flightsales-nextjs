'use client';
import { useMemo, useState } from 'react';

// Vertical checkbox list with optional inline counts and a "Show N more"
// truncation. The pattern is consistent across every multi-pick filter in
// the column — Category, Make, Engine type, Avionics, etc. — so the column
// reads as one rhythm top to bottom.
//
// Props:
//   options    — array of {value, label, count?}; count is optional
//   selected   — array of currently selected values
//   onToggle   — (value) => void
//   maxVisible — collapse beyond this many; user clicks "Show N more"
//   searchable — render a small "Filter <name>" input above the list
//   searchKey  — placeholder for the filter input ("Filter makes" etc.)
export default function CheckboxList({
  options,
  selected,
  onToggle,
  maxVisible = 5,
  searchable = false,
  searchKey = '',
}) {
  const [expanded, setExpanded] = useState(false);
  const [filterText, setFilterText] = useState('');

  const visible = useMemo(() => {
    let list = options;
    if (filterText) {
      const q = filterText.toLowerCase();
      list = list.filter(o => o.label.toLowerCase().includes(q));
    }
    if (!expanded && list.length > maxVisible) {
      list = list.slice(0, maxVisible);
    }
    return list;
  }, [options, filterText, expanded, maxVisible]);

  const hidden = Math.max(0, options.length - visible.length - (filterText ? 0 : 0));
  const moreCount = expanded || filterText
    ? 0
    : Math.max(0, options.length - maxVisible);

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
        return (
          <label key={opt.value} className={`fs-fc-checkrow${isOn ? ' on' : ''}`}>
            <input
              type="checkbox"
              checked={isOn}
              onChange={() => onToggle(opt.value)}
            />
            <span className="fs-fc-checkrow-label">{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span className="fs-fc-checkrow-count">{opt.count}</span>
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
