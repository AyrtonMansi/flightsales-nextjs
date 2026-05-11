// POST /api/reports { aircraftId, reason, details, reporterEmail }
// Creates a listing_report row + emails admin so the queue is monitored
// in real time. Anonymous reporters can submit (we capture an email for
// follow-up); logged-in reporters get their user_id stamped.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/email';
import { rateLimit, callerIp } from '../../../lib/ratelimit';

export const runtime = 'nodejs';

// Derive reporter user_id from the auth cookie, not the request body.
// Trusting body-supplied user IDs lets an attacker forge attribution
// against any user. Anonymous reports are still allowed (returns null).
async function reporterFromAuth(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const cookieHeader = req.headers.get('cookie') || '';
  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { cookie: cookieHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  return user?.id || null;
}

const ALLOWED_REASONS = new Set([
  'fake_listing', 'wrong_price', 'sold_elsewhere', 'spam', 'other',
]);

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  // Per-IP rate limit — reports trigger an admin email, so the abuse vector
  // is spamming the admin inbox or filling listing_reports with junk.
  // 5/min/IP is more than enough for any legitimate reporter.
  const ip = callerIp(req);
  const rl = await rateLimit(`reports:${ip}`, { limit: 5, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: rl.retryAfter ? { 'Retry-After': String(rl.retryAfter) } : undefined },
    );
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  // NOTE: reporter_user_id is intentionally NOT read from body anymore —
  // we derive it from the auth cookie to prevent forged attribution.
  const { aircraftId, reason, details, reporterEmail } = body || {};
  if (!aircraftId || !reason) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }
  if (!ALLOWED_REASONS.has(reason)) {
    return NextResponse.json({ ok: false, error: 'bad_reason' }, { status: 400 });
  }

  const reporterUserId = await reporterFromAuth(req);

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  const { data, error } = await supabase
    .from('listing_reports')
    .insert({
      aircraft_id: aircraftId,
      reason,
      details: details || null,
      reporter_email: reporterEmail || null,
      reporter_user_id: reporterUserId,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ ok: false, error: 'db_insert_failed', detail: error.message }, { status: 500 });
  }

  // Email admin so the queue gets actively triaged, not just sat in DB.
  const adminAddress = process.env.EMAIL_REPLY_TO || process.env.EMAIL_BCC_ADMIN;
  if (adminAddress) {
    const { data: listing } = await supabase
      .from('aircraft').select('title, rego').eq('id', aircraftId).maybeSingle();
    await sendEmail({
      to: adminAddress,
      template: 'lead.admin',
      vars: {
        type: 'report',
        name: reporterEmail || 'Anonymous reporter',
        email: reporterEmail || 'no-email-provided',
        subject: `Report: ${reason}`,
        message: `Listing: ${listing?.title || aircraftId}${listing?.rego ? ` (${listing.rego})` : ''}\n\nReason: ${reason}\nDetails: ${details || '(none)'}\n\nReview: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://flightsales.com.au'}/admin`,
      },
    });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
