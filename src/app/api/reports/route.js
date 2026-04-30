// POST /api/reports { aircraftId, reason, details, reporterEmail }
// Creates a listing_report row + emails admin so the queue is monitored
// in real time. Anonymous reporters can submit (we capture an email for
// follow-up); logged-in reporters get their user_id stamped.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/email';

export const runtime = 'nodejs';

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
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const { aircraftId, reason, details, reporterEmail, reporterUserId } = body || {};
  if (!aircraftId || !reason) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }
  if (!ALLOWED_REASONS.has(reason)) {
    return NextResponse.json({ ok: false, error: 'bad_reason' }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  const { data, error } = await supabase
    .from('listing_reports')
    .insert({
      aircraft_id: aircraftId,
      reason,
      details: details || null,
      reporter_email: reporterEmail || null,
      reporter_user_id: reporterUserId || null,
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
