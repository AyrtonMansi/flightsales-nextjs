'use client';
import Link from 'next/link';
import FilterSection from './FilterSection';
import CheckboxList from './CheckboxList';
import NumberField from './NumberField';
import RangeSlider from './RangeSlider';
import { CATEGORIES, MANUFACTURERS, STATES, CONDITIONS } from '../../lib/constants';
import { useAircraftCatalogue } from '../../lib/aircraftCatalogue';
import { SECTION_FIELDS, countActiveInSection, countActiveTotal, initialFilters } from '../../lib/filterReducer';

// Curated option lists for the advanced filter checkbox sections. Kept here
// (not in /lib/constants) because they're tightly coupled to the column's
// presentation — what shows up in which section.
const ENGINE_COUNTS = [
  { value: '1', label: 'Single' },
  { value: '2', label: 'Twin' },
  { value: '4', label: 'Quad' },
];

const ENGINE_TYPES = [
  { value: 'piston', label: 'Piston' },
  { value: 'turboprop', label: 'Turboprop' },
  { value: 'turbofan', label: 'Turbofan' },
  { value: 'electric', label: 'Electric' },
];

const ENGINE_MAKES = [
  'Continental', 'Lycoming', 'Pratt & Whitney', 'Williams', 'Rolls-Royce',
  'Rotax', 'Jabiru', 'Honeywell', 'GE Aviation', 'Pipistrel',
];

const AVIONICS_SUITES = [
  'Garmin G1000/NXi',
  'Garmin G3X',
  'Garmin G500/600',
  'Avidyne',
  'Dynon',
  'Aspen',
  'Steam gauges',
];

const AUTOPILOTS = [
  'GFC700', 'KAP140', 'S-TEC', 'TruTrak', 'None',
];

const DAMAGE_HISTORY = [
  { value: 'none', label: 'No damage' },
  { value: 'minor', label: 'Minor disclosed' },
  { value: 'major', label: 'Major disclosed' },
];

const OWNER_COUNTS = [
  { value: '1', label: 'Single owner' },
  { value: '2', label: '2 or fewer owners' },
  { value: '3', label: '3 or fewer owners' },
];

// The whole left-side column on /buy. Basic filters always visible at top;
// advanced sections collapsed below a divider; everything sits in the same
// scrollable column. Auth-gated: signed-out users see a single sign-in
// prompt in place of the advanced sections.
//
// Props:
//   state    — full filter state object (from filterReducer)
//   dispatch — reducer dispatch
//   total    — current result count (live)
//   user     — auth user (null if signed out)
export default function FilterColumn({ state, dispatch, total, user }) {
  const setField = (field, value) => dispatch({ type: 'SET', field, value });
  const toggle = (field, value) => dispatch({ type: 'TOGGLE_IN_ARRAY', field, value });

  // Pull makes from the catalogue (seed + DB extras), with the legacy
  // MANUFACTURERS list as a guaranteed fallback if the catalogue ever
  // came back empty for any reason. Makes already arrive popularity-
  // ordered from buildCatalogue (Cessna/Piper at the top, niche makes
  // at the bottom).
  const catalogue = useAircraftCatalogue();
  const allMakes = catalogue.makes.length > 0
    ? catalogue.makes
    : MANUFACTURERS.map((m) => ({ slug: m.toLowerCase(), name: m }));

  // Type cascade — when the user has selected one or more Type filters
  // (e.g. Helicopter), filter the available makes to only those that
  // have at least one model in the selected categories. So picking
  // Type=Helicopter hides Cessna / Piper / Cirrus from the Make list,
  // showing only Robinson / Bell / Airbus Helicopters / Schweizer.
  const makesFilteredByType = state.categories.length === 0
    ? allMakes
    : allMakes.filter((mk) => {
        const models = catalogue.modelsByMake.get(mk.slug) ?? [];
        return models.some((mdl) => state.categories.includes(mdl.category));
      });
  const makeOptions = makesFilteredByType.map((mk) => ({ value: mk.name, label: mk.name }));

  // Model options cascade from selected makes AND selected categories.
  // Map picked make NAMES (e.g. "Cessna") to slugs to fetch their
  // catalogue models. Each option's value matches the listing's `model`
  // column so checking "172S Skyhawk" filters the DB rows.
  const selectedMakeSlugs = state.manufacturers
    .map((name) => allMakes.find((mk) => mk.name === name)?.slug)
    .filter(Boolean);
  const modelOptions = selectedMakeSlugs.length === 0
    ? []
    : selectedMakeSlugs
        .flatMap((slug) => catalogue.modelsByMake.get(slug) ?? [])
        // Cascade by selected Types too — a Robinson user who also
        // ticked Helicopter sees only R22/R44/R66, never some hypothetical
        // future Robinson fixed-wing.
        .filter((mdl) =>
          state.categories.length === 0 || state.categories.includes(mdl.category)
        )
        .map((mdl) => {
          // The listing's `model` column stores the seller's text
          // (e.g. "172S Skyhawk", "SR22T"). Match against variant when
          // present, falling back to family for variant-less entries.
          const value = mdl.variant
            ? `${mdl.family} ${mdl.variant}`.trim()
            : mdl.family;
          return { value, label: value };
        })
        // Dedupe — same model name might appear under multiple makes
        // (rare, but Vans RV variants can collide).
        .filter((opt, i, arr) => arr.findIndex((o) => o.value === opt.value) === i);

  const activeTotal = countActiveTotal(state);
  const perfActive = countActiveInSection(state, SECTION_FIELDS.performance);
  const engActive = countActiveInSection(state, SECTION_FIELDS.engine);
  const equipActive = countActiveInSection(state, SECTION_FIELDS.equipment);
  const histActive = countActiveInSection(state, SECTION_FIELDS.history);

  // Helper: simple boolean checkbox row, used a lot in the equipment section.
  const Bool = ({ field, label }) => (
    <label className={`fs-fc-checkrow${state[field] ? ' on' : ''}`}>
      <input
        type="checkbox"
        checked={!!state[field]}
        onChange={e => setField(field, e.target.checked)}
      />
      <span className="fs-fc-checkrow-label">{label}</span>
    </label>
  );

  const resetSection = (fields) => dispatch({
    type: 'RESET_SECTION',
    fields: fields.reduce((acc, f) => {
      const initial = initialFilters[f];
      acc[f] = Array.isArray(initial) ? [] : initial;
      return acc;
    }, {}),
  });

  return (
    <div className="fs-fc">
      {/* Sticky header: live count + reset all */}
      <div className="fs-fc-head">
        <div className="fs-fc-count">
          <span className="fs-fc-count-num">{total.toLocaleString()}</span>
          <span className="fs-fc-count-label">aircraft</span>
        </div>
        {activeTotal > 0 && (
          <button
            type="button"
            className="fs-fc-reset"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            Reset all
          </button>
        )}
      </div>

      {/* BASIC — always visible, no header label */}
      <div className="fs-fc-basic">
        {/* Search */}
        <div className="fs-fc-field">
          <label className="fs-fc-label" htmlFor="fc-search">Search</label>
          <input
            id="fc-search"
            type="text"
            className="fs-fc-input"
            placeholder="Make, model, rego..."
            value={state.search}
            onChange={e => setField('search', e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Category</span>
          <CheckboxList
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            selected={state.categories}
            onToggle={v => toggle('categories', v)}
            maxVisible={5}
          />
        </div>

        {/* Make */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Make</span>
          <CheckboxList
            options={makeOptions}
            selected={state.manufacturers}
            onToggle={v => toggle('manufacturers', v)}
            maxVisible={5}
            searchable
            searchKey="Filter makes"
          />
        </div>

        {/* Model — cascades from Make. Hidden until a make is selected so
            the filter doesn't dump 150 model names on a user who hasn't
            narrowed yet. Once a make is picked, only that make's models
            appear (with all selected makes' models if multi-selected). */}
        {state.manufacturers.length > 0 && (
          <div className="fs-fc-field">
            <span className="fs-fc-label">Model</span>
            <CheckboxList
              options={modelOptions}
              selected={state.models}
              onToggle={v => toggle('models', v)}
              maxVisible={6}
              searchable
              searchKey="Filter models"
            />
          </div>
        )}

        {/* Location */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Location</span>
          <CheckboxList
            options={STATES.map(s => ({ value: s, label: s }))}
            selected={state.states}
            onToggle={v => toggle('states', v)}
            maxVisible={5}
          />
        </div>

        {/* Condition */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Condition</span>
          <CheckboxList
            options={CONDITIONS.map(c => ({ value: c, label: c }))}
            selected={state.conditions}
            onToggle={v => toggle('conditions', v)}
          />
        </div>

        {/* Price */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Price</span>
          <RangeSlider
            min={0} max={15_000_000} step={50_000}
            minValue={state.minPrice} maxValue={state.maxPrice}
            onChange={({ min, max }) => {
              setField('minPrice', min === '0' ? '' : min);
              setField('maxPrice', max === '15000000' ? '' : max);
            }}
            format={(n) => {
              const v = Number(n);
              if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
              if (v >= 1000) return `$${Math.round(v / 1000)}k`;
              return `$${v}`;
            }}
          />
        </div>

        {/* Year */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Year</span>
          <RangeSlider
            min={1960} max={2026} step={1}
            minValue={state.yearFrom} maxValue={state.yearTo}
            onChange={({ min, max }) => {
              setField('yearFrom', min === '1960' ? '' : min);
              setField('yearTo', max === '2026' ? '' : max);
            }}
            format={(n) => String(Math.round(Number(n)))}
          />
        </div>

        {/* Seller */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Seller</span>
          <label className={`fs-fc-checkrow${state.dealerOnly ? ' on' : ''}`}>
            <input type="checkbox" checked={state.dealerOnly}
              onChange={e => setField('dealerOnly', e.target.checked)} />
            <span className="fs-fc-checkrow-label">Verified dealer</span>
          </label>
          <label className={`fs-fc-checkrow${state.privateOnly ? ' on' : ''}`}>
            <input type="checkbox" checked={state.privateOnly}
              onChange={e => setField('privateOnly', e.target.checked)} />
            <span className="fs-fc-checkrow-label">Private seller</span>
          </label>
          <label className={`fs-fc-checkrow${state.featuredOnly ? ' on' : ''}`}>
            <input type="checkbox" checked={state.featuredOnly}
              onChange={e => setField('featuredOnly', e.target.checked)} />
            <span className="fs-fc-checkrow-label">Featured listings only</span>
          </label>
        </div>
      </div>

      <div className="fs-fc-divider" aria-hidden="true" />

      {/* ADVANCED — auth-gated */}
      {!user ? (
        <div className="fs-fc-gate">
          <h3>Advanced filters</h3>
          <p>
            Performance, engine, avionics & equipment — unlocked when you sign in.
          </p>
          <Link href="/login?next=%2Fbuy%3Fadvanced%3D1" className="fs-fc-gate-cta">
            Sign in to unlock
          </Link>
          <p className="fs-fc-gate-sub">
            Don't have an account? <Link href="/login">Create one (free)</Link>
          </p>
        </div>
      ) : (
        <>
          <FilterSection
            title="Performance"
            activeCount={perfActive}
            onReset={() => resetSection(SECTION_FIELDS.performance)}
          >
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Cruise speed</span>
              <NumberField prefix="Min" unit="kts" value={state.cruiseMin}
                onChange={v => setField('cruiseMin', v)} />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Range</span>
              <NumberField prefix="Min" unit="NM" value={state.rangeMin}
                onChange={v => setField('rangeMin', v)} />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Useful load</span>
              <NumberField prefix="Min" unit="kg" value={state.usefulLoadMin}
                onChange={v => setField('usefulLoadMin', v)} />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">MTOW</span>
              <RangeSlider
                min={0} max={10_000} step={100}
                minValue={state.mtowMin} maxValue={state.mtowMax}
                onChange={({ min, max }) => {
                  setField('mtowMin', min === '0' ? '' : min);
                  setField('mtowMax', max === '10000' ? '' : max);
                }}
                format={n => `${Number(n).toLocaleString()} kg`}
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Fuel burn</span>
              <NumberField prefix="Max" unit="L/hr" value={state.fuelBurnMax}
                onChange={v => setField('fuelBurnMax', v)} />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Service ceiling</span>
              <NumberField prefix="Min" unit="ft" value={state.ceilingMin}
                onChange={v => setField('ceilingMin', v)} step={500} />
            </div>
          </FilterSection>

          <FilterSection
            title="Engine"
            activeCount={engActive}
            onReset={() => resetSection(SECTION_FIELDS.engine)}
          >
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Engine count</span>
              <CheckboxList
                options={ENGINE_COUNTS}
                selected={state.engineCounts}
                onToggle={v => toggle('engineCounts', v)}
                maxVisible={3}
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Engine type</span>
              <CheckboxList
                options={ENGINE_TYPES}
                selected={state.engineTypes}
                onToggle={v => toggle('engineTypes', v)}
                maxVisible={4}
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Engine make</span>
              <CheckboxList
                options={ENGINE_MAKES.map(m => ({ value: m, label: m }))}
                selected={state.engineMakes}
                onToggle={v => toggle('engineMakes', v)}
                maxVisible={5}
                searchable
                searchKey="Filter makes"
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Hours since major overhaul</span>
              <NumberField prefix="Max" unit="hrs" value={state.smohMax}
                onChange={v => setField('smohMax', v)} />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">TBO remaining</span>
              <NumberField prefix="Min" unit="%" value={state.tboPctMin}
                onChange={v => setField('tboPctMin', v)} min={0} step={5} />
            </div>
          </FilterSection>

          <FilterSection
            title="Avionics & equipment"
            activeCount={equipActive}
            onReset={() => resetSection(SECTION_FIELDS.equipment)}
          >
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Avionics suite</span>
              <CheckboxList
                options={AVIONICS_SUITES.map(s => ({ value: s, label: s }))}
                selected={state.avionicsSuites}
                onToggle={v => toggle('avionicsSuites', v)}
                maxVisible={5}
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Autopilot</span>
              <CheckboxList
                options={AUTOPILOTS.map(a => ({ value: a, label: a }))}
                selected={state.autopilots}
                onToggle={v => toggle('autopilots', v)}
                maxVisible={5}
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Equipment</span>
              <Bool field="ifrOnly" label="IFR equipped" />
              <Bool field="glassOnly" label="Glass cockpit" />
              <Bool field="adsbIn" label="ADS-B In" />
              <Bool field="adsbOut" label="ADS-B Out" />
              <Bool field="synVis" label="Synthetic vision" />
              <Bool field="deIce" label="TKS / FIKI de-ice" />
              <Bool field="airCon" label="Air conditioning" />
              <Bool field="pressurised" label="Pressurized" />
              <Bool field="retractable" label="Retractable gear" />
              <Bool field="cargoDoor" label="Cargo door / pod" />
              <Bool field="parachute" label="BRS parachute (CAPS)" />
            </div>
          </FilterSection>

          <FilterSection
            title="History & condition"
            activeCount={histActive}
            onReset={() => resetSection(SECTION_FIELDS.history)}
          >
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Damage history</span>
              <CheckboxList
                options={DAMAGE_HISTORY}
                selected={state.damageHistory}
                onToggle={v => toggle('damageHistory', v)}
                maxVisible={3}
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Storage</span>
              <Bool field="hangared" label="Hangared" />
              <Bool field="logbooksComplete" label="Complete logbooks" />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Owner count</span>
              <CheckboxList
                options={OWNER_COUNTS}
                selected={state.ownerMaxCount ? [state.ownerMaxCount] : []}
                onToggle={v => setField('ownerMaxCount', state.ownerMaxCount === v ? '' : v)}
                maxVisible={3}
              />
            </div>
          </FilterSection>
        </>
      )}
    </div>
  );
}
