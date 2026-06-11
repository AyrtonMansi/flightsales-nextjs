import { NextResponse } from "next/server";
import { getWorldState, pendingApprovals, recentLog } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [ws, approvals, logs] = await Promise.all([getWorldState(), pendingApprovals(), recentLog(40)]);
  return NextResponse.json({
    paused: ws.paused,
    spent_today: ws.spent_today,
    budget_cap: ws.budget_cap,
    world_model: ws.world_model,
    approvals,
    logs,
  });
}
