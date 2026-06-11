import { callClaude, parseJson } from "./anthropic";
import { resolveModel } from "./models";
import { TRIAGE_SYSTEM } from "./prompts";
import { dispatch } from "./workers";
import { sendEmail } from "./integrations/email";
import { notify } from "./integrations/notify";
import {
  getWorldState, pendingTasks, enqueueTask, setTaskStatus, enqueueApproval,
  approvedUnexecuted, markExecuted, addSpend, log, updateWorldModel, getWorldModel,
} from "./store";

const DEFAULT_WATCH_MIN = 60;

// One scheduled tick. Does ONE unit of work then exits (fresh context next run).
export async function tick() {
  const ws = await getWorldState();
  const wm = ws.world_model ?? {};

  if (ws.paused) { await log({ action: "skipped: paused" }); return { status: "paused" }; }
  if (Number(ws.spent_today) >= Number(ws.budget_cap)) {
    await log({ action: `skipped: daily cap $${ws.budget_cap} reached` });
    return { status: "budget_capped" };
  }

  // 1. Execute human-APPROVED RED actions. Only place RED runs, only after a human tapped approve.
  for (const a of await approvedUnexecuted()) {
    try {
      const result = await executeApprovedAction(a);
      await markExecuted(a.id);
      await log({ action: `executed: ${a.summary}`, bucket: "RED", result });
      await notify("Action sent", a.summary);
    } catch (e: any) {
      await log({ action: `execute failed: ${a.summary}`, bucket: "RED", result: { error: String(e?.message ?? e) } });
      await notify("Action FAILED to send", `${a.summary}: ${String(e?.message ?? e)}`);
    }
  }

  // 2. Do one pending worker task.
  const tasks = await pendingTasks();
  if (tasks.length > 0) {
    await runOneTask(tasks[0], wm);
    return { status: "ticked" };
  }

  // 3. Nothing pending: decide what's next deterministically (cheap), triage with Opus only when needed.
  const lastWatch = wm.last_watch_at ? new Date(wm.last_watch_at).getTime() : 0;
  const intervalMs = (wm.watch_interval_min ?? DEFAULT_WATCH_MIN) * 60_000;
  const watchDue = Date.now() - lastWatch > intervalMs;

  if (watchDue) {
    await enqueueTask("watcher", "GREEN", { watch_items: wm.watch_items ?? [] });
    await enqueueTask("inbox", "GREEN", {});
    await updateWorldModel({ ...wm, last_watch_at: new Date().toISOString() });
    await log({ action: "routine watch scheduled" });
    return { status: "scheduled_watch" };
  }

  const untriaged = wm.untriaged ?? [];
  if (untriaged.length > 0) {
    await triage(untriaged, wm);
    return { status: "triaged" };
  }

  await log({ action: "noop" });
  return { status: "noop" };
}

async function runOneTask(t: any, wm: any) {
  await setTaskStatus(t.id, "in_progress");
  try {
    const task = t.role === "ops" ? { ...t.task, world_model: wm } : t.task;
    const r = await dispatch(t.role, t.bucket, task);
    await addSpend(r.cost);

    if (t.bucket === "RED") {
      const art = r.output;
      await enqueueApproval({
        summary: art.summary ?? `${t.role}: action ready for review`,
        reversible: art.reversible ?? t.task.reversible,
        confidence: t.confidence ?? "medium",
        artifact: art,
      });
      await log({ action: `queued RED for approval: ${t.role}`, bucket: "RED", model: r.model, cost_usd: r.cost, result: art });
      await notify("Approval needed", art.summary ?? `${t.role} drafted an action`);
    } else {
      await log({ action: `completed ${t.role}`, bucket: "GREEN", model: r.model, cost_usd: r.cost, result: r.output });
      // Fold watcher/inbox findings into untriaged so the orchestrator triages them next.
      if ((t.role === "watcher" || t.role === "inbox") && Array.isArray(r.output?.findings)) {
        const fresh = await getWorldModel();
        const untriaged = [...(fresh.untriaged ?? []), ...r.output.findings.filter((f: any) => f.status !== "nothing")];
        await updateWorldModel({ ...fresh, untriaged });
      }
      // Apply Ops maintenance.
      if (t.role === "ops" && r.output) {
        const fresh = await getWorldModel();
        const retire = new Set(r.output.retire ?? []);
        await updateWorldModel({
          ...fresh,
          untriaged: (fresh.untriaged ?? []).filter((f: any) => !retire.has(f.item)),
          reminders: [...(fresh.reminders ?? []), ...(r.output.reminders ?? [])],
        });
      }
    }
    await setTaskStatus(t.id, "done");
  } catch (e: any) {
    await setTaskStatus(t.id, "failed");
    await log({ action: `task failed: ${t.role}`, bucket: t.bucket, result: { error: String(e?.message ?? e) } });
  }
}

async function triage(untriaged: any[], wm: any) {
  const model = resolveModel("orchestrator", "GREEN"); // judgment tier
  const prompt = `FINDINGS TO TRIAGE:\n${JSON.stringify(untriaged, null, 2)}\n\nWorld model context:\n${JSON.stringify({ watch_items: wm.watch_items }, null, 2)}`;
  const res = await callClaude({ model, system: TRIAGE_SYSTEM, prompt, maxTokens: 1500 });
  await addSpend(res.cost);
  const plan = parseJson(res.text) ?? { decisions: [] };

  for (const d of plan.decisions ?? []) {
    if (d.action === "research") {
      await enqueueTask("researcher", "GREEN", { question: d.task?.question ?? d.finding, context: { finding: d.finding } }, d.confidence);
    } else if (d.action === "draft" && d.confidence !== "low") {
      await enqueueTask("drafter", "RED", { ...d.task, context: { finding: d.finding } }, d.confidence);
    }
  }
  const fresh = await getWorldModel();
  await updateWorldModel({ ...fresh, untriaged: [], recent: untriaged.slice(-20) });
  await log({ action: `triaged ${untriaged.length} findings`, model, cost_usd: res.cost, result: plan });
}

// Real RED executor. Reached only after human approval. Add channels here as you wire them.
async function executeApprovedAction(a: any) {
  const art = a.artifact ?? {};
  if (art.channel === "email" && art.to && art.body) {
    const sent = await sendEmail({ to: art.to, subject: art.subject ?? a.summary, body: art.body, cc: art.cc });
    return { sent: "email", to: art.to, id: sent.id };
  }
  // Unknown/unsupported channel: never guess. Leave it executed-but-noted.
  return { skipped: "no executor for channel", channel: art.channel ?? null };
}
