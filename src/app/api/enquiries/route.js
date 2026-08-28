// POST /api/enquiries
// Persists a buyer enquiry, notifies the seller and sends a buyer receipt.

import { NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/email';
import { verifyTurnstileToken } from '../../../lib/turnstile';
import { rateLimit, callerIp } from '../../../lib/ratelimit';
import { adminClient } from '../../../lib/requireAdmin';

export const runtime = 'nodejs';

function limitedResponse(rl) {
  if (rl.unavailable) {
    return NextResponse.json({ ok: false, error: 'abuse_protection_unavailable' }, {
      status: 503,
      headers: { 'Retry-After': String(rl.retryAfter || 60) },
    });
  }
  return NextResponse.json({ ok: false, error: 'rate_limited' }, {
    status: 429,
    headers: { 'Retry-After': String(rl.retryAfter || 60) },
  });
}

export async function POST(req) {
  const ip = callerIp(req);
  const rl = await rateLimit(`enquiries:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) return limitedResponse(rl);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const { aircraftId, name, email, phone, message, financeStatus, turnstileToken } = body || {};

  if (!(await verifyTurnstileToken(turnstileToken))) {
    return NextResponse.json({ ok: false, error: 'captcha_failed' }, { status: 400 });
  }

  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = String(phone || '').trim();
  const cleanMessage = String(message || '').trim();
  if (!aircraftId || !cleanName || !cleanEmail || !cleanMessage) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }
  if (cleanMessage.length > 4000 || cleanName.length > 120 || cleanEmail.length > 254 || cleanPhone.length > 60) {
    return NextResponse.json({ ok: false, error: 'too_long' }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 503 });

  const { data: listing } = await supabase
    .from('aircraft')
    .select(`id, title, status, user_id, dealer_id, dealer:dealers(id, name)`)
    .eq('id', aircraftId)
    .maybeSingle();
  if (!listing) return NextResponse.json({ ok: false, error: 'listing_not_found' }, { status: 404 });
  if (listing.status !== 'active') return NextResponse.json({ ok: false, error: 'listing_not_available' }, { status: 410 });

  const { data: enquiry, error: enquiryErr } = await supabase
    .from('enquiries')
    .insert({
      aircraft_id: aircraftId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || null,
      message: cleanMessage,
      finance_status: financeStatus || null,
      status: 'new',
    })
    .select()
    .single();
  if (enquiryErr) {
    console.error('[enquiries] insert failed', enquiryErr.message);
    return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 500 });
  }

  let sellerEmail = null;
  let sellerUserId = null;
  if (listing.user_id) {
    sellerUserId = listing.user_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', listing.user_id)
      .maybeSingle();
    sellerEmail = profile?.email || null;
  }

  const aircraftTitle = listing.title || 'your listing';
  if (sellerEmail) {
    await sendEmail({
      to: sellerEmail,
      template: 'enquiry.seller',
      replyTo: cleanEmail,
      vars: { buyerName: cleanName, buyerEmail: cleanEmail, buyerPhone: cleanPhone, message: cleanMessage, aircraftTitle, aircraftId },
    });
  }

  await sendEmail({
    to: cleanEmail,
    template: 'enquiry.buyer',
    vars: { buyerName: cleanName, aircraftTitle, aircraftId },
  });

  if (sellerUserId) {
    await supabase.from('notifications').insert({
      user_id: sellerUserId,
      type: 'enquiry.received',
      title: `New enquiry on ${aircraftTitle}`,
      body: `${cleanName} <${cleanEmail}> — ${cleanMessage.slice(0, 120)}${cleanMessage.length > 120 ? '…' : ''}`,
      link: '/dashboard',
    });
  }

  return NextResponse.json({ ok: true, id: enquiry.id });
}
