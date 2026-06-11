import { NextResponse } from "next/server";
import { tick } from "../../../../lib/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // allow long ticks

// Hit by Vercel Cron (see vercel.json). Protected by a shared secret so only the cron can run it.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await tick();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
