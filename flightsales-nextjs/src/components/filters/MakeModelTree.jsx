'use client';
import { useMemo, useState } from 'react';

// Faceted Make filter that nests each make's models below it as a
// disclosure tree. Tick a make → its models step out indented; untick →
// model selections under it clear via the cascade in FilterColumn.
//
// Replaces the previous two-section pattern (one Make CheckboxList, one
// Model CheckboxList that only appeared after at least one make was
// selected). The tree is cleaner because:
//   - parent-child relationship is visible at a glance
//   - no "where did the Model section go?" disappearing UI
//   - works for multi-make selection: pick Robinson + Bell, see both
//     groups of models inline
//
// Props:
//   makes              [{ value, label, count, slug }]
//   selectedMakes      [string]      — make values currently ticked
//   onToggleMake       (value) => void
//   modelsByMakeSlug   { [slug]: [{ value, label, count }] }
//   selectedModels     [string]      — model values currently ticked
//   onToggleModel      (value) => void
//   maxVisibleMakes    show "Show N more" beyond this many
//   maxVisibleModels   per-make collapse for long model lists

export default function MakeModelTree({
  makes,
  selectedMakes,
  onToggleMake,
  modelsByMakeSlug,
  selectedModels,
  onToggleModel,
  maxVisibleMakes = 5,
  maxVisibleModels = 6,
}) {
  const [expanded, setExpanded] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Split makes into "active" (count > 0 OR selected) and "dormant"
  // (count = 0 AND not selected) so dead options sink behind "Show more".
  const { active, dormant } = useMemo(() => {
    const sel = new Set(selectedMakes);
    const a = []; const d = [];
    for (const mk of makes) {
      const c = mk.count ?? 0;
      if (c > 0 || sel.has(mk.value)) a.push(mk);
      else d.push(mk);
    }
    return { active: a, dormant: d };
  }, [makes, selectedMakes]);

  const visibleMakes = useMemo(() => {
    if (filterText) {
      const q = filterText.toLowerCase();
      return [...active, ...dormant].filter(o =>
        o.label.toLowerCase().includes(q)
      );
    }
    if (expanded) return [...active, ...dormant];
    return active.slice(0, maxVisibleMakes);
  }, [active, dormant, filterText, expanded, maxVisibleMakes]);

  const moreCount = (expanded || filterText)
    ? 0
    : Math.max(0, active.length - maxVisibleMakes) + dormant.length;

  return (
    <div className="fs-fc-checklist">
      {makes.length > maxVisibleMakes && (
        <div className="fs-fc-checklist-search">
          <input
            type="text"
            placeholder="Filter makes"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            aria-label="Filter makes"
          />
        </div>
      )}

      {visibleMakes.map(mk => {
        const isOn = selectedMakes.includes(mk.value);
        const isZero = (mk.count ?? 0) === 0 && !isOn;
        const models = modelsByMakeSlug[mk.slug] ?? [];
        return (
          <div key={mk.value} className="fs-mmt-make">
            <label className={`fs-fc-checkrow${isOn ? ' on' : ''}${isZero ? ' zero' : ''}`}>
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => onToggleMake(mk.value)}
              />
              <span className="fs-fc-checkrow-label">{mk.label}</span>
              {typeof mk.count === 'number' && (
                <span className="fs-fc-checkrow-count" aria-label={`${mk.count} listings`}>
                  {mk.count.toLocaleString()}
                </span>
              )}
            </label>

            {isOn && models.length > 0 && (
              <ModelChildList
                models={models}
                selectedModels={selectedModels}
                onToggleModel={onToggleModel}
                maxVisible={maxVisibleModels}
              />
            )}
          </div>
        );
      })}

      {visibleMakes.length === 0 && filterText && (
        <p className="fs-fc-empty">No matches</p>
      )}

      {moreCount > 0 && (
        <button
          type="button"
          className="fs-fc-more"
          onClick={() => setExpanded(true)}
        >
          Show {moreCount} more
        </button>
      )}
      {expanded && makes.length > maxVisibleMakes && (
        <button
          type="button"
          className="fs-fc-more"
          onClick={() => setExpanded(false)}
        >
          Show less
        </button>
      )}
    </div>
  );
}

// Child list — same selected-pinned + zero-collapse + maxVisible rules
// as CheckboxList, but rendered indented under its parent make.
function ModelChildList({ models, selectedModels, onToggleModel, maxVisible }) {
  const [expanded, setExpanded] = useState(false);

  const { active, dormant } = useMemo(() => {
    const sel = new Set(selectedModels);
    const a = []; const d = [];
    for (const m of models) {
      const c = m.count ?? 0;
      if (c > 0 || sel.has(m.value)) a.push(m);
      else d.push(m);
    }
    return { active: a, dormant: d };
  }, [models, selectedModels]);

  const visible = expanded
    ? [...active, ...dormant]
    : active.slice(0, maxVisible);

  const moreCount = expanded
    ? 0
    : Math.max(0, active.length - maxVisible) + dormant.length;

  return (
    <div className="fs-mmt-models">
      {visible.map(mdl => {
        const isOn = selectedModels.includes(mdl.value);
        const isZero = (mdl.count ?? 0) === 0 && !isOn;
        return (
          <label
            key={mdl.value}
            className={`fs-fc-checkrow fs-mmt-model${isOn ? ' on' : ''}${isZero ? ' zero' : ''}`}
          >
            <input
              type="checkbox"
              checked={isOn}
              onChange={() => onToggleModel(mdl.value)}
            />
            <span className="fs-fc-checkrow-label">{mdl.label}</span>
            {typeof mdl.count === 'number' && (
              <span className="fs-fc-checkrow-count" aria-label={`${mdl.count} listings`}>
                {mdl.count.toLocaleString()}
              </span>
            )}
          </label>
        );
      })}

      {moreCount > 0 && (
        <button
          type="button"
          className="fs-fc-more fs-mmt-more"
          onClick={() => setExpanded(true)}
        >
          Show {moreCount} more
        </button>
      )}
      {expanded && active.length + dormant.length > maxVisible && (
        <button
          type="button"
          className="fs-fc-more fs-mmt-more"
          onClick={() => setExpanded(false)}
        >
          Show less
        </button>
      )}
    </div>
  );
}
