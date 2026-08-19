// Central filter state for the buy page. One reducer replaces the 30+
// useState calls that BuyPage was carrying. Single source of truth for
// what's in the URL, what gets sent to the DB query, and what the active-
// filter strip displays.
//
// Multi-select fields (categories, manufacturers, states, conditions, the
// new advanced multi-pick fields) are arrays. Single-pick / numeric /
// boolean fields stay scalar.

export const initialFilters = {
  // basic
  search: '',
  categories: [],
  manufacturers: [],
  models: [],          // free-text model strings (matches aircraft.model column)
  countries: [],       // ISO 3166-1 alpha-2 codes (matches aircraft.country)
  states: [],          // sub-division codes (matches aircraft.state)
  conditions: [],
  minPrice: '',
  maxPrice: '',
  yearFrom: '',
  yearTo: '',
  // seller (basic)
  dealerOnly: false,
  privateOnly: false,
  featuredOnly: false,
  // performance (advanced)
  cruiseMin: '',
  rangeMin: '',
  usefulLoadMin: '',
  fuelBurnMax: '',
  mtowMin: '',
  mtowMax: '',
  ceilingMin: '',
  // engine (advanced)
  engineCounts: [],   // [1, 2, 4]
  engineTypes: [],    // ['piston', 'turboprop', 'turbofan', 'electric']
  engineMakes: [],    // ['Continental', 'Lycoming', ...]
  smohMax: '',
  tboPctMin: '',
  // avionics & equipment (advanced)
  avionicsSuites: [], // ['Garmin G1000/NXi', 'Garmin G3X', ...]
  autopilots: [],     // ['GFC700', 'KAP140', 'S-TEC', 'None']
  ifrOnly: false,
  glassOnly: false,
  adsbIn: false,
  adsbOut: false,
  synVis: false,
  deIce: false,
  airCon: false,
  pressurised: false,
  retractable: false,
  cargoDoor: false,
  parachute: false,
  // history & condition (advanced)
  damageHistory: [],     // ['none', 'minor', 'major']
  logbooksComplete: false,
  hangared: false,
  ownerMaxCount: '',
  // ui-only
  sortBy: 'newest',
};

export function filterReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_IN_ARRAY': {
      const arr = state[action.field] || [];
      const next = arr.includes(action.value)
        ? arr.filter(v => v !== action.value)
        : [...arr, action.value];
      return { ...state, [action.field]: next };
    }
    case 'RESET':
      return { ...initialFilters, sortBy: state.sortBy };
    case 'RESET_SECTION':
      return { ...state, ...action.fields };
    case 'HYDRATE':
      // Used to seed from initialFilters prop on mount (AI-search results).
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Section group definitions — used to decide what "Reset section" wipes
// and what counts as an active filter in that section's header dot.
export const SECTION_FIELDS = {
  performance: ['cruiseMin', 'rangeMin', 'usefulLoadMin', 'fuelBurnMax', 'mtowMin', 'mtowMax', 'ceilingMin'],
  engine: ['engineCounts', 'engineTypes', 'engineMakes', 'smohMax', 'tboPctMin'],
  equipment: [
    'avionicsSuites', 'autopilots',
    'ifrOnly', 'glassOnly', 'adsbIn', 'adsbOut', 'synVis',
    'deIce', 'airCon', 'pressurised', 'retractable', 'cargoDoor', 'parachute',
  ],
  history: ['damageHistory', 'logbooksComplete', 'hangared', 'ownerMaxCount'],
};

// Count active filters in a section. Strings are "active" iff non-empty;
// booleans iff true; arrays iff non-empty. Numeric values follow string rule
// since the inputs store them as strings.
export function countActiveInSection(state, fields) {
  return fields.reduce((acc, f) => {
    const v = state[f];
    if (Array.isArray(v)) return acc + (v.length > 0 ? 1 : 0);
    if (typeof v === 'boolean') return acc + (v ? 1 : 0);
    return acc + (v ? 1 : 0);
  }, 0);
}

// Total active filters across the whole state — for the "Reset all" badge.
export function countActiveTotal(state) {
  let n = 0;
  if (state.search) n++;
  n += state.categories.length > 0 ? 1 : 0;
  n += state.manufacturers.length > 0 ? 1 : 0;
  n += state.models.length > 0 ? 1 : 0;
  n += state.states.length > 0 ? 1 : 0;
  n += state.conditions.length > 0 ? 1 : 0;
  if (state.minPrice || state.maxPrice) n++;
  if (state.yearFrom || state.yearTo) n++;
  if (state.dealerOnly) n++;
  if (state.privateOnly) n++;
  if (state.featuredOnly) n++;
  n += countActiveInSection(state, SECTION_FIELDS.performance);
  n += countActiveInSection(state, SECTION_FIELDS.engine);
  n += countActiveInSection(state, SECTION_FIELDS.equipment);
  n += countActiveInSection(state, SECTION_FIELDS.history);
  return n;
}

// Map the filter state to the shape useAircraft expects. Centralised so the
// query language and the UI shape stay aligned in one place.
export function toQueryFilters(state) {
  return {
    // basic
    categories: state.categories,
    manufacturers: state.manufacturers,
    models: state.models,
    countries: state.countries,
    states: state.states,
    conditions: state.conditions,
    minPrice: state.minPrice || undefined,
    maxPrice: state.maxPrice || undefined,
    yearFrom: state.yearFrom || undefined,
    yearTo: state.yearTo || undefined,
    // performance
    cruiseMin: state.cruiseMin || undefined,
    rangeMin: state.rangeMin || undefined,
    usefulLoadMin: state.usefulLoadMin || undefined,
    fuelBurnMax: state.fuelBurnMax || undefined,
    mtowMin: state.mtowMin || undefined,
    mtowMax: state.mtowMax || undefined,
    ceilingMin: state.ceilingMin || undefined,
    // engine
    engineCounts: state.engineCounts,
    engineTypes: state.engineTypes,
    engineMakes: state.engineMakes,
    smohMax: state.smohMax || undefined,
    tboPctMin: state.tboPctMin || undefined,
    // avionics & equipment
    avionicsSuites: state.avionicsSuites,
    autopilots: state.autopilots,
    ifrOnly: state.ifrOnly || undefined,
    glassOnly: state.glassOnly || undefined,
    adsbIn: state.adsbIn || undefined,
    adsbOut: state.adsbOut || undefined,
    synVis: state.synVis || undefined,
    deIce: state.deIce || undefined,
    airCon: state.airCon || undefined,
    pressurised: state.pressurised || undefined,
    retractable: state.retractable || undefined,
    cargoDoor: state.cargoDoor || undefined,
    parachute: state.parachute || undefined,
    // history & condition
    damageHistory: state.damageHistory,
    logbooksComplete: state.logbooksComplete || undefined,
    hangared: state.hangared || undefined,
    ownerMaxCount: state.ownerMaxCount || undefined,
    // seller
    dealerOnly: state.dealerOnly || undefined,
    privateOnly: state.privateOnly || undefined,
    featuredOnly: state.featuredOnly || undefined,
    // search/sort
    search: state.search || undefined,
    sortBy: state.sortBy,
  };
}

// ── URL <-> filter-state serialization ──────────────────────────────
// Compact, human-readable query params so /buy views are shareable,
// deep-linkable, and survive refresh. Only non-default values are
// written, so a clean search stays at a bare /buy. Pure functions —
// unit-testable, no window access.
//
// Array values are comma-joined into one param. Category/condition/
// engine-type values come from fixed constant lists with no commas,
// but manufacturers/models/engineMakes are augmented from live DB rows
// (admin/dealer imports — see aircraftCatalogue.js) and are therefore
// unconstrained free text. A literal comma in one of those (e.g. a
// manufacturer name with a comma) would otherwise silently split into
// two filter values on decode. escapeItem/splitEscaped below backslash-
// escape ',' and '\' within each item before joining, so the join is
// unambiguous regardless of content — this runs on the raw string
// BEFORE handing it to URLSearchParams.set, which does its own percent-
// encoding of the whole value on serialization (pre-encoding here too,
// e.g. via encodeURIComponent, would double-encode).
function escapeItem(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/,/g, '\\,');
}
function splitEscaped(s) {
  const out = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length) { cur += s[i + 1]; i++; }
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const ARRAY_PARAMS = {
  categories: 'cat', manufacturers: 'make', models: 'model',
  countries: 'country', states: 'state', conditions: 'cond',
  engineCounts: 'engc', engineTypes: 'engt', engineMakes: 'engm',
  avionicsSuites: 'av', autopilots: 'ap', damageHistory: 'damage',
};
const BOOL_PARAMS = {
  dealerOnly: 'dealer', privateOnly: 'private', featuredOnly: 'featured',
  ifrOnly: 'ifr', glassOnly: 'glass', adsbIn: 'adsbin', adsbOut: 'adsbout',
  synVis: 'synvis', deIce: 'deice', airCon: 'aircon', pressurised: 'press',
  retractable: 'retract', cargoDoor: 'cargo', parachute: 'chute',
  logbooksComplete: 'logs', hangared: 'hangar',
};
const SCALAR_PARAMS = {
  cruiseMin: 'cruise', rangeMin: 'range', usefulLoadMin: 'load',
  fuelBurnMax: 'fuel', ceilingMin: 'ceiling', smohMax: 'smoh',
  tboPctMin: 'tbo', ownerMaxCount: 'owners',
};
// paired lo/hi -> single "lo-hi" param (either side may be blank; all
// three ranges are non-negative so the first '-' is the separator).
const RANGE_PARAMS = [
  { lo: 'minPrice', hi: 'maxPrice', key: 'price' },
  { lo: 'yearFrom', hi: 'yearTo', key: 'year' },
  { lo: 'mtowMin', hi: 'mtowMax', key: 'mtow' },
];

// Returns a URLSearchParams holding only the active filters.
export function filtersToSearchParams(state) {
  const p = new URLSearchParams();
  if (state.search) p.set('q', state.search);
  for (const [field, key] of Object.entries(ARRAY_PARAMS)) {
    if (state[field] && state[field].length) {
      p.set(key, state[field].map(escapeItem).join(','));
    }
  }
  for (const [field, key] of Object.entries(BOOL_PARAMS)) {
    if (state[field]) p.set(key, '1');
  }
  for (const [field, key] of Object.entries(SCALAR_PARAMS)) {
    if (state[field]) p.set(key, String(state[field]));
  }
  for (const { lo, hi, key } of RANGE_PARAMS) {
    const l = state[lo]; const h = state[hi];
    if (l || h) p.set(key, `${l || ''}-${h || ''}`);
  }
  if (state.sortBy && state.sortBy !== 'newest') p.set('sort', state.sortBy);
  return p;
}

// Returns a full filter-state object with any present params overriding
// `base` (defaults to a clean initialFilters).
export function searchParamsToFilters(params, base = initialFilters) {
  const next = { ...base };
  const q = params.get('q');
  if (q != null) next.search = q;
  for (const [field, key] of Object.entries(ARRAY_PARAMS)) {
    const v = params.get(key);
    if (v != null) next[field] = splitEscaped(v).filter(Boolean);
  }
  for (const [field, key] of Object.entries(BOOL_PARAMS)) {
    if (params.get(key) === '1') next[field] = true;
  }
  for (const [field, key] of Object.entries(SCALAR_PARAMS)) {
    const v = params.get(key);
    if (v) next[field] = v;
  }
  for (const { lo, hi, key } of RANGE_PARAMS) {
    const v = params.get(key);
    if (v == null) continue;
    const dash = v.indexOf('-');
    if (dash === -1) { next[lo] = v; continue; }
    const l = v.slice(0, dash);
    const h = v.slice(dash + 1);
    if (l) next[lo] = l;
    if (h) next[hi] = h;
  }
  const sort = params.get('sort');
  if (sort) next.sortBy = sort;
  return next;
}

// True if the URL carries any recognised filter param — used to decide
// whether an incoming URL is a deep link worth hydrating over the
// default (or home-hero-seeded) state.
export function hasFilterParams(params) {
  const keys = [
    'q', 'sort',
    ...Object.values(ARRAY_PARAMS),
    ...Object.values(BOOL_PARAMS),
    ...Object.values(SCALAR_PARAMS),
    ...RANGE_PARAMS.map((r) => r.key),
  ];
  return keys.some((k) => params.has(k));
}
