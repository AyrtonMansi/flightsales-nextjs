// Push notification so you know when something needs your tap, without watching the dashboard.
// Set NOTIFY_WEBHOOK_URL to an ntfy topic URL, a Slack/Discord webhook, or any POST endpoint.
// A notification failure must never break the loop, so everything here is best-effort.
export async function notify(title: string, message: string) {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return;
  try {
    const isJson = /slack|discord|webhook|hooks\./i.test(url);
    if (isJson) {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title}\n${message}`, content: `${title}\n${message}` }),
      });
    } else {
      // ntfy.sh style: plain body, Title header, tap action opens the dashboard if set.
      const headers: Record<string, string> = { Title: title, Priority: "high" };
      if (process.env.DASHBOARD_URL) headers["Click"] = process.env.DASHBOARD_URL;
      await fetch(url, { method: "POST", headers, body: message });
    }
  } catch {
    /* swallow */
  }
}
