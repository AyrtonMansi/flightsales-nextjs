// Shared admin auth gate for /api/admin/* server routes.
//
// Two valid callers:
//   1. Server-to-server with `x-internal-token: ${INTERNAL_API_TOKEN}`
//      — useful for trusted internal callers (cron, build steps) so
//      they don't need a session cookie.
//   2. A real admin session — we read the supabase auth cookie, look
//      up the profile, and require role='admin'.
//
// Returns the user-session client + a service-role admin client on
// success, or null. Callers should respond 403 on null.

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

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

  // Path 2: user-session cookie + profile.role check.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const cookieHeader = req.headers.get('cookie') || '';
  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { cookie: cookieHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
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
