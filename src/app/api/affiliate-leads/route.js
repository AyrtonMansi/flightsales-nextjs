// POST /api/affiliate-leads
// Captures a lead from a logged-in or anonymous buyer who clicked a
// partner CTA on a listing detail page (or /partners). Creates the row
// in `affiliate_leads`, dispatches to the partner via their configured
// method (email | webhook | api), emails a confirmation to the buyer,
// and returns ok/error for the client modal.
//
// Auth: anyone may submit (anon allowed). Rate-limited per-IP to deter
// abuse. The actual lead row is written via service-role since RLS
// locks affiliate_leads to admins + the lead's owner.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/email';
import { rateLimit, callerIp } from '../../../lib/ratelimit';

export const runtime = 'nodejs';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function clean(s, max = 1000) {
  if (typeof s !== 'string') return null;
  const trimmed = s.trim().slice(0, max);
  return trimmed.length ? trimmed : null;
}

function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req) {
  // Rate-limit (10 leads per IP per hour — the form has spam protection
  // via Turnstile, this is the second line of defence).
  const ip = callerIp(req);
  const rl = await rateLimit(`affiliate-lead:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const affiliateId = clean(body.affiliateId, 64);
  const userName    = clean(body.userName, 200);
  const userEmail   = clean(body.userEmail, 200);
  const userPhone   = clean(body.userPhone, 50);
  const message     = clean(body.message, 2000);
  const userId      = clean(body.userId, 64) || null;
  const listingId   = body.listingId != null ? Number(body.listingId) : null;

  if (!affiliateId)              return NextResponse.json({ ok: false, error: 'missing_affiliate' }, { status: 400 });
  if (!userName)                 return NextResponse.json({ ok: false, error: 'missing_name' }, { status: 400 });
  if (!isEmail(userEmail))       return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  // Look up the partner — must be active.
  const { data: partner, error: partnerErr } = await supabase
    .from('affiliates')
    .select('*')
    .eq('id', affiliateId)
    .eq('status', 'active')
    .single();
  if (partnerErr || !partner) {
    return NextResponse.json({ ok: false, error: 'partner_not_found' }, { status: 404 });
  }

  // Optional listing context — skip if missing or invalid (still capture the lead).
  let listing = null;
  if (Number.isInteger(listingId) && listingId > 0) {
    const { data } = await supabase
      .from('aircraft')
      .select('id, title, price')
      .eq('id', listingId)
      .maybeSingle();
    listing = data || null;
  }

  // Insert the lead row.
  const { data: lead, error: leadErr } = await supabase
    .from('affiliate_leads')
    .insert({
      affiliate_id: partner.id,
      user_id: userId,
      listing_id: listing?.id ?? null,
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      message,
      status: 'sent',
      delivery_status: 'pending',
    })
    .select()
    .single();
  if (leadErr || !lead) {
    return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 500 });
  }

  // Dispatch to the partner. We always best-effort — even if delivery
  // fails the lead row exists for the admin to manually re-send.
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://flightsales.com.au';
  const listingUrl = listing ? `${site}/listings/${listing.id}` : null;
  const dispatchVars = {
    partnerName: partner.name,
    partnerType: partner.type,
    userName, userEmail, userPhone, message,
    listingTitle: listing?.title,
    listingPrice: listing?.price,
    listingUrl,
  };

  let deliveryStatus = 'failed';
  let deliveryResponse = null;
  let deliveryError = null;

  try {
    if (partner.lead_capture_method === 'email' && partner.lead_email) {
      const r = await sendEmail({
        to: partner.lead_email,
        template: 'affiliate.lead',
        vars: dispatchVars,
        replyTo: userEmail,
      });
      deliveryStatus = r.ok ? 'delivered' : 'failed';
      deliveryError = r.ok ? null : (r.reason || 'send_failed');
    } else if (partner.lead_capture_method === 'webhook' && partner.lead_webhook_url) {
      const res = await fetch(partner.lead_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'flightsales.com.au',
          lead_id: lead.id,
          ...dispatchVars,
        }),
      });
      deliveryStatus = res.ok ? 'delivered' : 'failed';
      let parsed = null;
      try { parsed = await res.json(); } catch { /* not json — fine */ }
      deliveryResponse = parsed;
      if (!res.ok) deliveryError = `webhook_${res.status}`;
    } else if (partner.lead_capture_method === 'api' && partner.api_endpoint_url) {
      // Generic API delivery — partners that want this share an endpoint
      // and we send a Bearer-auth POST. Each partner's exact contract
      // can extend this later via a per-partner adapter.
      const res = await fetch(partner.api_endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(partner.api_credential_secret
            ? { 'Authorization': `Bearer ${partner.api_credential_secret}` }
            : {}),
        },
        body: JSON.stringify({ source: 'flightsales.com.au', lead_id: lead.id, ...dispatchVars }),
      });
      deliveryStatus = res.ok ? 'delivered' : 'failed';
      let parsed = null;
      try { parsed = await res.json(); } catch { /* not json */ }
      deliveryResponse = parsed;
      if (!res.ok) deliveryError = `api_${res.status}`;
    } else {
      deliveryError = 'no_delivery_method_configured';
    }
  } catch (err) {
    deliveryError = err?.message || String(err);
  }

  // Update the lead with delivery state.
  await supabase.from('affiliate_leads').update({
    delivery_status: deliveryStatus,
    delivery_response: deliveryResponse,
    delivery_error: deliveryError,
    updated_at: new Date().toISOString(),
  }).eq('id', lead.id);

  // Confirmation email to the buyer — fire and forget.
  sendEmail({
    to: userEmail,
    template: 'affiliate.lead_confirmation',
    vars: dispatchVars,
  }).catch(() => { /* non-fatal */ });

  return NextResponse.json({ ok: true, leadId: lead.id, delivery: deliveryStatus });
}
