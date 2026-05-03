// POST /api/abn-verify
// Hits the Australian Business Register (ABR) public JSON endpoint to
// verify a dealer's ABN, then caches the result on profiles. Auto-flips
// profiles.abn_verified_at when ABR confirms an Active ABN — no admin
// review needed for the basic verification badge.
//
// Auth: any signed-in user can verify their OWN ABN. Verification only
// stamps that user's own profiles row; service-role bypass is used for
// the write so RLS stays restrictive elsewhere.
//
// ABR free endpoint:
//   https://abr.business.gov.au/json/AbnDetails.aspx?abn=ABN&callback=callback&guid=GUID
// Returns JSONP — we strip the callback wrapper before parsing.
//
// Env: ABR_GUID — register a free GUID at https://abr.business.gov.au/Tools/WebServices.
// Without a GUID set, the route 503s rather than silently succeeding;
// admins should provision the env var on first deploy.
//
// Pilot file for the JS → TS migration: keep the runtime logic identical
// to the JS original, just add types so future routes can copy the shape.

import { NextResponse, type NextRequest } from 'next/server';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// ── ABR response shape (what we read off the public JSONP payload) ──
interface AbrPayload {
  Abn?: string;
  AbnStatus?: string;          // 'Active' | 'Cancelled' | …
  EntityName?: string;
  EntityTypeName?: string;
  BusinessName?: string | string[];
  Gst?: string | null;         // present when registered
  AddressPostcode?: string;
  AddressState?: string;
  Message?: string;            // present on lookup errors only
}

interface AuthContext {
  user: User;
  adminC: SupabaseClient;
}

// ABN checksum — 11-digit number, weighted-mod-89 check from the ATO.
// Validates locally so we don't hit ABR with junk input.
const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19] as const;
function isValidAbn(raw: unknown): boolean {
  const digits = String(raw ?? '').replace(/\D+/g, '');
  if (digits.length !== 11) return false;
  // Subtract 1 from the first digit per the ATO spec.
  const nums = digits.split('').map(Number);
  nums[0] -= 1;
  const sum = nums.reduce((a, n, i) => a + n * ABN_WEIGHTS[i], 0);
  return sum % 89 === 0;
}

async function authoriseSelf(req: NextRequest): Promise<AuthContext | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const cookieHeader = req.headers.get('cookie') || '';
  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { cookie: cookieHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) return null;
  const adminC = createClient(url, service, { auth: { persistSession: false } });
  return { user, adminC };
}

// Strip the JSONP wrapper ABR returns. The endpoint always wraps with the
// `callback` query param — we use `callback=cb` to keep the unwrap simple.
function parseAbrJsonp(text: string): AbrPayload | null {
  const m = text.match(/^[A-Za-z0-9_$]+\s*\(([\s\S]+)\)\s*;?\s*$/);
  if (!m) return null;
  try { return JSON.parse(m[1]) as AbrPayload; } catch { return null; }
}

export async function POST(req: NextRequest) {
  const auth = await authoriseSelf(req);
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const guid = process.env.ABR_GUID;
  if (!guid) {
    // Soft-fail rather than crash — surface the config gap explicitly so
    // admins notice on first usage.
    return NextResponse.json({
      ok: false,
      error: 'abr_not_configured',
      detail: 'Set ABR_GUID env var (free, register at abr.business.gov.au/Tools/WebServices).',
    }, { status: 503 });
  }

  let body: { abn?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const abn = String(body?.abn ?? '').replace(/\D+/g, '');
  if (!isValidAbn(abn)) {
    return NextResponse.json({ ok: false, error: 'invalid_abn' }, { status: 400 });
  }

  // Hit ABR.
  let abrJson: AbrPayload | null;
  try {
    const u = new URL('https://abr.business.gov.au/json/AbnDetails.aspx');
    u.searchParams.set('abn', abn);
    u.searchParams.set('callback', 'cb');
    u.searchParams.set('guid', guid);
    const res = await fetch(u, { method: 'GET' });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'abr_unreachable' }, { status: 502 });
    }
    abrJson = parseAbrJsonp(await res.text());
    if (!abrJson) {
      return NextResponse.json({ ok: false, error: 'abr_unparseable' }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'abr_unreachable' }, { status: 502 });
  }

  // ABR returns a Message field on lookup errors (e.g. unknown ABN).
  if (abrJson.Message) {
    return NextResponse.json({ ok: false, error: 'abr_error', detail: abrJson.Message }, { status: 404 });
  }

  // Pick the best business name: legal entity name for companies/trusts,
  // main entity name otherwise. Fall back to the trading name if present.
  const legal = abrJson.EntityName
              || (Array.isArray(abrJson.BusinessName) ? abrJson.BusinessName[0] : abrJson.BusinessName)
              || null;
  const status = abrJson.AbnStatus || null;
  const isActive = status?.toLowerCase() === 'active';

  // Persist — store every row regardless of active status so the user
  // can see WHY they failed verification ("ABN cancelled 2019-04-01").
  const patch = {
    abn,
    abn_business_name: legal,
    abn_entity_type:   abrJson.EntityTypeName ?? null,
    abn_status:        status,
    abn_gst_registered: !!abrJson.Gst,
    abn_postcode:      abrJson.AddressPostcode ?? null,
    abn_state:         abrJson.AddressState ?? null,
    // Only stamp verified_at when ABR confirms Active. Reset it on
    // cancelled/non-active so a previously-verified dealer who lapses
    // loses the badge automatically.
    abn_verified_at:   isActive ? new Date().toISOString() : null,
    updated_at:        new Date().toISOString(),
  };

  const { error: upErr } = await auth.adminC
    .from('profiles')
    .update(patch)
    .eq('id', auth.user.id);

  if (upErr) {
    return NextResponse.json({ ok: false, error: 'persist_failed', detail: upErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    verified: isActive,
    abn,
    business_name: legal,
    entity_type: abrJson.EntityTypeName ?? null,
    status,
    gst_registered: !!abrJson.Gst,
    postcode: abrJson.AddressPostcode ?? null,
    state: abrJson.AddressState ?? null,
  });
}
