// Pure-function tests for the /buy sidebar's faceted-count matching logic
// (listingMatches, tallyBy). Same convention as the other *.unit.spec.js
// files — no browser fixture needed.
//
// This module is the client-side mirror of the real Supabase query in
// hooks/aircraft.js — every constraint applied there needs an equivalent
// check here, or the sidebar's live counts silently diverge from what the
// result grid actually shows. A review pass found FOUR real bugs of
// exactly that shape (see the regression tests below), so this suite
// leans heavily on exact-value assertions against a single realistic
// listing fixture rather than abstract shape checks.

import { test, expect } from '@playwright/test';
import { listingMatches, tallyBy } from '../../src/lib/useFacets.js';

// One realistic active listing exercising every column listingMatches
// reads. engine_count is deliberately a NUMBER (matches the real
// Postgres INTEGER column / what Supabase actually returns) while every
// filter-side value in these tests is the STRING the UI actually
// produces — the mismatch between those two is bug #3 below.
const BASE_LISTING = {
  id: '1',
  title: 'Cessna 172 Skyhawk',
  category: 'Single Engine Piston',
  manufacturer: 'Cessna',
  model: '172',
  state: 'NSW',
  country: 'AU',
  condition: 'Pre-Owned',
  engine_count: 1,
  engine_type: 'piston',
  engine_make: 'Lycoming',
  avionics_suite: 'Garmin G1000/NXi',
  autopilot: 'GFC700',
  damage_history: 'none',
  ifr: true,
  glass_cockpit: true,
  adsb_in: true,
  adsb_out: true,
  syn_vis: true,
  de_ice: false,
  air_con: false,
  pressurised: false,
  retractable: false,
  cargo_door: false,
  parachute: false,
  logbooks_complete: true,
  hangared: true,
  dealer_id: 'dealer-1',
  featured: true,
  price: 250000,
  year: 2015,
  cruise_kts: 122,
  range_nm: 640,
  useful_load: 900,
  fuel_burn: 40,
  mtow: 1111,
  service_ceiling: 14000,
  eng_hours: 500,
  eng_tbo: 2000,
  owner_count: 2,
};

test.describe('listingMatches — array (multi-select) fields', () => {
  const cases = [
    ['categories', 'Single Engine Piston', 'Turboprop'],
    ['manufacturers', 'Cessna', 'Piper'],
    ['models', '172', 'SR22'],
    ['countries', 'AU', 'US'],
    ['states', 'NSW', 'VIC'],
    ['conditions', 'Pre-Owned', 'New'],
    ['engineTypes', 'piston', 'turboprop'],
    ['engineMakes', 'Lycoming', 'Continental'],
    ['avionicsSuites', 'Garmin G1000/NXi', 'Avidyne'],
    ['autopilots', 'GFC700', 'KAP140'],
    ['damageHistory', 'none', 'minor'],
  ];
  for (const [field, matchingValue, otherValue] of cases) {
    test(`${field}: includes the matching value, excludes a different one`, () => {
      expect(listingMatches(BASE_LISTING, { [field]: [matchingValue] })).toBe(true);
      expect(listingMatches(BASE_LISTING, { [field]: [otherValue] })).toBe(false);
    });
  }

  // Regression — engineTypes previously read listing.engine_type_category,
  // a property FACET_COLUMNS never selected (always undefined), so this
  // returned false for every listing the instant any Engine Type option
  // was active — zeroing out every OTHER facet's count too.
  test('engineTypes reads listing.engine_type (regression)', () => {
    expect(listingMatches(BASE_LISTING, { engineTypes: ['piston'] })).toBe(true);
    expect(listingMatches(BASE_LISTING, { engineTypes: ['turboprop'] })).toBe(false);
  });

  // Regression — engine_count is a Postgres INTEGER (JS number via
  // Supabase); engineCounts holds the checkbox '1'/'2'/'4' STRING values.
  // A naive .includes() strict-equality check never matched.
  test('engineCounts (string filter values) matches the numeric engine_count column (regression)', () => {
    expect(listingMatches(BASE_LISTING, { engineCounts: ['1'] })).toBe(true);
    expect(listingMatches(BASE_LISTING, { engineCounts: ['2'] })).toBe(false);
  });
});

test.describe('listingMatches — numeric ranges', () => {
  test('price range (min and max independently)', () => {
    expect(listingMatches(BASE_LISTING, { minPrice: '200000' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { minPrice: '300000' })).toBe(false);
    expect(listingMatches(BASE_LISTING, { maxPrice: '300000' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { maxPrice: '200000' })).toBe(false);
  });

  test('year range', () => {
    expect(listingMatches(BASE_LISTING, { yearFrom: '2010' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { yearFrom: '2020' })).toBe(false);
    expect(listingMatches(BASE_LISTING, { yearTo: '2020' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { yearTo: '2010' })).toBe(false);
  });

  // Regression — these seven fields (the entire Performance section plus
  // smohMax/ownerMaxCount) were entirely absent from listingMatches
  // before this pass: setting e.g. "Cruise >= 200kts" correctly narrowed
  // the result grid via the real query, but every sidebar count still
  // reflected the un-narrowed universe.
  test('cruiseMin (>=)', () => {
    expect(listingMatches(BASE_LISTING, { cruiseMin: '100' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { cruiseMin: '150' })).toBe(false);
  });
  test('rangeMin (>=)', () => {
    expect(listingMatches(BASE_LISTING, { rangeMin: '500' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { rangeMin: '700' })).toBe(false);
  });
  test('usefulLoadMin (>=)', () => {
    expect(listingMatches(BASE_LISTING, { usefulLoadMin: '800' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { usefulLoadMin: '1000' })).toBe(false);
  });
  test('fuelBurnMax (<=)', () => {
    expect(listingMatches(BASE_LISTING, { fuelBurnMax: '50' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { fuelBurnMax: '30' })).toBe(false);
  });
  test('mtowMin / mtowMax', () => {
    expect(listingMatches(BASE_LISTING, { mtowMin: '1000' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { mtowMin: '1200' })).toBe(false);
    expect(listingMatches(BASE_LISTING, { mtowMax: '1200' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { mtowMax: '1000' })).toBe(false);
  });
  test('ceilingMin (>=)', () => {
    expect(listingMatches(BASE_LISTING, { ceilingMin: '10000' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { ceilingMin: '15000' })).toBe(false);
  });
  test('smohMax (<=)', () => {
    expect(listingMatches(BASE_LISTING, { smohMax: '600' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { smohMax: '400' })).toBe(false);
  });
  test('ownerMaxCount (<=)', () => {
    expect(listingMatches(BASE_LISTING, { ownerMaxCount: '3' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { ownerMaxCount: '1' })).toBe(false);
  });

  test('tboPctMin — derived (eng_tbo - eng_hours) / eng_tbo * 100, matches hooks/aircraft.js exactly', () => {
    // eng_tbo=2000, eng_hours=500 -> remaining = 75%
    expect(listingMatches(BASE_LISTING, { tboPctMin: '70' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { tboPctMin: '80' })).toBe(false);
  });
  test('tboPctMin excludes listings missing eng_tbo or eng_hours', () => {
    expect(listingMatches({ ...BASE_LISTING, eng_tbo: null }, { tboPctMin: '10' })).toBe(false);
    expect(listingMatches({ ...BASE_LISTING, eng_hours: null }, { tboPctMin: '10' })).toBe(false);
  });
});

test.describe('listingMatches — booleans', () => {
  const cases = [
    ['ifrOnly', 'ifr'], ['glassOnly', 'glass_cockpit'], ['adsbIn', 'adsb_in'], ['adsbOut', 'adsb_out'],
    ['synVis', 'syn_vis'],
    ['logbooksComplete', 'logbooks_complete'], ['hangared', 'hangared'], ['featuredOnly', 'featured'],
  ];
  for (const [filterField, column] of cases) {
    test(`${filterField} requires listing.${column} to be true`, () => {
      expect(listingMatches(BASE_LISTING, { [filterField]: true })).toBe(true);
      expect(listingMatches({ ...BASE_LISTING, [column]: false }, { [filterField]: true })).toBe(false);
    });
  }

  // BASE_LISTING has these false by default (a Cessna 172 realistically
  // has none of them) — check the reverse direction for the remaining
  // boolean columns.
  const offByDefault = [
    ['deIce', 'de_ice'], ['airCon', 'air_con'], ['cargoDoor', 'cargo_door'], ['parachute', 'parachute'],
    ['pressurised', 'pressurised'], ['retractable', 'retractable'],
  ];
  for (const [filterField, column] of offByDefault) {
    test(`${filterField} excludes a listing where ${column} is false`, () => {
      expect(listingMatches(BASE_LISTING, { [filterField]: true })).toBe(false);
      expect(listingMatches({ ...BASE_LISTING, [column]: true }, { [filterField]: true })).toBe(true);
    });
  }

  // Regression — was listing.synthetic_vision (never selected by
  // FACET_COLUMNS, so always undefined); should read listing.syn_vis.
  test('synVis reads listing.syn_vis (regression)', () => {
    expect(listingMatches(BASE_LISTING, { synVis: true })).toBe(true);
    expect(listingMatches({ ...BASE_LISTING, syn_vis: false }, { synVis: true })).toBe(false);
  });
});

test.describe('listingMatches — seller (dealerOnly / privateOnly)', () => {
  const dealerListing = BASE_LISTING;
  const privateListing = { ...BASE_LISTING, dealer_id: null };

  test('dealerOnly alone requires a dealer_id', () => {
    expect(listingMatches(dealerListing, { dealerOnly: true })).toBe(true);
    expect(listingMatches(privateListing, { dealerOnly: true })).toBe(false);
  });

  test('privateOnly alone requires no dealer_id', () => {
    expect(listingMatches(privateListing, { privateOnly: true })).toBe(true);
    expect(listingMatches(dealerListing, { privateOnly: true })).toBe(false);
  });

  // Regression — hooks/aircraft.js applies .not()/.is() only when exactly
  // one of the two is on; with both on, neither clause fires and every
  // listing passes. The old listingMatches AND-ed both constraints
  // unconditionally, which excluded EVERY listing (a dealer listing fails
  // the privateOnly check; a private listing fails the dealerOnly check)
  // — every sidebar count went to 0 while the result grid stayed full.
  test('both dealerOnly and privateOnly on cancels out to no seller constraint', () => {
    const both = { dealerOnly: true, privateOnly: true };
    expect(listingMatches(dealerListing, both)).toBe(true);
    expect(listingMatches(privateListing, both)).toBe(true);
  });
});

test.describe('listingMatches — free-text search', () => {
  test('matches title, manufacturer, or model, case-insensitively', () => {
    expect(listingMatches(BASE_LISTING, { search: 'cessna' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { search: 'CESSNA' })).toBe(true);
    expect(listingMatches(BASE_LISTING, { search: 'Skyhawk' })).toBe(true); // title only
    expect(listingMatches(BASE_LISTING, { search: 'Piper' })).toBe(false);
  });

  test('a search term that sanitises to empty applies no constraint', () => {
    // Mirrors hooks/aircraft.js: after stripping to [A-Za-z0-9 .-], an
    // all-symbol term becomes empty and the real query's `if (safe)`
    // guard skips the .or() filter entirely.
    expect(listingMatches(BASE_LISTING, { search: '###' })).toBe(true);
  });
});

test.describe('listingMatches — excludeField (the core faceted-search semantic)', () => {
  test('excluding a field drops only that field\'s own constraint', () => {
    const filters = { categories: ['Turboprop'], manufacturers: ['Cessna'] };
    // Neither excluded: category mismatch (BASE_LISTING is Single Engine
    // Piston) fails it regardless of the manufacturer match.
    expect(listingMatches(BASE_LISTING, filters)).toBe(false);
    // Exclude categories: that constraint drops; manufacturers (Cessna)
    // still applies and matches.
    expect(listingMatches(BASE_LISTING, filters, 'categories')).toBe(true);
    // Exclude manufacturers instead: categories (Turboprop) still
    // applies and BASE_LISTING doesn't match it.
    expect(listingMatches(BASE_LISTING, filters, 'manufacturers')).toBe(false);
  });
});

test.describe('tallyBy', () => {
  test('groups and counts by field value, skipping null/empty', () => {
    const rows = [{ category: 'A' }, { category: 'A' }, { category: 'B' }, { category: null }, { category: '' }];
    const counts = tallyBy(rows, 'category');
    expect(counts.get('A')).toBe(2);
    expect(counts.get('B')).toBe(1);
    expect(counts.size).toBe(2);
  });

  // Regression — engine_count is stored as a JS number; without
  // normalising the tally key to match the string values every checkbox/
  // URL param/reducer field uses, decorateAndSortByCount's
  // counts.get('1') (a strict Map lookup) never found the number-keyed
  // entry, so every Engine Count checkbox permanently showed (0).
  test('keyFn normalises the tally key (engine_count regression)', () => {
    const rows = [{ engine_count: 1 }, { engine_count: 1 }, { engine_count: 2 }];
    const counts = tallyBy(rows, 'engine_count', String);
    expect(counts.get('1')).toBe(2);
    expect(counts.get('2')).toBe(1);
    expect(counts.has(1)).toBe(false); // proves the key really was normalised, not left numeric
  });
});
