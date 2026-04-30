// POST /api/contact
// Records a contact-form / lead submission AND emails:
//   1) admin (the EMAIL_BCC_ADMIN address, or EMAIL_REPLY_TO if set)
//   2) the user — auto-reply confirming receipt
//
// type values: 'contact' (general) | 'finance' | 'insurance' | 'valuation'
// All four feed the same enquiries table with the type column so the
// admin LeadsTab can filter. The contact subject string flows into the
// admin email so triage is fast.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/email';
import { verifyTurnstileToken } from '../../../lib/turnstile';
import { rateLimit, callerIp } from '../../../lib/ratelimit';

export const runtime = 'nodejs';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  const ip = callerIp(req);
  const rl = await rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const { type = 'contact', name, email, phone, subject, message, aircraftId, turnstileToken } = body || {};

  if (!(await verifyTurnstileToken(turnstileToken))) {
    return NextResponse.json({ ok: false, error: 'captcha_failed' }, { status: 400 });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }
  if (!['contact', 'finance', 'insurance', 'valuation'].includes(type)) {
    return NextResponse.json({ ok: false, error: 'bad_type' }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  const { data, error } = await supabase
    .from('enquiries')
    .insert({
      aircraft_id: aircraftId || null,
      type,
      name, email,
      phone: phone || null,
      message: subject ? `[${subject}] ${message}` : message,
      status: 'new',
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ ok: false, error: 'db_insert_failed', detail: error.message }, { status: 500 });
  }

  const adminAddress = process.env.EMAIL_REPLY_TO || process.env.EMAIL_BCC_ADMIN;
  if (adminAddress) {
    await sendEmail({
      to: adminAddress,
      template: 'lead.admin',
      replyTo: email,
      vars: { type, name, email, phone, subject, message },
    });
  }

  await sendEmail({
    to: email,
    template: 'lead.user',
    vars: { type, name },
  });

  return NextResponse.json({ ok: true, id: data.id });
}
