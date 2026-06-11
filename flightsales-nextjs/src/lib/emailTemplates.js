// All transactional email templates as pure functions returning
// { subject, html, text }. Plain-text versions are required for spam-
// score reasons and for clients that strip HTML.
//
// Visual treatment is intentionally restrained: a single ink-black
// header bar, body in system fonts at 14px, one CTA button. No fancy
// layouts — they break in Outlook and add nothing for transactional
// content. Substack / Stripe Receipt / Linear use this same pattern.

const SITE = 'https://flightsales.com.au';
const BRAND = 'FlightSales';

function shell({ preheader, body }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader || ''}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
<tr><td style="background:#0a0a0a;color:#fff;padding:18px 24px;font-size:18px;font-weight:700;letter-spacing:-0.02em;">${BRAND}</td></tr>
<tr><td style="padding:32px 24px 24px;font-size:14px;line-height:1.55;color:#0a0a0a;">${body}</td></tr>
<tr><td style="padding:16px 24px 28px;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7;">
${BRAND} · Australia's marketplace for aircraft · <a href="${SITE}" style="color:#71717a;">flightsales.com.au</a><br>
This is an automated message. If you didn't expect it, please ignore.
</td></tr>
</table></td></tr></table></body></html>`;
}

function btn(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;">${label}</a>`;
}

const TEMPLATES = {
  // 1. Buyer enquiry submitted → seller is notified
  'enquiry.seller': (v) => ({
    subject: `New enquiry on ${v.aircraftTitle || 'your listing'}`,
    html: shell({
      preheader: `${v.buyerName} has enquired about your aircraft.`,
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;letter-spacing:-0.01em;">You've got an enquiry</h2>
        <p style="margin:0 0 16px;"><strong>${escape(v.buyerName)}</strong> is interested in <strong>${escape(v.aircraftTitle)}</strong>.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f8fafc;border-radius:6px;padding:0;margin:0 0 20px;">
          <tr><td style="padding:14px 18px;font-size:13px;">
            <strong>Email:</strong> <a href="mailto:${escape(v.buyerEmail)}" style="color:#0a0a0a;">${escape(v.buyerEmail)}</a><br>
            ${v.buyerPhone ? `<strong>Phone:</strong> ${escape(v.buyerPhone)}<br>` : ''}
            <strong>Message:</strong><br>${escape(v.message).replace(/\n/g, '<br>')}
          </td></tr>
        </table>
        <p style="margin:0 0 20px;">${btn(`${SITE}/dashboard`, 'View in dashboard')}</p>
        <p style="margin:0;color:#71717a;font-size:13px;">Reply to this email and your response goes straight to ${escape(v.buyerName)}.</p>
      `,
    }),
    text: `New enquiry on ${v.aircraftTitle}\n\n${v.buyerName} (${v.buyerEmail}) wrote:\n\n${v.message}\n\nView: ${SITE}/dashboard`,
  }),

  // 2. Auto-reply to the buyer
  'enquiry.buyer': (v) => ({
    subject: `We've passed your enquiry to the seller`,
    html: shell({
      preheader: `Your enquiry about ${v.aircraftTitle} is on its way.`,
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">Your enquiry is on its way</h2>
        <p style="margin:0 0 14px;">Hi ${escape(v.buyerName?.split(' ')[0] || 'there')},</p>
        <p style="margin:0 0 14px;">We've passed your enquiry about <strong>${escape(v.aircraftTitle)}</strong> straight to the seller. Most respond within 24 hours.</p>
        <p style="margin:0 0 20px;">${btn(`${SITE}/listings/${v.aircraftId || ''}`, 'View listing')}</p>
        <p style="margin:0;color:#71717a;font-size:13px;">If you don't hear back within 48 hours, reply to this email and we'll follow up on your behalf.</p>
      `,
    }),
    text: `Your enquiry about ${v.aircraftTitle} is on its way to the seller. Most respond within 24 hours.`,
  }),

  // 3. Generic platform lead → admin
  'lead.admin': (v) => ({
    subject: `[${(v.type || 'lead').toUpperCase()}] ${v.name} — ${v.email}`,
    html: shell({
      preheader: `New ${v.type} lead.`,
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">New ${escape(v.type || 'platform')} lead</h2>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:13px;">
          <tr><td style="padding:6px 0;color:#71717a;">Name</td><td style="padding:6px 0;"><strong>${escape(v.name)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#71717a;">Email</td><td style="padding:6px 0;"><a href="mailto:${escape(v.email)}" style="color:#0a0a0a;">${escape(v.email)}</a></td></tr>
          ${v.phone ? `<tr><td style="padding:6px 0;color:#71717a;">Phone</td><td style="padding:6px 0;">${escape(v.phone)}</td></tr>` : ''}
          ${v.subject ? `<tr><td style="padding:6px 0;color:#71717a;">Subject</td><td style="padding:6px 0;">${escape(v.subject)}</td></tr>` : ''}
        </table>
        <p style="margin:18px 0 6px;font-size:13px;color:#71717a;">Message</p>
        <div style="background:#f8fafc;padding:14px 18px;border-radius:6px;font-size:13px;">${escape(v.message || '').replace(/\n/g, '<br>')}</div>
        <p style="margin:20px 0 0;">${btn(`${SITE}/admin`, 'Open admin')}</p>
      `,
    }),
    text: `New ${v.type} lead from ${v.name} (${v.email})\n\n${v.message || ''}`,
  }),

  // 4. Auto-reply on contact / lead form submission
  'lead.user': (v) => ({
    subject: `We received your ${v.type || 'message'} — FlightSales`,
    html: shell({
      preheader: 'Thanks for reaching out.',
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">Thanks, ${escape(v.name?.split(' ')[0] || 'there')}.</h2>
        <p style="margin:0 0 14px;">We've received your ${escape(v.type || 'message')} and will reply within 24 business hours.</p>
        <p style="margin:0;color:#71717a;font-size:13px;">If your matter is urgent, you can reply to this email directly.</p>
      `,
    }),
    text: `Thanks, ${v.name?.split(' ')[0] || 'there'}. We've received your ${v.type || 'message'} and will reply within 24 business hours.`,
  }),

  // 5. Listing approved → seller
  'listing.approved': (v) => ({
    subject: `Your listing is live — ${v.aircraftTitle}`,
    html: shell({
      preheader: `Your listing is now visible on FlightSales.`,
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">Your listing is live</h2>
        <p style="margin:0 0 14px;"><strong>${escape(v.aircraftTitle)}</strong> has been approved and is now visible to buyers.</p>
        <p style="margin:0 0 20px;">${btn(`${SITE}/listings/${v.aircraftId || ''}`, 'View listing')}</p>
        <p style="margin:0;color:#71717a;font-size:13px;">You'll get an email each time someone enquires.</p>
      `,
    }),
    text: `Your listing "${v.aircraftTitle}" is live. View: ${SITE}/listings/${v.aircraftId || ''}`,
  }),

  // 6. Listing rejected → seller (with reason)
  'listing.rejected': (v) => ({
    subject: `Action required on your listing — ${v.aircraftTitle}`,
    html: shell({
      preheader: 'Your listing needs some changes before it can go live.',
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">Your listing needs changes</h2>
        <p style="margin:0 0 14px;">An admin reviewed <strong>${escape(v.aircraftTitle)}</strong> and asked for the following before it can go live:</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:14px 18px;border-radius:6px;font-size:13px;margin:0 0 20px;">${escape(v.reason || 'No reason provided.').replace(/\n/g, '<br>')}</div>
        <p style="margin:0 0 16px;">${btn(`${SITE}/dashboard`, 'Edit listing')}</p>
        <p style="margin:0;color:#71717a;font-size:13px;">Once you've updated, resubmit and an admin will re-review within 24 hours.</p>
      `,
    }),
    text: `Your listing "${v.aircraftTitle}" needs changes before it can go live.\n\nReason: ${v.reason || 'No reason provided.'}\n\nEdit: ${SITE}/dashboard`,
  }),

  // 7. Dealer application approved
  'dealer_app.approved': (v) => ({
    subject: 'Your dealer application is approved',
    html: shell({
      preheader: 'Welcome to FlightSales as a verified dealer.',
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">You're a verified dealer</h2>
        <p style="margin:0 0 14px;">Your application for <strong>${escape(v.businessName || 'your business')}</strong> has been approved. Your listings will now show the verified dealer badge.</p>
        <p style="margin:0 0 20px;">${btn(`${SITE}/dashboard`, 'Open dashboard')}</p>
      `,
    }),
    text: `Your dealer application for "${v.businessName}" is approved. Open dashboard: ${SITE}/dashboard`,
  }),

  // 8. Dealer application rejected (with reason)
  'dealer_app.rejected': (v) => ({
    subject: 'Update on your dealer application',
    html: shell({
      preheader: 'Your dealer application needs more information.',
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">Your dealer application</h2>
        <p style="margin:0 0 14px;">We weren't able to approve your dealer application as submitted. The reviewer's note:</p>
        <div style="background:#f8fafc;color:#0a0a0a;padding:14px 18px;border-radius:6px;font-size:13px;margin:0 0 20px;">${escape(v.reason || 'No reason provided.').replace(/\n/g, '<br>')}</div>
        <p style="margin:0;color:#71717a;font-size:13px;">You can resubmit with updated details from your dashboard at any time.</p>
      `,
    }),
    text: `Your dealer application wasn't approved.\nReason: ${v.reason || 'No reason provided.'}\nYou can resubmit anytime from ${SITE}/dashboard.`,
  }),

  // 9. Welcome email after signup
  'auth.welcome': (v) => ({
    subject: 'Welcome to FlightSales',
    html: shell({
      preheader: "Australia's marketplace for aircraft.",
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">Welcome${v.firstName ? `, ${escape(v.firstName)}` : ''}.</h2>
        <p style="margin:0 0 14px;">You're set up. Browse aircraft, save what catches your eye, or list your own.</p>
        <p style="margin:0 0 20px;">${btn(`${SITE}/buy`, 'Browse aircraft')}</p>
        <p style="margin:0;color:#71717a;font-size:13px;">Selling? Open your dashboard and list your first aircraft in 4 short steps.</p>
      `,
    }),
    text: `Welcome to FlightSales. Browse: ${SITE}/buy · Dashboard: ${SITE}/dashboard`,
  }),

  // 10. Account suspended
  'user.suspended': (v) => ({
    subject: 'Your FlightSales account has been suspended',
    html: shell({
      preheader: 'Action taken on your account.',
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">Account suspended</h2>
        <p style="margin:0 0 14px;">An admin has suspended your account. Reason given:</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:14px 18px;border-radius:6px;font-size:13px;margin:0 0 20px;">${escape(v.reason || 'No reason provided.').replace(/\n/g, '<br>')}</div>
        <p style="margin:0;color:#71717a;font-size:13px;">If this is an error, reply to this email to discuss with our support team.</p>
      `,
    }),
    text: `Your FlightSales account has been suspended.\nReason: ${v.reason || 'No reason provided.'}\nReply to this email to discuss.`,
  }),

  // 11. Saved-search digest (placeholder for v1.5)
  'search.digest': (v) => ({
    subject: `${v.matchCount} new aircraft match your saved search`,
    html: shell({
      preheader: `New listings matching "${v.searchName}".`,
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">New matches for ${escape(v.searchName)}</h2>
        <p style="margin:0 0 14px;">Since your last digest, <strong>${v.matchCount} new aircraft</strong> match your saved search.</p>
        <p style="margin:0 0 20px;">${btn(`${SITE}/buy${v.queryString ? `?${v.queryString}` : ''}`, 'View matches')}</p>
        <p style="margin:0;color:#71717a;font-size:13px;">You can change your alert preferences in your dashboard.</p>
      `,
    }),
    text: `${v.matchCount} new aircraft match your saved search "${v.searchName}". View: ${SITE}/buy`,
  }),

  // Lead delivery — sent to the partner's lead_email when method='email'.
  // Plain, scannable: who the user is + what listing they were looking
  // at + how to reach them. Reply-to is the buyer so the partner can
  // respond directly without going through us.
  'affiliate.lead': (v) => ({
    subject: `New lead from FlightSales: ${v.userName || 'a buyer'} — ${v.partnerType || 'enquiry'}`,
    html: shell({
      preheader: `${v.userName} is enquiring about ${v.partnerType || 'a service'}.`,
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">New lead from FlightSales</h2>
        <p style="margin:0 0 14px;">
          A buyer has requested ${escape(v.partnerType || 'a service')} from your business via FlightSales.com.au.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
          <tr><td style="padding:8px 0;color:#71717a;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${escape(v.userName)}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Email</td><td style="padding:8px 0;"><a href="mailto:${escape(v.userEmail)}" style="color:#0a0a0a;">${escape(v.userEmail)}</a></td></tr>
          ${v.userPhone ? `<tr><td style="padding:8px 0;color:#71717a;">Phone</td><td style="padding:8px 0;">${escape(v.userPhone)}</td></tr>` : ''}
          ${v.listingTitle ? `<tr><td style="padding:8px 0;color:#71717a;">Aircraft</td><td style="padding:8px 0;">${escape(v.listingTitle)}${v.listingPrice ? ` — $${Number(v.listingPrice).toLocaleString()}` : ''}</td></tr>` : ''}
          ${v.listingUrl ? `<tr><td style="padding:8px 0;color:#71717a;">Listing</td><td style="padding:8px 0;"><a href="${escape(v.listingUrl)}" style="color:#0a0a0a;">View on FlightSales</a></td></tr>` : ''}
        </table>
        ${v.message ? `
          <p style="margin:0 0 8px;color:#71717a;font-size:13px;">Message from buyer:</p>
          <p style="margin:0 0 20px;padding:12px;background:#f6f6f7;border-radius:8px;font-size:14px;">${escape(v.message)}</p>
        ` : ''}
        <p style="margin:0;color:#71717a;font-size:12px;">
          Reply directly to this email — it goes straight to the buyer.
        </p>
      `,
    }),
    text: `New lead from FlightSales\n\nName: ${v.userName}\nEmail: ${v.userEmail}\n${v.userPhone ? `Phone: ${v.userPhone}\n` : ''}${v.listingTitle ? `Aircraft: ${v.listingTitle}\n` : ''}${v.message ? `\nMessage:\n${v.message}` : ''}`,
  }),

  // Confirmation copy sent to the buyer — "we've forwarded your details
  // to {partner}, expect contact within 24h". Sets expectations + audit
  // trail for the buyer.
  'affiliate.lead_confirmation': (v) => ({
    subject: `Your enquiry to ${v.partnerName} has been sent`,
    html: shell({
      preheader: `${v.partnerName} will be in touch shortly.`,
      body: `
        <h2 style="font-size:18px;margin:0 0 12px;">Enquiry sent</h2>
        <p style="margin:0 0 14px;">
          Hi ${escape(v.userName)} — we've forwarded your details to <strong>${escape(v.partnerName)}</strong>.
          They'll typically reach out within 24 hours.
        </p>
        <p style="margin:0 0 20px;color:#71717a;font-size:14px;">
          What we shared: your name, email${v.userPhone ? ', phone' : ''}${v.listingTitle ? `, and the listing you were viewing (${escape(v.listingTitle)})` : ''}.
        </p>
        <p style="margin:0;color:#71717a;font-size:13px;">
          Didn't expect this? Just reply to this email and we'll look into it.
        </p>
      `,
    }),
    text: `Hi ${v.userName} — we've forwarded your details to ${v.partnerName}. They'll typically reach out within 24 hours.`,
  }),
};

function escape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderTemplate(name, vars = {}) {
  const fn = TEMPLATES[name];
  if (!fn) return null;
  return fn(vars);
}

export const TEMPLATE_NAMES = Object.keys(TEMPLATES);
