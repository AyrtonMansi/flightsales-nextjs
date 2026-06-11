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
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../../lib/email';

export const runtime = 'nodejs';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

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

async function listingsForUser(supabase, userId) {
  const { count } = await supabase
    .from('aircraft')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count || 0;
}

export async function GET(req) {
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  let day2Sent = 0;
  let day7Sent = 0;

  // ── Day 2 nudge ──────────────────────────────────────────────────
  // Users 2-3 days old who haven't received the day-2 email yet AND
  // who haven't listed any aircraft.
  const day2Bucket = await ageBucket(supabase, 2, 3);
  for (const u of day2Bucket) {
    if (u.onboarding_step_sent === 'day2' || u.onboarding_step_sent === 'day7') continue;
    const listings = await listingsForUser(supabase, u.id);
    if (listings > 0) {
      // They've listed — skip nudge but mark so we don't keep checking
      await supabase.from('profiles').update({ onboarding_step_sent: 'day2' }).eq('id', u.id);
      continue;
    }
    if (!u.email) continue;
    await sendEmail({
      to: u.email,
      template: 'auth.welcome',  // re-uses welcome shell w/ different vars
      vars: { firstName: u.full_name?.split(' ')[0], step: 'day2' },
    });
    await supabase.from('profiles').update({ onboarding_step_sent: 'day2' }).eq('id', u.id);
    day2Sent += 1;
  }

  // ── Day 7 final nudge ────────────────────────────────────────────
  const day7Bucket = await ageBucket(supabase, 7, 8);
  for (const u of day7Bucket) {
    if (u.onboarding_step_sent === 'day7') continue;
    const listings = await listingsForUser(supabase, u.id);
    if (listings > 0) {
      await supabase.from('profiles').update({ onboarding_step_sent: 'day7' }).eq('id', u.id);
      continue;
    }
    if (!u.email) continue;
    await sendEmail({
      to: u.email,
      template: 'auth.welcome',
      vars: { firstName: u.full_name?.split(' ')[0], step: 'day7' },
    });
    await supabase.from('profiles').update({ onboarding_step_sent: 'day7' }).eq('id', u.id);
    day7Sent += 1;
  }

  return NextResponse.json({ ok: true, day2Sent, day7Sent });
}
