// Sanitise a post-auth redirect target.
//
// Rejects anything that isn't a single-leading-slash relative path. This
// closes the open-redirect via `?next=//evil.com` (which browsers can
// interpret as protocol-relative) and `?next=/\evil.com` (which some parsers
// treat as escaping past the origin). Same-origin paths only.
//
// Extracted from the old server-side /auth/callback route so the guard is
// unit-testable and survives the move to a browser-side code exchange.
export function safeNext(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return '/';
  if (raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\') return '/';
  return raw;
}
