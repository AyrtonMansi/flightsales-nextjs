// Unit: post-auth redirect sanitisation.
//
// safeNext guards the `?next=` param on /auth/callback. It moved out of the
// old server route when the OAuth code exchange moved into the browser (the
// server could never complete a PKCE exchange), so these tests make sure the
// open-redirect protection survived the move intact.
//
// An open redirect here is genuinely dangerous: the link the user clicks is a
// real, legitimate flightsales.com.au sign-in URL, so it passes every "check
// the domain" instinct — and then bounces them to an attacker's page with the
// trust of having just authenticated.

import { test, expect } from '@playwright/test';
import { safeNext } from '../../src/lib/safeNext.js';

test.describe('safeNext', () => {
  test('allows ordinary same-origin paths', () => {
    expect(safeNext('/dashboard')).toBe('/dashboard');
    expect(safeNext('/buy?cat=Jet&page=2')).toBe('/buy?cat=Jet&page=2');
    expect(safeNext('/listings/abc-123')).toBe('/listings/abc-123');
  });

  test('rejects protocol-relative URLs', () => {
    // Browsers resolve //evil.com against the current scheme — a real redirect
    // off-site despite looking path-like.
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('//evil.com/phish')).toBe('/');
  });

  test('rejects backslash escapes past the origin', () => {
    expect(safeNext('/\\evil.com')).toBe('/');
  });

  test('rejects absolute URLs', () => {
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext('http://evil.com')).toBe('/');
    expect(safeNext('javascript:alert(1)')).toBe('/');
  });

  test('falls back to / for missing or non-string input', () => {
    expect(safeNext(null)).toBe('/');
    expect(safeNext(undefined)).toBe('/');
    expect(safeNext('')).toBe('/');
    expect(safeNext(42)).toBe('/');
    expect(safeNext({})).toBe('/');
  });
});
