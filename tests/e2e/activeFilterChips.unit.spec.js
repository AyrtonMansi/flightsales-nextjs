// Pure-function tests for the /buy active-filter-chips derivation. Same
// convention as parseAiQuery.unit.spec.js / filterReducer.unit.spec.js —
// no browser fixture needed.

import { test, expect } from '@playwright/test';
import { getActiveFilterChips } from '../../src/lib/activeFilterChips.js';
import { initialFilters, filterReducer } from '../../src/lib/filterReducer.js';

test.describe('getActiveFilterChips', () => {
  test('a clean state produces no chips', () => {
    expect(getActiveFilterChips(initialFilters)).toEqual([]);
  });

  test('search produces a quoted chip that clears back to empty', () => {
    const state = { ...initialFilters, search: 'Cirrus SR22' };
    const chips = getActiveFilterChips(state);
    expect(chips).toHaveLength(1);
    expect(chips[0].label).toBe('"Cirrus SR22"');
    expect(filterReducer(state, chips[0].action).search).toBe('');
  });

  test('one array value produces one chip; removing it empties the array', () => {
    const state = { ...initialFilters, categories: ['Turboprop', 'Light Jet'] };
    const chips = getActiveFilterChips(state);
    expect(chips).toHaveLength(2);
    const afterFirst = filterReducer(state, chips[0].action);
    expect(afterFirst.categories).toEqual(['Light Jet']);
  });

  test('coded array values (countries/states/engineCounts/damageHistory) get human labels', () => {
    const state = {
      ...initialFilters,
      countries: ['AU'],
      states: ['NSW'],
      engineCounts: ['2'],
      damageHistory: ['minor'],
    };
    const chips = getActiveFilterChips(state);
    const labels = chips.map((c) => c.label);
    expect(labels).toContain('Australia');
    expect(labels).toContain('New South Wales');
    expect(labels).toContain('Twin engine');
    expect(labels).toContain('Minor damage disclosed');
  });

  test('an unrecognised code falls back to the raw value rather than throwing', () => {
    const state = { ...initialFilters, countries: ['ZZ'] };
    const chips = getActiveFilterChips(state);
    expect(chips[0].label).toBe('ZZ');
  });

  test('a price range with only a floor renders as "X+"', () => {
    const state = { ...initialFilters, minPrice: '500000' };
    const chips = getActiveFilterChips(state);
    expect(chips[0].label).toBe('Price: $500k+');
  });

  test('a price range with only a ceiling renders as "up to X"', () => {
    const state = { ...initialFilters, maxPrice: '2000000' };
    const chips = getActiveFilterChips(state);
    expect(chips[0].label).toBe('Price: up to $2.0M');
  });

  test('a full price range renders as "X – Y" and clears both bounds at once', () => {
    const state = { ...initialFilters, minPrice: '500000', maxPrice: '2000000' };
    const chips = getActiveFilterChips(state);
    expect(chips).toHaveLength(1);
    expect(chips[0].label).toBe('Price: $500k – $2.0M');
    const cleared = filterReducer(state, chips[0].action);
    expect(cleared.minPrice).toBe('');
    expect(cleared.maxPrice).toBe('');
  });

  // Regression guard, same pattern as filterReducer's URL-signature test:
  // this is the second place (after BuyPage's page-reset effect) that used
  // to hand-enumerate filter fields and silently drift out of sync with
  // initialFilters. Iterating initialFilters itself instead of a curated
  // list means a future field added there without a matching entry in one
  // of the *_FIELDS arrays fails this test immediately, rather than
  // shipping a filter that's active but invisible in the chip row.
  test('every filter field (except sortBy) produces a chip when active, and dispatching it fully clears that field', () => {
    for (const field of Object.keys(initialFilters)) {
      if (field === 'sortBy') continue;
      const defaultValue = initialFilters[field];
      let activeState;
      if (Array.isArray(defaultValue)) activeState = { ...initialFilters, [field]: ['probe-value'] };
      else if (typeof defaultValue === 'boolean') activeState = { ...initialFilters, [field]: true };
      else activeState = { ...initialFilters, [field]: '42' };

      const chips = getActiveFilterChips(activeState);
      expect(chips.length, `field "${field}" is active but produced no chip`).toBeGreaterThan(0);

      const cleared = chips.reduce((s, chip) => filterReducer(s, chip.action), activeState);
      expect(cleared[field], `field "${field}" was not cleared by its own chip action`).toEqual(defaultValue);
    }
  });
});
