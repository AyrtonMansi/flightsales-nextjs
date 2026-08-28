// Regression: the admin API must have no shared-secret bypass.
//
// requireAdmin() used to accept `x-internal-token: ${INTERNAL_API_TOKEN}` as
// a first-class auth path, checked BEFORE any session lookup, granting full
// admin across /api/admin/listings, /users, /dealer-apps and /notify —
// approve or reject any listing, suspend or promote any user, approve dealer
// applications, send platform email to arbitrary addresses.
//
// That value was committed to LAUNCH.md and remains readable in this
// repository's git history (commit 6a470d9). The repository is public, so
// the "secret" was world-readable. API routes sit outside the pre-launch
// password wall (that's a client-side React component), so the hole was live
// in production. Nothing in the app ever sent the header.
//
// These tests pin the removal: a header-only caller must never be admitted,
// and the header must not appear as an auth check in the source again.

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd());
const ADMIN_ROUTES = [
  '/api/admin/listings',
  '/api/admin/users',
  '/api/admin/dealer-apps',
  '/api/admin/notify',
];

test.describe('admin API has no shared-secret bypass', () => {
  for (const path of ADMIN_ROUTES) {
    test(`POST ${path} with x-internal-token is refused`, async ({ request }) => {
      const res = await request.post(path, {
        headers: {
          'x-internal-token': '8547722bede062de5e554b29c6404b1771761a2a7e2138b35d519fe306fb0ea4',
          'Content-Type': 'application/json',
        },
        data: { id: 'x', userId: 'x', action: 'approve', event: 'listing.approved' },
      });
      // Must be rejected as unauthorised — never 200.
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });
  }

  test('no source file reads the internal-token header as an auth check', () => {
    for (const rel of ['src/lib/requireAdmin.ts', 'src/app/api/admin/notify/route.js']) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      // Strip comments so the explanatory notes don't trip the assertion.
      const code = src
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
      expect(code).not.toContain('x-internal-token');
      expect(code).not.toContain('INTERNAL_API_TOKEN');
    }
  });
});
