'use client';
import { useMemo, useState } from 'react';
import { useDealerApplications } from '../../../lib/hooks';
import { showToast } from '../../../lib/toast';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';
import StatusBadge from '../StatusBadge';
import ConfirmDialog from '../ConfirmDialog';

const STATUS_OPTIONS = (counts) => [
  { value: 'pending', label: 'Pending', count: counts.pending },
  { value: 'approved', label: 'Approved', count: counts.approved },
  { value: 'rejected', label: 'Rejected', count: counts.rejected },
  { value: 'all', label: 'All', count: counts.total },
];

export default function DealerAppsTab({ adminId }) {
  const { apps, loading, approveApp, rejectApp } = useDealerApplications();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [confirm, setConfirm] = useState(null); // { kind, app }

  const counts = useMemo(() => ({
    pending: apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    total: apps.length,
  }), [apps]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return apps;
    return apps.filter(a => (a.status || 'pending') === statusFilter);
  }, [apps, statusFilter]);

  const t = useTableState(filtered, {
    pageSize: 25,
    searchFields: ['business_name', 'location', 'abn', 'applicant.email', 'applicant.full_name'],
    defaultSort: { field: 'created_at', direction: 'desc' },
  });

  const wrap = (fn, ok) => async (...a) => {
    try { await fn(...a); showToast(ok); }
    catch (err) { showToast(err?.message ? `Failed: ${err.message}` : 'Failed'); }
  };

  const handleApprove = wrap(async (app) => approveApp(app, adminId), 'Application approved');
  const handleReject = wrap(async (id, reason) => rejectApp(id, reason, adminId), 'Application rejected');

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search business, applicant, ABN…"
        statusOptions={STATUS_OPTIONS(counts)}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        filteredCount={t.filteredCount} totalCount={apps.length}
      />

      {loading ? (
        <div className="fs-admin-loading">Loading applications…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty">
          <h3>No applications</h3>
          <p>Applications submitted by users from their dashboard appear here.</p>
        </div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <SortHeader field="business_name" sort={t.sort} onSortChange={t.setSort}>Business</SortHeader>
                <th>Applicant</th>
                <SortHeader field="location" sort={t.sort} onSortChange={t.setSort}>Location</SortHeader>
                <th>ABN</th>
                <SortHeader field="status" sort={t.sort} onSortChange={t.setSort}>Status</SortHeader>
                <SortHeader field="created_at" sort={t.sort} onSortChange={t.setSort}>Submitted</SortHeader>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map(app => (
                <tr key={app.id}>
                  <td className="fs-admin-cell-strong">{app.business_name}</td>
                  <td>
                    <p>{app.applicant?.full_name || '—'}</p>
                    <p className="fs-admin-cell-muted">{app.applicant?.email || '—'}</p>
                  </td>
                  <td className="fs-admin-cell-muted">{app.location}</td>
                  <td className="fs-admin-cell-muted">{app.abn || '—'}</td>
                  <td><StatusBadge kind="lead" status={app.status} /></td>
                  <td className="fs-admin-cell-muted">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {app.status === 'pending' && (
                      <div className="fs-admin-row-actions">
                        <button
                          type="button"
                          className="fs-confirm-btn fs-confirm-btn-primary fs-confirm-btn-sm"
                          onClick={() => setConfirm({ kind: 'approve', app })}
                        >Approve</button>
                        <button
                          type="button"
                          className="fs-confirm-btn fs-confirm-btn-destructive fs-confirm-btn-sm"
                          onClick={() => setConfirm({ kind: 'reject', app })}
                        >Reject</button>
                      </div>
                    )}
                    {app.status !== 'pending' && app.rejection_reason && (
                      <span className="fs-admin-cell-muted" title={app.rejection_reason}>
                        Reason recorded
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={t.page} totalPages={t.totalPages} onChange={t.setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.kind === 'approve' ? `Approve ${confirm.app?.business_name}?` :
          confirm?.kind === 'reject' ? `Reject ${confirm.app?.business_name}?` :
          ''
        }
        message={
          confirm?.kind === 'approve'
            ? 'Creates a verified dealer record and flips the applicant\'s profile to dealer status.'
            : 'The applicant will see your reason. They can apply again after addressing it.'
        }
        confirmLabel={confirm?.kind === 'approve' ? 'Approve' : 'Reject'}
        destructive={confirm?.kind === 'reject'}
        reasonRequired={confirm?.kind === 'reject'}
        onConfirm={async (reason) => {
          if (confirm.kind === 'approve') await handleApprove(confirm.app);
          else if (confirm.kind === 'reject') await handleReject(confirm.app.id, reason);
        }}
      />
    </>
  );
}
