import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { isSupabaseConfigured } from './_shared';

// ─── Aircraft listing reads ──────────────────────────────────────────
//
// useAircraft is the primary public-facing query — drives /buy filter
// rail, hero quick-search results, AI-search results, dealer detail
// page listings, and the admin Listings tab seed.
//
// useFeaturedAircraft / useLatestAircraft are the homepage rails:
// "Featured" (admin-set `featured=true` flag) and "Latest" (newest
// `created_at`). Both limit 3.

export function useAircraft(filters = {}) {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  // Guards against rapid filter changes: if a newer fetch starts before an
  // older one resolves, the older response is discarded instead of
  // clobbering state with stale results.
  const fetchIdRef = useRef(0);

  // Destructure to primitives so useCallback can depend on each value directly.
  // Avoids the JSON.stringify(filters) hack that ran on every render.
  // Multi-select fields are arrays; their references are stable across
  // renders because BuyPage's filterReducer only swaps an array when its
  // contents change, so they can sit in the dep array directly.
  const {
    // legacy single-string filters kept for back-compat with hooks that still
    // pass scalars (useFeaturedAircraft, dealer detail page, etc.)
    category, manufacturer, state, condition, dealerId,
    // new array-shaped multi-select fields used by BuyPage
    categories, manufacturers, models, countries, states, conditions,
    engineCounts, engineTypes, engineMakes,
    avionicsSuites, autopilots, damageHistory,
    minPrice, maxPrice, maxHours, ifrOnly, glassOnly,
    yearFrom, yearTo,
    cruiseMin, rangeMin, usefulLoadMin, fuelBurnMax,
    mtowMin, mtowMax, ceilingMin,
    smohMax, tboPctMin,
    adsbIn, adsbOut, synVis, deIce, airCon,
    retractable, pressurised, cargoDoor, parachute,
    logbooksComplete, hangared, ownerMaxCount,
    dealerOnly, privateOnly, featuredOnly,
    search, sortBy, page, pageSize,
  } = filters;

  const fetchAircraft = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      if (fetchIdRef.current !== fetchId) return;
      setAircraft([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('aircraft')
        .select(`*, dealer:dealers(id, name, location, rating, verified), seller:profiles!aircraft_user_id_profiles_fkey(abn_verified_at, abn_business_name)`, { count: 'exact' })
        .eq('status', 'active');

      // Single-string back-compat path (used by Home / dealer detail).
      if (category) query = query.eq('category', category);
      if (manufacturer) query = query.eq('manufacturer', manufacturer);
      if (state) query = query.eq('state', state);
      if (condition) query = query.eq('condition', condition);
      if (dealerId) query = query.eq('dealer_id', dealerId);

      // New multi-select path — Supabase `.in()` for OR-within-field.
      if (categories && categories.length) query = query.in('category', categories);
      if (manufacturers && manufacturers.length) query = query.in('manufacturer', manufacturers);
      if (models && models.length) query = query.in('model', models);
      // Country filter (ISO 3166-1 alpha-2) — checks the aircraft.country
      // column. State filter is the sub-division code (AU state, US state,
      // CA province). Both arrays can be present together; combined with
      // .in() they form an OR within each field and AND across them.
      if (countries && countries.length) query = query.in('country', countries);
      if (states && states.length) query = query.in('state', states);
      if (conditions && conditions.length) query = query.in('condition', conditions);

      // Numeric ranges
      if (minPrice) query = query.gte('price', Number(minPrice));
      if (maxPrice) query = query.lte('price', Number(maxPrice));
      if (yearFrom) query = query.gte('year', Number(yearFrom));
      if (yearTo) query = query.lte('year', Number(yearTo));
      if (maxHours) query = query.lte('ttaf', Number(maxHours));

      // Performance specs
      if (cruiseMin) query = query.gte('cruise_kts', Number(cruiseMin));
      if (rangeMin) query = query.gte('range_nm', Number(rangeMin));
      if (usefulLoadMin) query = query.gte('useful_load', Number(usefulLoadMin));
      if (fuelBurnMax) query = query.lte('fuel_burn', Number(fuelBurnMax));
      if (mtowMin) query = query.gte('mtow', Number(mtowMin));
      if (mtowMax) query = query.lte('mtow', Number(mtowMax));
      if (ceilingMin) query = query.gte('service_ceiling', Number(ceilingMin));

      // Engine
      if (engineCounts && engineCounts.length) query = query.in('engine_count', engineCounts.map(Number));
      if (engineTypes && engineTypes.length) query = query.in('engine_type', engineTypes);
      if (engineMakes && engineMakes.length) query = query.in('engine_make', engineMakes);
      if (smohMax) query = query.lte('eng_hours', Number(smohMax));
      if (tboPctMin) {
        // TBO remaining % is (eng_tbo - eng_hours) / eng_tbo * 100. Computed
        // client-side after fetch — Supabase doesn't have computed-column
        // .filter without an RPC and we'd rather keep the query path simple.
      }

      // Avionics & equipment
      if (avionicsSuites && avionicsSuites.length) query = query.in('avionics_suite', avionicsSuites);
      if (autopilots && autopilots.length) query = query.in('autopilot', autopilots);
      if (ifrOnly) query = query.eq('ifr', true);
      if (glassOnly) query = query.eq('glass_cockpit', true);
      if (retractable) query = query.eq('retractable', true);
      if (pressurised) query = query.eq('pressurised', true);
      if (adsbIn) query = query.eq('adsb_in', true);
      if (adsbOut) query = query.eq('adsb_out', true);
      if (synVis) query = query.eq('syn_vis', true);
      if (deIce) query = query.eq('de_ice', true);
      if (airCon) query = query.eq('air_con', true);
      if (cargoDoor) query = query.eq('cargo_door', true);
      if (parachute) query = query.eq('parachute', true);

      // History & condition
      if (damageHistory && damageHistory.length) query = query.in('damage_history', damageHistory);
      if (logbooksComplete) query = query.eq('logbooks_complete', true);
      if (hangared) query = query.eq('hangared', true);
      if (ownerMaxCount) query = query.lte('owner_count', Number(ownerMaxCount));

      // Seller filters
      if (dealerOnly && !privateOnly) query = query.not('dealer_id', 'is', null);
      if (privateOnly && !dealerOnly) query = query.is('dealer_id', null);
      if (featuredOnly) query = query.eq('featured', true);

      // Search — sanitise the term before splicing into a PostgREST .or()
      // filter. Comma is the filter separator, parens group sub-expressions,
      // and %/_ are ILIKE wildcards; an unescaped value would let a crafted
      // query inject extra filters. Whitelist keeps the shape simple: only
      // word chars, spaces, hyphens, dots — covers every real aircraft
      // search (Cessna 172, VH-ABC, PA.28-180) and rejects everything else.
      if (search) {
        const safe = String(search)
          .slice(0, 80)
          .replace(/[^A-Za-z0-9 .\-]/g, ' ')
          .trim();
        if (safe) {
          query = query.or(
            `title.ilike.%${safe}%,manufacturer.ilike.%${safe}%,model.ilike.%${safe}%`
          );
        }
      }

      // Sort
      if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'hours-low') query = query.order('ttaf', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      if (page && pageSize) {
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }

      const { data, error: err, count } = await query;
      if (err) throw err;
      if (fetchIdRef.current !== fetchId) return; // superseded by a newer fetch

      // Apply TBO % filter client-side (see note above).
      let rows = data || [];
      if (tboPctMin) {
        const minPct = Number(tboPctMin);
        rows = rows.filter(r => {
          if (!r.eng_tbo || !r.eng_hours) return false;
          const remaining = ((r.eng_tbo - r.eng_hours) / r.eng_tbo) * 100;
          return remaining >= minPct;
        });
      }

      setAircraft(rows);
      setTotal(tboPctMin ? rows.length : (count || 0));
    } catch (err) {
      if (fetchIdRef.current !== fetchId) return;
      setError(err.message);
    } finally {
      if (fetchIdRef.current === fetchId) setLoading(false);
    }
  }, [
    category, manufacturer, state, condition, dealerId,
    categories, manufacturers, models, countries, states, conditions,
    engineCounts, engineTypes, engineMakes,
    avionicsSuites, autopilots, damageHistory,
    minPrice, maxPrice, maxHours, ifrOnly, glassOnly,
    yearFrom, yearTo,
    cruiseMin, rangeMin, usefulLoadMin, fuelBurnMax,
    mtowMin, mtowMax, ceilingMin,
    smohMax, tboPctMin,
    adsbIn, adsbOut, synVis, deIce, airCon,
    retractable, pressurised, cargoDoor, parachute,
    logbooksComplete, hangared, ownerMaxCount,
    dealerOnly, privateOnly, featuredOnly,
    search, sortBy, page, pageSize,
  ]);

  useEffect(() => { fetchAircraft(); }, [fetchAircraft]);

  return { aircraft, loading, error, total, refetch: fetchAircraft };
}

export function useFeaturedAircraft() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const { data, error: err } = await supabase
          .from('aircraft')
          .select(`*, dealer:dealers(id, name, location, rating, verified), seller:profiles!aircraft_user_id_profiles_fkey(abn_verified_at, abn_business_name)`)
          .eq('featured', true)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);
        if (err) throw err;
        if (cancelled) return;
        setAircraft(data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        console.error('[useFeaturedAircraft]', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    // No safety-net timeout: the previous setTimeout(setLoading(false), 5000)
    // fired unconditionally and caused a flicker.
    return () => { cancelled = true; };
  }, []);

  return { aircraft, loading, error };
}

export function useLatestAircraft() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const { data } = await supabase
          .from('aircraft')
          .select(`*, dealer:dealers(id, name, location, rating, verified), seller:profiles!aircraft_user_id_profiles_fkey(abn_verified_at, abn_business_name)`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);
        if (cancelled) return;
        setAircraft(data || []);
      } catch (err) {
        if (cancelled) return;
        console.error('[useLatestAircraft]', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  return { aircraft, loading };
}

// Single-row fetch by id — used by FlightSalesApp's mount-time fallback
// (when a route gave only an id, no full row) and its popstate handler
// (browser back/forward into /listings/:id). Centralised here so both
// call sites share one query shape instead of duplicating it inline.
export async function fetchAircraftById(id) {
  const { data } = await supabase
    .from('aircraft')
    .select(`*, dealer:dealers(id, name, location, rating, verified)`)
    .eq('id', id)
    .maybeSingle();
  return data || null;
}
