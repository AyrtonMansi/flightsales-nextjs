'use client';
import { useMemo, useState } from 'react';
import { useAdminEnquiries } from '../../../lib/hooks';
import { showToast } from '../../../lib/toast';
import { LEAD_STATUSES } from '../../../lib/statuses';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';
import StatusBadge from '../StatusBadge';

// Wave 1.1 fix — the previous tab had filter buttons that updated state but
// never actually filtered the table. Here the filter is part of the visible
// table-state pipeline.
const TYPE_LABELS = { finance: 'Finance', insurance: 'Insurance', valuation: 'Valuation' };

export default function LeadsTab() {
  const { enquiries, loading, updateStatus } = useAdminEnquiries();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Platform leads = enquiries with type other than 'enquiry'.
  const allLeads = useMemo(
    () => enquiries.filter(e => e.type && e.type !== 'enquiry'),
    [enquiries]
  );

  // Apply both filters before search/sort/pagination.
  const filtered = useMemo(() => {
    let out = allLeads;
    if (typeFilter !== 'all') out = out.filter(l => l.type === typeFilter);
    if (statusFilter !== 'all') out = out.filter(l => (l.status || 'new') === statusFilter);
    return out;
  }, [allLeads, typeFilter, statusFilter]);

  const t = useTableState(filtered, {
    pageSize: 25,
    searchFields: ['name', 'email', 'phone', 'message', 'aircraft.title'],
    defaultSort: { field: 'created_at', direction: 'desc' },
  });

  const typeCounts = useMemo(() => ({
    all: allLeads.length,
    finance: allLeads.filter(l => l.type === 'finance').length,
    insurance: allLeads.filter(l => l.type === 'insurance').length,
    valuation: allLeads.filter(l => l.type === 'valuation').length,
  }), [allLeads]);

  const handleStatus = async (id, status) => {
    try { await updateStatus(id, status); showToast(`Marked ${status}`); }
    catch (err) { showToast('Failed'); }
  };

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search lead name, email, phone…"
        statusOptions={[
          { value: 'all', label: 'All', count: typeCounts.all },
          { value: 'finance', label: 'Finance', count: typeCounts.finance },
          { value: 'insurance', label: 'Insurance', count: typeCounts.insurance },
          { value: 'valuation', label: 'Valuation', count: typeCounts.valuation },
        ]}
        statusValue={typeFilter}
        onStatusChange={setTypeFilter}
        filteredCount={t.filteredCount} totalCount={allLeads.length}
        right={
          <select
            className="fs-admin-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {LEAD_STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        }
      />

      {loading ? (
        <div className="fs-admin-loading">Loading leads…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty"><h3>No leads match</h3></div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <SortHeader field="type" sort={t.sort} onSortChange={t.setSort}>Type</SortHeader>
                <SortHeader field="name" sort={t.sort} onSortChange={t.setSort}>Contact</SortHeader>
                <th>Aircraft</th>
                <SortHeader field="status" sort={t.sort} onSortChange={t.setSort}>Status</SortHeader>
                <SortHeader field="created_at" sort={t.sort} onSortChange={t.setSort}>Received</SortHeader>
                <th style={{ textAlign: 'right' }}>Quick action</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map(l => (
                <tr key={l.id}>
                  <td className="fs-admin-cell-strong">{TYPE_LABELS[l.type] || l.type}</td>
                  <td>
                    <p>{l.name}</p>
                    <p className="fs-admin-cell-muted">{l.email}</p>
                    {l.phone && <p className="fs-admin-cell-muted">{l.phone}</p>}
                  </td>
                  <td className="fs-admin-cell-muted">{l.aircraft?.title || '—'}</td>
                  <td><StatusBadge kind="lead" status={l.status || 'new'} /></td>
                  <td className="fs-admin-cell-muted">
                    {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <select
                      className="fs-admin-select fs-admin-select-sm"
                      value={l.status || 'new'}
                      onChange={(e) => handleStatus(l.id, e.target.value)}
                      aria-label={`Update status for ${l.name}`}
                    >
                      {LEAD_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={t.page} totalPages={t.totalPages} onChange={t.setPage} />
        </div>
      )}
    </>
  );
}
