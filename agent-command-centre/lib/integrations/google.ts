import { google } from "googleapis";

// Read-only Gmail + Calendar access. Real API calls; returns [] gracefully if no Google
// credentials are set, so the loop runs fine before you connect Google.
// To enable: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN
// (generate the refresh token once via the Google OAuth Playground with gmail.readonly +
// calendar.readonly scopes — see README "Connecting Google").
function authClient() {
  const refresh = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!refresh || !process.env.GOOGLE_CLIENT_ID) return null;
  const o = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  o.setCredentials({ refresh_token: refresh });
  return o;
}

export function googleConfigured() {
  return !!authClient();
}

export async function recentEmails(maxResults = 12) {
  const auth = authClient();
  if (!auth) return [];
  const gmail = google.gmail({ version: "v1", auth });
  const list = await gmail.users.messages.list({ userId: "me", maxResults, q: "newer_than:1d -in:chats" });
  const out: { from: string; subject: string; snippet: string; date: string }[] = [];
  for (const m of list.data.messages ?? []) {
    const full = await gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata", metadataHeaders: ["From", "Subject", "Date"] });
    const h = (n: string) => full.data.payload?.headers?.find((x) => x.name === n)?.value ?? "";
    out.push({ from: h("From"), subject: h("Subject"), snippet: full.data.snippet ?? "", date: h("Date") });
  }
  return out;
}

export async function upcomingEvents(days = 7) {
  const auth = authClient();
  if (!auth) return [];
  const cal = google.calendar({ version: "v3", auth });
  const now = new Date();
  const max = new Date(now.getTime() + days * 864e5);
  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: max.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 20,
  });
  return (res.data.items ?? []).map((e) => ({
    summary: e.summary ?? "(no title)",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    location: e.location ?? "",
  }));
}
