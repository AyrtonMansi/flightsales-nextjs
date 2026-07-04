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
import { sendEmail } from '../../../../lib/email';
import { adminClient } from '../../../../lib/requireAdmin';

export const runtime = 'nodejs';

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

  const remindable = (dueSoon || []).filter(row => row.profile?.email);
  await Promise.all(remindable.map(row => {
    const daysLeft = Math.max(1, Math.ceil((new Date(row.expires_at) - now) / 86400000));
    return sendEmail({
      to: row.profile.email,
      template: 'listing.approved',  // re-uses the visual shell; subject overridden via vars
      vars: {
        aircraftTitle: row.title,
        aircraftId: row.id,
        renewalDays: daysLeft,
      },
    });
  }));
  if (remindable.length) {
    await supabase
      .from('aircraft')
      .update({ renewal_reminder_sent_at: now.toISOString() })
      .in('id', remindable.map(row => row.id));
  }
  const remindersSent = remindable.length;

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
    // unavailable; the status change is the source of truth). One
    // batched profiles lookup instead of one query per expired listing.
    const ownerIds = [...new Set(expired.map(r => r.user_id).filter(Boolean))];
    const { data: owners } = ownerIds.length
      ? await supabase.from('profiles').select('id, email').in('id', ownerIds)
      : { data: [] };
    const emailByOwnerId = new Map((owners || []).map(o => [o.id, o.email]));

    await Promise.all(expired.map(async (row) => {
      const email = row.user_id ? emailByOwnerId.get(row.user_id) : null;
      if (!email) return;
      await sendEmail({
        to: email,
        template: 'listing.rejected', // re-uses template; reason explains expiry
        vars: {
          aircraftTitle: 'Your listing',
          aircraftId: row.id,
          reason: 'Your listing reached its 60-day expiry and has been auto-archived. Open your dashboard to renew it for another 60 days.',
        },
      });
    }));
  }

  return NextResponse.json({
    ok: true,
    remindersSent,
    archived: expired?.length || 0,
  });
}
