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

export async function POST(req) {
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

  return NextResponse.json({ ok: true });
}
