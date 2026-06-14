'use client';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import FilterSection from './FilterSection';
import CheckboxList from './CheckboxList';
import MakeModelTree from './MakeModelTree';
import NumberField from './NumberField';
import RangeSlider from './RangeSlider';
import { CATEGORIES, MANUFACTURERS, STATES, CONDITIONS } from '../../lib/constants';
import { useAircraftCatalogue, makesForCategories, modelsForMakesAndCategories } from '../../lib/aircraftCatalogue';
import { SECTION_FIELDS, countActiveInSection, countActiveTotal, initialFilters } from '../../lib/filterReducer';
import { useFacets, decorateAndSortByCount } from '../../lib/useFacets';

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

  // Faceted listing counts — every filter option gets a (N) showing how
  // many listings would match if it were added to the user's current
  // selection. Sorted by count desc so the most-listed options bubble
  // up; zero-count sinks behind the "Show more" toggle.
  const facets = useFacets(state);

  // Cascade rules — pure helpers from aircraftCatalogue.js so the same
  // logic is unit-tested + shared with HeroSearchPro.
  const makesFilteredByType = state.categories.length === 0
    ? allMakes
    : makesForCategories(catalogue, state.categories);
  // Make → its models, decorated with counts. The MakeModelTree renders
  // a make's models inline below it when ticked, so we precompute every
  // selected-make's model list keyed by slug. Computed from the catalogue
  // (cascading by Type) so unrelated models never leak in.
  const makesWithSlug = makesFilteredByType.map(mk => ({
    value: mk.name,
    label: mk.name,
    slug: mk.slug,
  }));
  const makesDecorated = decorateAndSortByCount(makesWithSlug, facets.makeCounts, state.manufacturers);

  const selectedMakeSlugs = state.manufacturers
    .map((name) => allMakes.find((mk) => mk.name === name)?.slug)
    .filter(Boolean);

  const modelsByMakeSlug = useMemo(() => {
    const out = {};
    for (const slug of selectedMakeSlugs) {
      const list = modelsForMakesAndCategories(catalogue, [slug], state.categories)
        .map((mdl) => {
          const value = mdl.variant
            ? `${mdl.family} ${mdl.variant}`.trim()
            : mdl.family;
          return { value, label: value };
        })
        .filter((opt, i, arr) => arr.findIndex((o) => o.value === opt.value) === i);
      out[slug] = decorateAndSortByCount(list, facets.modelCounts, state.models);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMakeSlugs.join('|'), state.categories.join('|'), state.models.join('|'), facets.modelCounts]);

  // ── Cascade cleanup ────────────────────────────────────────────
  // When the user changes a parent filter (Type, Make), drop any
  // child-filter selections that are no longer reachable through the
  // visible options. Without this, picking Type=Helicopter while Cessna
  // was selected would leave "Cessna" in the manufacturers array but
  // hidden from the dropdown — DB query returns 0 rows and the user
  // can't find what to uncheck.
  //
  // Three rules, all gated by length checks so the effect is a no-op
  // 99% of the time and never causes infinite re-renders:
  //   1. Drop manufacturers no longer in the type-filtered Make list.
  //   2. Drop models no longer in the cascaded Model list.
  //   3. Clear all models when manufacturers becomes empty (the Model
  //      filter UI hides, leaving orphans that still apply to the query).
  const validMakeNames = makesDecorated.map((o) => o.value);
  const validModelValues = Object.values(modelsByMakeSlug).flat().map((o) => o.value);
  const makesKey = state.manufacturers.join('|');
  const catsKey = state.categories.join('|');

  useEffect(() => {
    // Rule 1
    if (state.categories.length > 0 && state.manufacturers.length > 0) {
      const filtered = state.manufacturers.filter((n) => validMakeNames.includes(n));
      if (filtered.length !== state.manufacturers.length) {
        dispatch({ type: 'SET', field: 'manufacturers', value: filtered });
        return;   // let the rerun handle the model cleanup
      }
    }
    // Rule 3 — clear models when no makes
    if (state.manufacturers.length === 0 && state.models.length > 0) {
      dispatch({ type: 'SET', field: 'models', value: [] });
      return;
    }
    // Rule 2 — prune models that don't fit the cascaded options
    if (state.models.length > 0) {
      const filtered = state.models.filter((v) => validModelValues.includes(v));
      if (filtered.length !== state.models.length) {
        dispatch({ type: 'SET', field: 'models', value: filtered });
      }
    }
    // catsKey + makesKey strings cover the parent-change triggers; the
    // option-list arrays themselves change identity every render so we
    // intentionally don't depend on them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catsKey, makesKey]);

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
            options={decorateAndSortByCount(
              CATEGORIES.map(c => ({ value: c, label: c })),
              facets.categoryCounts,
              state.categories,
            )}
            selected={state.categories}
            onToggle={v => toggle('categories', v)}
            maxVisible={5}
            collapseZero
          />
        </div>

        {/* Make + nested Model tree — pick a make and its models step
            out indented below it. Replaces the older two-section pattern
            where Model lived in its own block beneath Make. */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Make &amp; Model</span>
          <MakeModelTree
            makes={makesDecorated}
            selectedMakes={state.manufacturers}
            onToggleMake={v => toggle('manufacturers', v)}
            modelsByMakeSlug={modelsByMakeSlug}
            selectedModels={state.models}
            onToggleModel={v => toggle('models', v)}
            maxVisibleMakes={5}
            maxVisibleModels={6}
          />
        </div>

        {/* Location */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Location</span>
          <CheckboxList
            options={decorateAndSortByCount(
              STATES.map(s => ({ value: s, label: s })),
              facets.stateCounts,
              state.states,
            )}
            selected={state.states}
            onToggle={v => toggle('states', v)}
            maxVisible={5}
            collapseZero
          />
        </div>

        {/* Condition */}
        <div className="fs-fc-field">
          <span className="fs-fc-label">Condition</span>
          <CheckboxList
            options={decorateAndSortByCount(
              CONDITIONS.map(c => ({ value: c, label: c })),
              facets.conditionCounts,
              state.conditions,
            )}
            selected={state.conditions}
            onToggle={v => toggle('conditions', v)}
            collapseZero
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
                options={decorateAndSortByCount(ENGINE_COUNTS, facets.engineCountCounts, state.engineCounts)}
                selected={state.engineCounts}
                onToggle={v => toggle('engineCounts', v)}
                maxVisible={3}
                collapseZero
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Engine type</span>
              <CheckboxList
                options={decorateAndSortByCount(ENGINE_TYPES, facets.engineTypeCounts, state.engineTypes)}
                selected={state.engineTypes}
                onToggle={v => toggle('engineTypes', v)}
                maxVisible={4}
                collapseZero
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Engine make</span>
              <CheckboxList
                options={decorateAndSortByCount(
                  ENGINE_MAKES.map(m => ({ value: m, label: m })),
                  facets.engineMakeCounts,
                  state.engineMakes,
                )}
                selected={state.engineMakes}
                onToggle={v => toggle('engineMakes', v)}
                maxVisible={5}
                searchable
                searchKey="Filter makes"
                collapseZero
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
                options={decorateAndSortByCount(
                  AVIONICS_SUITES.map(s => ({ value: s, label: s })),
                  facets.avSuiteCounts,
                  state.avionicsSuites,
                )}
                selected={state.avionicsSuites}
                onToggle={v => toggle('avionicsSuites', v)}
                maxVisible={5}
                collapseZero
              />
            </div>
            <div className="fs-fc-row">
              <span className="fs-fc-sublabel">Autopilot</span>
              <CheckboxList
                options={decorateAndSortByCount(
                  AUTOPILOTS.map(a => ({ value: a, label: a })),
                  facets.autopilotCounts,
                  state.autopilots,
                )}
                selected={state.autopilots}
                onToggle={v => toggle('autopilots', v)}
                maxVisible={5}
                collapseZero
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
                options={decorateAndSortByCount(DAMAGE_HISTORY, facets.damageCounts, state.damageHistory)}
                selected={state.damageHistory}
                onToggle={v => toggle('damageHistory', v)}
                maxVisible={3}
                collapseZero
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
