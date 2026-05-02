// POST /api/admin/notify
// Fires the right email + creates an in-app notification for an admin
// action that already happened in the DB. Call this AFTER the listing /
// dealer-app status mutation has succeeded — keeps the DB write
// concerns (RLS-protected) separate from the side effects (email +
// notification).
//
// Body: { event, targetUserId?, vars }
//   event: 'listing.approved' | 'listing.rejected' | 'dealer_app.approved' | 'dealer_app.rejected' | 'user.suspended'
//   targetUserId: the user_id the email + in-app notification are for
//   vars: passed to the email template renderer
//
// Auth: requires the caller to have an admin session. We verify by
// reading the supabase auth cookie and checking profiles.role.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../../lib/email';

export const runtime = 'nodejs';

const EVENTS = new Set([
  'listing.approved',
  'listing.rejected',
  'dealer_app.approved',
  'dealer_app.rejected',
  'user.suspended',
]);

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// In-app notification metadata per event.
const INAPP = {
  'listing.approved': (v) => ({ title: `Listing approved: ${v.aircraftTitle || ''}`, body: 'Your listing is now live.', link: `/listings/${v.aircraftId || ''}` }),
  'listing.rejected': (v) => ({ title: `Listing needs changes: ${v.aircraftTitle || ''}`, body: v.reason || 'Reason: not provided.', link: '/dashboard' }),
  'dealer_app.approved': (v) => ({ title: 'Dealer application approved', body: `${v.businessName || 'Your business'} is now a verified dealer.`, link: '/dashboard' }),
  'dealer_app.rejected': (v) => ({ title: 'Dealer application not approved', body: v.reason || 'See email for details.', link: '/dashboard' }),
  'user.suspended': (v) => ({ title: 'Account suspended', body: v.reason || 'See email for details.', link: '/' }),
};

// Auth gate. Two valid callers:
//   1. Server-to-server with `x-internal-token: ${INTERNAL_API_TOKEN}` —
//      admin tabs in this app POST after a DB mutation; the token is
//      also rotatable independent of any session.
//   2. A real admin session — we read the supabase auth cookie, look up
//      the profile, and require role='admin'. Nothing else gets in.
//
// Without a gate, anyone with the URL can fire admin emails to any
// address and insert forged notification rows. That's a phishing
// foothold via our own infrastructure.
async function isAuthorisedAdmin(req) {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (expected && req.headers.get('x-internal-token') === expected) return true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;

  // Build a request-scoped supabase client that can read the user's
  // auth cookie — service role client doesn't see the session.
  const cookieHeader = req.headers.get('cookie') || '';
  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { cookie: cookieHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return false;

  // Verify admin role server-side via the service-role-able client.
  const adminC = adminClient();
  if (!adminC) return false;
  const { data: profile } = await adminC
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return profile?.role === 'admin';
}

export async function POST(req) {
  if (!await isAuthorisedAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const { event, targetUserId, vars = {} } = body || {};

  if (!EVENTS.has(event)) {
    return NextResponse.json({ ok: false, error: 'unknown_event' }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  // Look up target email if not supplied.
  let recipientEmail = vars?.toEmail || null;
  if (!recipientEmail && targetUserId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', targetUserId)
      .maybeSingle();
    recipientEmail = profile?.email || null;
  }

  // Email — template name matches the event id one-to-one.
  if (recipientEmail) {
    await sendEmail({ to: recipientEmail, template: event, vars });
  }

  // In-app notification (skip suspensions; suspended user can't read).
  if (targetUserId && event !== 'user.suspended') {
    const meta = INAPP[event](vars);
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: event,
      title: meta.title,
      body: meta.body,
      link: meta.link,
    });
  }

  // Audit log — every admin action writes a row so we have a who/what/when
  // trail. The admin_audit table is RLS-locked to admin reads. Failures
  // here are silent — auditing is observability, not a hard dependency
  // on the user-facing flow.
  try {
    const adminId = vars?.adminId || null;
    await supabase.from('admin_audit').insert({
      admin_id: adminId,
      action: event,
      target_type: event.startsWith('listing.') ? 'aircraft'
                 : event.startsWith('dealer_app.') ? 'dealer_app'
                 : event.startsWith('user.') ? 'profile'
                 : 'unknown',
      target_id: vars?.targetId || vars?.aircraftId || null,
      after: vars || null,
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
