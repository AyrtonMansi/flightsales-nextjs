// Derives a flat, removable-pill representation of the /buy filter state.
// Every field in filterReducer's initialFilters is covered here — this is
// intentionally exhaustive (not a curated subset) so the chip row is always
// a complete, trustworthy summary of what's actually being queried, no
// matter which of the 40+ fields the user touched.
//
// Each chip carries a ready-to-dispatch reducer action so the caller never
// has to know the shape of the underlying field (array / boolean / scalar
// / paired-range).

import { WORLD_REGIONS } from './worldRegions';

// ── Label lookups for coded values ──────────────────────────────────
const COUNTRY_NAMES = new Map();
const STATE_NAMES = new Map();
for (const region of WORLD_REGIONS) {
  for (const country of region.countries) {
    COUNTRY_NAMES.set(country.code, country.name);
    for (const sub of country.subdivisions || []) {
      STATE_NAMES.set(sub.code, sub.name);
    }
  }
}

const ENGINE_COUNT_LABELS = { '1': 'Single engine', '2': 'Twin engine', '4': 'Quad engine' };
const DAMAGE_LABELS = { none: 'No damage', minor: 'Minor damage disclosed', major: 'Major damage disclosed' };

function fmtPrice(n) {
  const v = Number(n);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${v}`;
}

// field -> per-value label override. Omitted fields fall back to the raw
// value (already human-readable for categories/manufacturers/models/
// conditions/engineTypes/avionicsSuites/autopilots).
const ARRAY_FIELDS = [
  { field: 'categories' },
  { field: 'manufacturers' },
  { field: 'models' },
  { field: 'countries', labelFor: (v) => COUNTRY_NAMES.get(v) || v },
  { field: 'states', labelFor: (v) => STATE_NAMES.get(v) || v },
  { field: 'conditions' },
  { field: 'engineCounts', labelFor: (v) => ENGINE_COUNT_LABELS[v] || v },
  { field: 'engineTypes' },
  { field: 'engineMakes' },
  { field: 'avionicsSuites' },
  { field: 'autopilots' },
  { field: 'damageHistory', labelFor: (v) => DAMAGE_LABELS[v] || v },
];

const BOOL_FIELDS = [
  { field: 'dealerOnly', label: 'Verified dealer' },
  { field: 'privateOnly', label: 'Private seller' },
  { field: 'featuredOnly', label: 'Featured listings' },
  { field: 'ifrOnly', label: 'IFR equipped' },
  { field: 'glassOnly', label: 'Glass cockpit' },
  { field: 'adsbIn', label: 'ADS-B In' },
  { field: 'adsbOut', label: 'ADS-B Out' },
  { field: 'synVis', label: 'Synthetic vision' },
  { field: 'deIce', label: 'TKS / FIKI de-ice' },
  { field: 'airCon', label: 'Air conditioning' },
  { field: 'pressurised', label: 'Pressurized' },
  { field: 'retractable', label: 'Retractable gear' },
  { field: 'cargoDoor', label: 'Cargo door / pod' },
  { field: 'parachute', label: 'BRS parachute (CAPS)' },
  { field: 'logbooksComplete', label: 'Complete logbooks' },
  { field: 'hangared', label: 'Hangared' },
];

const SCALAR_FIELDS = [
  { field: 'cruiseMin', label: (v) => `Cruise ≥ ${v} kts` },
  { field: 'rangeMin', label: (v) => `Range ≥ ${v} NM` },
  { field: 'usefulLoadMin', label: (v) => `Useful load ≥ ${v} kg` },
  { field: 'fuelBurnMax', label: (v) => `Fuel burn ≤ ${v} L/hr` },
  { field: 'ceilingMin', label: (v) => `Ceiling ≥ ${v} ft` },
  { field: 'smohMax', label: (v) => `Hrs since overhaul ≤ ${v}` },
  { field: 'tboPctMin', label: (v) => `TBO remaining ≥ ${v}%` },
  { field: 'ownerMaxCount', label: (v) => `${v} owner${v === '1' ? '' : 's'} or fewer` },
];

// Paired min/max fields that collapse into one chip. `clearFields` lists
// both keys so RESET_SECTION can wipe them together.
const RANGE_FIELDS = [
  { lo: 'minPrice', hi: 'maxPrice', prefix: 'Price', format: fmtPrice },
  { lo: 'yearFrom', hi: 'yearTo', prefix: 'Year', format: String },
  { lo: 'mtowMin', hi: 'mtowMax', prefix: 'MTOW', format: (v) => `${Number(v).toLocaleString()} kg` },
];

// Returns [{ id, label, action }]. `action` is a ready-to-dispatch
// filterReducer action object — the caller just calls dispatch(chip.action).
export function getActiveFilterChips(state) {
  const chips = [];

  if (state.search) {
    chips.push({
      id: 'search',
      label: `"${state.search}"`,
      action: { type: 'SET', field: 'search', value: '' },
    });
  }

  for (const { field, labelFor } of ARRAY_FIELDS) {
    for (const value of state[field] || []) {
      chips.push({
        id: `${field}:${value}`,
        label: labelFor ? labelFor(value) : value,
        action: { type: 'TOGGLE_IN_ARRAY', field, value },
      });
    }
  }

  for (const { field, label } of BOOL_FIELDS) {
    if (state[field]) {
      chips.push({
        id: field,
        label,
        action: { type: 'SET', field, value: false },
      });
    }
  }

  for (const { field, label } of SCALAR_FIELDS) {
    if (state[field]) {
      chips.push({
        id: field,
        label: label(state[field]),
        action: { type: 'SET', field, value: '' },
      });
    }
  }

  for (const { lo, hi, prefix, format } of RANGE_FIELDS) {
    const loVal = state[lo];
    const hiVal = state[hi];
    if (!loVal && !hiVal) continue;
    let label;
    if (loVal && hiVal) label = `${prefix}: ${format(loVal)} – ${format(hiVal)}`;
    else if (loVal) label = `${prefix}: ${format(loVal)}+`;
    else label = `${prefix}: up to ${format(hiVal)}`;
    chips.push({
      id: `${lo}-${hi}`,
      label,
      action: { type: 'RESET_SECTION', fields: { [lo]: '', [hi]: '' } },
    });
  }

  return chips;
}
