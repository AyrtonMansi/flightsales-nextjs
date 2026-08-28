// Shared admin auth gate for /api/admin/* server routes.
//
// One valid caller: a real admin session. The browser sends its Supabase
// access token as `Authorization: Bearer <jwt>` (see src/lib/authedFetch.js);
// we verify that JWT, look up the profile, and require role='admin'.
//
// There is deliberately no shared-secret bypass — see the note in the body.
//
// This previously tried to read a Supabase auth *cookie*, which never
// worked: the browser client stores its session in localStorage, and
// supabase-js does not resolve sessions from a forwarded cookie header
// regardless. Every admin mutation therefore 403'd for real admins. See
// the long note in src/lib/serverAuth.ts.
//
// Returns the user-session client + a service-role admin client on
// success, or null. Callers should respond 403 on null.

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { getBearerUser } from './serverAuth';

export interface AdminAuthContext {
  user: User | null;       // null when authorised via internal-token
  adminC: SupabaseClient;
}

export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function requireAdmin(req: NextRequest): Promise<AdminAuthContext | null> {
  const adminC = adminClient();
  if (!adminC) return null;

  // The `x-internal-token: ${INTERNAL_API_TOKEN}` bypass that used to sit
  // here has been REMOVED. It granted full admin — approve/reject/feature
  // any listing, suspend/promote any user, approve dealer applications —
  // to anyone presenting a single shared header value, and it was checked
  // BEFORE any session lookup.
  //
  // That value was committed to LAUNCH.md and is still readable in this
  // repository's git history (commit 6a470d9). The repository is public,
  // so the "secret" was world-readable, and API routes are not behind the
  // pre-launch password wall (that's a client-side React component), which
  // means the hole was live in production.
  //
  // Nothing in the codebase ever sent the header — grep for x-internal-token
  // returns only the two places that checked it — so this is a pure removal
  // with no caller to migrate. Deleting the path closes the hole immediately
  // rather than depending on the token being rotated promptly.
  //
  // If a genuine server-to-server caller is needed later, give it its own
  // credential with a narrow scope, not a global admin skeleton key.

  // Verified user access token + profile.role check.
  const user = await getBearerUser(req);
  if (!user) return null;

  const { data: profile } = await adminC
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') return null;

  return { user, adminC };
}

// Tiny helper for audit-log writes. Best-effort — failures don't
// break the parent operation.
export async function audit(
  adminC: SupabaseClient,
  adminId: string | null,
  action: string,
  target_type: string,
  target_id: string | null,
  before: unknown = null,
  after: unknown = null,
): Promise<void> {
  try {
    await adminC.from('admin_audit').insert({
      admin_id: adminId,
      action,
      target_type,
      target_id,
      before,
      after,
    });
  } catch { /* swallow */ }
}
