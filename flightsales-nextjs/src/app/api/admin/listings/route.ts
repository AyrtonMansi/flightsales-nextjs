// POST /api/admin/listings
// Admin-only listing moderation. Replaces the client-side
// useAdminListings mutations in lib/hooks.js which ran with the
// user's anon-key session and could be bypassed if the row's RLS
// policy didn't restrict the target column (e.g. status flip).
//
// Body: { id, action, ...params }
//   action: 'approve' | 'reject' | 'feature' | 'unfeature' | 'archive' | 'restore'
//   reason: required when action === 'reject'

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, audit } from '../../../../lib/requireAdmin';

export const runtime = 'nodejs';

type Action = 'approve' | 'reject' | 'feature' | 'unfeature' | 'archive' | 'restore';
const ACTIONS = new Set<Action>(['approve', 'reject', 'feature', 'unfeature', 'archive', 'restore']);

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let body: { id?: string; action?: string; reason?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const { id, action, reason } = body || {};

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 });
  }
  if (!action || !ACTIONS.has(action as Action)) {
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  }
  if (action === 'reject' && !reason?.trim()) {
    return NextResponse.json({ ok: false, error: 'reason_required' }, { status: 400 });
  }

  // Fetch the row before so we can audit + return to the caller.
  const { data: before } = await auth.adminC
    .from('aircraft')
    .select('id, status, featured, rejection_reason, title, user_id')
    .eq('id', id)
    .maybeSingle();
  if (!before) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  switch (action as Action) {
    case 'approve':    patch.status = 'active';  patch.rejection_reason = null; break;
    case 'reject':     patch.status = 'pending'; patch.rejection_reason = reason!.trim(); break;
    case 'feature':    patch.featured = true; break;
    case 'unfeature':  patch.featured = false; break;
    case 'archive':    patch.status = 'sold'; break;
    case 'restore':    patch.status = 'active'; break;
  }

  const { data: after, error } = await auth.adminC
    .from('aircraft')
    .update(patch)
    .eq('id', id)
    .select('id, status, featured, rejection_reason, title, user_id')
    .single();

  if (error || !after) {
    return NextResponse.json({ ok: false, error: 'update_failed', detail: error?.message }, { status: 500 });
  }

  await audit(auth.adminC, auth.user?.id ?? null, `listing.${action}`, 'aircraft', id, before, after);

  return NextResponse.json({ ok: true, listing: after });
}
