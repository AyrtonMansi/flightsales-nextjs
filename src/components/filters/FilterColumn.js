'use client';

import { useEffect, useMemo, useState } from 'react';
import CheckboxList from './CheckboxList';
import MakeModelTree from './MakeModelTree';
import NumberField from './NumberField';
import RangeSlider from './RangeSlider';
import LocationCascade from './LocationCascade';
import { CATEGORIES, MANUFACTURERS, CONDITIONS } from '../../lib/constants';
import { useAircraftCatalogue, makesForCategories, modelsForMakesAndCategories } from '../../lib/aircraftCatalogue';
import { SECTION_FIELDS, countActiveInSection, countActiveTotal, initialFilters } from '../../lib/filterReducer';
import { useFacets, decorateAndSortByCount } from '../../lib/useFacets';
import styles from './FilterColumnPro.module.css';

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
const ENGINE_MAKES = ['Continental', 'Lycoming', 'Pratt & Whitney', 'Williams', 'Rolls-Royce', 'Rotax', 'Jabiru', 'Honeywell', 'GE Aviation', 'Pipistrel'];
const AVIONICS_SUITES = ['Garmin G1000/NXi', 'Garmin G3X', 'Garmin G500/600', 'Avidyne', 'Dynon', 'Aspen', 'Steam gauges'];
const AUTOPILOTS = ['GFC700', 'KAP140', 'S-TEC', 'TruTrak', 'None'];
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

function shortList(values, fallback = 'Any') {
  if (!values?.length) return fallback;
  if (values.length === 1) return values[0];
  return `${values[0]} +${values.length - 1}`;
}

function moneyShort(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}m`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

function rangeSummary(min, max, formatter = String, fallback = 'Any') {
  if (!min && !max) return fallback;
  if (min && max) return `${formatter(min)}–${formatter(max)}`;
  if (min) return `${formatter(min)}+`;
  return `Up to ${formatter(max)}`;
}

function FacetSection({ title, summary, activeCount = 0, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `facet-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className={`${styles.section}${open ? ` ${styles.sectionOpen}` : ''}`}>
      <button
        type="button"
        className={styles.sectionButton}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(v => !v)}
      >
        <span className={styles.sectionText}>
          <span className={styles.sectionTitle}>{title}</span>
          {!open && summary && <span className={styles.sectionSummary}>{summary}</span>}
        </span>
        <span className={styles.sectionMeta}>
          {activeCount > 0 && <span className={styles.activeBadge}>{activeCount}</span>}
          <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </button>
      {open && <div id={id} className={styles.sectionBody}>{children}</div>}
    </section>
  );
}

export default function FilterColumn({ state, dispatch, total }) {
  const setField = (field, value) => dispatch({ type: 'SET', field, value });
  const toggle = (field, value) => dispatch({ type: 'TOGGLE_IN_ARRAY', field, value });
  const catalogue = useAircraftCatalogue();
  const facets = useFacets(state);

  const allMakes = catalogue.makes.length > 0
    ? catalogue.makes
    : MANUFACTURERS.map((name) => ({ slug: name.toLowerCase(), name }));
  const makesFilteredByType = state.categories.length === 0 ? allMakes : makesForCategories(catalogue, state.categories);
  const makesDecorated = decorateAndSortByCount(
    makesFilteredByType.map(mk => ({ value: mk.name, label: mk.name, slug: mk.slug })),
    facets.makeCounts,
    state.manufacturers,
  );

  const selectedMakeSlugs = state.manufacturers
    .map(name => allMakes.find(mk => mk.name === name)?.slug)
    .filter(Boolean);

  const modelsByMakeSlug = useMemo(() => {
    const out = {};
    for (const slug of selectedMakeSlugs) {
      const list = modelsForMakesAndCategories(catalogue, [slug], state.categories)
        .map(mdl => {
          const value = mdl.variant ? `${mdl.family} ${mdl.variant}`.trim() : mdl.family;
          return { value, label: value };
        })
        .filter((opt, i, arr) => arr.findIndex(o => o.value === opt.value) === i);
      out[slug] = decorateAndSortByCount(list, facets.modelCounts, state.models);
    }
    return out;
  }, [catalogue, facets.modelCounts, selectedMakeSlugs, state.categories, state.models]);

  const validMakeNames = makesDecorated.map(o => o.value);
  const validModelValues = Object.values(modelsByMakeSlug).flat().map(o => o.value);
  const catsKey = state.categories.join('|');
  const makesKey = state.manufacturers.join('|');

  useEffect(() => {
    if (state.categories.length && state.manufacturers.length) {
      const next = state.manufacturers.filter(name => validMakeNames.includes(name));
      if (next.length !== state.manufacturers.length) {
        dispatch({ type: 'SET', field: 'manufacturers', value: next });
        return;
      }
    }
    if (!state.manufacturers.length && state.models.length) {
      dispatch({ type: 'SET', field: 'models', value: [] });
      return;
    }
    if (state.models.length) {
      const next = state.models.filter(value => validModelValues.includes(value));
      if (next.length !== state.models.length) dispatch({ type: 'SET', field: 'models', value: next });
    }
    // Parent filter changes are the only intended cleanup trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catsKey, makesKey]);

  const perfActive = countActiveInSection(state, SECTION_FIELDS.performance);
  const engActive = countActiveInSection(state, SECTION_FIELDS.engine);
  const equipActive = countActiveInSection(state, SECTION_FIELDS.equipment);
  const histActive = countActiveInSection(state, SECTION_FIELDS.history);
  const railActiveTotal = Math.max(0, countActiveTotal(state) - (state.search ? 1 : 0));

  const resetFields = (fields) => dispatch({
    type: 'RESET_SECTION',
    fields: fields.reduce((acc, field) => {
      const value = initialFilters[field];
      acc[field] = Array.isArray(value) ? [] : value;
      return acc;
    }, {}),
  });
  const clearRail = () => dispatch({
    type: 'HYDRATE',
    payload: { ...initialFilters, search: state.search, sortBy: state.sortBy },
  });

  const Bool = ({ field, label }) => (
    <label className={`fs-fc-checkrow${state[field] ? ' on' : ''}`}>
      <input type="checkbox" checked={!!state[field]} onChange={e => setField(field, e.target.checked)} />
      <span className="fs-fc-checkrow-label">{label}</span>
    </label>
  );

  const sellerSummary = state.dealerOnly ? 'Dealer' : state.privateOnly ? 'Private' : state.featuredOnly ? 'Featured only' : 'Any seller';
  const listingActive = (state.conditions.length ? 1 : 0) + (state.dealerOnly || state.privateOnly ? 1 : 0) + (state.featuredOnly ? 1 : 0);

  return (
    <div className={styles.rail}>
      <div className={styles.header}>
        <div>
          <div className={styles.headerTitle}>Refine</div>
          <div className={styles.headerCount} aria-live="polite">
            {Number(total || 0).toLocaleString()} {Number(total) === 1 ? 'aircraft' : 'aircraft'}
          </div>
        </div>
        {railActiveTotal > 0 && (
          <button type="button" className={styles.clearButton} onClick={clearRail}>Clear</button>
        )}
      </div>

      <FacetSection title="Aircraft type" summary={shortList(state.categories, 'All types')} activeCount={state.categories.length ? 1 : 0} defaultOpen>
        <CheckboxList
          options={decorateAndSortByCount(CATEGORIES.map(value => ({ value, label: value })), facets.categoryCounts, state.categories)}
          selected={state.categories}
          onToggle={value => toggle('categories', value)}
          maxVisible={6}
          collapseZero
        />
      </FacetSection>

      <FacetSection title="Make & model" summary={state.models.length ? shortList(state.models) : shortList(state.manufacturers, 'All makes')} activeCount={(state.manufacturers.length ? 1 : 0) + (state.models.length ? 1 : 0)} defaultOpen={state.manufacturers.length > 0}>
        <MakeModelTree
          makes={makesDecorated}
          selectedMakes={state.manufacturers}
          onToggleMake={value => toggle('manufacturers', value)}
          modelsByMakeSlug={modelsByMakeSlug}
          selectedModels={state.models}
          onToggleModel={value => toggle('models', value)}
          maxVisibleMakes={6}
          maxVisibleModels={6}
        />
      </FacetSection>

      <FacetSection title="Location" summary={state.states.length ? shortList(state.states) : shortList(state.countries, 'Anywhere')} activeCount={(state.countries.length ? 1 : 0) + (state.states.length ? 1 : 0)} defaultOpen={state.countries.length > 0 || state.states.length > 0}>
        <LocationCascade
          selectedCountries={state.countries}
          selectedStates={state.states}
          onToggleCountry={value => toggle('countries', value)}
          onToggleState={value => toggle('states', value)}
          countryCounts={facets.countryCounts}
          stateCounts={facets.stateCounts}
        />
      </FacetSection>

      <FacetSection
        title="Price & year"
        summary={state.minPrice || state.maxPrice
          ? rangeSummary(state.minPrice, state.maxPrice, moneyShort)
          : rangeSummary(state.yearFrom, state.yearTo, String, 'Any price · Any year')}
        activeCount={(state.minPrice || state.maxPrice ? 1 : 0) + (state.yearFrom || state.yearTo ? 1 : 0)}
        defaultOpen={!!(state.minPrice || state.maxPrice || state.yearFrom || state.yearTo)}
      >
        <div className="fs-fc-row">
          <span className="fs-fc-sublabel">Price</span>
          <RangeSlider
            min={0} max={15_000_000} step={50_000}
            minValue={state.minPrice} maxValue={state.maxPrice}
            onChange={({ min, max }) => {
              setField('minPrice', min === '0' ? '' : min);
              setField('maxPrice', max === '15000000' ? '' : max);
            }}
            format={moneyShort}
          />
        </div>
        <div className="fs-fc-row">
          <span className="fs-fc-sublabel">Year</span>
          <RangeSlider
            min={1960} max={2026} step={1}
            minValue={state.yearFrom} maxValue={state.yearTo}
            onChange={({ min, max }) => {
              setField('yearFrom', min === '1960' ? '' : min);
              setField('yearTo', max === '2026' ? '' : max);
            }}
            format={n => String(Math.round(Number(n)))}
          />
        </div>
      </FacetSection>

      <FacetSection title="Listing" summary={state.conditions.length ? `${shortList(state.conditions)} · ${sellerSummary}` : sellerSummary} activeCount={listingActive} defaultOpen={listingActive > 0}>
        <div className="fs-fc-row">
          <span className="fs-fc-sublabel">Condition</span>
          <CheckboxList
            options={decorateAndSortByCount(CONDITIONS.map(value => ({ value, label: value })), facets.conditionCounts, state.conditions)}
            selected={state.conditions}
            onToggle={value => toggle('conditions', value)}
            collapseZero
          />
        </div>
        <div className="fs-fc-row">
          <span className="fs-fc-sublabel">Seller</span>
          <label className={`fs-fc-checkrow${state.dealerOnly ? ' on' : ''}`}>
            <input type="checkbox" checked={state.dealerOnly} onChange={() => {
              const next = !state.dealerOnly;
              setField('dealerOnly', next);
              if (next) setField('privateOnly', false);
            }} />
            <span className="fs-fc-checkrow-label">Dealer</span>
          </label>
          <label className={`fs-fc-checkrow${state.privateOnly ? ' on' : ''}`}>
            <input type="checkbox" checked={state.privateOnly} onChange={() => {
              const next = !state.privateOnly;
              setField('privateOnly', next);
              if (next) setField('dealerOnly', false);
            }} />
            <span className="fs-fc-checkrow-label">Private seller</span>
          </label>
          <Bool field="featuredOnly" label="Featured only" />
        </div>
      </FacetSection>

      <div className={styles.advancedLabel}>Aircraft specifications</div>

      <FacetSection title="Performance" summary={perfActive ? `${perfActive} selected` : 'Speed, range, payload'} activeCount={perfActive} defaultOpen={perfActive > 0}>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Cruise speed</span><NumberField prefix="Min" unit="kts" value={state.cruiseMin} onChange={v => setField('cruiseMin', v)} /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Range</span><NumberField prefix="Min" unit="NM" value={state.rangeMin} onChange={v => setField('rangeMin', v)} /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Useful load</span><NumberField prefix="Min" unit="kg" value={state.usefulLoadMin} onChange={v => setField('usefulLoadMin', v)} /></div>
        <div className="fs-fc-row">
          <span className="fs-fc-sublabel">MTOW</span>
          <RangeSlider min={0} max={10_000} step={100} minValue={state.mtowMin} maxValue={state.mtowMax} onChange={({ min, max }) => { setField('mtowMin', min === '0' ? '' : min); setField('mtowMax', max === '10000' ? '' : max); }} format={n => `${Number(n).toLocaleString()} kg`} />
        </div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Fuel burn</span><NumberField prefix="Max" unit="L/hr" value={state.fuelBurnMax} onChange={v => setField('fuelBurnMax', v)} /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Service ceiling</span><NumberField prefix="Min" unit="ft" value={state.ceilingMin} onChange={v => setField('ceilingMin', v)} step={500} /></div>
        {perfActive > 0 && <button type="button" className={styles.sectionClear} onClick={() => resetFields(SECTION_FIELDS.performance)}>Clear performance</button>}
      </FacetSection>

      <FacetSection title="Engine" summary={engActive ? `${engActive} selected` : 'Type, hours, overhaul'} activeCount={engActive} defaultOpen={engActive > 0}>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Engine count</span><CheckboxList options={decorateAndSortByCount(ENGINE_COUNTS, facets.engineCountCounts, state.engineCounts)} selected={state.engineCounts} onToggle={v => toggle('engineCounts', v)} maxVisible={3} collapseZero /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Engine type</span><CheckboxList options={decorateAndSortByCount(ENGINE_TYPES, facets.engineTypeCounts, state.engineTypes)} selected={state.engineTypes} onToggle={v => toggle('engineTypes', v)} maxVisible={4} collapseZero /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Engine make</span><CheckboxList options={decorateAndSortByCount(ENGINE_MAKES.map(value => ({ value, label: value })), facets.engineMakeCounts, state.engineMakes)} selected={state.engineMakes} onToggle={v => toggle('engineMakes', v)} maxVisible={5} searchable searchKey="Filter engine makes" collapseZero /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Hours since major overhaul</span><NumberField prefix="Max" unit="hrs" value={state.smohMax} onChange={v => setField('smohMax', v)} /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">TBO remaining</span><NumberField prefix="Min" unit="%" value={state.tboPctMin} onChange={v => setField('tboPctMin', v)} min={0} step={5} /></div>
        {engActive > 0 && <button type="button" className={styles.sectionClear} onClick={() => resetFields(SECTION_FIELDS.engine)}>Clear engine</button>}
      </FacetSection>

      <FacetSection title="Avionics & equipment" summary={equipActive ? `${equipActive} selected` : 'IFR, glass, equipment'} activeCount={equipActive} defaultOpen={equipActive > 0}>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Avionics suite</span><CheckboxList options={decorateAndSortByCount(AVIONICS_SUITES.map(value => ({ value, label: value })), facets.avSuiteCounts, state.avionicsSuites)} selected={state.avionicsSuites} onToggle={v => toggle('avionicsSuites', v)} maxVisible={5} collapseZero /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Autopilot</span><CheckboxList options={decorateAndSortByCount(AUTOPILOTS.map(value => ({ value, label: value })), facets.autopilotCounts, state.autopilots)} selected={state.autopilots} onToggle={v => toggle('autopilots', v)} maxVisible={5} collapseZero /></div>
        <div className="fs-fc-row">
          <span className="fs-fc-sublabel">Equipment</span>
          <Bool field="ifrOnly" label="IFR equipped" /><Bool field="glassOnly" label="Glass cockpit" /><Bool field="adsbIn" label="ADS-B In" /><Bool field="adsbOut" label="ADS-B Out" /><Bool field="synVis" label="Synthetic vision" /><Bool field="deIce" label="TKS / FIKI de-ice" /><Bool field="airCon" label="Air conditioning" /><Bool field="pressurised" label="Pressurised" /><Bool field="retractable" label="Retractable gear" /><Bool field="cargoDoor" label="Cargo door / pod" /><Bool field="parachute" label="BRS / CAPS parachute" />
        </div>
        {equipActive > 0 && <button type="button" className={styles.sectionClear} onClick={() => resetFields(SECTION_FIELDS.equipment)}>Clear equipment</button>}
      </FacetSection>

      <FacetSection title="History & ownership" summary={histActive ? `${histActive} selected` : 'Damage, logs, storage'} activeCount={histActive} defaultOpen={histActive > 0}>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Damage history</span><CheckboxList options={decorateAndSortByCount(DAMAGE_HISTORY, facets.damageCounts, state.damageHistory)} selected={state.damageHistory} onToggle={v => toggle('damageHistory', v)} maxVisible={3} collapseZero /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Records & storage</span><Bool field="hangared" label="Hangared" /><Bool field="logbooksComplete" label="Complete logbooks" /></div>
        <div className="fs-fc-row"><span className="fs-fc-sublabel">Owner count</span><CheckboxList options={OWNER_COUNTS} selected={state.ownerMaxCount ? [state.ownerMaxCount] : []} onToggle={v => setField('ownerMaxCount', state.ownerMaxCount === v ? '' : v)} maxVisible={3} /></div>
        {histActive > 0 && <button type="button" className={styles.sectionClear} onClick={() => resetFields(SECTION_FIELDS.history)}>Clear history</button>}
      </FacetSection>
    </div>
  );
}
