import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { isSupabaseConfigured } from './_shared';

// Lean query for the buy-page filter rail's facet counts. Selects ONLY
// the columns useFacets needs to aggregate (12 fields, ~80 bytes per
// row) instead of the full aircraft row that useAircraft returns
// (~50 fields + dealer + seller joins, ~600 bytes per row).
//
// Why a separate query: useFacets used to share useAircraft({})'s
// universe, which fetched the full join row for every active listing
// just to count grouped fields. A 2,000-listing marketplace was
// shipping ~1.2 MB of JSON to the browser per filter render. This
// query is ~160 KB for the same 2k rows — 7-8x smaller.
//
// Cap at 5000 rows. Past that, switch to a Postgres `aircraft_facet_
// counts(jsonb)` RPC (returns aggregated counts only — never sends
// row data over the wire). At current scale (0-100 listings) the
// in-browser aggregation is sub-millisecond and not worth the SQL
// function complexity.

const FACET_LIMIT = 5000;

const FACET_COLUMNS = [
  'id',                    // for stable React keys if needed
  'category',
  'manufacturer',
  'model',
  'state',
  'country',
  'condition',
  'engine_count',
  'engine_type',           // listingMatches reads engine_type_category
  'engine_make',
  'avionics_suite',
  'autopilot',
  'damage_history',
  // Booleans the facet hook gates on
  'ifr', 'glass_cockpit',
  'adsb_in', 'adsb_out',
  'syn_vis', 'de_ice', 'air_con',
  'pressurised', 'retractable', 'cargo_door', 'parachute',
  'dealer_id', 'featured',
  // Numerics for range gating
  'price', 'year',
].join(', ');

export function useFacetUniverse() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('aircraft')
          .select(FACET_COLUMNS)
          .eq('status', 'active')
          .limit(FACET_LIMIT);
        if (!cancelled) setRows(data || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { rows, loading };
}
