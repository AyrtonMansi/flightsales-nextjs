'use client';
import { useMemo, useState } from 'react';

// Standard pagination + search + sort state for an admin table. Pulls the
// concerns out of every tab's render so each tab doesn't re-implement them.
//
// Usage:
//   const t = useTableState(rows, {
//     pageSize: 25,
//     searchFields: ['title', 'seller'],
//     defaultSort: { field: 'date', direction: 'desc' },
//   });
//   t.pageRows           — rows to render
//   t.search, t.setSearch
//   t.sort, t.setSort
//   t.page, t.setPage, t.totalPages
//   t.filteredCount, t.totalCount
export default function useTableState(rows, options = {}) {
  const {
    pageSize = 25,
    searchFields = [],
    defaultSort = null,
  } = options;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!search || searchFields.length === 0) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      searchFields.some(f => {
        const v = f.split('.').reduce((acc, key) => acc?.[key], r);
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, search, searchFields]);

  // Sort
  const sorted = useMemo(() => {
    if (!sort?.field) return filtered;
    const dir = sort.direction === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = sort.field.split('.').reduce((acc, k) => acc?.[k], a);
      const bv = sort.field.split('.').reduce((acc, k) => acc?.[k], b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reset page when search/sort changes — prevents landing on an empty page.
  const wrappedSetSearch = (v) => { setSearch(v); setPage(1); };
  const wrappedSetSort = (v) => { setSort(v); setPage(1); };

  return {
    search,
    setSearch: wrappedSetSearch,
    sort,
    setSort: wrappedSetSort,
    page: safePage,
    setPage,
    totalPages,
    pageRows,
    filteredCount: sorted.length,
    totalCount: rows.length,
  };
}

// Toggle the sort direction (or initialise it) for the given field.
// Use it from a column header onClick to get the cycle:
//   unsorted -> asc -> desc -> unsorted
export function nextSort(currentSort, field) {
  if (!currentSort || currentSort.field !== field) {
    return { field, direction: 'asc' };
  }
  if (currentSort.direction === 'asc') {
    return { field, direction: 'desc' };
  }
  return null; // back to unsorted
}
