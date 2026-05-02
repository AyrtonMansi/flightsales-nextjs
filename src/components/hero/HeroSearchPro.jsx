'use client';
import { useEffect } from 'react';
import { Icons } from '../Icons';
import { CATEGORIES, STATES } from '../../lib/constants';
import { useAircraftCatalogue, makesForCategories } from '../../lib/aircraftCatalogue';

// HeroSearchPro — 2026 redraw of the hero search card.
//
// Visual moves vs the original:
//   - One fused glass surface instead of seven floating cards.
//   - Hairline dividers (1px @ 6% black) between fields, no gaps.
//   - Stripe/Linear/Apple-Wallet typography: 10px uppercase letter-spaced
//     labels, 15px semibold values, tabular numerals on prices/years.
//   - AI input gets a faint violet→indigo wash + ⌘K kbd hint, signalling
//     "smart" without being loud.
//   - CTA reports a live count: "Search 1,247 aircraft →".
//   - Year and Price are native dropdowns (selects) sitting transparent
//     over the rendered value — keyboard / iOS picker behave normally,
//     visual chrome stays consistent with the other fields.

const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => {
  const y = String(2026 - i);
  return { value: y, label: y };
});

const PRICE_FROM_OPTIONS = [
  { value: '50000',   label: '$50k' },
  { value: '100000',  label: '$100k' },
  { value: '200000',  label: '$200k' },
  { value: '300000',  label: '$300k' },
  { value: '500000',  label: '$500k' },
  { value: '1000000', label: '$1M' },
  { value: '2000000', label: '$2M' },
  { value: '5000000', label: '$5M' },
];

const PRICE_TO_OPTIONS = [
  { value: '100000',   label: '$100k' },
  { value: '200000',   label: '$200k' },
  { value: '300000',   label: '$300k' },
  { value: '500000',   label: '$500k' },
  { value: '1000000',  label: '$1M' },
  { value: '2000000',  label: '$2M' },
  { value: '5000000',  label: '$5M' },
  { value: '10000000', label: '$10M+' },
];

const labelFor = (opts, value, fallback) =>
  opts.find((o) => o.value === value)?.label ?? fallback;

export default function HeroSearchPro({ model, count }) {
  const {
    searchCat, setSearchCat,
    searchMake, setSearchMake,
    searchState, setSearchState,
    yearFrom, setYearFrom, yearTo, setYearTo,
    priceFrom, setPriceFrom, priceTo, setPriceTo,
    aiQuery, setAiQuery,
    onAiSearch,
    onManualSearch,
  } = model;

  const fmtCount = typeof count === 'number'
    ? count.toLocaleString()
    : null;

  // Pull makes from the catalogue (popularity-ordered) and cascade-
  // filter by the picked Type so Helicopter narrows Make to Robinson /
  // Bell / Airbus Helicopters / Schweizer instead of dumping every
  // fixed-wing manufacturer in the user's face.
  const catalogue = useAircraftCatalogue();
  const visibleMakes = makesForCategories(catalogue, searchCat ? [searchCat] : []);
  const makeOptions = visibleMakes.map((mk) => ({ value: mk.name, label: mk.name }));

  // Cascade cleanup — if the user picks a Type that excludes the
  // currently-selected Make, clear the Make so they don't end up with
  // an "invisible" filter (e.g. picking Helicopter while Cessna was
  // selected would leave Cessna in the URL but missing from the
  // dropdown options). Rerunning when Type changes is safe because
  // the cleanup is idempotent.
  useEffect(() => {
    if (!searchMake || !searchCat) return;
    const stillValid = visibleMakes.some((mk) => mk.name === searchMake);
    if (!stillValid) setSearchMake('');
    // intentional: visibleMakes identity changes every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCat]);

  return (
    <form
      className="fs-h-card"
      onSubmit={(e) => { e.preventDefault(); onManualSearch(); }}
    >
      {/* AI input — sparkle, gradient wash, ⌘K hint */}
      <label className="fs-h-ai">
        <span className="fs-h-ai-spark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4V2" />
            <path d="M15 16v-2" />
            <path d="M8 9h2" />
            <path d="M20 9h2" />
            <path d="M17.8 11.8 19 13" />
            <path d="M15 9h.01" />
            <path d="M17.8 6.2 19 5" />
            <path d="M3 21l9-9" />
            <path d="M12.2 6.2 11 5" />
          </svg>
        </span>
        <input
          className="fs-h-ai-input"
          placeholder="Try our AI Quick Search"
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAiSearch(e.target.value); } }}
          aria-label="AI search — describe the aircraft you're looking for"
        />
        <kbd className="fs-h-kbd" aria-hidden="true">⌘K</kbd>
      </label>

      {/* Vertically-stacked rows with the Uber pin-line connector — one
          row per facet so each gets a label + value + native picker. */}
      <div className="fs-h-stack">
        <SelectField
          stacked
          label="Type"
          value={searchCat}
          onChange={setSearchCat}
          placeholder="All types"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <SelectField
          stacked
          label="Make"
          value={searchMake}
          onChange={setSearchMake}
          placeholder="All makes"
          options={makeOptions}
        />
        <SelectRangeField
          stacked
          label="Year"
          minValue={yearFrom}
          maxValue={yearTo}
          onMinChange={setYearFrom}
          onMaxChange={setYearTo}
          minPlaceholder="From"
          maxPlaceholder="To"
          minOptions={YEAR_OPTIONS}
          maxOptions={YEAR_OPTIONS}
        />
        <SelectRangeField
          stacked
          label="Price"
          minValue={priceFrom}
          maxValue={priceTo}
          onMinChange={setPriceFrom}
          onMaxChange={setPriceTo}
          minPlaceholder="Min"
          maxPlaceholder="Max"
          minOptions={PRICE_FROM_OPTIONS}
          maxOptions={PRICE_TO_OPTIONS}
        />
        <SelectField
          stacked
          label="Location"
          value={searchState}
          onChange={setSearchState}
          placeholder="Anywhere in Australia"
          options={STATES.map((s) => ({ value: s, label: s }))}
        />
      </div>

      {/* CTA + side link — Uber pattern: solid black button (not full
          width), tight padding, with a text link to its right. */}
      <div className="fs-h-cta-row">
        <button className="fs-h-cta" type="submit">
          {fmtCount
            ? <>Search <span className="fs-h-cta-count">{fmtCount}</span></>
            : 'Search'}
        </button>
        <a href="/login" className="fs-h-cta-side">
          Log in to save searches
        </a>
      </div>
    </form>
  );
}

// Field wraps a borderless native <select>. The select sits transparent
// over the rendered label/value so the keyboard, screen-reader, and
// mobile picker behaviour is the platform default while the visual
// chrome stays consistent with the rest of the card.
//
// `stacked` switches the row to the Uber-style horizontal layout:
//   ●  Label                      Value     ▾
// Otherwise it renders the older 3-column grid cell.
function SelectField({ label, value, onChange, placeholder, options, icon, stacked }) {
  const isEmpty = !value;
  if (stacked) {
    return (
      <label className="fs-h-stack-row">
        <span className="fs-h-stack-pin" aria-hidden="true" />
        <span className="fs-h-stack-label">{label}</span>
        <span className={`fs-h-stack-value${isEmpty ? ' muted' : ''}`}>
          {icon && <span className="fs-h-field-icon">{icon}</span>}
          {value || placeholder}
        </span>
        <span className="fs-h-stack-chevron" aria-hidden="true">▾</span>
        <select
          className="fs-h-field-native"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="fs-h-field fs-h-field-select">
      <span className="fs-h-field-label">{label}</span>
      <span className={`fs-h-field-value${isEmpty ? ' muted' : ''}`}>
        {icon && <span className="fs-h-field-icon">{icon}</span>}
        {value || placeholder}
      </span>
      <select
        className="fs-h-field-native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

// Range field with two native selects side-by-side under one label.
// Each cell is positioned so the transparent <select> only covers its own
// half — tapping the From cell opens the From picker, tapping To opens To.
function SelectRangeField({
  label,
  minValue, maxValue,
  onMinChange, onMaxChange,
  minPlaceholder, maxPlaceholder,
  minOptions, maxOptions,
  stacked,
}) {
  if (stacked) {
    const minEmpty = !minValue;
    const maxEmpty = !maxValue;
    return (
      <div className="fs-h-stack-row fs-h-stack-row-range">
        <span className="fs-h-stack-pin" aria-hidden="true" />
        <span className="fs-h-stack-label">{label}</span>
        <span className="fs-h-stack-range">
          <span className="fs-h-range-cell">
            <span className={`fs-h-stack-value${minEmpty ? ' muted' : ''}`}>
              {labelFor(minOptions, minValue, minPlaceholder)}
            </span>
            <select
              className="fs-h-field-native"
              value={minValue}
              onChange={(e) => onMinChange(e.target.value)}
              aria-label={`${label} from`}
            >
              <option value="">{minPlaceholder}</option>
              {minOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </span>
          <span className="fs-h-range-sep" aria-hidden="true">—</span>
          <span className="fs-h-range-cell">
            <span className={`fs-h-stack-value${maxEmpty ? ' muted' : ''}`}>
              {labelFor(maxOptions, maxValue, maxPlaceholder)}
            </span>
            <select
              className="fs-h-field-native"
              value={maxValue}
              onChange={(e) => onMaxChange(e.target.value)}
              aria-label={`${label} to`}
            >
              <option value="">{maxPlaceholder}</option>
              {maxOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </span>
        </span>
        <span className="fs-h-stack-chevron" aria-hidden="true">▾</span>
      </div>
    );
  }
  return (
    <div className="fs-h-field fs-h-field-range">
      <span className="fs-h-field-label">{label}</span>
      <div className="fs-h-range">
        <span className="fs-h-range-cell">
          <span className={`fs-h-range-text${minValue ? '' : ' muted'}`}>
            {labelFor(minOptions, minValue, minPlaceholder)}
          </span>
          <select
            className="fs-h-field-native"
            value={minValue}
            onChange={(e) => onMinChange(e.target.value)}
            aria-label={`${label} from`}
          >
            <option value="">{minPlaceholder}</option>
            {minOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </span>
        <span className="fs-h-range-sep" aria-hidden="true">—</span>
        <span className="fs-h-range-cell">
          <span className={`fs-h-range-text${maxValue ? '' : ' muted'}`}>
            {labelFor(maxOptions, maxValue, maxPlaceholder)}
          </span>
          <select
            className="fs-h-field-native"
            value={maxValue}
            onChange={(e) => onMaxChange(e.target.value)}
            aria-label={`${label} to`}
          >
            <option value="">{maxPlaceholder}</option>
            {maxOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </span>
      </div>
    </div>
  );
}
