// Unit + smoke: server-side caller authentication.
//
// Regression test for a whole-subsystem outage. Seven API routes resolved the
// calling user like this:
//
//     const userClient = createClient(url, anon, {
//       auth: { persistSession: false, autoRefreshToken: false },
//       global: { headers: { cookie: req.headers.get('cookie') } },
//     });
//     const { data: { user } } = await userClient.auth.getUser();
//
// That can never return a user: supabase-js does not resolve sessions from a
// forwarded cookie header, `getUser()` with no argument reads the client's own
// (empty) session storage, and the browser client stores its session in
// localStorage so there was no cookie to forward in the first place. Result:
// every admin mutation 403'd for real admins, ABN verify and bulk import 403'd
// for real dealers, and reports/affiliate-leads recorded a null user id for
// signed-in users.
//
// The contract now is: browser sends `Authorization: Bearer <access_token>`
// (src/lib/authedFetch.js), server verifies that JWT (src/lib/serverAuth.ts).

import { test, expect } from '@playwright/test';
import { bearerToken } from '../../src/lib/serverAuth.ts';

/** Minimal stand-in for the Headers-bearing request object the helper takes. */
function req(headers = {}) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return { headers: { get: (k) => lower[k.toLowerCase()] ?? null } };
}

test.describe('bearerToken', () => {
  test('extracts the token from a well-formed header', () => {
    expect(bearerToken(req({ authorization: 'Bearer abc.def.ghi' }))).toBe('abc.def.ghi');
  });

  test('is case-insensitive on the scheme', () => {
    expect(bearerToken(req({ authorization: 'bearer abc' }))).toBe('abc');
    expect(bearerToken(req({ authorization: 'BEARER abc' }))).toBe('abc');
  });

  test('returns null when the header is absent, empty, or not Bearer', () => {
    expect(bearerToken(req())).toBeNull();
    expect(bearerToken(req({ authorization: '' }))).toBeNull();
    expect(bearerToken(req({ authorization: 'Bearer' }))).toBeNull();
    expect(bearerToken(req({ authorization: 'Bearer   ' }))).toBeNull();
    expect(bearerToken(req({ authorization: 'Basic dXNlcjpwYXNz' }))).toBeNull();
  });

  test('a forwarded cookie is NOT accepted as credentials', () => {
    // The exact shape the old code relied on. It must not authenticate anyone.
    expect(bearerToken(req({ cookie: 'sb-access-token=abc; sb-refresh-token=def' }))).toBeNull();
  });
});

test.describe('admin API rejects unauthenticated callers', () => {
  // Direction that matters for security: no credentials must never mutate.
  // (In this sandbox Supabase is unconfigured, so requireAdmin also fails
  // closed on a missing service key — either way the assertion below is the
  // one we care about: an anonymous POST does not get through.)
  for (const path of ['/api/admin/listings', '/api/admin/users', '/api/admin/dealer-apps']) {
    test(`POST ${path} without a token is refused`, async ({ request }) => {
      const res = await request.post(path, { data: { id: 'x', action: 'approve' } });
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });
  }
});
