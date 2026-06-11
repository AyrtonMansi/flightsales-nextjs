// POST /api/admin/users
// Admin user-level mutations. Bypasses the profiles column-lock
// trigger via service role.
//
// Body: { userId, action, reason?, role? }
//   action: 'suspend' | 'unsuspend' | 'promote' | 'demote' | 'set_role'
//   reason: required for 'suspend'
//   role:   required for 'set_role' — 'private' | 'dealer' | 'admin'

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, audit } from '../../../../lib/requireAdmin';

export const runtime = 'nodejs';

type Action = 'suspend' | 'unsuspend' | 'promote' | 'demote' | 'set_role';
const ACTIONS = new Set<Action>(['suspend', 'unsuspend', 'promote', 'demote', 'set_role']);
const ROLES = new Set(['private', 'dealer', 'admin']);

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let body: { userId?: string; action?: string; reason?: string; role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const { userId, action, reason, role } = body || {};

  if (!userId || typeof userId !== 'string') return NextResponse.json({ ok: false, error: 'missing_userId' }, { status: 400 });
  if (!action || !ACTIONS.has(action as Action)) return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  if (action === 'suspend' && !reason?.trim()) return NextResponse.json({ ok: false, error: 'reason_required' }, { status: 400 });
  if (action === 'set_role' && !ROLES.has(role || '')) return NextResponse.json({ ok: false, error: 'invalid_role' }, { status: 400 });

  // Self-action guard — admin can't downgrade or suspend themselves.
  if (auth.user && auth.user.id === userId && (action === 'suspend' || action === 'demote' || (action === 'set_role' && role !== 'admin'))) {
    return NextResponse.json({ ok: false, error: 'cannot_self_modify' }, { status: 400 });
  }

  const { data: before } = await auth.adminC
    .from('profiles')
    .select('id, email, role, is_dealer, suspended_at, suspension_reason')
    .eq('id', userId)
    .maybeSingle();
  if (!before) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  switch (action as Action) {
    case 'suspend':
      patch.suspended_at = now;
      patch.suspension_reason = reason!.trim();
      break;
    case 'unsuspend':
      patch.suspended_at = null;
      patch.suspension_reason = null;
      break;
    case 'promote':
      patch.is_dealer = true;
      // Only promote private → dealer; don't downgrade admin.
      if (before.role === 'private') patch.role = 'dealer';
      break;
    case 'demote':
      patch.is_dealer = false;
      if (before.role === 'dealer') patch.role = 'private';
      break;
    case 'set_role':
      patch.role = role;
      patch.is_dealer = role === 'dealer';
      break;
  }

  const { data: after, error } = await auth.adminC
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('id, email, role, is_dealer, suspended_at, suspension_reason')
    .single();

  if (error || !after) {
    return NextResponse.json({ ok: false, error: 'update_failed', detail: error?.message }, { status: 500 });
  }

  await audit(auth.adminC, auth.user?.id ?? null, `user.${action}`, 'profile', userId, before, after);

  return NextResponse.json({ ok: true, user: after });
}
