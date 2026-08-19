// Pure-function tests for the /buy filter reducer and its URL <-> state
// serialization. Co-located under tests/e2e/ per the existing *.unit.spec.js
// convention (see parseAiQuery.unit.spec.js) — same Playwright runner, no
// browser fixture needed.

import { test, expect } from '@playwright/test';
import {
  initialFilters, filterReducer, countActiveInSection, countActiveTotal,
  toQueryFilters, filtersToSearchParams, searchParamsToFilters, hasFilterParams,
  SECTION_FIELDS,
} from '../../src/lib/filterReducer.js';

test.describe('filterReducer', () => {
  test('SET replaces a single field, leaves the rest untouched', () => {
    const next = filterReducer(initialFilters, { type: 'SET', field: 'search', value: 'Cirrus' });
    expect(next.search).toBe('Cirrus');
    expect(next.categories).toEqual([]);
    expect(next).not.toBe(initialFilters); // new object, no mutation
  });

  test('TOGGLE_IN_ARRAY adds then removes a value', () => {
    const withOne = filterReducer(initialFilters, { type: 'TOGGLE_IN_ARRAY', field: 'categories', value: 'Turboprop' });
    expect(withOne.categories).toEqual(['Turboprop']);
    const withTwo = filterReducer(withOne, { type: 'TOGGLE_IN_ARRAY', field: 'categories', value: 'Light Jet' });
    expect(withTwo.categories).toEqual(['Turboprop', 'Light Jet']);
    const backToOne = filterReducer(withTwo, { type: 'TOGGLE_IN_ARRAY', field: 'categories', value: 'Turboprop' });
    expect(backToOne.categories).toEqual(['Light Jet']);
  });

  test('TOGGLE_IN_ARRAY on a field with no prior array defaults to []', () => {
    const state = { ...initialFilters, engineCounts: undefined };
    const next = filterReducer(state, { type: 'TOGGLE_IN_ARRAY', field: 'engineCounts', value: '2' });
    expect(next.engineCounts).toEqual(['2']);
  });

  test('RESET wipes every field except sortBy', () => {
    const dirty = {
      ...initialFilters,
      search: 'Cessna', categories: ['Turboprop'], minPrice: '100000',
      ifrOnly: true, sortBy: 'price-asc',
    };
    const next = filterReducer(dirty, { type: 'RESET' });
    expect(next.search).toBe('');
    expect(next.categories).toEqual([]);
    expect(next.minPrice).toBe('');
    expect(next.ifrOnly).toBe(false);
    expect(next.sortBy).toBe('price-asc'); // sort preference survives a reset
  });

  test('RESET_SECTION only overwrites the given fields', () => {
    const dirty = { ...initialFilters, cruiseMin: '120', rangeMin: '500', search: 'Cessna' };
    const next = filterReducer(dirty, {
      type: 'RESET_SECTION',
      fields: { cruiseMin: '', rangeMin: '' },
    });
    expect(next.cruiseMin).toBe('');
    expect(next.rangeMin).toBe('');
    expect(next.search).toBe('Cessna'); // untouched
  });

  test('HYDRATE merges a partial payload over existing state', () => {
    const next = filterReducer(initialFilters, {
      type: 'HYDRATE',
      payload: { categories: ['Helicopter'], minPrice: '50000' },
    });
    expect(next.categories).toEqual(['Helicopter']);
    expect(next.minPrice).toBe('50000');
    expect(next.search).toBe(''); // untouched fields keep their default
  });

  test('unknown action type is a no-op', () => {
    const next = filterReducer(initialFilters, { type: 'NOT_REAL' });
    expect(next).toBe(initialFilters);
  });
});

test.describe('countActiveInSection / countActiveTotal', () => {
  test('a clean state has zero active filters everywhere', () => {
    expect(countActiveTotal(initialFilters)).toBe(0);
    for (const fields of Object.values(SECTION_FIELDS)) {
      expect(countActiveInSection(initialFilters, fields)).toBe(0);
    }
  });

  test('counts one per non-empty field regardless of type', () => {
    const state = {
      ...initialFilters,
      engineCounts: ['1', '2'], // array — counts as 1
      smohMax: '500',           // scalar string — counts as 1
      ifrOnly: true,            // boolean — counts as 1
    };
    expect(countActiveInSection(state, SECTION_FIELDS.engine)).toBe(2); // engineCounts + smohMax
    expect(countActiveInSection(state, SECTION_FIELDS.equipment)).toBe(1); // ifrOnly
  });

  test('countActiveTotal sums basic + every advanced section', () => {
    const state = {
      ...initialFilters,
      search: 'Cirrus',
      categories: ['Turboprop'],
      minPrice: '100000', // price range counts once even with only one side set
      dealerOnly: true,
      cruiseMin: '150',
      engineTypes: ['piston'],
      glassOnly: true,
      hangared: true,
    };
    // search(1) + categories(1) + price(1) + dealerOnly(1) + cruiseMin(1)
    // + engineTypes(1) + glassOnly(1) + hangared(1) = 8
    expect(countActiveTotal(state)).toBe(8);
  });
});

test.describe('toQueryFilters', () => {
  test('empty strings become undefined so the DB layer treats them as absent', () => {
    const q = toQueryFilters(initialFilters);
    expect(q.minPrice).toBeUndefined();
    expect(q.search).toBeUndefined();
    expect(q.dealerOnly).toBeUndefined();
  });

  test('array fields pass through even when empty (the query layer expects arrays)', () => {
    const q = toQueryFilters(initialFilters);
    expect(q.categories).toEqual([]);
    expect(q.manufacturers).toEqual([]);
  });

  test('sortBy always passes through, including the default', () => {
    expect(toQueryFilters(initialFilters).sortBy).toBe('newest');
  });
});

test.describe('URL <-> filter-state round trip', () => {
  test('a clean state serializes to an empty query string', () => {
    const params = filtersToSearchParams(initialFilters);
    expect(params.toString()).toBe('');
    expect(hasFilterParams(params)).toBe(false);
  });

  test('every field family round-trips: array, bool, scalar, range, search, sort', () => {
    const state = {
      ...initialFilters,
      search: 'low hours Cirrus',
      categories: ['Turboprop', 'Light Jet'],
      manufacturers: ['Cessna'],
      countries: ['AU'],
      states: ['NSW', 'VIC'],
      minPrice: '250000',
      maxPrice: '900000',
      yearFrom: '2010',
      dealerOnly: true,
      cruiseMin: '160',
      engineCounts: ['1'],
      ifrOnly: true,
      sortBy: 'price-asc',
    };
    const params = filtersToSearchParams(state);
    expect(hasFilterParams(params)).toBe(true);

    const roundTripped = searchParamsToFilters(params);
    // Compare the fields we actually set — everything else should still
    // equal initialFilters.
    expect(roundTripped.search).toBe(state.search);
    expect(roundTripped.categories).toEqual(state.categories);
    expect(roundTripped.manufacturers).toEqual(state.manufacturers);
    expect(roundTripped.countries).toEqual(state.countries);
    expect(roundTripped.states).toEqual(state.states);
    expect(roundTripped.minPrice).toBe(state.minPrice);
    expect(roundTripped.maxPrice).toBe(state.maxPrice);
    expect(roundTripped.yearFrom).toBe(state.yearFrom);
    expect(roundTripped.yearTo).toBe(''); // never set — stays default
    expect(roundTripped.dealerOnly).toBe(true);
    expect(roundTripped.privateOnly).toBe(false); // untouched bool stays default
    expect(roundTripped.cruiseMin).toBe(state.cruiseMin);
    expect(roundTripped.engineCounts).toEqual(state.engineCounts);
    expect(roundTripped.ifrOnly).toBe(true);
    expect(roundTripped.sortBy).toBe('price-asc');
  });

  test('range param with only the lower bound set', () => {
    const state = { ...initialFilters, minPrice: '500000' };
    const params = filtersToSearchParams(state);
    expect(params.get('price')).toBe('500000-');
    const back = searchParamsToFilters(params);
    expect(back.minPrice).toBe('500000');
    expect(back.maxPrice).toBe('');
  });

  test('range param with only the upper bound set', () => {
    const state = { ...initialFilters, maxPrice: '500000' };
    const params = filtersToSearchParams(state);
    expect(params.get('price')).toBe('-500000');
    const back = searchParamsToFilters(params);
    expect(back.minPrice).toBe('');
    expect(back.maxPrice).toBe('500000');
  });

  test('range param with both bounds set', () => {
    const state = { ...initialFilters, minPrice: '100000', maxPrice: '500000' };
    const params = filtersToSearchParams(state);
    expect(params.get('price')).toBe('100000-500000');
    const back = searchParamsToFilters(params);
    expect(back.minPrice).toBe('100000');
    expect(back.maxPrice).toBe('500000');
  });

  test('sortBy is omitted from the URL when it is the default', () => {
    const params = filtersToSearchParams({ ...initialFilters, sortBy: 'newest' });
    expect(params.has('sort')).toBe(false);
  });

  test('a manufacturer/model name containing a literal comma survives the round trip', () => {
    // Manufacturers/models are augmented from live DB rows (admin/dealer
    // imports), so they're not guaranteed comma-free like the curated
    // category/condition lists. A naive comma-join would silently split
    // "Smith, Jones Aviation" into two bogus filter values.
    const state = {
      ...initialFilters,
      manufacturers: ['Smith, Jones Aviation', 'Cessna'],
      models: ['Model A, Special Edition'],
    };
    const params = filtersToSearchParams(state);
    const back = searchParamsToFilters(params);
    expect(back.manufacturers).toEqual(['Smith, Jones Aviation', 'Cessna']);
    expect(back.models).toEqual(['Model A, Special Edition']);
  });

  test('an array value containing a literal backslash survives the round trip', () => {
    const state = { ...initialFilters, manufacturers: ['Back\\slash Air'] };
    const params = filtersToSearchParams(state);
    const back = searchParamsToFilters(params);
    expect(back.manufacturers).toEqual(['Back\\slash Air']);
  });

  test('a real-world query string parses without a live URLSearchParams object', () => {
    // Simulates hydrating from window.location.search on page load.
    const params = new URLSearchParams('cat=Turboprop,Light+Jet&price=250000-900000&dealer=1&sort=price-desc');
    const state = searchParamsToFilters(params);
    expect(state.categories).toEqual(['Turboprop', 'Light Jet']);
    expect(state.minPrice).toBe('250000');
    expect(state.maxPrice).toBe('900000');
    expect(state.dealerOnly).toBe(true);
    expect(state.sortBy).toBe('price-desc');
  });

  test('unrecognised params are ignored, not thrown on', () => {
    const params = new URLSearchParams('utm_source=newsletter&ref=abc123');
    expect(() => searchParamsToFilters(params)).not.toThrow();
    expect(hasFilterParams(params)).toBe(false);
  });

  test('searchParamsToFilters defaults to initialFilters as base', () => {
    const params = new URLSearchParams('cat=Turboprop');
    const state = searchParamsToFilters(params);
    expect(state.search).toBe(initialFilters.search);
    expect(state.sortBy).toBe(initialFilters.sortBy);
  });

  test('an empty-string q param still overrides search (explicit clear)', () => {
    const params = new URLSearchParams('q=');
    const state = searchParamsToFilters(params, { ...initialFilters, search: 'stale' });
    expect(state.search).toBe('');
  });

  test('every filter field (all types) changes the serialized signature when toggled', () => {
    // Regression guard: BuyPage derives its "reset to page 1" trigger from
    // filtersToSearchParams(state).toString() specifically so that trigger
    // can never silently miss a field the way the old hand-maintained
    // dependency array did (it was missing 21 fields — the entire Engine
    // and Avionics & Equipment sections, MTOW, ceiling, countries, models,
    // damage history...). This test proves the serializer itself covers
    // every field in initialFilters except sortBy (checked separately
    // above) — so if a future field is added to initialFilters without a
    // matching entry in one of the *_PARAMS maps, this fails immediately
    // instead of silently reintroducing the stuck-pagination bug.
    const baseline = filtersToSearchParams(initialFilters).toString();
    for (const field of Object.keys(initialFilters)) {
      if (field === 'sortBy') continue; // covered by its own dedicated test
      const value = initialFilters[field];
      let changed;
      if (Array.isArray(value)) changed = { ...initialFilters, [field]: ['probe-value'] };
      else if (typeof value === 'boolean') changed = { ...initialFilters, [field]: true };
      else changed = { ...initialFilters, [field]: 'probe-value' };

      const signature = filtersToSearchParams(changed).toString();
      expect(signature, `toggling "${field}" did not change the URL signature`).not.toBe(baseline);
    }
  });
});
