// POST /api/views { aircraftId }
// Increments view_count on the aircraft row. Cookie-deduped per browser
// per listing per day so a single buyer reloading 50 times doesn't
// inflate the seller's stats. The view-count is informational, not
// billable, so cookie dedup is fine — no need for fingerprinting.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const { aircraftId } = body || {};
  if (!aircraftId) return NextResponse.json({ ok: false, error: 'missing_aircraftId' }, { status: 400 });

  // Cookie-deduplicate. The `fs_v_` cookie holds a comma-separated list
  // of aircraft ids the user has viewed today. Trimmed to last 200 to
  // keep the header lightweight.
  const cookies = req.headers.get('cookie') || '';
  const cookieMatch = cookies.match(/(?:^|;\s*)fs_v=([^;]+)/);
  const seenList = cookieMatch ? cookieMatch[1].split(',').filter(Boolean) : [];
  if (seenList.includes(aircraftId)) {
    // Already counted today.
    return NextResponse.json({ ok: true, deduped: true });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  // Atomic increment using a single update — no read-modify-write race.
  const { error } = await supabase.rpc('increment_view_count', { aircraft_id: aircraftId });
  if (error) {
    // RPC might not exist; fall back to read-modify-write. Acceptable at
    // current scale (hundreds of views per minute would still be fine).
    const { data: row } = await supabase.from('aircraft').select('view_count').eq('id', aircraftId).single();
    const next = (row?.view_count || 0) + 1;
    await supabase.from('aircraft').update({ view_count: next }).eq('id', aircraftId);
  }

  // Refresh the cookie with this id appended. 24h TTL.
  const updated = [...seenList.slice(-199), aircraftId].join(',');
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', `fs_v=${updated}; Path=/; Max-Age=86400; SameSite=Lax`);
  return res;
}
