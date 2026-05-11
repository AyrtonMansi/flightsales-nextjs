'use client';
import { useEffect, useState } from 'react';
import { CATEGORIES } from '../../lib/constants';
import { orderRegionsForUser, regionKeyForCountry } from '../../lib/worldRegions';

// HeroSearchPro — 2026 redraw of the hero search card.
//
// Visual moves vs the original:
//   - One fused glass surface instead of seven floating cards.
//   - Hairline dividers (1px @ 6% black) between fields, no gaps.
//   - Stripe/Linear/Apple-Wallet typography: 10px uppercase letter-spaced
//     labels, 15px semibold values, tabular numerals on prices/years.
//   - AI input gets a faint violet→indigo wash + ⌘K kbd hint, signalling
//     "smart" without being loud.
//   - CTA: a single-word "Search" button — Uber-style, no count clutter.
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

export default function HeroSearchPro({ model }) {
  const {
    searchCat, setSearchCat,
    searchMake, setSearchMake,
    searchState, setSearchState,
    yearFrom, setYearFrom, yearTo, setYearTo,
    priceFrom, setPriceFrom, priceTo, setPriceTo,
    aiQuery, setAiQuery,
    rotatingPlaceholder,
    onAiSearch,
    onManualSearch,
  } = model;

  // Make is intentionally NOT shown in the hero — it's too granular
  // for the entry-point funnel. The /buy filter rail handles Make
  // (and Model, with cascading + counts) deeply. AI quick search up
  // top still parses brand names like "Cessna" into the make filter,
  // so the path is preserved for users who already know what they want.

  return (
    <form
      className="fs-h-stackform"
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
          /* Placeholder is purely the rotating typewriter — no static
             fallback. The previous "Try our AI Quick Search" string
             flashed between rotations and read as a meta label that
             contradicted the actual example queries. Empty input
             during the brief rotation gap is part of the typewriter
             feel and is far less distracting. */
          placeholder={rotatingPlaceholder}
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAiSearch(e.target.value); } }}
          aria-label="AI search — describe the aircraft you're looking for"
        />
        <kbd className="fs-h-kbd" aria-hidden="true">⌘K</kbd>
      </label>

      {/* Cards group — five individual cards (one per facet) with a
          single hairline connector that runs from Type's pickup pin
          all the way to Location's destination square, passing through
          every card and every gap. */}
      <div className="fs-h-cards-group">
        <div className="fs-h-stack">
          <SelectField
            stacked
            label="Type"
            value={searchCat}
            onChange={setSearchCat}
            placeholder="All types"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="fs-h-stack">
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
        </div>
        <div className="fs-h-stack">
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
        </div>
        <div className="fs-h-stack">
          <LocationField
            value={searchState}
            onChange={setSearchState}
          />
        </div>
      </div>{/* /fs-h-cards-group */}

      {/* CTA — Uber pattern: solid black button, tight padding. */}
      <div className="fs-h-cta-row">
        <button className="fs-h-cta" type="submit">
          Search
        </button>
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

// LocationField — region-grouped Location select. The user's home
// country (detected via /api/geo, which reads the Vercel IP-country
// header) sits at the top of the dropdown with every sub-division
// (state/province) underneath. Other regions follow as <optgroup>s
// so the dropdown reads as: "Australia → AU states → North America →
// US, Canada, Mexico → Europe → … → etc."
//
// Encoded values match the model expected by HomePage.handleManualSearch:
//   ''             → no location filter
//   'state:NSW'    → state filter only (legacy AU shape preserved)
//   'country:AU'   → country filter (whole country)
//   'country:US'   → country filter
//   'state:CA'     → state filter (US California — same shape as AU)
//
// The downstream BuyPage seed already supports `country` + `state`
// fields via toQueryFilters, so the routing just needs to set both.
function LocationField({ value, onChange }) {
  const [userCountry, setUserCountry] = useState(null);

  useEffect(() => {
    fetch('/api/geo', { cache: 'force-cache' })
      .then((r) => r.json())
      .then((j) => { if (j?.country) setUserCountry(j.country); })
      .catch(() => { /* leave null — natural region order */ });
  }, []);

  // Home country resolves from the geo header; falls back to AU
  // (this is an Australian marketplace, the default audience is here).
  const homeCountryCode = userCountry || 'AU';
  const userRegionKey = regionKeyForCountry(homeCountryCode);
  const orderedRegions = orderRegionsForUser(userRegionKey);

  // The home country is rendered as its own top-level optgroup with
  // all of its sub-divisions inline (clicking is a one-step pick for
  // local buyers). Then every other region is rendered as a sibling
  // optgroup whose options are the countries (no state-level detail
  // — that's available on the Buy page's filter rail).
  const homeRegion = orderedRegions.find((r) =>
    r.countries.some((c) => c.code === homeCountryCode)
  ) || orderedRegions[0];
  const homeCountry = homeRegion?.countries.find((c) => c.code === homeCountryCode);
  const homeSubs = homeCountry?.subdivisions || [];

  // Display label for the chip in the closed select.
  const labelFor = () => {
    if (!value) return `Anywhere${homeCountry ? ` in ${homeCountry.name}` : ''}`;
    if (value.startsWith('state:')) {
      const code = value.slice(6);
      const sub = homeSubs.find((s) => s.code === code);
      if (sub) return sub.name;
      // Foreign state — find anywhere
      for (const r of orderedRegions) {
        for (const c of r.countries) {
          const s = (c.subdivisions || []).find((x) => x.code === code);
          if (s) return `${s.name}, ${c.name}`;
        }
      }
      return code;
    }
    if (value.startsWith('country:')) {
      const code = value.slice(8);
      for (const r of orderedRegions) {
        const c = r.countries.find((c) => c.code === code);
        if (c) return c.name;
      }
      return code;
    }
    return value;
  };

  const isEmpty = !value;

  return (
    <label className="fs-h-stack-row">
      <span className="fs-h-stack-pin" aria-hidden="true" />
      <span className="fs-h-stack-label">Location</span>
      <span className={`fs-h-stack-value${isEmpty ? ' muted' : ''}`}>{labelFor()}</span>
      <span className="fs-h-stack-chevron" aria-hidden="true">▾</span>
      <select
        className="fs-h-field-native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Location"
      >
        <option value="">Anywhere worldwide</option>

        {/* Home country group — full sub-division list inline */}
        {homeCountry && (
          <optgroup label={homeCountry.name}>
            <option value={`country:${homeCountry.code}`}>
              Anywhere in {homeCountry.name}
            </option>
            {homeSubs.map((s) => (
              <option key={`state:${s.code}`} value={`state:${s.code}`}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}

        {/* Other regions — country-level only. State/province granularity
            is available on the Buy page's filter rail; the hero keeps
            it concise. */}
        {orderedRegions.map((r) => {
          // Skip the home region (already rendered above as its own
          // group). For the home region's other countries, render them
          // under a "Rest of <region>" optgroup so the home country
          // doesn't disappear from the dropdown logic.
          const otherCountries = r.key === homeRegion?.key
            ? r.countries.filter((c) => c.code !== homeCountryCode)
            : r.countries;
          if (otherCountries.length === 0) return null;
          const label = r.key === homeRegion?.key ? `Rest of ${r.name}` : r.name;
          return (
            <optgroup key={r.key} label={label}>
              {otherCountries.map((c) => (
                <option key={`country:${c.code}`} value={`country:${c.code}`}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}
