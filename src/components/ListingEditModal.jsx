'use client';
import { useState } from 'react';
import { updateListing } from '../lib/hooks';
import { showToast } from '../lib/toast';

// Focused edit modal for the seller's dashboard. Surfaces the fields
// sellers actually change post-creation: title, price, description,
// total time, location, plus the equipment booleans buyers filter on.
// Full re-edit of every spec field would mean re-running the entire
// sell flow — that's out of scope; sellers can delete + relist if
// they need to change category/manufacturer/model.
//
// On save: PATCHes via updateListing hook; closes modal + refetches
// the list. Status changes ('mark as sold') stay on the existing
// updateListingStatus path — separate concern.

const FIELDS = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'price', label: 'Price (AUD)', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'ttaf', label: 'Total time (hrs)', type: 'number' },
  { key: 'eng_hours', label: 'Engine hours', type: 'number' },
  { key: 'city', label: 'City', type: 'text' },
];

export default function ListingEditModal({ listing, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const base = {};
    for (const f of FIELDS) base[f.key] = listing?.[f.key] ?? '';
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, v) => setForm(f => ({ ...f, [key]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const patch = {};
      for (const f of FIELDS) {
        const v = form[f.key];
        patch[f.key] = f.type === 'number' && v !== '' ? Number(v) : (v || null);
      }
      await updateListing(listing.id, patch);
      showToast('Listing updated');
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!listing) return null;

  return (
    <div
      className="fs-confirm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-edit-title"
    >
      <div className="fs-confirm-card" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 id="listing-edit-title" className="fs-confirm-title">Edit listing</h3>
        <p className="fs-confirm-message">
          Changes here are visible immediately. Status changes (mark sold,
          archive) live in the row's status dropdown.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FIELDS.map(f => (
            <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="fs-form-label">{f.label}</span>
              {f.type === 'textarea' ? (
                <textarea
                  className="fs-form-input"
                  rows={4}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <input
                  className="fs-form-input"
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </label>
          ))}

          {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}

          <div className="fs-confirm-actions">
            <button type="button" className="fs-confirm-btn fs-confirm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="fs-confirm-btn fs-confirm-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
