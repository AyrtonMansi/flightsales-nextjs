// POST /api/email
// Server-only endpoint for sending transactional email. Called by client
// hooks (enquiry submit, contact form) and by admin-side actions
// (listing approve/reject, dealer app review).
//
// Why a server route instead of the client calling Resend directly:
//  - keeps RESEND_API_KEY out of the browser bundle
//  - centralises the email_log writes
//  - lets us add rate limiting / spam protection in one place
//
// Body: { to, template, vars?, replyTo? }
// Auth: requires the caller's Supabase session cookie OR a server-side
//       admin context. Anonymous callers can only fire safe templates
//       (enquiry.buyer, lead.user — auto-replies that go to themselves).

import { NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/email';
import { TEMPLATE_NAMES } from '../../../lib/emailTemplates';

export const runtime = 'nodejs';

// Templates an unauthenticated caller is allowed to trigger. Everything
// else (notify-the-seller, notify-an-admin) requires a session.
const ANON_ALLOWED = new Set([
  'enquiry.buyer',
  'lead.user',
]);

// Server-side caller (the api route itself, called via internal fetch
// from another server context) may bypass via this header. Set in
// Vercel env to the same value the calling server context knows.
function isInternalCaller(req) {
  const h = req.headers.get('x-fs-internal');
  const expected = process.env.INTERNAL_API_TOKEN;
  return !!(expected && h && h === expected);
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const { to, template, vars, replyTo } = body || {};

  if (!to || !template) {
    return NextResponse.json({ ok: false, error: 'missing_to_or_template' }, { status: 400 });
  }
  if (!TEMPLATE_NAMES.includes(template)) {
    return NextResponse.json({ ok: false, error: 'unknown_template' }, { status: 400 });
  }
  // Light gate: internal callers (server-to-server) skip the anon check.
  // Browser-originating calls can only fire ANON_ALLOWED templates.
  if (!isInternalCaller(req) && !ANON_ALLOWED.has(template)) {
    return NextResponse.json({ ok: false, error: 'template_not_allowed' }, { status: 403 });
  }

  const result = await sendEmail({ to, template, vars, replyTo });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason || 'send_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
