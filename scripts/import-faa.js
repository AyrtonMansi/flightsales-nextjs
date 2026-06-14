#!/usr/bin/env node
/* eslint-disable no-console */
//
// Import the FAA Aircraft Reference (ACFTREF) into the catalogue.
//
// The FAA publishes the registration roster + reference tables as a free
// public-domain dataset. ACFTREF.txt has every (manufacturer, model)
// combination registered in the US — about 12,000 unique entries that
// dedupe to ~5,000 useful ones after we strip blank/test rows.
//
// Running this script populates the aircraft_makes + aircraft_models
// tables in Supabase. The runtime catalogue (useAircraftCatalogue) merges
// the static seed with whatever's in the DB, so the picker grows
// automatically with no code change.
//
// USAGE
// -----
//   1. Download the FAA dataset (one-off, ~50 MB zipped):
//        mkdir -p data/raw
//        curl -L https://registry.faa.gov/database/ReleasableAircraft.zip \
//          -o /tmp/faa.zip
//        unzip -p /tmp/faa.zip ACFTREF.txt > data/raw/ACFTREF.txt
//
//   2. Run the importer (idempotent — safe to re-run after FAA refreshes):
//        NEXT_PUBLIC_SUPABASE_URL=https://gztdahwsfwybpzqcegty.supabase.co \
//        SUPABASE_SERVICE_ROLE_KEY=... \
//        node scripts/import-faa.js
//
//   3. (Optional) point at a custom path:
//        node scripts/import-faa.js path/to/ACFTREF.txt
//
// Output: progress per chunk + final counts. Anything that errors gets
// logged but doesn't abort the run — partial wins are still wins.

const fs = require('fs');
const path = require('path');

// ── Config ─────────────────────────────────────────────────────────
const FAA_PATH = process.argv[2] || path.resolve(process.cwd(), 'data/raw/ACFTREF.txt');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHUNK_SIZE = 500;
const FAA_POPULARITY = 80; // FAA-imported entries default below the 1-72 hand-curated tiers

// ── Validation ─────────────────────────────────────────────────────
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  console.error('Tip: export them from your shell, or use a .env.local + dotenv loader.');
  process.exit(1);
}
if (!fs.existsSync(FAA_PATH)) {
  console.error(`File not found: ${FAA_PATH}`);
  console.error('See header comment in this script for download instructions.');
  process.exit(1);
}

// Dynamic require so the script doesn't blow up on `node scripts/import-faa.js --help`
let createClient;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (err) {
  console.error('Missing dependency: npm i @supabase/supabase-js');
  process.exit(1);
}

// ── Slug + normalisation helpers (kept in lockstep with src/lib/aircraftCatalogue.js) ──
function slugify(s) {
  if (!s) return '';
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Some FAA manufacturers are written like "CESSNA AIRCRAFT CO" or "PIPER
// AIRCRAFT INC". Normalise the noise so they collide with our seed makes.
const MFR_NORMALISE = [
  [/\s+(AIRCRAFT|AIR|AVIATION|CO|CORP|CORPORATION|INC|INCORPORATED|LLC|LTD|LIMITED|MFG|MANUFACTURING|GROUP|HOLDINGS|COMPANY)\b\.?/gi, ''],
  [/\s+/g, ' '],
];
function cleanMfr(raw) {
  let out = (raw || '').toUpperCase();
  for (const [re, sub] of MFR_NORMALISE) out = out.replace(re, sub);
  return out.trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\B\w/g, c => c.toLowerCase());
}

// Map FAA codes → our 14-category system. Codes per FAA Aircraft
// Registration Database documentation.
function categoryFor({ typeAcft, typeEng, acCat, weight }) {
  if (typeAcft === '6') return 'Helicopter';
  if (typeAcft === '9') return 'Gyrocopter';
  if (typeAcft === '1') return 'Glider';
  if (typeAcft === '7' || typeAcft === '8') return 'Ultralight';
  // Jet bucketing by FAA weight class
  if (typeEng === '4' || typeEng === '5') {
    if (weight === 'CLASS 1') return 'Light Jet';
    if (weight === 'CLASS 2') return 'Midsize Jet';
    return 'Heavy Jet';
  }
  if (typeEng === '2' || typeEng === '3') return 'Turboprop';
  // Sea/amphib variants of fixed-wing
  if (acCat === '2' || acCat === '3') return 'Amphibious/Seaplane';
  if (typeAcft === '5') return 'Multi Engine Piston';
  if (typeAcft === '4') return 'Single Engine Piston';
  return null;  // skip blimps, balloons, hybrids — out of marketplace scope
}

// ── Parse ───────────────────────────────────────────────────────────
function parseRow(line) {
  // ACFTREF.txt is comma-delimited with a fixed column order.
  // Fields: CODE,MFR,MODEL,TYPE-ACFT,TYPE-ENG,AC-CAT,BUILD-CERT-IND,
  //         NO-ENG,NO-SEATS,AC-WEIGHT,SPEED,TC-DATA-SHEET,TC-DATA-HOLDER
  const f = line.split(',').map(x => x.trim());
  return {
    code:      f[0],
    mfr:       f[1],
    model:     f[2],
    typeAcft:  f[3],
    typeEng:   f[4],
    acCat:     f[5],
    noEng:     parseInt(f[7], 10) || 1,
    noSeats:   parseInt(f[8], 10) || null,
    weight:    f[9],
    speed:     parseInt(f[10], 10) || null,
  };
}

console.log(`Reading ${FAA_PATH}…`);
const lines = fs.readFileSync(FAA_PATH, 'utf8').split(/\r?\n/);
console.log(`  ${lines.length.toLocaleString()} rows`);

const makes = new Map();   // makeSlug → { slug, name, source, popularity }
const models = new Map();  // modelSlug → { slug, make_slug, family, full_name, ... }
let skipped = 0;

// Skip header row
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  const row = parseRow(line);
  if (!row.mfr || !row.model) { skipped++; continue; }
  const category = categoryFor(row);
  if (!category) { skipped++; continue; }

  const mfrName = cleanMfr(row.mfr);
  const makeSlug = slugify(mfrName);
  if (!makeSlug) { skipped++; continue; }

  if (!makes.has(makeSlug)) {
    makes.set(makeSlug, {
      slug: makeSlug,
      name: mfrName,
      source: 'faa',
      popularity: FAA_POPULARITY,
    });
  }

  const fullName = `${mfrName} ${row.model}`.trim();
  const modelSlug = slugify(fullName);
  if (!modelSlug || models.has(modelSlug)) continue;

  models.set(modelSlug, {
    slug: modelSlug,
    make_slug: makeSlug,
    family: row.model,
    full_name: fullName,
    category,
    seats: row.noSeats,
    engine_count: row.noEng,
    cruise_kts: row.speed,
    source: 'faa',
  });
}

console.log(`Parsed ${makes.size.toLocaleString()} makes, ${models.size.toLocaleString()} models (skipped ${skipped.toLocaleString()})`);

// ── Upsert ──────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsertChunked(table, rows, conflictKey) {
  let done = 0;
  let errored = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const slice = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(table).upsert(slice, {
      onConflict: conflictKey,
      ignoreDuplicates: true,
    });
    if (error) {
      errored += slice.length;
      // Log but keep going — DB errors per chunk shouldn't abort the run
      console.error(`  ${table} chunk ${i}: ${error.message}`);
    } else {
      done += slice.length;
    }
    process.stdout.write(`  ${table}: ${done.toLocaleString()} ok, ${errored.toLocaleString()} errored\r`);
  }
  console.log();
}

(async () => {
  console.log('Upserting makes…');
  await upsertChunked('aircraft_makes', [...makes.values()], 'slug');
  console.log('Upserting models…');
  await upsertChunked('aircraft_models', [...models.values()], 'slug');
  console.log('Done.');
})().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
