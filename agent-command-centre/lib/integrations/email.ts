import nodemailer from "nodemailer";

// Real outbound email. Sends from your own address via SMTP — works with a Gmail/Workspace
// app password or any SMTP provider. This is the channel a RED email approval executes through.
export async function sendEmail(opts: { to: string; subject: string; body: string; cc?: string }) {
  if (!process.env.SMTP_HOST) throw new Error("SMTP not configured (set SMTP_HOST/USER/PASS/FROM)");
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const info = await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: opts.to,
    cc: opts.cc,
    subject: opts.subject,
    text: opts.body,
  });
  return { id: info.messageId };
}
