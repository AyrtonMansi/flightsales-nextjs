'use client';
import { useEffect, useState } from 'react';

// Lightweight confirm/prompt modal. Two modes:
//   confirm-only:  message + Yes/No
//   with-reason:   prompts for a reason string before confirming
//
// Why not window.confirm: blocks the JS thread, can't capture a reason,
// looks like a 1998 popup, and can't be styled. The custom element keeps
// the admin UX cohesive.
//
// Props:
//   open
//   onClose
//   onConfirm(reason?)  — called only when user clicks the primary action
//   title, message
//   confirmLabel, cancelLabel
//   destructive (boolean) — paints the primary button red
//   reasonRequired (boolean) — surface the reason textarea + require non-empty
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  reasonRequired = false,
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) { setReason(''); setSubmitting(false); }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canConfirm = !reasonRequired || reason.trim().length > 0;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fs-confirm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="fs-confirm-card">
        <h3 id="confirm-title" className="fs-confirm-title">{title}</h3>
        {message && <p className="fs-confirm-message">{message}</p>}
        {reasonRequired && (
          <textarea
            className="fs-confirm-reason"
            placeholder="Reason (visible to the seller / user)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
          />
        )}
        <div className="fs-confirm-actions">
          <button
            type="button"
            className="fs-confirm-btn fs-confirm-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`fs-confirm-btn ${destructive ? 'fs-confirm-btn-destructive' : 'fs-confirm-btn-primary'}`}
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
          >
            {submitting ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
