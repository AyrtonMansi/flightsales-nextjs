'use client';
import { useMemo } from 'react';
import { useAdminAudit } from '../../../lib/hooks';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';

// Read-only viewer for admin_audit. Every admin mutation writes a row
// here — listing approve/reject, dealer-app review, user suspension.
// First time something goes wrong (wrong listing approved, user wrongly
// banned), this is where you reconstruct what happened.

const ACTION_LABELS = {
  'listing.approved': 'Listing approved',
  'listing.rejected': 'Listing rejected',
  'dealer_app.approved': 'Dealer app approved',
  'dealer_app.rejected': 'Dealer app rejected',
  'user.suspended': 'User suspended',
};

export default function AuditTab() {
  const { rows, loading } = useAdminAudit({ limit: 500 });

  const decorated = useMemo(() => rows.map(r => ({
    ...r,
    actionLabel: ACTION_LABELS[r.action] || r.action,
    summary: summarise(r),
  })), [rows]);

  const t = useTableState(decorated, {
    pageSize: 50,
    searchFields: ['actionLabel', 'target_type', 'target_id', 'summary'],
    defaultSort: { field: 'created_at', direction: 'desc' },
  });

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search action, target id, summary…"
        filteredCount={t.filteredCount} totalCount={rows.length}
      />

      {loading ? (
        <div className="fs-admin-loading">Loading audit log…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty">
          <h3>No audit events</h3>
          <p>Admin actions appear here as they happen.</p>
        </div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <SortHeader field="created_at" sort={t.sort} onSortChange={t.setSort}>When</SortHeader>
                <SortHeader field="actionLabel" sort={t.sort} onSortChange={t.setSort}>Action</SortHeader>
                <SortHeader field="target_type" sort={t.sort} onSortChange={t.setSort}>Target</SortHeader>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map(r => (
                <tr key={r.id}>
                  <td className="fs-admin-cell-muted">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="fs-admin-cell-strong">{r.actionLabel}</td>
                  <td className="fs-admin-cell-muted">
                    {r.target_type}{r.target_id ? ` · ${String(r.target_id).slice(0, 8)}…` : ''}
                  </td>
                  <td className="fs-admin-cell-muted" style={{ maxWidth: 400 }}>{r.summary}</td>
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

function summarise(row) {
  const v = row.after || {};
  if (row.action === 'listing.approved') return v.aircraftTitle || '';
  if (row.action === 'listing.rejected') return `${v.aircraftTitle || ''} — ${v.reason || ''}`;
  if (row.action === 'dealer_app.approved') return v.businessName || '';
  if (row.action === 'dealer_app.rejected') return `${v.businessName || ''} — ${v.reason || ''}`;
  if (row.action === 'user.suspended') return v.reason || '';
  return '';
}
