// GET /api/cron/onboarding-emails
// Vercel Cron, daily at 10:00 UTC. Drip-sequence:
//   Day 0 — auth.welcome (already fired by signup flow; this cron is
//           idempotent — won't re-send for users >0 days old).
//   Day 2 — "have you uploaded photos?" (only for users who haven't
//           yet listed an aircraft).
//   Day 7 — "still haven't listed?" (gentle nudge, single send).
//
// Uses a simple `onboarding_step_sent` row pattern in profiles to
// dedupe across reruns. Cheap; no per-event row needed for this volume.

import { NextResponse } from 'next/server';
import { sendEmail } from '../../../../lib/email';
import { adminClient } from '../../../../lib/requireAdmin';

export const runtime = 'nodejs';

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

async function ageBucket(supabase, lo, hi) {
  // Users created between lo and hi days ago.
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at, onboarding_step_sent')
    .gte('created_at', daysAgo(hi))
    .lt('created_at', daysAgo(lo));
  return data || [];
}

// Which of these users have listed at least one aircraft — a single
// batched query instead of one count() per user.
async function usersWithListings(supabase, userIds) {
  if (!userIds.length) return new Set();
  const { data } = await supabase.from('aircraft').select('user_id').in('user_id', userIds);
  return new Set((data || []).map(r => r.user_id));
}

// Send the nudge to everyone in the bucket who hasn't listed yet
// (parallel), then stamp onboarding_step_sent for the whole bucket
// (nudged + already-listed) in one batched update instead of one per user.
async function processBucket(supabase, bucket, step) {
  const pending = bucket.filter(u => u.onboarding_step_sent !== step && u.onboarding_step_sent !== 'day7');
  if (!pending.length) return 0;

  const listedIds = await usersWithListings(supabase, pending.map(u => u.id));
  const toNudge = pending.filter(u => !listedIds.has(u.id) && u.email);
  const toStamp = pending.map(u => u.id);

  await Promise.all(toNudge.map(u => sendEmail({
    to: u.email,
    template: `onboarding.${step}`,
    vars: { firstName: u.full_name?.split(' ')[0] },
  })));

  if (toStamp.length) {
    await supabase.from('profiles').update({ onboarding_step_sent: step }).in('id', toStamp);
  }

  return toNudge.length;
}

export async function GET(req) {
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  // Users 2-3 days old (day-2 nudge) and 7-8 days old (day-7 nudge) —
  // independent buckets, fetched concurrently.
  const [day2Bucket, day7Bucket] = await Promise.all([
    ageBucket(supabase, 2, 3),
    ageBucket(supabase, 7, 8),
  ]);

  const [day2Sent, day7Sent] = await Promise.all([
    processBucket(supabase, day2Bucket, 'day2'),
    processBucket(supabase, day7Bucket, 'day7'),
  ]);

  return NextResponse.json({ ok: true, day2Sent, day7Sent });
}
