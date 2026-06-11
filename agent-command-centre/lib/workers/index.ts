import { callClaude, parseJson } from "../anthropic";
import { resolveModel } from "../models";
import { WATCHER_SYSTEM, INBOX_WATCHER_SYSTEM, RESEARCHER_SYSTEM, DRAFTER_SYSTEM, OPS_SYSTEM } from "../prompts";
import { recentEmails, upcomingEvents, googleConfigured } from "../integrations/google";
import type { Bucket } from "../store";

export interface WorkerResult { output: any; cost: number; model: string }

// ---- Watcher: public signals via web search --------------------------------
export async function runWatcher(task: any): Promise<WorkerResult> {
  const model = resolveModel("watcher", "GREEN");
  const items: string[] = task.watch_items ?? [];
  const prompt = `Watch items:\n${items.map((i) => `- ${i}`).join("\n")}\n\nCheck for material changes and report.`;
  const res = await callClaude({ model, system: WATCHER_SYSTEM, prompt, webSearch: true, maxTokens: 2500 });
  return { output: parseJson(res.text) ?? { findings: [] }, cost: res.cost, model };
}

// ---- Inbox Watcher: real Gmail + Calendar (no-op until Google connected) ----
export async function runInboxWatcher(): Promise<WorkerResult> {
  const model = resolveModel("watcher", "GREEN");
  if (!googleConfigured()) return { output: { findings: [], note: "google not connected" }, cost: 0, model };
  const [emails, events] = await Promise.all([recentEmails(), upcomingEvents()]);
  const prompt = `RECENT EMAILS:\n${JSON.stringify(emails, null, 2)}\n\nUPCOMING EVENTS:\n${JSON.stringify(events, null, 2)}\n\nSurface only what is material and time-sensitive.`;
  const res = await callClaude({ model, system: INBOX_WATCHER_SYSTEM, prompt, maxTokens: 2000 });
  return { output: parseJson(res.text) ?? { findings: [] }, cost: res.cost, model };
}

// ---- Researcher -------------------------------------------------------------
export async function runResearcher(task: any): Promise<WorkerResult> {
  const model = resolveModel("researcher", "GREEN");
  const res = await callClaude({
    model, system: RESEARCHER_SYSTEM,
    prompt: `Question: ${task.question}\nContext: ${JSON.stringify(task.context ?? {})}`,
    webSearch: true, maxTokens: 3000,
  });
  return { output: parseJson(res.text) ?? { answer: res.text }, cost: res.cost, model };
}

// ---- Drafter (RED): produces ready-to-send email, never sends ---------------
export async function runDrafter(task: any, bucket: Bucket): Promise<WorkerResult> {
  const model = resolveModel("drafter", bucket); // RED forces judgment tier
  const res = await callClaude({
    model, system: DRAFTER_SYSTEM,
    prompt: `Write this message.\nTo: ${task.to ?? "(unknown)"}\nSubject hint: ${task.subject ?? ""}\nIntent: ${task.intent ?? task.summary ?? ""}\nContext: ${JSON.stringify(task.context ?? {})}`,
    maxTokens: 1500,
  });
  const out = parseJson(res.text) ?? { channel: "email", body: res.text, to: task.to, subject: task.subject };
  return { output: out, cost: res.cost, model };
}

// ---- Ops: real world-model maintenance --------------------------------------
export async function runOps(task: any): Promise<WorkerResult> {
  const model = resolveModel("ops", "GREEN");
  const res = await callClaude({
    model, system: OPS_SYSTEM,
    prompt: `Current world model:\n${JSON.stringify(task.world_model ?? {}, null, 2)}\n\nDeduplicate findings, retire stale threads, propose reminders.`,
    maxTokens: 1500,
  });
  return { output: parseJson(res.text) ?? { reminders: [], retire: [] }, cost: res.cost, model };
}

export async function dispatch(role: string, bucket: Bucket, task: any): Promise<WorkerResult> {
  switch (role) {
    case "watcher": return runWatcher(task);
    case "inbox": return runInboxWatcher();
    case "researcher": return runResearcher(task);
    case "drafter": return runDrafter(task, bucket);
    case "ops": return runOps(task);
    default: throw new Error(`unknown role: ${role}`);
  }
}
