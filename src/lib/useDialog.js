'use client';
import { useEffect, useRef } from 'react';

// Modal a11y primitive. Pass it the container ref + an `open` flag and
// it handles:
//   - focus-trap inside the container (Tab / Shift+Tab cycle, never leak
//     to the page behind)
//   - initial focus on the first focusable element when the dialog opens
//   - focus-restore to whatever was focused before the dialog opened
//   - Escape closes (calls onClose)
//   - body scroll lock while open (single root rule, idempotent across
//     concurrent dialogs by reference-counting)
//
// Consumers also need to add role="dialog", aria-modal="true",
// aria-labelledby (pointing at the heading id) on the container. The
// hook only handles focus + key behaviour, not semantics, so screen
// readers still need the ARIA on the JSX.

let scrollLockRefCount = 0;

function lockScroll() {
  scrollLockRefCount += 1;
  if (scrollLockRefCount === 1) {
    document.documentElement.style.setProperty('--fs-prev-overflow', document.body.style.overflow || '');
    document.body.style.overflow = 'hidden';
  }
}
function unlockScroll() {
  scrollLockRefCount = Math.max(0, scrollLockRefCount - 1);
  if (scrollLockRefCount === 0) {
    const prev = document.documentElement.style.getPropertyValue('--fs-prev-overflow');
    document.body.style.overflow = prev || '';
    document.documentElement.style.removeProperty('--fs-prev-overflow');
  }
}

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useDialog({ open, onClose, containerRef }) {
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    // Save the element that had focus so we can restore it on close.
    restoreRef.current = document.activeElement;

    lockScroll();

    // Move focus into the dialog. Prefer an element that opts in via
    // [data-autofocus]; fall back to the first natural focusable.
    const autofocus = container.querySelector('[data-autofocus]');
    const firstFocusable = autofocus || container.querySelector(FOCUSABLE);
    if (firstFocusable && typeof firstFocusable.focus === 'function') {
      firstFocusable.focus();
    } else {
      // Make the container itself focusable so SR users land somewhere
      // sensible when a dialog has no inputs (e.g. confirm-only).
      if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
      container.focus();
    }

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = container.querySelectorAll(FOCUSABLE);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      unlockScroll();
      // Defer focus restore so React can finish unmounting the dialog
      // and any focus-stealing children won't yank it back.
      const restore = restoreRef.current;
      setTimeout(() => {
        if (restore && typeof restore.focus === 'function' && document.body.contains(restore)) {
          restore.focus();
        }
      }, 0);
    };
  }, [open, onClose, containerRef]);
}
