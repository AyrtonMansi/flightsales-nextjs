// Server-side email sender. Single function `sendEmail({ to, template, vars })`
// that:
//   1) renders the template (lib/emailTemplates.js)
//   2) hits Resend's REST API
//   3) writes a row to email_log with status sent|failed
//
// Resend was picked over SES/SendGrid for the dev experience: no SDK
// dependency, REST API, free tier covers the first 3k emails/month.
// Runs on Edge or Node — uses fetch only.
//
// Env vars required (set in Vercel):
//   RESEND_API_KEY     — Resend secret key
//   EMAIL_FROM         — verified sender, e.g. "FlightSales <noreply@flightsales.com.au>"
//   EMAIL_REPLY_TO     — optional, e.g. "support@flightsales.com.au"
//   EMAIL_BCC_ADMIN    — optional, BCC every transactional email here for ops visibility

import { createClient } from '@supabase/supabase-js';
import { renderTemplate } from './emailTemplates';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function adminClient() {
  // Service role key bypasses RLS so we can write to email_log from
  // server context regardless of who triggered the send. Falls back to
  // anon if service key isn't set (development).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function logEmail(row) {
  const supabase = adminClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.from('email_log').insert(row).select().single();
    return data?.id || null;
  } catch {
    return null;
  }
}

async function updateLog(id, patch) {
  if (!id) return;
  const supabase = adminClient();
  if (!supabase) return;
  try { await supabase.from('email_log').update(patch).eq('id', id); } catch {}
}

export async function sendEmail({ to, template, vars = {}, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'FlightSales <noreply@flightsales.com.au>';
  const bcc = process.env.EMAIL_BCC_ADMIN || undefined;
  const defaultReplyTo = process.env.EMAIL_REPLY_TO || undefined;

  if (!apiKey) {
    // Soft-fail in dev / preview without keys — log but don't throw so
    // that the parent flow (e.g. enquiry submit) still succeeds.
    console.warn(`[email] RESEND_API_KEY not set — would have sent ${template} to ${to}`);
    return { ok: false, reason: 'no_api_key' };
  }

  const rendered = renderTemplate(template, vars);
  if (!rendered) return { ok: false, reason: 'unknown_template' };

  const logId = await logEmail({
    to_address: to,
    template,
    subject: rendered.subject,
    status: 'pending',
  });

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        bcc: bcc ? [bcc] : undefined,
        reply_to: replyTo || defaultReplyTo,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      await updateLog(logId, { status: 'failed', error: body?.message || `HTTP ${res.status}` });
      return { ok: false, reason: 'send_failed', error: body?.message };
    }
    await updateLog(logId, { status: 'sent', provider_id: body?.id });
    return { ok: true, id: body?.id };
  } catch (err) {
    await updateLog(logId, { status: 'failed', error: err?.message || 'unknown' });
    return { ok: false, reason: 'exception', error: err?.message };
  }
}
