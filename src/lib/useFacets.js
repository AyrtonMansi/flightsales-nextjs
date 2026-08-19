'use client';
import { useMemo } from 'react';
import { useFacetUniverse } from './hooks/facetUniverse';

// Faceted-search counts for the buy-page filter rail. For every
// multi-pick filter (Make, Model, State, Condition, plus the advanced
// engine / avionics / damage-history sections) we need a count of how
// many listings would match if the user added that option to their
// current filter state.
//
// Faceted means: each count respects every OTHER filter the user has
// active, but not the facet itself. So if "Type=Helicopter" is selected,
// makeCounts shows the helicopter count for every make — not zero for
// fixed-wing makers (we'd never see them) — but if "Cessna" is also
// selected we don't multiply Cessna by itself.
//
// Implementation: pulls the full active-listing set once via useAircraft
// (already cached at the page level) then computes counts client-side.
// At ~10 ms per re-compute even for 10k rows. Past ~10k listings, swap
// to a /api/search/facets Postgres group-by endpoint without changing
// this hook's signature.

// Sanitise a free-text search term the same way hooks/aircraft.js does
// before splicing it into its PostgREST .or() filter (word chars, spaces,
// hyphens, dots only). Applying the identical whitelist here — even
// though a client-side .includes() check has no injection risk of its
// own — keeps this an exact behavioural mirror of the real query, not
// just an equivalent-looking one: whatever normalises the term one way
// server-side must normalise it the same way here, or the facet counts
// would predict a different match than the result grid actually returns.
function sanitiseSearch(term) {
  return String(term).slice(0, 80).replace(/[^A-Za-z0-9 .\-]/g, ' ').trim();
}

// Returns true iff `listing` matches every filter constraint in `filters`,
// IGNORING the field named in `excludeField`. Used so makeCounts excludes
// the manufacturers facet when computing per-make counts.
//
// This function is the client-side mirror of the real Supabase query in
// hooks/aircraft.js's fetchAircraft — every constraint applied there must
// have an equivalent check here, or the sidebar's live counts silently
// diverge from what the result grid actually shows. That drift already
// happened once (engineTypes read a listing.engine_type_category property
// that was never selected — every row had it undefined, so ticking any
// Engine Type option zeroed out every other facet's count) — hence the
// exhaustive per-field comment below and the field-by-field parity test
// in tests/e2e/useFacets.unit.spec.js.
export function listingMatches(listing, filters, excludeField) {
  const cats        = excludeField === 'categories'    ? [] : (filters.categories    ?? []);
  const makes       = excludeField === 'manufacturers' ? [] : (filters.manufacturers ?? []);
  const models      = excludeField === 'models'        ? [] : (filters.models        ?? []);
  const states      = excludeField === 'states'        ? [] : (filters.states        ?? []);
  const countries   = excludeField === 'countries'     ? [] : (filters.countries     ?? []);
  const conditions  = excludeField === 'conditions'    ? [] : (filters.conditions    ?? []);
  const engineCounts = excludeField === 'engineCounts' ? [] : (filters.engineCounts  ?? []);
  const engineTypes  = excludeField === 'engineTypes'  ? [] : (filters.engineTypes   ?? []);
  const engineMakes  = excludeField === 'engineMakes'  ? [] : (filters.engineMakes   ?? []);
  const avSuites     = excludeField === 'avionicsSuites' ? [] : (filters.avionicsSuites ?? []);
  const aps          = excludeField === 'autopilots'   ? [] : (filters.autopilots    ?? []);
  const damage       = excludeField === 'damageHistory' ? [] : (filters.damageHistory ?? []);

  if (cats.length        && !cats.includes(listing.category)) return false;
  if (makes.length       && !makes.includes(listing.manufacturer)) return false;
  if (models.length      && !models.includes(listing.model)) return false;
  if (states.length      && !states.includes(listing.state)) return false;
  if (countries.length   && !countries.includes(listing.country)) return false;
  if (conditions.length  && !conditions.includes(listing.condition)) return false;
  // engine_count is a Postgres INTEGER column — Supabase returns it as a
  // JS number, while engineCounts holds the checkbox '1'/'2'/'4' STRING
  // values (same as everywhere else filter state travels: URL params,
  // reducer state). String() both sides so the comparison isn't strict-
  // equality-comparing a string array against a number and silently
  // excluding every listing.
  if (engineCounts.length && !engineCounts.includes(String(listing.engine_count))) return false;
  // Was listing.engine_type_category — a property FACET_COLUMNS never
  // selected, so it was always undefined and this branch excluded every
  // listing the instant any Engine Type option was ticked.
  if (engineTypes.length  && !engineTypes.includes(listing.engine_type)) return false;
  if (engineMakes.length  && !engineMakes.includes(listing.engine_make)) return false;
  if (avSuites.length    && !avSuites.includes(listing.avionics_suite)) return false;
  if (aps.length         && !aps.includes(listing.autopilot)) return false;
  if (damage.length      && !damage.includes(listing.damage_history)) return false;

  // Numeric ranges (always applied — these aren't faceted). Mirrors every
  // .gte/.lte in hooks/aircraft.js's Performance + Engine sections; these
  // were previously entirely absent here, so e.g. setting "Cruise ≥ 200kts"
  // filtered the result grid correctly but left every sidebar count as if
  // no cruise constraint were active.
  if (filters.minPrice && Number(listing.price) < Number(filters.minPrice)) return false;
  if (filters.maxPrice && Number(listing.price) > Number(filters.maxPrice)) return false;
  if (filters.yearFrom && Number(listing.year)  < Number(filters.yearFrom)) return false;
  if (filters.yearTo   && Number(listing.year)  > Number(filters.yearTo))   return false;
  if (filters.cruiseMin      && Number(listing.cruise_kts)     < Number(filters.cruiseMin))      return false;
  if (filters.rangeMin       && Number(listing.range_nm)       < Number(filters.rangeMin))       return false;
  if (filters.usefulLoadMin  && Number(listing.useful_load)    < Number(filters.usefulLoadMin))  return false;
  if (filters.fuelBurnMax    && Number(listing.fuel_burn)      > Number(filters.fuelBurnMax))    return false;
  if (filters.mtowMin        && Number(listing.mtow)           < Number(filters.mtowMin))        return false;
  if (filters.mtowMax        && Number(listing.mtow)           > Number(filters.mtowMax))        return false;
  if (filters.ceilingMin     && Number(listing.service_ceiling) < Number(filters.ceilingMin))    return false;
  if (filters.smohMax        && Number(listing.eng_hours)      > Number(filters.smohMax))        return false;
  if (filters.ownerMaxCount  && Number(listing.owner_count)    > Number(filters.ownerMaxCount))  return false;
  // TBO remaining % — same derived-percentage rule as the post-fetch
  // client-side filter in hooks/aircraft.js (no raw column for it).
  if (filters.tboPctMin) {
    if (!listing.eng_tbo || !listing.eng_hours) return false;
    const remaining = ((listing.eng_tbo - listing.eng_hours) / listing.eng_tbo) * 100;
    if (remaining < Number(filters.tboPctMin)) return false;
  }

  // Free-text search — same title/manufacturer/model substring match the
  // real query's .or(ilike) performs, sanitised identically first.
  if (filters.search) {
    const safe = sanitiseSearch(filters.search).toLowerCase();
    if (safe) {
      const hay = `${listing.title || ''} ${listing.manufacturer || ''} ${listing.model || ''}`.toLowerCase();
      if (!hay.includes(safe)) return false;
    }
  }

  // Booleans (only enforce when truthy)
  if (filters.ifrOnly       && !listing.ifr) return false;
  if (filters.glassOnly     && !listing.glass_cockpit) return false;
  if (filters.adsbIn        && !listing.adsb_in) return false;
  if (filters.adsbOut       && !listing.adsb_out) return false;
  if (filters.synVis        && !listing.syn_vis) return false;
  if (filters.deIce         && !listing.de_ice) return false;
  if (filters.airCon        && !listing.air_con) return false;
  if (filters.pressurised   && !listing.pressurised) return false;
  if (filters.retractable   && !listing.retractable) return false;
  if (filters.cargoDoor     && !listing.cargo_door) return false;
  if (filters.parachute     && !listing.parachute) return false;
  if (filters.logbooksComplete && !listing.logbooks_complete) return false;
  if (filters.hangared      && !listing.hangared) return false;
  if (filters.featuredOnly  && !listing.featured) return false;
  // Seller: dealerOnly/privateOnly mirror the real query's exact
  // cancel-out semantics (hooks/aircraft.js) — a constraint applies only
  // when exactly one of the pair is on. Naively AND-ing "has a dealer_id"
  // with "has no dealer_id" (the previous form) excluded every listing
  // whenever a user had BOTH boxes ticked, while the real query — which
  // only ever applies one of the two .not()/.is() clauses when they
  // disagree — correctly falls through to "no seller constraint" and
  // shows everything. Every sidebar count went to 0 in that state while
  // the result grid stayed full.
  if (filters.dealerOnly && !filters.privateOnly && !listing.dealer_id) return false;
  if (filters.privateOnly && !filters.dealerOnly &&  listing.dealer_id) return false;

  return true;
}

// Group a list of listings into a count Map keyed by `field` value.
// `keyFn` normalises the raw column value before it becomes a Map key —
// needed for engine_count (a Postgres INTEGER, returned as a JS number)
// so the tally's keys line up with the STRING '1'/'2'/'4' values every
// checkbox, URL param, and reducer field uses for it. Without this,
// decorateAndSortByCount's `counts.get(opt.value)` — a strict-equality
// Map lookup, opt.value being the string '1' — would never find the
// number-keyed entry and every Engine Count checkbox would permanently
// show (0), sinking the whole section behind "Show more" regardless of
// actual stock.
export function tallyBy(listings, field, keyFn = (v) => v) {
  const counts = new Map();
  for (const l of listings) {
    const raw = l[field];
    if (raw == null || raw === '') continue;
    const key = keyFn(raw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Returns a counts-Map for every multi-pick filter facet. All counts
 * are computed against the universe of active listings, with the
 * matching subset re-computed per-facet to exclude that facet's own
 * filter (proper faceted-search semantics).
 *
 * Loading state: while the universe is fetching, returns empty maps —
 * the UI shows option labels without counts, never blocks selection.
 */
export function useFacets(filterState) {
  // Universe: every active listing's facetable columns only. Switched
  // from useAircraft({}) to useFacetUniverse() — same row set, ~7x
  // smaller payload (12 indexed columns vs full row + dealer + seller
  // joins). Past 5,000 active listings, swap to a Postgres
  // aircraft_facet_counts(jsonb) RPC that returns aggregated counts
  // only and never sends row data over the wire.
  const { rows: universe = [], loading } = useFacetUniverse();

  // Stringified filter key keeps the memo dep shallow + stable across
  // renders (the filterState object identity churns every render).
  const filterKey = JSON.stringify(filterState);

  return useMemo(() => {
    if (loading || universe.length === 0) {
      return {
        loading,
        total: 0,
        makeCounts:        new Map(),
        modelCounts:       new Map(),
        categoryCounts:    new Map(),
        stateCounts:       new Map(),
        countryCounts:     new Map(),
        conditionCounts:   new Map(),
        engineCountCounts: new Map(),
        engineTypeCounts:  new Map(),
        engineMakeCounts:  new Map(),
        avSuiteCounts:     new Map(),
        autopilotCounts:   new Map(),
        damageCounts:      new Map(),
      };
    }

    // Per-facet matched set: drop the facet's own filter, apply the rest.
    const subsetExcluding = (field) =>
      universe.filter((l) => listingMatches(l, filterState, field));

    return {
      loading: false,
      total: universe.length,
      categoryCounts:    tallyBy(subsetExcluding('categories'),    'category'),
      makeCounts:        tallyBy(subsetExcluding('manufacturers'), 'manufacturer'),
      modelCounts:       tallyBy(subsetExcluding('models'),        'model'),
      stateCounts:       tallyBy(subsetExcluding('states'),        'state'),
      countryCounts:     tallyBy(subsetExcluding('countries'),     'country'),
      conditionCounts:   tallyBy(subsetExcluding('conditions'),    'condition'),
      engineCountCounts: tallyBy(subsetExcluding('engineCounts'),  'engine_count', String),
      engineTypeCounts:  tallyBy(subsetExcluding('engineTypes'),   'engine_type'),
      engineMakeCounts:  tallyBy(subsetExcluding('engineMakes'),   'engine_make'),
      avSuiteCounts:     tallyBy(subsetExcluding('avionicsSuites'),'avionics_suite'),
      autopilotCounts:   tallyBy(subsetExcluding('autopilots'),    'autopilot'),
      damageCounts:      tallyBy(subsetExcluding('damageHistory'), 'damage_history'),
    };
    // filterKey stands in for filterState (see above) — the raw object
    // is deliberately excluded so identity churn doesn't recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    universe,
    filterKey,
  ]);
}

/**
 * Decorate an option list with `count` from a facet map, then sort:
 *   1. Currently selected first   (so user can always uncheck them)
 *   2. Count descending           (popular options bubble to top)
 *   3. Existing seed order        (popularity tiebreaker preserved)
 *
 * Options without a count entry get count = 0 — they sink to the end
 * but stay in the list (collapsed behind "Show more" via CheckboxList).
 */
export function decorateAndSortByCount(options, counts, selectedValues = []) {
  const selectedSet = new Set(selectedValues);
  return options
    .map((opt, originalIndex) => ({
      ...opt,
      count: counts.get(opt.value) ?? 0,
      _originalIndex: originalIndex,
    }))
    .sort((a, b) => {
      // Selected always first
      const aSel = selectedSet.has(a.value);
      const bSel = selectedSet.has(b.value);
      if (aSel !== bSel) return aSel ? -1 : 1;
      // Then by count desc
      if (a.count !== b.count) return b.count - a.count;
      // Then preserve original popularity order
      return a._originalIndex - b._originalIndex;
    })
    .map(({ _originalIndex, ...rest }) => rest);
}
