'use client';

// Thin, privacy-friendly analytics shim. Wraps Plausible's custom-event
// API (window.plausible), which the layout already loads behind
// NEXT_PUBLIC_PLAUSIBLE_DOMAIN. When Plausible isn't configured (local
// dev, or the env var unset) every call is a silent no-op — callers never
// have to guard, and no events are dropped to the console.
//
// Usage:  track('search_submit', { query })
//         track('filter_apply', { field: 'categories', count: 3 })
//
// Event names are snake_case verbs/nouns; props stay small and
// low-cardinality (counts, field names, enums) — never PII or free text
// beyond a short search string.

export function track(event, props) {
  if (typeof window === 'undefined') return;
  try {
    const fn = window.plausible;
    if (typeof fn === 'function') {
      fn(event, props ? { props } : undefined);
    }
  } catch {
    // Analytics must never break the app.
  }
}
