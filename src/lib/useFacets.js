'use client';
import { useMemo } from 'react';
import { useAircraft } from './hooks';

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

// Returns true iff `listing` matches every filter constraint in `filters`,
// IGNORING the field named in `excludeField`. Used so makeCounts excludes
// the manufacturers facet when computing per-make counts.
function listingMatches(listing, filters, excludeField) {
  const cats        = excludeField === 'categories'    ? [] : (filters.categories    ?? []);
  const makes       = excludeField === 'manufacturers' ? [] : (filters.manufacturers ?? []);
  const models      = excludeField === 'models'        ? [] : (filters.models        ?? []);
  const states      = excludeField === 'states'        ? [] : (filters.states        ?? []);
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
  if (conditions.length  && !conditions.includes(listing.condition)) return false;
  if (engineCounts.length && !engineCounts.includes(listing.engine_count)) return false;
  if (engineTypes.length  && !engineTypes.includes(listing.engine_type_category)) return false;
  if (engineMakes.length  && !engineMakes.includes(listing.engine_make)) return false;
  if (avSuites.length    && !avSuites.includes(listing.avionics_suite)) return false;
  if (aps.length         && !aps.includes(listing.autopilot)) return false;
  if (damage.length      && !damage.includes(listing.damage_history)) return false;

  // Numeric ranges (always applied — these aren't faceted)
  if (filters.minPrice && Number(listing.price) < Number(filters.minPrice)) return false;
  if (filters.maxPrice && Number(listing.price) > Number(filters.maxPrice)) return false;
  if (filters.yearFrom && Number(listing.year)  < Number(filters.yearFrom)) return false;
  if (filters.yearTo   && Number(listing.year)  > Number(filters.yearTo))   return false;

  // Booleans (only enforce when truthy)
  if (filters.ifrOnly       && !listing.ifr) return false;
  if (filters.glassOnly     && !listing.glass_cockpit) return false;
  if (filters.adsbIn        && !listing.adsb_in) return false;
  if (filters.adsbOut       && !listing.adsb_out) return false;
  if (filters.synVis        && !listing.synthetic_vision) return false;
  if (filters.deIce         && !listing.de_ice) return false;
  if (filters.airCon        && !listing.air_con) return false;
  if (filters.pressurised   && !listing.pressurised) return false;
  if (filters.retractable   && !listing.retractable) return false;
  if (filters.cargoDoor     && !listing.cargo_door) return false;
  if (filters.parachute     && !listing.parachute) return false;
  if (filters.dealerOnly    && !listing.dealer_id) return false;
  if (filters.privateOnly   &&  listing.dealer_id) return false;
  if (filters.featuredOnly  && !listing.featured) return false;

  return true;
}

// Group a list of listings into a count Map keyed by `field` value.
function tallyBy(listings, field) {
  const counts = new Map();
  for (const l of listings) {
    const key = l[field];
    if (key == null || key === '') continue;
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
  // Universe: every listing the user could possibly see, ignoring all
  // their current filters. Cached at the page level, free re-render.
  const { aircraft: universe = [], loading } = useAircraft({});

  return useMemo(() => {
    if (loading || universe.length === 0) {
      return {
        loading,
        total: 0,
        makeCounts:        new Map(),
        modelCounts:       new Map(),
        categoryCounts:    new Map(),
        stateCounts:       new Map(),
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
      conditionCounts:   tallyBy(subsetExcluding('conditions'),    'condition'),
      engineCountCounts: tallyBy(subsetExcluding('engineCounts'),  'engine_count'),
      engineTypeCounts:  tallyBy(subsetExcluding('engineTypes'),   'engine_type_category'),
      engineMakeCounts:  tallyBy(subsetExcluding('engineMakes'),   'engine_make'),
      avSuiteCounts:     tallyBy(subsetExcluding('avionicsSuites'),'avionics_suite'),
      autopilotCounts:   tallyBy(subsetExcluding('autopilots'),    'autopilot'),
      damageCounts:      tallyBy(subsetExcluding('damageHistory'), 'damage_history'),
    };
    // Stringified state key keeps deps shallow + stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    universe,
    JSON.stringify(filterState),
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
