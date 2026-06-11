// Tiny toast bus — decouples the toast UI in FlightSalesApp from the rest of
// the app without prop-drilling a setToast through 14 pages. Anywhere in the
// app can call `showToast('Saved')` and the listener wired in FlightSalesApp
// will pick it up. Server-safe: window guard prevents SSR errors.

const EVENT = 'fs-toast';

export function showToast(message) {
  if (typeof window === 'undefined' || !message) return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: String(message) }));
}

export function onToast(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (e) => handler(e.detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
