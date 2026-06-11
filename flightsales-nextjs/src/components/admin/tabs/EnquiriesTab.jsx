'use client';
import { useMemo } from 'react';
import { useAdminEnquiries } from '../../../lib/hooks';
import { showToast } from '../../../lib/toast';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';
import StatusBadge from '../StatusBadge';

export default function EnquiriesTab() {
  const { enquiries, loading, updateStatus } = useAdminEnquiries();

  // Listing enquiries are the ones without a non-listing `type` (finance/
  // insurance/etc. live in LeadsTab).
  const listingEnquiries = useMemo(
    () => enquiries.filter(e => !e.type || e.type === 'enquiry'),
    [enquiries]
  );

  const t = useTableState(listingEnquiries, {
    pageSize: 25,
    searchFields: ['name', 'email', 'aircraft.title', 'message'],
    defaultSort: { field: 'created_at', direction: 'desc' },
  });

  const handleMarkRead = async (id) => {
    try { await updateStatus(id, 'read'); showToast('Marked read'); }
    catch (err) { showToast('Failed'); }
  };

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search enquirer, aircraft, message…"
        filteredCount={t.filteredCount} totalCount={listingEnquiries.length}
      />

      {loading ? (
        <div className="fs-admin-loading">Loading enquiries…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty"><h3>No listing enquiries</h3></div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <SortHeader field="name" sort={t.sort} onSortChange={t.setSort}>From</SortHeader>
                <SortHeader field="aircraft.title" sort={t.sort} onSortChange={t.setSort}>Aircraft</SortHeader>
                <SortHeader field="status" sort={t.sort} onSortChange={t.setSort}>Status</SortHeader>
                <SortHeader field="created_at" sort={t.sort} onSortChange={t.setSort}>Received</SortHeader>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map(e => (
                <tr key={e.id}>
                  <td>
                    <p className="fs-admin-cell-strong">{e.name}</p>
                    <p className="fs-admin-cell-muted">{e.email}</p>
                  </td>
                  <td className="fs-admin-cell-muted">{e.aircraft?.title || '—'}</td>
                  <td><StatusBadge kind="enquiry" status={e.status || 'new'} /></td>
                  <td className="fs-admin-cell-muted">
                    {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a href={`mailto:${e.email}`} className="fs-admin-link-btn">Email</a>
                    {e.status === 'new' && (
                      <button
                        type="button"
                        className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm"
                        onClick={() => handleMarkRead(e.id)}
                      >Mark read</button>
                    )}
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
