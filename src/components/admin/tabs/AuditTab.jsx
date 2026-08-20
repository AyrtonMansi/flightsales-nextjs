'use client';
import { useMemo } from 'react';
import { useAdminAudit } from '../../../lib/hooks';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';

// Read-only viewer for admin_audit. Every admin mutation writes a row
// here — listing approve/reject, dealer-app review, user suspension.
// First time something goes wrong (wrong listing approved, user wrongly
// banned), this is where you reconstruct what happened.

// Keys match the exact `action` strings the /api/admin/* routes write
// (present tense — `listing.${action}` / `user.${action}` verbs, e.g.
// 'listing.approve' not 'listing.approved'). These previously used
// past-tense keys that never matched anything written to admin_audit,
// so every row fell back to the raw action string with a blank summary.
const ACTION_LABELS = {
  'listing.approve': 'Listing approved',
  'listing.reject': 'Listing rejected',
  'listing.unpublish': 'Listing unpublished',
  'listing.feature': 'Listing featured',
  'listing.unfeature': 'Listing unfeatured',
  'listing.archive': 'Listing archived (sold)',
  'listing.restore': 'Listing restored',
  'dealer_app.approve': 'Dealer app approved',
  'dealer_app.reject': 'Dealer app rejected',
  'user.suspend': 'User suspended',
  'user.unsuspend': 'User unsuspended',
  'user.promote': 'User promoted to dealer',
  'user.demote': 'User demoted from dealer',
  'user.set_role': 'User role changed',
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

// `before`/`after` are the actual DB rows (or update patches) the routes
// pass to audit() — field names match the aircraft/profiles/dealer_applications
// columns (snake_case), not a synthetic {aircraftTitle, reason} shape.
function summarise(row) {
  const before = row.before || {};
  const after = row.after || {};
  switch (row.action) {
    case 'listing.approve':
    case 'listing.unpublish':
    case 'listing.archive':
    case 'listing.restore':
    case 'listing.feature':
    case 'listing.unfeature':
      return after.title || before.title || '';
    case 'listing.reject':
      return `${after.title || before.title || ''} — ${after.rejection_reason || ''}`;
    case 'dealer_app.approve':
      return before.business_name || '';
    case 'dealer_app.reject':
      return `${before.business_name || ''} — ${after.reason || ''}`;
    case 'user.suspend':
      return `${before.email || ''} — ${after.suspension_reason || ''}`;
    case 'user.unsuspend':
    case 'user.promote':
    case 'user.demote':
      return before.email || after.email || '';
    case 'user.set_role':
      return `${before.email || ''} → ${after.role || ''}`;
    default:
      return '';
  }
}
