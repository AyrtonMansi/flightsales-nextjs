'use client';

import { useReducer, useRef } from 'react';
import { Icons } from './Icons';
import FilterColumn from './filters/FilterColumn';
import { useDialog } from '../lib/useDialog';
import { useAircraft } from '../lib/hooks';
import { filterReducer, initialFilters, toQueryFilters, countActiveTotal } from '../lib/filterReducer';

export default function MobileFilterSheet(props) {
  if (!props.open) return null;
  return <OpenFilterSheet {...props} />;
}

function OpenFilterSheet({ onClose, state, dispatch, user }) {
  const sheetRef = useRef(null);
  const [draft, draftDispatch] = useReducer(filterReducer, state);
  useDialog({ open: true, onClose, containerRef: sheetRef });

  // Mobile filters are deliberately staged: users can make several changes
  // without the results page shifting behind the sheet. We still calculate
  // the prospective count so the primary CTA communicates the consequence
  // before Apply. TBO remaining is derived client-side today, so that one
  // case intentionally fetches the full narrowed set for an accurate count;
  // all normal filters request a single row + exact DB count.
  const draftQuery = toQueryFilters(draft);
  const countQuery = draft.tboPctMin
    ? draftQuery
    : { ...draftQuery, page: 1, pageSize: 1 };
  const { total: prospectiveTotal, loading: countLoading } = useAircraft(countQuery);
  const activeCount = Math.max(0, countActiveTotal(draft) - (draft.search ? 1 : 0));

  const clearDraft = () => {
    draftDispatch({
      type: 'HYDRATE',
      payload: { ...initialFilters, search: draft.search, sortBy: draft.sortBy },
    });
  };

  const apply = () => {
    dispatch({ type: 'HYDRATE', payload: draft });
    onClose();
  };

  return (
    <div className="fs-mfs-root">
      <button className="fs-mfs-backdrop" type="button" aria-label="Close filters" onClick={onClose} />
      <section ref={sheetRef} className="fs-mfs-panel" role="dialog" aria-modal="true" aria-labelledby="fs-mfs-title">
        <header className="fs-mfs-header">
          <div>
            <h2 id="fs-mfs-title">Filters</h2>
            <p>{activeCount > 0 ? `${activeCount} active` : 'Refine aircraft results'}</p>
          </div>
          <button type="button" className="fs-mfs-close" onClick={onClose} aria-label="Close filters">
            {Icons.x}
          </button>
        </header>

        <div className="fs-mfs-body">
          <FilterColumn state={draft} dispatch={draftDispatch} total={prospectiveTotal} user={user} />
        </div>

        <footer className="fs-mfs-footer">
          <button type="button" className="fs-mfs-clear" onClick={clearDraft} disabled={activeCount === 0}>
            Clear all
          </button>
          <button type="button" className="fs-mfs-apply" onClick={apply}>
            {countLoading
              ? 'Updating…'
              : `Show ${Number(prospectiveTotal || 0).toLocaleString()} ${prospectiveTotal === 1 ? 'aircraft' : 'aircraft'}`}
          </button>
        </footer>
      </section>

      <style jsx>{`
        .fs-mfs-root { position: fixed; inset: 0; z-index: 1000; }
        .fs-mfs-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: rgba(0,0,0,.42); cursor: default; }
        .fs-mfs-panel { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--fs-white); color: var(--fs-ink); }
        .fs-mfs-header { min-height: 72px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--fs-line); background: var(--fs-white); flex-shrink: 0; }
        .fs-mfs-header h2 { margin: 0; font-size: 18px; line-height: 1.2; font-weight: 700; letter-spacing: -.02em; }
        .fs-mfs-header p { margin: 3px 0 0; color: var(--fs-ink-4); font-size: 11.5px; font-weight: 500; }
        .fs-mfs-close { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--fs-bg-2); color: var(--fs-ink); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
        .fs-mfs-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
        .fs-mfs-footer { padding: 12px 16px max(12px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: auto minmax(0,1fr); align-items: center; gap: 14px; border-top: 1px solid var(--fs-line); background: rgba(255,255,255,.96); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); flex-shrink: 0; }
        .fs-mfs-clear { min-height: 48px; padding: 0 8px; border: 0; background: none; color: var(--fs-ink-2); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .fs-mfs-clear:disabled { color: var(--fs-ink-4); cursor: default; opacity: .55; }
        .fs-mfs-apply { min-height: 50px; border: 0; border-radius: 8px; background: var(--fs-ink); color: white; font: inherit; font-size: 14px; font-weight: 700; letter-spacing: -.01em; cursor: pointer; padding: 0 20px; }
        .fs-mfs-apply:active { transform: translateY(1px); }
        @media (min-width: 769px) { .fs-mfs-root { display: none; } }
        @media (prefers-reduced-motion: reduce) { .fs-mfs-apply:active { transform: none; } }
      `}</style>
    </div>
  );
}
