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
  states: [],
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
  // engine (advanced)
  smohMax: '',
  tboPctMin: '',
  // avionics & equipment (advanced)
  ifrOnly: false,
  glassOnly: false,
  retractable: false,
  pressurised: false,
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
  performance: ['cruiseMin', 'rangeMin', 'usefulLoadMin', 'fuelBurnMax'],
  engine: ['smohMax', 'tboPctMin'],
  equipment: ['ifrOnly', 'glassOnly', 'retractable', 'pressurised'],
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
  return n;
}

// Map the filter state to the shape useAircraft expects. Centralised so the
// query language and the UI shape stay aligned in one place.
export function toQueryFilters(state) {
  return {
    categories: state.categories,
    manufacturers: state.manufacturers,
    states: state.states,
    conditions: state.conditions,
    minPrice: state.minPrice || undefined,
    maxPrice: state.maxPrice || undefined,
    yearFrom: state.yearFrom || undefined,
    yearTo: state.yearTo || undefined,
    cruiseMin: state.cruiseMin || undefined,
    rangeMin: state.rangeMin || undefined,
    usefulLoadMin: state.usefulLoadMin || undefined,
    fuelBurnMax: state.fuelBurnMax || undefined,
    smohMax: state.smohMax || undefined,
    tboPctMin: state.tboPctMin || undefined,
    ifrOnly: state.ifrOnly || undefined,
    glassOnly: state.glassOnly || undefined,
    retractable: state.retractable || undefined,
    pressurised: state.pressurised || undefined,
    dealerOnly: state.dealerOnly || undefined,
    privateOnly: state.privateOnly || undefined,
    featuredOnly: state.featuredOnly || undefined,
    search: state.search || undefined,
    sortBy: state.sortBy,
  };
}
