// POST /api/bulk-import/parse
// Takes a raw CSV body, returns typed listing rows. If
// ANTHROPIC_API_KEY is set, runs each unfamiliar row through Claude
// Haiku for normalisation: cleaning weird brand spellings, mapping to
// canonical catalogue model_slug, inferring category from rego/model.
// If the key is absent, falls back to header-map only — still works,
// just without the AI assistance.
//
// Auth: requires a session whose profile.role === 'dealer' (or admin).
// Verified server-side via supabase auth cookie. Bulk import is a
// dealer-only feature gated this way both here and in the UI.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseCsv, rowsToListings } from '../../../../lib/csv';
import { MAKES_SEED, MODELS_SEED } from '../../../../lib/aircraftCatalogueSeed';

// Pure-JS catalogue match — re-implemented inline so this server route
// doesn't pull in aircraftCatalogue.js (which imports React hooks at
// module load and so flags as client-only under the Next.js compiler).
function normalize(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

let SEED_INDEX = null;
function getSeedIndex() {
  if (SEED_INDEX) return SEED_INDEX;
  const aliasIndex = new Map();
  const add = (key, model) => {
    const k = normalize(key);
    if (!k || aliasIndex.has(k)) return;
    aliasIndex.set(k, model);
  };
  for (const m of MODELS_SEED) {
    add(m.full_name, m);
    add(m.slug, m);
    if (m.type_designator) add(m.type_designator, m);
    if (Array.isArray(m.aliases)) for (const a of m.aliases) add(a, m);
  }
  SEED_INDEX = { aliasIndex };
  return SEED_INDEX;
}

function findModel(idx, text) {
  if (!text) return null;
  return idx.aliasIndex.get(normalize(text)) ?? null;
}

export const runtime = 'nodejs';

async function authoriseDealer(req) {
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
  // Look up role via service role so the user's RLS doesn't fight us.
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
    return { user, profile };
  }
  return null;
}

export async function POST(req) {
  const auth = await authoriseDealer(req);
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const csv = typeof body?.csv === 'string' ? body.csv : '';
  if (!csv.trim()) return NextResponse.json({ ok: false, error: 'empty_csv' }, { status: 400 });

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return NextResponse.json({ ok: false, error: 'need_header_plus_data' }, { status: 400 });
  }
  const [headerRow, ...dataRows] = rows;
  if (dataRows.length > 200) {
    return NextResponse.json({ ok: false, error: 'too_many_rows', max: 200 }, { status: 400 });
  }

  const listings = rowsToListings(headerRow, dataRows);

  // Catalogue match — for each row, try to resolve the make+model to a
  // canonical slug. This runs locally, no AI cost. Adds `model_slug`,
  // `_catalogueMatch`, and validation flags.
  const idx = getSeedIndex();
  const decorated = listings.map((row) => {
    const flags = [];
    if (!row.manufacturer && !row.model) flags.push('missing_make_model');
    if (!row.year)  flags.push('missing_year');
    if (!row.price) flags.push('missing_price');

    let modelMatch = null;
    if (row.manufacturer && row.model) {
      modelMatch = findModel(idx, `${row.manufacturer} ${row.model}`);
    }
    if (!modelMatch && row.model) {
      modelMatch = findModel(idx, row.model);
    }
    return {
      ...row,
      model_slug: modelMatch?.slug || null,
      category:   row.category || modelMatch?.category || null,
      _matchedFamily: modelMatch?.family || null,
      _flags: flags,
    };
  });

  // AI normalisation pass — only run on rows with flags or unmatched
  // catalogue entries, and only if Anthropic key is configured.
  const ai = await maybeAiNormalise(decorated);
  return NextResponse.json({ ok: true, listings: ai });
}

// AI helper — calls Claude Haiku once per BATCH of unmatched rows
// rather than once per row to stay cheap. Falls back to the
// pre-AI rows if the API call fails for any reason.
async function maybeAiNormalise(rows) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return rows;
  const needsAi = rows.filter(
    (r) => !r.model_slug || r._flags.length > 0
  );
  if (needsAi.length === 0) return rows;

  // Build a tight payload — just the fields the model needs to clean up.
  const compact = needsAi.map((r, i) => ({
    i,
    manufacturer: r.manufacturer,
    model: r.model,
    year: r.year,
    rego: r.rego,
    category: r.category,
    description: r.description?.slice(0, 200) || null,
  }));

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system:
          'You normalise aircraft listing CSV rows. For each input row, return a JSON object ' +
          'with the same `i` and these fields when you can confidently derive them: ' +
          'manufacturer (e.g. "Cessna"), model (e.g. "172S Skyhawk"), category (one of: ' +
          'Single Engine Piston, Multi Engine Piston, Turboprop, Light Jet, Midsize Jet, Heavy Jet, ' +
          'Helicopter, Gyrocopter, Ultralight, LSA, Warbird, Glider, Amphibious/Seaplane, Drone & eVTOL). ' +
          'Use the description and rego format to disambiguate. ' +
          'Return ONLY a JSON array of {i, manufacturer?, model?, category?} — no prose.',
        messages: [{
          role: 'user',
          content: 'Normalise these rows:\n' + JSON.stringify(compact),
        }],
      }),
    });
    if (!res.ok) return rows;
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return rows;
    const fixes = JSON.parse(match[0]);
    if (!Array.isArray(fixes)) return rows;

    const byIndex = new Map(fixes.map((f) => [f.i, f]));
    return rows.map((r, idx) => {
      // Find the index in `needsAi` for this row, then look up its fix.
      const aiIdx = needsAi.indexOf(r);
      if (aiIdx < 0) return r;
      const fix = byIndex.get(aiIdx);
      if (!fix) return r;
      return {
        ...r,
        manufacturer: fix.manufacturer ?? r.manufacturer,
        model: fix.model ?? r.model,
        category: fix.category ?? r.category,
        _ai: true,
      };
    });
  } catch {
    return rows;   // any error → pre-AI version is the safe fallback
  }
}
