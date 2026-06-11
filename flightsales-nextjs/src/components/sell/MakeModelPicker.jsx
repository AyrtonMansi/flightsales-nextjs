'use client';

// MakeModelPicker — two-stage typeahead used by /sell to capture the
// aircraft make + model from the catalogue.
//
// Behaviour:
//   1. Type in the Make field → suggestions dropdown of MAKES.
//   2. Pick a make → Model field activates with that make's models only.
//   3. Type / pick a model → calls onPick({ make, model, modelRow }).
//      modelRow includes specs (mtow, seats, engine, etc.) so the parent
//      can auto-fill the rest of the listing form.
//
// Fail-safe: if the user can't find their aircraft in the suggestions,
// they can hit "Can't find it? Type manually" to fall back to the legacy
// free-text inputs that the parent component still renders.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useAircraftCatalogue, searchMakes, searchModels, findModel,
} from '../../lib/aircraftCatalogue';

export default function MakeModelPicker({
  initialMake = '',
  initialModel = '',
  onPick,
  onManualFallback,
}) {
  const catalogue = useAircraftCatalogue();

  // Resolve initial values — caller may pass display strings ("Cessna",
  // "172S Skyhawk") rather than slugs. Coerce to a make slug + model row
  // if we can find them.
  const initialMakeSlug = useMemo(() => {
    if (!initialMake) return '';
    const found = catalogue.makes.find(
      (mk) => mk.slug === initialMake || mk.name === initialMake
    );
    return found?.slug ?? '';
  }, [initialMake, catalogue.makes]);

  const initialModelRow = useMemo(() => {
    if (!initialModel) return null;
    return findModel(catalogue, initialModel);
  }, [initialModel, catalogue]);

  const [makeQuery, setMakeQuery] = useState(
    catalogue.makesBySlug.get(initialMakeSlug)?.name ?? ''
  );
  const [makeSlug, setMakeSlug] = useState(initialMakeSlug);
  const [modelQuery, setModelQuery] = useState(initialModelRow?.full_name ?? '');
  const [selectedModel, setSelectedModel] = useState(initialModelRow);

  const [makeOpen, setMakeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const makeWrapRef = useRef(null);
  const modelWrapRef = useRef(null);

  // Click-outside closes either dropdown.
  useEffect(() => {
    function onClick(e) {
      if (makeWrapRef.current && !makeWrapRef.current.contains(e.target)) {
        setMakeOpen(false);
      }
      if (modelWrapRef.current && !modelWrapRef.current.contains(e.target)) {
        setModelOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Suggestions
  const makeSuggestions = useMemo(
    () => searchMakes(catalogue, makeQuery, { limit: 10 }),
    [catalogue, makeQuery]
  );
  const modelSuggestions = useMemo(
    () => searchModels(catalogue, modelQuery, { limit: 12, makeSlug: makeSlug || null }),
    [catalogue, modelQuery, makeSlug]
  );

  function pickMake(mk) {
    setMakeSlug(mk.slug);
    setMakeQuery(mk.name);
    setMakeOpen(false);
    // Reset model when make changes
    if (selectedModel && selectedModel.make !== mk.slug) {
      setSelectedModel(null);
      setModelQuery('');
    }
  }

  function pickModel(mdl) {
    setSelectedModel(mdl);
    setModelQuery(mdl.full_name);
    setModelOpen(false);
    // If make wasn't set yet, infer it from the picked model
    if (!makeSlug) {
      const mk = catalogue.makesBySlug.get(mdl.make);
      if (mk) {
        setMakeSlug(mk.slug);
        setMakeQuery(mk.name);
      }
    }
    onPick?.({
      make: catalogue.makesBySlug.get(mdl.make),
      model: mdl,
    });
  }

  return (
    <div className="fs-mmp">
      <div className="fs-mmp-row">
        {/* MAKE FIELD */}
        <div className="fs-mmp-field" ref={makeWrapRef}>
          <label className="fs-mmp-label" htmlFor="mmp-make">Make</label>
          <input
            id="mmp-make"
            className="fs-mmp-input"
            type="text"
            autoComplete="off"
            placeholder="Cessna, Piper, Cirrus…"
            value={makeQuery}
            onChange={(e) => {
              setMakeQuery(e.target.value);
              setMakeSlug('');
              setMakeOpen(true);
            }}
            onFocus={() => setMakeOpen(true)}
            aria-autocomplete="list"
            aria-expanded={makeOpen}
          />
          {makeOpen && makeSuggestions.length > 0 && (
            <ul className="fs-mmp-pop" role="listbox">
              {makeSuggestions.map((mk) => (
                <li key={mk.slug}>
                  <button
                    type="button"
                    className="fs-mmp-opt"
                    onClick={() => pickMake(mk)}
                  >
                    <span className="fs-mmp-opt-name">{mk.name}</span>
                    {mk.country && <span className="fs-mmp-opt-meta">{mk.country}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* MODEL FIELD */}
        <div className="fs-mmp-field" ref={modelWrapRef}>
          <label className="fs-mmp-label" htmlFor="mmp-model">Model</label>
          <input
            id="mmp-model"
            className="fs-mmp-input"
            type="text"
            autoComplete="off"
            placeholder={makeSlug ? '172S Skyhawk, SR22T, R44…' : 'Pick a make first, or search any model'}
            value={modelQuery}
            onChange={(e) => {
              setModelQuery(e.target.value);
              setSelectedModel(null);
              setModelOpen(true);
            }}
            onFocus={() => setModelOpen(true)}
            aria-autocomplete="list"
            aria-expanded={modelOpen}
          />
          {modelOpen && modelSuggestions.length > 0 && (
            <ul className="fs-mmp-pop" role="listbox">
              {modelSuggestions.map((mdl) => (
                <li key={mdl.slug}>
                  <button
                    type="button"
                    className="fs-mmp-opt"
                    onClick={() => pickModel(mdl)}
                  >
                    <span className="fs-mmp-opt-name">{mdl.full_name}</span>
                    <span className="fs-mmp-opt-meta">
                      {mdl.type_designator && <code>{mdl.type_designator}</code>}
                      {mdl.year_first && (
                        <span> {mdl.year_first}{mdl.year_last ? `–${mdl.year_last}` : '+'}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Specs preview when model selected — gives instant feedback that
          auto-fill is happening + lets the user verify before continuing. */}
      {selectedModel && (
        <div className="fs-mmp-specs">
          {selectedModel.category && <Spec label="Category" value={selectedModel.category} />}
          {selectedModel.seats != null && <Spec label="Seats" value={selectedModel.seats} />}
          {selectedModel.mtow_kg != null && <Spec label="MTOW" value={`${selectedModel.mtow_kg} kg`} />}
          {selectedModel.engine_type && <Spec label="Engine" value={selectedModel.engine_type} />}
          {selectedModel.cruise_kts != null && <Spec label="Cruise" value={`${selectedModel.cruise_kts} kts`} />}
          {selectedModel.range_nm != null && <Spec label="Range" value={`${selectedModel.range_nm} nm`} />}
        </div>
      )}

      {onManualFallback && (
        <button
          type="button"
          className="fs-mmp-fallback"
          onClick={onManualFallback}
        >
          Can&apos;t find your aircraft? Enter make / model manually →
        </button>
      )}
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <span className="fs-mmp-spec">
      <span className="fs-mmp-spec-label">{label}</span>
      <span className="fs-mmp-spec-value">{value}</span>
    </span>
  );
}
