'use client';

// Sticky toolbar that lives above an admin table. Centralises the
// search input, optional status pill row, and result count. Used on
// every tab so the chrome is identical and predictable.
//
// Props:
//   search, onSearch — bound to useTableState
//   placeholder
//   statusOptions   — [{value, label, count?}] | null
//   statusValue, onStatusChange
//   filteredCount, totalCount
//   right            — slot for tab-specific actions (export, etc.)
export default function AdminTableToolbar({
  search,
  onSearch,
  placeholder = 'Search…',
  statusOptions = null,
  statusValue,
  onStatusChange,
  filteredCount,
  totalCount,
  right,
}) {
  return (
    <div className="fs-admin-toolbar">
      <div className="fs-admin-toolbar-row">
        <input
          type="text"
          className="fs-admin-search"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search table"
        />
        <span className="fs-admin-result-count">
          <strong>{filteredCount.toLocaleString()}</strong>
          {filteredCount !== totalCount && (
            <span> of {totalCount.toLocaleString()}</span>
          )}
        </span>
        {right && <div className="fs-admin-toolbar-right">{right}</div>}
      </div>
      {statusOptions && (
        <div className="fs-admin-status-row">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`fs-admin-status-pill${statusValue === opt.value ? ' on' : ''}`}
              onClick={() => onStatusChange(opt.value)}
            >
              {opt.label}
              {typeof opt.count === 'number' && (
                <span className="fs-admin-status-pill-count">{opt.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Sortable column header. Renders an indicator chevron for the active sort.
// Usage: <SortHeader field="date" sort={t.sort} onSortChange={t.setSort}>Date</SortHeader>
export function SortHeader({ field, sort, onSortChange, align = 'left', children }) {
  const isActive = sort?.field === field;
  const direction = isActive ? sort.direction : null;
  return (
    <th style={{ textAlign: align }}>
      <button
        type="button"
        className={`fs-admin-sortbtn${isActive ? ' on' : ''}`}
        onClick={() => {
          if (!isActive) onSortChange({ field, direction: 'asc' });
          else if (direction === 'asc') onSortChange({ field, direction: 'desc' });
          else onSortChange(null);
        }}
        aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
      >
        {children}
        <span className="fs-admin-sort-indicator" aria-hidden="true">
          {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '↕'}
        </span>
      </button>
    </th>
  );
}

// Pagination bar used at the bottom of admin tables.
export function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const showRange = 5;
  let start = Math.max(1, page - Math.floor(showRange / 2));
  let end = Math.min(totalPages, start + showRange - 1);
  start = Math.max(1, end - showRange + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  return (
    <div className="fs-admin-pager">
      <button
        type="button"
        className="fs-admin-pager-btn"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
      >‹</button>
      {pages.map(p => (
        <button
          key={p}
          type="button"
          className={`fs-admin-pager-btn${p === page ? ' on' : ''}`}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >{p}</button>
      ))}
      <button
        type="button"
        className="fs-admin-pager-btn"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
      >›</button>
    </div>
  );
}
