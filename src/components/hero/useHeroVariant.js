'use client';
import { useEffect, useState } from 'react';

// Hero search-card variant switcher. Two designs run side-by-side so we can
// A/B feel them out:
//   classic — the original 7-field card we shipped first.
//   pro     — the 2026 redraw: fused glass surface, hairline dividers, live
//             count CTA, tabular spec-sheet typography.
//
// Resolution order:
//   1. ?hero=classic|pro in the URL (overrides for share-link testing).
//   2. localStorage('fs.heroVariant') so a chosen variant sticks.
//   3. Default = 'pro'.

const KEY = 'fs.heroVariant';
const DEFAULT = 'pro';
const VALID = new Set(['classic', 'pro']);

export function useHeroVariant() {
  const [variant, setVariantState] = useState(DEFAULT);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get('hero');
      if (fromUrl && VALID.has(fromUrl)) {
        setVariantState(fromUrl);
        localStorage.setItem(KEY, fromUrl);
        return;
      }
      const stored = localStorage.getItem(KEY);
      if (stored && VALID.has(stored)) setVariantState(stored);
    } catch {
      // SSR / private mode — default stays.
    }
  }, []);

  const setVariant = (next) => {
    if (!VALID.has(next)) return;
    setVariantState(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  };

  return [variant, setVariant];
}
