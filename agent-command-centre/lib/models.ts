// Claude-only model routing. This is the "optimise models per task" layer.
// Change a task's tier in ONE place here; nothing else in the codebase hardcodes a model.

export type Tier = "cheap" | "standard" | "judgment";

// Authoritative current Claude model strings.
export const MODELS: Record<Tier, string> = {
  cheap: "claude-3-5-haiku-20241022", // high-volume GREEN work: watching, filtering, extraction
  standard: "claude-3-7-sonnet-20250219", // drafting, summarising, structured research
  judgment: "claude-3-opus-20240229",  // orchestrator classification + anything RED-bucket
};

// Per-role default tiers. The orchestrator can override per-task (see escalation rule below).
export const ROLE_TIER: Record<string, Tier> = {
  orchestrator: "judgment", // never cheap out the dispatcher — a wrong GREEN/RED call cascades
  watcher: "cheap",
  researcher: "standard",
  drafter: "standard",
  ops: "cheap",
};

// Escalation rule: any task touching a RED action is forced to judgment tier regardless of role,
// so a cheap model never makes the call on something irreversible.
export function resolveModel(role: string, bucket: "GREEN" | "RED"): string {
  if (bucket === "RED") return MODELS.judgment;
  const tier = ROLE_TIER[role] ?? "standard";
  return MODELS[tier];
}

// Rough per-MTok prices (USD) for cost tracking. Verify against current platform pricing.
export const PRICE_PER_MTOK: Record<string, { in: number; out: number }> = {
  "claude-3-5-haiku-20241022": { in: 0.8, out: 4.0 },
  "claude-3-7-sonnet-20250219": { in: 3.0, out: 15.0 },
  "claude-3-opus-20240229": { in: 15.0, out: 75.0 },
};

export function estimateCost(model: string, inTok: number, outTok: number): number {
  const p = PRICE_PER_MTOK[model] ?? { in: 5, out: 25 };
  return (inTok / 1e6) * p.in + (outTok / 1e6) * p.out;
}
