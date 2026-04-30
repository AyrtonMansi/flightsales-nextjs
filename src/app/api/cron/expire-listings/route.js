// GET /api/cron/expire-listings
// Scheduled by Vercel Cron (vercel.json). Two passes:
//
//   1. Listings whose `expires_at` is within 7 days AND no
//      renewal_reminder_sent_at — email the seller a renewal reminder
//      and stamp renewal_reminder_sent_at so we don't spam.
//
//   2. Listings whose `expires_at` is in the past AND status != 'sold'
//      → status = 'archived'. Seller can renew from their dashboard
//      (which resets expires_at to NOW() + 60 days).
//
// Auth: Vercel Cron sends a request with `Authorization: Bearer
// <CRON_SECRET>`. We verify it before running so an attacker can't
// manually fire the endpoint and trigger a flood of renewal emails.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../../lib/email';

export const runtime = 'nodejs';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req) {
  // Verify the Vercel Cron header.
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 86400000).toISOString();

  // Pass 1 — renewal reminders.
  const { data: dueSoon } = await supabase
    .from('aircraft')
    .select(`id, title, user_id, expires_at, profile:profiles!user_id(email, full_name)`)
    .eq('status', 'active')
    .lte('expires_at', sevenDays)
    .gt('expires_at', now.toISOString())
    .is('renewal_reminder_sent_at', null);

  let remindersSent = 0;
  for (const row of dueSoon || []) {
    const recipient = row.profile?.email;
    if (!recipient) continue;
    const daysLeft = Math.max(1, Math.ceil((new Date(row.expires_at) - now) / 86400000));
    await sendEmail({
      to: recipient,
      template: 'listing.approved',  // re-uses the visual shell; subject overridden via vars
      vars: {
        aircraftTitle: row.title,
        aircraftId: row.id,
        renewalDays: daysLeft,
      },
    });
    await supabase
      .from('aircraft')
      .update({ renewal_reminder_sent_at: now.toISOString() })
      .eq('id', row.id);
    remindersSent++;
  }

  // Pass 2 — auto-archive expired listings.
  const { data: expired } = await supabase
    .from('aircraft')
    .select('id, user_id')
    .eq('status', 'active')
    .lte('expires_at', now.toISOString());

  if (expired && expired.length) {
    await supabase
      .from('aircraft')
      .update({ status: 'archived' })
      .in('id', expired.map(r => r.id));

    // Notify each seller their listing expired (skip if email infra
    // unavailable; the status change is the source of truth).
    for (const row of expired) {
      if (!row.user_id) continue;
      const { data: profile } = await supabase
        .from('profiles').select('email').eq('id', row.user_id).maybeSingle();
      if (!profile?.email) continue;
      await sendEmail({
        to: profile.email,
        template: 'listing.rejected', // re-uses template; reason explains expiry
        vars: {
          aircraftTitle: 'Your listing',
          aircraftId: row.id,
          reason: 'Your listing reached its 60-day expiry and has been auto-archived. Open your dashboard to renew it for another 60 days.',
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    remindersSent,
    archived: expired?.length || 0,
  });
}
