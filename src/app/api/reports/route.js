import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/email';
import { rateLimit, callerIp } from '../../../lib/ratelimit';
import { adminClient } from '../../../lib/requireAdmin';
import { getBearerUserId } from '../../../lib/serverAuth';

export const runtime = 'nodejs';

// Derive the reporter's user_id from their verified access token, never from
// the request body — trusting a body-supplied id would let anyone forge
// attribution against any user. Anonymous reports are still allowed and simply
// record a null reporter.
async function reporterFromAuth(req) {
  return getBearerUserId(req);
}

const ALLOWED_REASONS = new Set(['fake_listing', 'wrong_price', 'sold_elsewhere', 'spam', 'other']);

export async function POST(req) {
  const ip = callerIp(req);
  const rl = await rateLimit(`reports:${ip}`, { limit: 5, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: rl.unavailable ? 'abuse_protection_unavailable' : 'rate_limited' },
      { status: rl.unavailable ? 503 : 429, headers: { 'Retry-After': String(rl.retryAfter || 60) } },
    );
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const aircraftId = body?.aircraftId;
  const reason = String(body?.reason || '');
  const details = String(body?.details || '').trim();
  const reporterEmail = String(body?.reporterEmail || '').trim().toLowerCase();
  if (!aircraftId || !reason) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  if (!ALLOWED_REASONS.has(reason)) return NextResponse.json({ ok: false, error: 'bad_reason' }, { status: 400 });
  if (details.length > 3000 || reporterEmail.length > 254) return NextResponse.json({ ok: false, error: 'too_long' }, { status: 400 });
  if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 503 });

  const { data: listing } = await supabase.from('aircraft').select('id,title,rego').eq('id', aircraftId).maybeSingle();
  if (!listing) return NextResponse.json({ ok: false, error: 'listing_not_found' }, { status: 404 });

  const reporterUserId = await reporterFromAuth(req);
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
    console.error('[reports] insert failed', error.message);
    return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 500 });
  }

  const adminAddress = process.env.EMAIL_REPLY_TO || process.env.EMAIL_BCC_ADMIN;
  if (adminAddress) {
    await sendEmail({
      to: adminAddress,
      template: 'lead.admin',
      vars: {
        type: 'report',
        name: reporterEmail || 'Anonymous reporter',
        email: reporterEmail || 'no-email-provided',
        subject: `Report: ${reason}`,
        message: `Listing: ${listing.title || aircraftId}${listing.rego ? ` (${listing.rego})` : ''}\n\nReason: ${reason}\nDetails: ${details || '(none)'}\n\nReview: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://flightsales.com.au'}/admin`,
      },
    });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
