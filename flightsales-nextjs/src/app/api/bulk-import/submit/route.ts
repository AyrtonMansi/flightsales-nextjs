// POST /api/bulk-import/submit
// Takes a list of pre-validated listings (from /api/bulk-import/parse) and
// inserts them as status='pending' rows for admin review. Same auth gate
// as the parse route — dealer or admin only.
//
// Why two endpoints? Parse is read-only and AI-augmented; Submit writes.
// Splitting them lets the user edit the preview grid between AI cleanup
// and DB write without re-running the AI pass.

import { NextResponse, type NextRequest } from 'next/server';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export const runtime = 'nodejs';

interface PreviewInput {
  title?: string;
  price?: number;
  manufacturer?: string;
  model?: string;
  year?: number;
  category?: string;
  condition?: string;
  state?: string;
  city?: string;
  ttaf?: number;
  eng_hours?: number;
  eng_tbo?: number;
  avionics?: string;
  rego?: string;
  description?: string;
  images?: string[];
}

interface DbRow {
  title: string | null;
  price: number | null;
  manufacturer: string | null;
  model: string | null;
  year: number | null;
  category: string | null;
  condition: string;
  state: string | null;
  city: string | null;
  ttaf: number;
  eng_hours: number | null;
  eng_tbo: number | null;
  avionics: string | null;
  rego: string | null;
  description: string | null;
  images: string[];
  status: 'pending';
  user_id: string;
}

interface RowResult { index: number; ok: boolean; error?: string; id?: string; }
interface AuthContext { user: User; profile: unknown; adminC: SupabaseClient; }

const REQUIRED: (keyof DbRow)[] = ['title', 'price', 'manufacturer', 'model', 'year', 'category', 'condition', 'state', 'city'];

async function authoriseDealer(req: NextRequest): Promise<AuthContext | null> {
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
  const { data: profile } = await adminC
    .from('profiles')
    .select('id, role, is_dealer')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) return null;
  if (profile.role === 'admin' || profile.role === 'dealer' || profile.is_dealer) {
    return { user, profile, adminC };
  }
  return null;
}

// Build a DB-shaped row from a preview row. Returns { row, error } where
// error is a short reason string when a required field is missing.
function shapeRow(input: PreviewInput, userId: string): { row: DbRow | null; error: string | null } {
  const title = input.title
    || [input.year, input.manufacturer, input.model].filter(Boolean).join(' ').trim()
    || null;
  const price = Number.isFinite(input.price) ? Math.round(input.price as number) : null;
  const year  = Number.isFinite(input.year)  ? Math.round(input.year as number)  : null;
  const ttaf  = Number.isFinite(input.ttaf)  ? Math.round(input.ttaf as number)  : 0;

  const row: DbRow = {
    title,
    price,
    manufacturer: input.manufacturer || null,
    model:        input.model        || null,
    year,
    category:     input.category     || null,
    condition:    input.condition    || 'Pre-Owned',
    state:        input.state        || null,
    city:         input.city         || null,
    ttaf,
    eng_hours:    Number.isFinite(input.eng_hours) ? Math.round(input.eng_hours as number) : null,
    eng_tbo:      Number.isFinite(input.eng_tbo)   ? Math.round(input.eng_tbo as number)   : null,
    avionics:     input.avionics    || null,
    rego:         input.rego        || null,
    description:  input.description || null,
    images:       Array.isArray(input.images) ? input.images : [],
    status:       'pending',
    user_id:      userId,
  };

  for (const k of REQUIRED) {
    if (row[k] == null || row[k] === '') {
      return { row: null, error: `missing_${k}` };
    }
  }
  return { row, error: null };
}

export async function POST(req: NextRequest) {
  const auth = await authoriseDealer(req);
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let body: { listings?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const incoming = Array.isArray(body?.listings) ? (body.listings as PreviewInput[]) : [];
  if (incoming.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_listings' }, { status: 400 });
  }
  if (incoming.length > 200) {
    return NextResponse.json({ ok: false, error: 'too_many_rows', max: 200 }, { status: 400 });
  }

  // Shape + validate each row. Track per-row results so the UI can show
  // exactly which rows landed and which were rejected.
  const results: RowResult[] = [];
  const toInsert: { _resultIdx: number; row: DbRow }[] = [];
  for (let i = 0; i < incoming.length; i++) {
    const { row, error } = shapeRow(incoming[i] || {}, auth.user.id);
    if (error) {
      results.push({ index: i, ok: false, error });
    } else if (row) {
      results.push({ index: i, ok: true });
      toInsert.push({ _resultIdx: results.length - 1, row });
    }
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, results });
  }

  // Single batch insert — keeps it one round-trip. RLS would normally
  // run, but we use the service-role client so the insert isn't blocked
  // by per-row policies (the auth gate above already verified dealer role).
  const rows = toInsert.map((x) => x.row);
  const { data, error } = await auth.adminC
    .from('aircraft')
    .insert(rows)
    .select('id, rego');

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('rego')) {
      return NextResponse.json({
        ok: false,
        error: 'rego_conflict',
        detail: error.message,
        results,
      }, { status: 409 });
    }
    return NextResponse.json({
      ok: false,
      error: 'insert_failed',
      detail: error.message,
      results,
    }, { status: 500 });
  }

  data?.forEach((inserted: { id: string; rego: string | null }, n: number) => {
    const target = toInsert[n];
    if (target && results[target._resultIdx]) {
      results[target._resultIdx].id = inserted.id;
    }
  });

  return NextResponse.json({
    ok: true,
    inserted: data?.length || 0,
    results,
  });
}
