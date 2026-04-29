'use client';
import Link from 'next/link';
import FilterSection from './FilterSection';
import CheckboxList from './CheckboxList';
import NumberField from './NumberField';
import RangeSlider from './RangeSlider';
import { CATEGORIES, MANUFACTURERS, STATES, CONDITIONS } from '../../lib/constants';
import { SECTION_FIELDS, countActiveInSection, countActiveTotal, initialFilters } from '../../lib/filterReducer';

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

  const activeTotal = countActiveTotal(state);
  const perfActive = countActiveInSection(state, SECTION_FIELDS.performance);
  const engActive = countActiveInSection(state, SECTION_FIELDS.engine);
  const equipActive = countActiveInSection(state, SECTION_FIELDS.equipment);

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
            options={MANUFACTURERS.map(m => ({ value: m, label: m }))}
            selected={state.manufacturers}
            onToggle={v => toggle('manufacturers', v)}
            maxVisible={5}
            searchable
            searchKey="Filter makes"
          />
        </div>

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
              <span className="fs-fc-sublabel">Fuel burn</span>
              <NumberField prefix="Max" unit="L/hr" value={state.fuelBurnMax}
                onChange={v => setField('fuelBurnMax', v)} />
            </div>
          </FilterSection>

          <FilterSection
            title="Engine"
            activeCount={engActive}
            onReset={() => resetSection(SECTION_FIELDS.engine)}
          >
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
            <label className={`fs-fc-checkrow${state.ifrOnly ? ' on' : ''}`}>
              <input type="checkbox" checked={state.ifrOnly}
                onChange={e => setField('ifrOnly', e.target.checked)} />
              <span className="fs-fc-checkrow-label">IFR equipped</span>
            </label>
            <label className={`fs-fc-checkrow${state.glassOnly ? ' on' : ''}`}>
              <input type="checkbox" checked={state.glassOnly}
                onChange={e => setField('glassOnly', e.target.checked)} />
              <span className="fs-fc-checkrow-label">Glass cockpit</span>
            </label>
            <label className={`fs-fc-checkrow${state.retractable ? ' on' : ''}`}>
              <input type="checkbox" checked={state.retractable}
                onChange={e => setField('retractable', e.target.checked)} />
              <span className="fs-fc-checkrow-label">Retractable gear</span>
            </label>
            <label className={`fs-fc-checkrow${state.pressurised ? ' on' : ''}`}>
              <input type="checkbox" checked={state.pressurised}
                onChange={e => setField('pressurised', e.target.checked)} />
              <span className="fs-fc-checkrow-label">Pressurized</span>
            </label>
          </FilterSection>
        </>
      )}
    </div>
  );
}
