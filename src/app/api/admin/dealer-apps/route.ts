// POST /api/admin/dealer-apps
// Admin approves/rejects a dealer_applications row. Approval flips
// profiles.is_dealer + role='dealer' and optionally creates a dealers
// directory row. Service-role bypasses the profiles column-lock trigger
// so this mutation is the legitimate path for promotion.
//
// Body: { id, action, reason? }
//   action: 'approve' | 'reject'

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, audit } from '../../../../lib/requireAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let body: { id?: string; action?: string; reason?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const { id, action, reason } = body || {};

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 });
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  }
  if (action === 'reject' && !reason?.trim()) {
    return NextResponse.json({ ok: false, error: 'reason_required' }, { status: 400 });
  }

  const { data: app } = await auth.adminC
    .from('dealer_applications')
    .select('id, user_id, business_name, location, status')
    .eq('id', id)
    .maybeSingle();
  if (!app) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const now = new Date().toISOString();

  if (action === 'reject') {
    const { error } = await auth.adminC
      .from('dealer_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason!.trim(),
        reviewed_by: auth.user?.id ?? null,
        reviewed_at: now,
      })
      .eq('id', id);
    if (error) return NextResponse.json({ ok: false, error: 'update_failed', detail: error.message }, { status: 500 });
    await audit(auth.adminC, auth.user?.id ?? null, 'dealer_app.reject', 'dealer_applications', id, app, null);
    return NextResponse.json({ ok: true, status: 'rejected' });
  }

  // Approve: flip the profile, optionally create a dealers row, mark app approved.
  // The profile column-lock trigger lets service_role through, so this works.
  const profilePatch = {
    is_dealer: true,
    role: 'dealer',
    pending_dealer: false,
    updated_at: now,
  };
  const { error: profErr } = await auth.adminC
    .from('profiles')
    .update(profilePatch)
    .eq('id', app.user_id)
    // Don't downgrade admins.
    .neq('role', 'admin');
  if (profErr) {
    return NextResponse.json({ ok: false, error: 'profile_update_failed', detail: profErr.message }, { status: 500 });
  }

  const { error: appErr } = await auth.adminC
    .from('dealer_applications')
    .update({
      status: 'approved',
      reviewed_by: auth.user?.id ?? null,
      reviewed_at: now,
    })
    .eq('id', id);
  if (appErr) {
    return NextResponse.json({ ok: false, error: 'app_update_failed', detail: appErr.message }, { status: 500 });
  }

  await audit(auth.adminC, auth.user?.id ?? null, 'dealer_app.approve', 'dealer_applications', id, app, profilePatch);

  return NextResponse.json({ ok: true, status: 'approved', user_id: app.user_id });
}
