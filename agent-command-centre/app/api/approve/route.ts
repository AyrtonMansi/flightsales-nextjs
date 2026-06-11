import { NextResponse } from "next/server";
import { decideApproval, setPaused } from "../../../lib/store";

export async function POST(req: Request) {
  const body = await req.json();

  if (body.kind === "pause") {
    await setPaused(!!body.paused);
    return NextResponse.json({ ok: true, paused: !!body.paused });
  }

  // approve / reject a RED action. Approve only sets status; the NEXT cron tick executes it.
  if (body.id && (body.decision === "approved" || body.decision === "rejected")) {
    await decideApproval(body.id, body.decision);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "bad request" }, { status: 400 });
}
