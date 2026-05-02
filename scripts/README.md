# scripts/

One-off CLIs that don't ship in the bundle.

## import-faa.js — grow the aircraft catalogue from the FAA registry

Pulls every (manufacturer, model) row from FAA's public Aircraft Reference
file (`ACFTREF.txt`) and upserts them into the `aircraft_makes` and
`aircraft_models` tables in Supabase.

Result: catalogue grows from the ~73-make / ~330-model hand-curated seed
to ~1,500 makes / ~5,000 models. Picker UI updates automatically — the
runtime hook in `src/lib/aircraftCatalogue.js` merges seed + DB.

### One-time setup

```bash
# 1. Make sure @supabase/supabase-js is installed (already in package.json)
npm install

# 2. Download the FAA dataset (~50 MB zipped, refreshes monthly)
mkdir -p data/raw
curl -L https://registry.faa.gov/database/ReleasableAircraft.zip \
  -o /tmp/faa.zip
unzip -p /tmp/faa.zip ACFTREF.txt > data/raw/ACFTREF.txt
```

### Run

```bash
NEXT_PUBLIC_SUPABASE_URL=https://gztdahwsfwybpzqcegty.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> \
node scripts/import-faa.js
```

Optional — point at a custom file path:

```bash
node scripts/import-faa.js path/to/ACFTREF.txt
```

### What it does

- Parses every row of `ACFTREF.txt` (~12,000 entries)
- Drops blimps, balloons, and rows missing manufacturer/model
- Cleans manufacturer noise: `CESSNA AIRCRAFT CO` → `Cessna`
- Maps FAA type codes → our 14 categories (Single Engine Piston,
  Helicopter, etc.)
- Slugs everything for the same key shape as the seed
- Upserts in 500-row chunks with `ignoreDuplicates: true` so it's safe
  to re-run after FAA's monthly refresh
- Logs progress + per-chunk errors but keeps going (partial wins ship)

### Notes

- FAA imports default to `popularity: 80`, so they sort *below* the
  hand-curated tier-1–4 makes (Cessna at 1, vintage Waco at 70). Anything
  curated in the seed wins position even if FAA also lists it.
- The script never deletes rows — FAA can add but never removes a model.
  If you need to prune, do it via SQL.
- Set `source = 'faa'` lets the admin UI later filter "show only FAA-
  imported models" if we add a curate-the-imports queue.
