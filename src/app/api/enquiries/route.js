// POST /api/enquiries
// Records a buyer enquiry against a listing AND fires two emails:
//   1) seller — "you've got an enquiry"
//   2) buyer  — auto-reply confirming the message went through
// Plus an in-app notification row for the seller's bell.
//
// This route exists instead of letting the client write directly to the
// enquiries table because the email + notification triggers need server
// context (Resend API key, Supabase service role for the cross-user
// notification insert). The client-side submitEnquiry helper still
// works for back-compat but new callers should hit this route.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/email';

export const runtime = 'nodejs';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const { aircraftId, name, email, phone, message, financeStatus } = body || {};

  // Minimum fields. Server-side validation only — client also checks but
  // we don't trust that.
  if (!aircraftId || !name || !email || !message) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  // 1) Persist the enquiry.
  const { data: enquiry, error: enquiryErr } = await supabase
    .from('enquiries')
    .insert({
      aircraft_id: aircraftId,
      name, email,
      phone: phone || null,
      message,
      finance_status: financeStatus || null,
      status: 'new',
    })
    .select()
    .single();
  if (enquiryErr) {
    return NextResponse.json({ ok: false, error: 'db_insert_failed', detail: enquiryErr.message }, { status: 500 });
  }

  // 2) Look up the listing + seller's email so we know who to notify.
  const { data: listing } = await supabase
    .from('aircraft')
    .select(`id, title, user_id, dealer_id, dealer:dealers(id, name)`)
    .eq('id', aircraftId)
    .maybeSingle();

  let sellerEmail = null;
  let sellerUserId = null;
  if (listing?.user_id) {
    sellerUserId = listing.user_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', listing.user_id)
      .maybeSingle();
    sellerEmail = profile?.email || null;
  }

  const aircraftTitle = listing?.title || 'your listing';

  // 3) Email seller (if we have an address). Fail-soft — DB row is
  // already in, the admin BCC will catch sends without a seller email.
  if (sellerEmail) {
    await sendEmail({
      to: sellerEmail,
      template: 'enquiry.seller',
      replyTo: email, // seller can reply directly to buyer
      vars: { buyerName: name, buyerEmail: email, buyerPhone: phone, message, aircraftTitle, aircraftId },
    });
  }

  // 4) Auto-reply to buyer.
  await sendEmail({
    to: email,
    template: 'enquiry.buyer',
    vars: { buyerName: name, aircraftTitle, aircraftId },
  });

  // 5) In-app notification for the seller.
  if (sellerUserId) {
    await supabase.from('notifications').insert({
      user_id: sellerUserId,
      type: 'enquiry.received',
      title: `New enquiry on ${aircraftTitle}`,
      body: `${name} <${email}> — ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`,
      link: '/dashboard',
    });
  }

  return NextResponse.json({ ok: true, id: enquiry.id });
}
