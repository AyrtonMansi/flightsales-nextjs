'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import StatusBadge from './StatusBadge';

// Right-side drawer showing the full listing for moderation. Replaces the
// row-level approve-blind action set with an informed review:
//   - photos
//   - description, specs, dealer, rego, year, location
//   - inline Approve / Reject (with reason) / Mark Sold / Feature toggle
//
// The drawer doesn't fetch the listing — caller passes the row object that
// the admin table already loaded. Mutations are bubbled via callbacks.
export default function ListingDetailDrawer({
  listing,
  onClose,
  onApprove,
  onReject,        // (reason) => void
  onMarkSold,
  onUnpublish,
  onToggleFeatured,
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!listing) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listing, onClose]);

  useEffect(() => {
    if (!listing) { setRejectMode(false); setRejectReason(''); }
  }, [listing]);

  if (!listing) return null;

  const images = listing.images && listing.images.length ? listing.images : [];
  const status = listing.status || 'pending';
  const featured = !!listing.featured;

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(rejectReason.trim());
  };

  return (
    <div
      className="fs-drawer-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ldd-title"
    >
      <div className="fs-drawer">
        <div className="fs-drawer-head">
          <div>
            <p className="fs-drawer-eyebrow">Listing #{String(listing.id).slice(0, 8)}</p>
            <h2 id="ldd-title" className="fs-drawer-title">{listing.title || `${listing.year || ''} ${listing.manufacturer || ''} ${listing.model || ''}`.trim()}</h2>
          </div>
          <button
            type="button"
            className="fs-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >×</button>
        </div>

        <div className="fs-drawer-body">
          {/* Status / featured */}
          <div className="fs-drawer-row">
            <StatusBadge kind="listing" status={status} />
            {featured && (
              <span className="fs-drawer-feat-pill">Featured</span>
            )}
          </div>

          {/* Photo strip */}
          {images.length > 0 ? (
            <div className="fs-drawer-photos">
              {images.slice(0, 6).map((src, i) => (
                <div key={i} className="fs-drawer-photo">
                  <Image
                    src={src}
                    alt={`Photo ${i + 1}`}
                    fill
                    sizes="220px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="fs-drawer-no-photos">No photos uploaded</div>
          )}

          {/* Specs grid */}
          <dl className="fs-drawer-specs">
            <div><dt>Price</dt><dd>${(listing.price || 0).toLocaleString()}</dd></div>
            <div><dt>Year</dt><dd>{listing.year || '—'}</dd></div>
            <div><dt>Make</dt><dd>{listing.manufacturer || '—'}</dd></div>
            <div><dt>Model</dt><dd>{listing.model || '—'}</dd></div>
            <div><dt>Category</dt><dd>{listing.category || '—'}</dd></div>
            <div><dt>Condition</dt><dd>{listing.condition || '—'}</dd></div>
            <div><dt>Rego</dt><dd>{listing.rego || '—'}</dd></div>
            <div><dt>Location</dt><dd>{[listing.city, listing.state].filter(Boolean).join(', ') || '—'}</dd></div>
            <div><dt>TTAF</dt><dd>{listing.ttaf != null ? `${listing.ttaf} hrs` : '—'}</dd></div>
            <div><dt>Engine hrs</dt><dd>{listing.eng_hours != null ? `${listing.eng_hours} hrs` : '—'}</dd></div>
            <div><dt>Engine TBO</dt><dd>{listing.eng_tbo != null ? `${listing.eng_tbo} hrs` : '—'}</dd></div>
            <div><dt>Avionics</dt><dd>{listing.avionics || '—'}</dd></div>
            <div><dt>Seller</dt><dd>{listing.dealer?.name || (listing.user_id ? 'Private seller' : 'Unknown')}</dd></div>
            <div><dt>Submitted</dt><dd>{listing.created_at ? new Date(listing.created_at).toLocaleString() : '—'}</dd></div>
          </dl>

          {/* Description */}
          {listing.description && (
            <div className="fs-drawer-section">
              <h4>Description</h4>
              <p>{listing.description}</p>
            </div>
          )}

          {/* Existing rejection reason if any */}
          {listing.rejection_reason && (
            <div className="fs-drawer-rejection">
              <h4>Previous rejection reason</h4>
              <p>{listing.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Sticky action bar */}
        <div className="fs-drawer-actions">
          {rejectMode ? (
            <div className="fs-drawer-reject">
              <textarea
                placeholder="Reason — visible to the seller"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
              <div className="fs-drawer-reject-actions">
                <button
                  type="button"
                  className="fs-drawer-btn fs-drawer-btn-secondary"
                  onClick={() => { setRejectMode(false); setRejectReason(''); }}
                >Cancel</button>
                <button
                  type="button"
                  className="fs-drawer-btn fs-drawer-btn-destructive"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                >Confirm reject</button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="fs-drawer-btn fs-drawer-btn-feature"
                onClick={() => onToggleFeatured(!featured)}
                title={featured ? 'Unfeature' : 'Feature'}
              >
                {featured ? 'Unfeature' : 'Feature'}
              </button>
              {status !== 'active' && (
                <button
                  type="button"
                  className="fs-drawer-btn fs-drawer-btn-primary"
                  onClick={onApprove}
                >Approve</button>
              )}
              {status === 'active' && (
                <button
                  type="button"
                  className="fs-drawer-btn fs-drawer-btn-secondary"
                  onClick={onUnpublish}
                >Unpublish</button>
              )}
              <button
                type="button"
                className="fs-drawer-btn fs-drawer-btn-secondary"
                onClick={onMarkSold}
              >Mark sold</button>
              {status !== 'rejected' && (
                <button
                  type="button"
                  className="fs-drawer-btn fs-drawer-btn-destructive"
                  onClick={() => setRejectMode(true)}
                >Reject…</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
