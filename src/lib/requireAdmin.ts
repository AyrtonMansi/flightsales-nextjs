// Shared admin auth gate for /api/admin/* server routes.
//
// Two valid callers:
//   1. Server-to-server with `x-internal-token: ${INTERNAL_API_TOKEN}`
//      — useful for trusted internal callers (cron, build steps) so
//      they don't need a user session.
//   2. A real admin session — the browser sends its Supabase access token
//      as `Authorization: Bearer <jwt>` (see src/lib/authedFetch.js); we
//      verify that JWT, look up the profile, and require role='admin'.
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

  // Path 1: internal token.
  const expected = process.env.INTERNAL_API_TOKEN;
  if (expected && req.headers.get('x-internal-token') === expected) {
    return { user: null, adminC };
  }

  // Path 2: verified user access token + profile.role check.
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
