import { NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/email';
import { verifyTurnstileToken } from '../../../lib/turnstile';
import { rateLimit, callerIp } from '../../../lib/ratelimit';
import { adminClient } from '../../../lib/requireAdmin';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['contact', 'finance', 'insurance', 'valuation']);

function limitedResponse(rl) {
  const unavailable = !!rl.unavailable;
  return NextResponse.json(
    { ok: false, error: unavailable ? 'abuse_protection_unavailable' : 'rate_limited' },
    { status: unavailable ? 503 : 429, headers: { 'Retry-After': String(rl.retryAfter || 60) } },
  );
}

export async function POST(req) {
  const ip = callerIp(req);
  const rl = await rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) return limitedResponse(rl);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const type = String(body?.type || 'contact');
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const phone = String(body?.phone || '').trim();
  const subject = String(body?.subject || '').trim();
  const message = String(body?.message || '').trim();
  const aircraftId = body?.aircraftId || null;

  if (!(await verifyTurnstileToken(body?.turnstileToken))) {
    return NextResponse.json({ ok: false, error: 'captcha_failed' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(type)) return NextResponse.json({ ok: false, error: 'bad_type' }, { status: 400 });
  if (!name || !email || !message) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  if (name.length > 120 || email.length > 254 || phone.length > 60 || subject.length > 180 || message.length > 4000) {
    return NextResponse.json({ ok: false, error: 'too_long' }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 503 });

  if (aircraftId) {
    const { data: listing } = await supabase.from('aircraft').select('id,status').eq('id', aircraftId).maybeSingle();
    if (!listing) return NextResponse.json({ ok: false, error: 'listing_not_found' }, { status: 404 });
  }

  const storedMessage = subject ? `[${subject}] ${message}` : message;
  const { data, error } = await supabase
    .from('enquiries')
    .insert({ aircraft_id: aircraftId, type, name, email, phone: phone || null, message: storedMessage, status: 'new' })
    .select()
    .single();

  if (error) {
    console.error('[contact] insert failed', error.message);
    return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 500 });
  }

  const adminAddress = process.env.EMAIL_REPLY_TO || process.env.EMAIL_BCC_ADMIN;
  if (adminAddress) {
    await sendEmail({ to: adminAddress, template: 'lead.admin', replyTo: email, vars: { type, name, email, phone, subject, message } });
  }
  await sendEmail({ to: email, template: 'lead.user', vars: { type, name } });

  return NextResponse.json({ ok: true, id: data.id });
}
