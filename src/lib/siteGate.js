// Single source of truth for the pre-launch password wall.
//
// This used to be split across two different env vars that had to agree:
// the API route read SITE_PASSWORD_PROTECTED while the client component
// read NEXT_PUBLIC_SITE_PASSWORD_PROTECTED. LAUNCH.md documented setting
// only the former, so following the documented go-live procedure left the
// server accepting any password while every visitor still hit the wall.
//
// Now: the server decides once (here), the root layout passes the result
// down to PasswordGate as a prop, and no client code reads env at all.
//
// Server-only — do not import from a 'use client' module.
//
// Semantics: protected by default (fail safe). Either var set to the
// literal string 'false' takes the wall down. NEXT_PUBLIC_ is still
// honoured so existing local-dev and Playwright configs keep working.
export function isSiteGated() {
  if (process.env.SITE_PASSWORD_PROTECTED === 'false') return false;
  if (process.env.NEXT_PUBLIC_SITE_PASSWORD_PROTECTED === 'false') return false;
  return true;
}
