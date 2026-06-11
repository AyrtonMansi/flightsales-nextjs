'use client';
import { useState } from 'react';
import { useAdminUsers } from '../../../lib/hooks';
import { showToast } from '../../../lib/toast';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';
import ConfirmDialog from '../ConfirmDialog';

export default function UsersTab() {
  const { users, loading, promoteToDealer, suspendUser, unsuspendUser } = useAdminUsers();
  const [confirm, setConfirm] = useState(null); // { kind, user }

  const t = useTableState(users, {
    pageSize: 25,
    searchFields: ['email', 'full_name'],
    defaultSort: { field: 'created_at', direction: 'desc' },
  });

  const wrap = (fn, ok) => async (...a) => {
    try { await fn(...a); showToast(ok); }
    catch (err) { showToast(err?.message ? `Failed: ${err.message}` : 'Failed'); }
  };

  const handlePromote = wrap(async (id) => promoteToDealer(id), 'Promoted to dealer');
  const handleSuspend = wrap(async (id, reason) => suspendUser(id, reason), 'User suspended');
  const handleUnsuspend = wrap(async (id) => unsuspendUser(id), 'User reinstated');

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search by name or email…"
        filteredCount={t.filteredCount} totalCount={users.length}
      />

      {loading ? (
        <div className="fs-admin-loading">Loading users…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty"><h3>No users match</h3></div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <SortHeader field="full_name" sort={t.sort} onSortChange={t.setSort}>User</SortHeader>
                <SortHeader field="role" sort={t.sort} onSortChange={t.setSort}>Role</SortHeader>
                <SortHeader field="listings_count" sort={t.sort} onSortChange={t.setSort}>Listings</SortHeader>
                <SortHeader field="created_at" sort={t.sort} onSortChange={t.setSort}>Joined</SortHeader>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map(u => {
                const role = u.role === 'admin' ? 'admin' : (u.is_dealer ? 'dealer' : 'private');
                const suspended = !!u.suspended_at;
                return (
                  <tr key={u.id} className={suspended ? 'fs-admin-row-suspended' : ''}>
                    <td>
                      <p className="fs-admin-cell-strong">{u.full_name || '—'}</p>
                      <p className="fs-admin-cell-muted">{u.email}</p>
                    </td>
                    <td>
                      <span className={`fs-admin-role role-${role}`}>{role}</span>
                    </td>
                    <td>{u.listings_count || 0}</td>
                    <td className="fs-admin-cell-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {suspended ? (
                        <span className="fs-admin-suspended-tag" title={u.suspension_reason || ''}>Suspended</span>
                      ) : (
                        <span className="fs-admin-cell-muted">Active</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="fs-admin-row-actions">
                        {!u.is_dealer && role !== 'admin' && (
                          <button
                            type="button"
                            className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm"
                            onClick={() => setConfirm({ kind: 'promote', user: u })}
                          >Promote</button>
                        )}
                        {suspended ? (
                          <button
                            type="button"
                            className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm"
                            onClick={() => handleUnsuspend(u.id)}
                          >Reinstate</button>
                        ) : (
                          role !== 'admin' && (
                            <button
                              type="button"
                              className="fs-confirm-btn fs-confirm-btn-destructive fs-confirm-btn-sm"
                              onClick={() => setConfirm({ kind: 'suspend', user: u })}
                            >Suspend</button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pager page={t.page} totalPages={t.totalPages} onChange={t.setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.kind === 'promote' ? `Promote ${confirm.user?.full_name || confirm.user?.email}?` :
          confirm?.kind === 'suspend' ? `Suspend ${confirm.user?.full_name || confirm.user?.email}?` :
          ''
        }
        message={
          confirm?.kind === 'promote'
            ? 'They\'ll be flagged as a verified dealer. You can revert this anytime.'
            : 'Suspended users can\'t log in or make changes. The reason is recorded for audit.'
        }
        confirmLabel={confirm?.kind === 'promote' ? 'Promote' : 'Suspend'}
        destructive={confirm?.kind === 'suspend'}
        reasonRequired={confirm?.kind === 'suspend'}
        onConfirm={async (reason) => {
          if (confirm.kind === 'promote') await handlePromote(confirm.user.id);
          else if (confirm.kind === 'suspend') await handleSuspend(confirm.user.id, reason);
        }}
      />
    </>
  );
}
