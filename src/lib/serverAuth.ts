// Resolve the calling user from a request, server-side.
//
// This replaces a pattern that was repeated across seven routes and could
// never have worked:
//
//     const userClient = createClient(url, anon, {
//       auth: { persistSession: false, autoRefreshToken: false },
//       global: { headers: { cookie: req.headers.get('cookie') } },
//     });
//     const { data: { user } } = await userClient.auth.getUser();
//
// Two independent reasons it always returned null:
//
//   1. supabase-js does not read sessions from a `cookie` header. Passing one
//      through `global.headers` just forwards an opaque string to PostgREST.
//      `getUser()` with no argument looks in the client's own session storage,
//      which `persistSession: false` guarantees is empty — so it returns
//      AuthSessionMissingError every time.
//   2. There was no cookie to forward anyway. The browser client
//      (src/lib/supabase.js) is created with default options, so the session
//      lives in localStorage, and the client fetches sent no credentials.
//
// Net effect before this fix: every admin mutation 403'd for real admins, ABN
// verification and bulk import 403'd for real dealers, and reports/affiliate
// leads silently recorded a null user id for signed-in users.
//
// The fix is the standard Supabase pattern: the browser sends its access token
// as a Bearer header (see src/lib/authedFetch.js) and the server validates that
// JWT against the auth server with `getUser(token)`, which really does perform
// a signature-checked lookup.

import { createClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/** Extract a Bearer token from the Authorization header, if present. */
export function bearerToken(req: NextRequest | Request): string | null {
  const header = req.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Verify the caller's access token and return the authenticated user.
 * Returns null for anonymous or invalid-token callers — never throws.
 */
export async function getBearerUser(req: NextRequest | Request): Promise<User | null> {
  const token = bearerToken(req);
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    const client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Passing the JWT explicitly is the part that matters: this hits
    // GET /auth/v1/user with the token and validates its signature.
    const { data, error } = await client.auth.getUser(token);
    if (error) return null;
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** Convenience: just the user id, or null. */
export async function getBearerUserId(req: NextRequest | Request): Promise<string | null> {
  const user = await getBearerUser(req);
  return user?.id ?? null;
}
