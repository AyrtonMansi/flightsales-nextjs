'use client';
import { useMemo, useState } from 'react';
import { useAdminListings } from '../../../lib/hooks';
import { showToast } from '../../../lib/toast';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';
import StatusBadge from '../StatusBadge';
import ConfirmDialog from '../ConfirmDialog';
import ListingDetailDrawer from '../ListingDetailDrawer';

// Status filter options for the listings tab. "Pending" is the most common
// admin landing state — defaults there to surface what needs review.
const STATUS_OPTIONS = (counts) => [
  { value: 'pending', label: 'Pending', count: counts.pending },
  { value: 'active', label: 'Active', count: counts.active },
  { value: 'rejected', label: 'Rejected', count: counts.rejected },
  { value: 'sold', label: 'Sold', count: counts.sold },
  { value: 'all', label: 'All', count: counts.total },
];

export default function ListingsTab() {
  const {
    listings, loading,
    updateStatus, rejectListing, setFeatured, bulkUpdateStatus,
  } = useAdminListings();

  const [statusFilter, setStatusFilter] = useState('pending');
  const [openListing, setOpenListing] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null); // { kind, ids, ... }

  // Status counts power the toolbar pill badges.
  const counts = useMemo(() => ({
    pending: listings.filter(l => l.status === 'pending').length,
    active: listings.filter(l => l.status === 'active').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
    sold: listings.filter(l => l.status === 'sold').length,
    total: listings.length,
  }), [listings]);

  // Apply status filter pre-search/sort.
  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'all') return listings;
    return listings.filter(l => (l.status || 'pending') === statusFilter);
  }, [listings, statusFilter]);

  const t = useTableState(filteredByStatus, {
    pageSize: 25,
    searchFields: ['title', 'manufacturer', 'model', 'rego', 'dealer.name'],
    defaultSort: { field: 'created_at', direction: 'desc' },
  });

  const allSelected = t.pageRows.length > 0 && t.pageRows.every(r => selected.has(r.id));
  const toggleSelectAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) t.pageRows.forEach(r => next.delete(r.id));
      else t.pageRows.forEach(r => next.add(r.id));
      return next;
    });
  };
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const wrap = (fn, ok) => async (...args) => {
    try { await fn(...args); showToast(ok); }
    catch (err) { showToast(err?.message ? `Failed: ${err.message}` : 'Failed'); }
  };

  // Fires email + in-app notification AFTER a status mutation succeeds.
  // Listing object lookup is already in `listings` state — no refetch.
  const notify = async (event, id, extras = {}) => {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    try {
      await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          targetUserId: l.user_id,
          vars: { aircraftTitle: l.title || 'your listing', aircraftId: l.id, ...extras },
        }),
      });
    } catch {}
  };

  const handleApprove = wrap(async (id) => { await updateStatus(id, 'active'); await notify('listing.approved', id); }, 'Listing approved');
  const handleUnpublish = wrap(async (id) => updateStatus(id, 'pending'), 'Listing unpublished');
  const handleMarkSold = wrap(async (id) => updateStatus(id, 'sold'), 'Marked sold');
  const handleReject = wrap(async (id, reason) => { await rejectListing(id, reason); await notify('listing.rejected', id, { reason }); }, 'Listing rejected');
  const handleToggleFeatured = wrap(async (id, featured) => setFeatured(id, featured), 'Featured updated');

  const handleBulk = async (newStatus) => {
    const ids = [...selected];
    const result = await bulkUpdateStatus(ids, newStatus);
    showToast(`${result.succeeded}/${ids.length} updated`);
    setSelected(new Set());
  };

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search title, make, model, rego…"
        statusOptions={STATUS_OPTIONS(counts)}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        filteredCount={t.filteredCount} totalCount={listings.length}
      />

      {selected.size > 0 && (
        <div className="fs-admin-bulkbar">
          <span><strong>{selected.size}</strong> selected</span>
          <div className="fs-admin-bulkbar-actions">
            <button
              type="button"
              className="fs-confirm-btn fs-confirm-btn-primary"
              onClick={() => setConfirm({ kind: 'bulkApprove', ids: [...selected] })}
            >Approve all</button>
            <button
              type="button"
              className="fs-confirm-btn fs-confirm-btn-secondary"
              onClick={() => setConfirm({ kind: 'bulkArchive', ids: [...selected] })}
            >Archive all</button>
            <button
              type="button"
              className="fs-confirm-btn fs-confirm-btn-secondary"
              onClick={() => setSelected(new Set())}
            >Clear</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="fs-admin-loading">Loading listings…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty">
          <h3>No listings match</h3>
          <p>Try a different status or clear the search.</p>
        </div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all on page"
                  />
                </th>
                <SortHeader field="title" sort={t.sort} onSortChange={t.setSort}>Aircraft</SortHeader>
                <SortHeader field="price" sort={t.sort} onSortChange={t.setSort}>Price</SortHeader>
                <SortHeader field="dealer.name" sort={t.sort} onSortChange={t.setSort}>Seller</SortHeader>
                <SortHeader field="status" sort={t.sort} onSortChange={t.setSort}>Status</SortHeader>
                <SortHeader field="created_at" sort={t.sort} onSortChange={t.setSort}>Submitted</SortHeader>
                <th style={{ textAlign: 'right' }}>Review</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map(l => {
                const status = l.status || 'pending';
                return (
                  <tr key={l.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(l.id)}
                        onChange={() => toggleSelect(l.id)}
                        aria-label={`Select ${l.title}`}
                      />
                    </td>
                    <td className="fs-admin-cell-strong">
                      {l.title || `${l.year || ''} ${l.manufacturer || ''} ${l.model || ''}`.trim()}
                      {l.featured && <span className="fs-admin-feat-pill">Featured</span>}
                    </td>
                    <td>${(l.price || 0).toLocaleString()}</td>
                    <td className="fs-admin-cell-muted">
                      {l.dealer?.name || (l.user_id ? 'Private seller' : 'Unknown')}
                    </td>
                    <td><StatusBadge kind="listing" status={status} /></td>
                    <td className="fs-admin-cell-muted">
                      {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="fs-admin-link-btn"
                        onClick={() => setOpenListing(l)}
                      >Review →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pager page={t.page} totalPages={t.totalPages} onChange={t.setPage} />
        </div>
      )}

      <ListingDetailDrawer
        listing={openListing}
        onClose={() => setOpenListing(null)}
        onApprove={async () => { await handleApprove(openListing.id); setOpenListing(null); }}
        onUnpublish={() => setConfirm({ kind: 'unpublish', id: openListing.id })}
        onMarkSold={() => setConfirm({ kind: 'sold', id: openListing.id })}
        onReject={async (reason) => { await handleReject(openListing.id, reason); setOpenListing(null); }}
        onToggleFeatured={async (next) => { await handleToggleFeatured(openListing.id, next); }}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.kind === 'unpublish' ? 'Unpublish listing?' :
          confirm?.kind === 'sold' ? 'Mark as sold?' :
          confirm?.kind === 'bulkApprove' ? `Approve ${confirm?.ids?.length} listings?` :
          confirm?.kind === 'bulkArchive' ? `Archive ${confirm?.ids?.length} listings?` :
          ''
        }
        message={
          confirm?.kind === 'unpublish' ? 'The listing will no longer appear publicly. The seller can resubmit.' :
          confirm?.kind === 'sold' ? 'Marks the listing as sold; it stays visible with a sold badge.' :
          confirm?.kind === 'bulkApprove' ? 'All selected listings will be set to active.' :
          confirm?.kind === 'bulkArchive' ? 'All selected listings will be archived (status: pending).' :
          ''
        }
        confirmLabel={
          confirm?.kind === 'unpublish' ? 'Unpublish' :
          confirm?.kind === 'sold' ? 'Mark sold' :
          confirm?.kind?.startsWith('bulk') ? 'Apply' : 'Confirm'
        }
        destructive={confirm?.kind === 'unpublish' || confirm?.kind === 'bulkArchive'}
        onConfirm={async () => {
          if (confirm.kind === 'unpublish') { await handleUnpublish(confirm.id); setOpenListing(null); }
          else if (confirm.kind === 'sold') { await handleMarkSold(confirm.id); setOpenListing(null); }
          else if (confirm.kind === 'bulkApprove') await handleBulk('active');
          else if (confirm.kind === 'bulkArchive') await handleBulk('pending');
        }}
      />
    </>
  );
}
