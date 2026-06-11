"use client";
import { useEffect, useState, useCallback } from "react";

export default function CommandCentre() {
  const [state, setState] = useState<any>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/state", { cache: "no-store" });
    setState(await r.json());
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000); // poll every 10s
    return () => clearInterval(t);
  }, [refresh]);

  async function decide(id: string, decision: "approved" | "rejected") {
    await fetch("/api/approve", { method: "POST", body: JSON.stringify({ id, decision }) });
    refresh();
  }
  async function togglePause() {
    await fetch("/api/approve", { method: "POST", body: JSON.stringify({ kind: "pause", paused: !state.paused }) });
    refresh();
  }

  if (!state) return <main style={S.wrap}><p>Loading…</p></main>;

  const overBudget = Number(state.spent_today) >= Number(state.budget_cap);

  return (
    <main style={S.wrap}>
      <header style={S.header}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Command Centre</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: overBudget ? "#c0392b" : "#555" }}>
            ${Number(state.spent_today).toFixed(2)} / ${Number(state.budget_cap).toFixed(2)} today
          </span>
          <button onClick={togglePause} style={state.paused ? S.resume : S.kill}>
            {state.paused ? "▶ Resume loop" : "■ Pause loop"}
          </button>
        </div>
      </header>

      <section>
        <h2 style={S.h2}>Approvals ({state.approvals.length})</h2>
        {state.approvals.length === 0 && <p style={S.muted}>Nothing waiting on you.</p>}
        {state.approvals.map((a: any) => (
          <div key={a.id} style={S.card}>
            <div style={{ fontWeight: 600 }}>{a.summary}</div>
            <div style={S.muted}>confidence: {a.confidence} · reversible: {a.reversible ?? "—"}</div>
            <pre style={S.pre}>{JSON.stringify(a.artifact, null, 2)}</pre>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => decide(a.id, "approved")} style={S.approve}>Approve</button>
              <button onClick={() => decide(a.id, "rejected")} style={S.reject}>Reject</button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 style={S.h2}>Live feed</h2>
        {state.logs.map((l: any) => (
          <div key={l.id} style={S.logRow}>
            <span style={{ color: l.bucket === "RED" ? "#c0392b" : "#2d7" }}>●</span>{" "}
            <span style={S.muted}>{new Date(l.created_at).toLocaleString()}</span> — {l.action}
            {l.cost_usd ? <span style={S.muted}> (${Number(l.cost_usd).toFixed(4)}, {l.model})</span> : null}
          </div>
        ))}
      </section>
    </main>
  );
}

const S: Record<string, any> = {
  wrap: { maxWidth: 760, margin: "0 auto", padding: 20, fontFamily: "system-ui, sans-serif", color: "#1a1a1a" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  h2: { fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5, color: "#888", marginTop: 28 },
  muted: { color: "#888", fontSize: 13 },
  card: { border: "1px solid #e3e3e3", borderRadius: 10, padding: 14, marginBottom: 12 },
  pre: { background: "#f6f6f6", padding: 10, borderRadius: 6, fontSize: 12, overflow: "auto", maxHeight: 220 },
  logRow: { fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f0f0f0" },
  approve: { background: "#1a7f37", color: "#fff", border: 0, borderRadius: 6, padding: "6px 14px", cursor: "pointer" },
  reject: { background: "#fff", color: "#c0392b", border: "1px solid #c0392b", borderRadius: 6, padding: "6px 14px", cursor: "pointer" },
  kill: { background: "#c0392b", color: "#fff", border: 0, borderRadius: 6, padding: "6px 14px", cursor: "pointer" },
  resume: { background: "#1a7f37", color: "#fff", border: 0, borderRadius: 6, padding: "6px 14px", cursor: "pointer" },
};
