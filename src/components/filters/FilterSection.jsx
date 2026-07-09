'use client';
import { useState } from 'react';

// Collapsible section in the filter column. Uses a controlled <button> +
// conditional body rather than <details> so we can render the active-count
// dot in the header alongside the chevron and animate independently.
//
// Props:
//   title         — header text
//   icon          — optional JSX icon rendered before the title (from the
//                   shared Icons module — keeps the section header visually
//                   scannable in a long rail of otherwise-identical rows)
//   activeCount   — number; if > 0, renders the small dot + count
//   defaultOpen   — initial expansion (default: false)
//   onReset       — optional callback; renders "Reset section" when active
//   locked        — boolean; if true, header is non-interactive (auth gate)
export default function FilterSection({
  title,
  icon,
  activeCount = 0,
  defaultOpen = false,
  onReset,
  locked = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = !locked && open;

  return (
    <div className="fs-fc-section">
      <button
        type="button"
        className="fs-fc-section-head"
        aria-expanded={isOpen}
        onClick={() => !locked && setOpen(o => !o)}
        disabled={locked}
      >
        <span className="fs-fc-chev" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
        {icon && <span className="fs-fc-section-icon" aria-hidden="true">{icon}</span>}
        <span className="fs-fc-section-title">{title}</span>
        {activeCount > 0 && (
          <span className="fs-fc-section-badge" aria-label={`${activeCount} active`}>
            <span className="fs-fc-badge-dot" /> {activeCount}
          </span>
        )}
      </button>
      {isOpen && (
        // key={title} forces a fresh mount (and re-fires the entrance
        // animation) each time a section opens, rather than only on the
        // component's first ever render.
        <div className="fs-fc-section-body fs-anim-fade-up" key={title} style={{ animationDuration: '0.28s' }}>
          {children}
          {activeCount > 0 && onReset && (
            <button type="button" className="fs-fc-section-reset" onClick={onReset}>
              Reset section
            </button>
          )}
        </div>
      )}
    </div>
  );
}
