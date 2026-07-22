'use client';
import { useEffect, useState } from 'react';

// Returns a copy of `value` that only updates after it has stopped
// changing for `delay` ms. Used to keep a text input instant while the
// expensive thing it drives (a network query) coalesces.
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
