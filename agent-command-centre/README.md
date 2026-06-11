# Agent Command Centre

A Claude-only, 24/7 auto-loop with a control surface. One Vercel project hosts both the dashboard
and the scheduled loop; Supabase holds shared state; the Anthropic API runs the agents. Models are
optimised per task (Haiku → Sonnet → Opus) in one config file.

This is the **complete** build: all four workers live, findings auto-triaged, RED actions sent for
real after approval, push notifications when something needs you, and Gmail/Calendar reading wired.
The only thing left is pasting your own credentials — that part is unavoidably yours.

---

## The loop, end to end

```
cron tick (every 15 min)
  → Watcher (web) + Inbox Watcher (Gmail/Calendar)  [GREEN, Haiku]
     → findings land in world_model.untriaged
  → Orchestrator triages findings                    [judgment, Opus]
     → research?  Researcher                          [GREEN, Sonnet]
     → outreach?  Drafter produces a ready email      [RED, Opus] → approval queue + phone push
        → you tap Approve on the dashboard
        → next tick sends it for real via SMTP
  → Ops keeps the world model clean                   [GREEN, Haiku]
```

Every model choice lives in `lib/models.ts`. RED (irreversible) work never executes from the loop —
it is produced to ready state and held for your tap. `executeApprovedAction()` is now a real sender
(email via SMTP); add channels there as you grow.

---

## Files

```
lib/models.ts             Model-per-task routing. The ONE place a model is chosen.
lib/prompts.ts            All agent system prompts.
lib/store.ts              State access (world model, queues, decision log).
lib/anthropic.ts          Messages client with cost capture + web search.
lib/orchestrator.ts       The tick: guardrails → execute approved → dispatch → triage → write back.
lib/workers/index.ts      Watcher, Inbox watcher, Researcher, Drafter, Ops — all live.
lib/integrations/email.ts Real outbound email (SMTP).
lib/integrations/notify.ts Push notification on approval-needed.
lib/integrations/google.ts Real Gmail + Calendar read (graceful no-op until connected).
app/page.tsx              Dashboard: approvals, live feed, kill switch, spend.
app/api/cron/tick         Vercel Cron entrypoint.
app/api/approve           Approve/reject + pause.
app/api/state             Dashboard read.
supabase/schema.sql       State tables.
scripts/seed.ts           Seeds your watch items.  scripts/tick-once.ts  Run a tick locally.
```

---

## Setup

**Required (loop runs on these alone):**
1. `npm install`
2. Create a Supabase project (free). Run `supabase/schema.sql` in its SQL editor. Copy the project
   URL and `service_role` key.
3. `cp .env.example .env.local` and fill: `ANTHROPIC_API_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY`, `CRON_SECRET`.
4. `npm run seed` (edit your watch items in `scripts/seed.ts` first).
5. `npm run tick:local` — watch a tick run. Then `npm run dev` → http://localhost:3000.
6. Push to Git, import to Vercel, add the same env vars. Cron in `vercel.json` fires every 15 min.

**To actually send RED emails:** set `SMTP_*`. For Gmail/Workspace use `smtp.gmail.com:587`, your
address as `SMTP_USER`, and a Google **App Password** as `SMTP_PASS` (requires 2FA on the account).
Until SMTP is set, approved emails are logged as "no executor" rather than sent — safe by default.

**To get pinged when approval is needed:** set `NOTIFY_WEBHOOK_URL` to an
`https://ntfy.sh/your-topic` URL and subscribe to that topic in the ntfy app on your phone (or use a
Slack/Discord webhook). Set `DASHBOARD_URL` so the notification taps through to the dashboard.

**To watch your inbox/calendar:** set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_OAUTH_REFRESH_TOKEN`. Easiest path: create an OAuth client in Google Cloud Console, then use
the Google OAuth Playground to mint a refresh token with `gmail.readonly` and `calendar.readonly`
scopes. Until set, the Inbox Watcher is a clean no-op and the rest of the loop runs normally.

---

## Model optimisation

`lib/models.ts`: Watcher/Inbox/Ops → **Haiku**; Researcher/Drafter → **Sonnet**; Orchestrator →
**Opus**. Any **RED** task force-escalates to Opus regardless of role, so a cheap model never decides
something irreversible. Re-tier a role by changing one line in `ROLE_TIER`.

---

## Guardrails

- **Kill switch / pause** on the dashboard (global `paused` flag) — loop does nothing while paused.
- **Daily budget cap** (`budget_cap`, default $5) — every call's cost is metered into `spent_today`;
  the loop hard-stops for the day when hit. Adjust in the `world_state` row.
- **RED gating** — nothing outward-facing fires without your tap, and the executor only knows the
  channels you've wired (email today).
- **Drift defense** — each tick boots from the state store, not accumulated context; findings are
  ground-truthed into `world_model` and triaged separately.

---

## Operating notes

- **Cron frequency** depends on your Vercel plan; if it caps you, point an external scheduler
  (cron-job.org, GitHub Actions) at `/api/cron/tick` with header `Authorization: Bearer <CRON_SECRET>`.
- **Watch your first week.** Read `decision_log` rows. Confirm the Watcher isn't inventing findings
  and the triage isn't over-drafting before you wire SMTP and let RED actions go live.
- **Prices** in `lib/models.ts` are approximate — verify against current platform pricing.
- **Managed Agents alternative:** if you'd rather Anthropic host the loop/sandbox/scheduling, the
  prompts port unchanged; follow the live quickstart at
  https://platform.claude.com/docs/en/managed-agents/quickstart rather than a frozen payload (beta).

---

## What I could not do for you (and why)

Standing this up needs your accounts, so these final actions are yours: pasting your Anthropic key,
creating the Supabase project and running the schema, setting SMTP credentials, and (optionally) the
ntfy topic and Google OAuth token. Everything else — the loop, the routing, the agents, the gating,
the dashboard — is built and typechecks clean.
