import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // service key: server-side only, never ship to the browser
);

export type Bucket = "GREEN" | "RED";

export async function getWorldState() {
  const { data, error } = await sb.from("world_state").select("*").eq("id", "singleton").single();
  if (error) throw error;
  // roll the daily spend counter
  const today = new Date().toISOString().slice(0, 10);
  if (data.spend_date !== today) {
    await sb.from("world_state").update({ spent_today: 0, spend_date: today }).eq("id", "singleton");
    data.spent_today = 0;
    data.spend_date = today;
  }
  return data;
}

export async function setPaused(paused: boolean) {
  await sb.from("world_state").update({ paused, updated_at: new Date().toISOString() }).eq("id", "singleton");
}

export async function addSpend(usd: number) {
  const ws = await getWorldState();
  await sb.from("world_state").update({ spent_today: Number(ws.spent_today) + usd }).eq("id", "singleton");
}

export async function getWorldModel() {
  const ws = await getWorldState();
  return ws.world_model ?? {};
}

export async function updateWorldModel(world_model: any) {
  await sb.from("world_state").update({ world_model, updated_at: new Date().toISOString() }).eq("id", "singleton");
}

export async function pendingTasks() {
  const { data } = await sb.from("task_queue").select("*").eq("status", "pending").order("created_at");
  return data ?? [];
}

export async function enqueueTask(role: string, bucket: Bucket, task: any, confidence?: string) {
  await sb.from("task_queue").insert({ role, bucket, task, confidence });
}

export async function setTaskStatus(id: string, status: string) {
  await sb.from("task_queue").update({ status }).eq("id", id);
}

export async function enqueueApproval(a: { summary: string; reversible?: string; confidence?: string; artifact: any }) {
  await sb.from("approval_queue").insert({ ...a, status: "pending" });
}

export async function pendingApprovals() {
  const { data } = await sb.from("approval_queue").select("*").eq("status", "pending").order("created_at");
  return data ?? [];
}

export async function approvedUnexecuted() {
  const { data } = await sb.from("approval_queue").select("*").eq("status", "approved").order("created_at");
  return data ?? [];
}

export async function decideApproval(id: string, status: "approved" | "rejected") {
  await sb.from("approval_queue").update({ status, decided_at: new Date().toISOString() }).eq("id", id);
}

export async function markExecuted(id: string) {
  await sb.from("approval_queue").update({ status: "executed" }).eq("id", id);
}

export async function log(entry: {
  action: string; bucket?: string; confidence?: string; model?: string; cost_usd?: number; result?: any;
}) {
  await sb.from("decision_log").insert(entry);
}

export async function recentLog(limit = 30) {
  const { data } = await sb.from("decision_log").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}
