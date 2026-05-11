'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  WORLD_REGIONS,
  orderRegionsForUser,
  regionKeyForCountry,
} from '../../lib/worldRegions';

// Region → Country → Subdivision cascade. Mirrors the Make → Model
// tree pattern from MakeModelTree.jsx but with three levels.
//
// Default-collapsed: shows the top 3 regions only. "Show all regions"
// expands the rest. The region matching the user's geo-IP country is
// floated to the top — so an Australian visitor sees Oceania first,
// a US visitor sees North America first, etc.
//
// Selection state lives in the parent reducer as two arrays:
//   - state.countries (e.g. ['AU', 'US'])  — country-level matches
//   - state.states    (e.g. ['NSW', 'CA'])  — subdivision codes
//
// Either array can be empty independently. The query layer ORs
// country-level and AND-merges country+subdivision matches.

const DEFAULT_REGION_LIMIT = 3;

export default function LocationCascade({
  selectedCountries = [],
  selectedStates = [],
  onToggleCountry,
  onToggleState,
}) {
  const [userCountry, setUserCountry] = useState(null);
  const [expandAll, setExpandAll] = useState(false);
  const [openRegions, setOpenRegions] = useState(new Set());
  const [openCountries, setOpenCountries] = useState(new Set());

  // Detect the user's country once on mount. Soft-fail: when /api/geo
  // returns null or the request errors, the cascade just uses the
  // default region order (Oceania → North America → Europe → ...).
  useEffect(() => {
    fetch('/api/geo', { cache: 'force-cache' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.country) setUserCountry(j.country);
      })
      .catch(() => { /* leave as null */ });
  }, []);

  const userRegionKey = regionKeyForCountry(userCountry);

  // Whenever the user's region resolves, pre-open it AND pre-open
  // their country if it has subdivisions. That way an Aussie sees
  // "Oceania > Australia > [NSW VIC QLD ...]" on first paint — no
  // clicks needed.
  useEffect(() => {
    if (!userRegionKey) return;
    setOpenRegions((prev) => {
      const next = new Set(prev);
      next.add(userRegionKey);
      return next;
    });
    if (userCountry) {
      setOpenCountries((prev) => {
        const next = new Set(prev);
        next.add(userCountry);
        return next;
      });
    }
  }, [userRegionKey, userCountry]);

  const orderedRegions = useMemo(() => orderRegionsForUser(userRegionKey), [userRegionKey]);
  const visibleRegions = expandAll ? orderedRegions : orderedRegions.slice(0, DEFAULT_REGION_LIMIT);
  const hiddenRegions = orderedRegions.length - visibleRegions.length;

  const toggleRegion = (key) => {
    setOpenRegions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const toggleCountryOpen = (code) => {
    setOpenCountries((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  return (
    <div className="fs-loc-cascade">
      {visibleRegions.map((region) => {
        const isOpen = openRegions.has(region.key);
        const regionSelectedCount = region.countries.reduce(
          (n, c) => n + (selectedCountries.includes(c.code) ? 1 : 0),
          0,
        );
        return (
          <div key={region.key} className="fs-loc-region">
            <button
              type="button"
              className={`fs-loc-row fs-loc-region-row${isOpen ? ' open' : ''}`}
              onClick={() => toggleRegion(region.key)}
              aria-expanded={isOpen}
            >
              <span className="fs-loc-caret" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
              <span className="fs-loc-name">{region.name}</span>
              {regionSelectedCount > 0 && (
                <span className="fs-loc-badge">{regionSelectedCount}</span>
              )}
            </button>

            {isOpen && (
              <div className="fs-loc-children">
                {region.countries.map((country) => {
                  const hasSubs = !!country.subdivisions?.length;
                  const isCountrySelected = selectedCountries.includes(country.code);
                  const subSelectedCount = hasSubs
                    ? country.subdivisions.reduce(
                        (n, s) => n + (selectedStates.includes(s.code) ? 1 : 0),
                        0,
                      )
                    : 0;
                  const isCountryOpen = openCountries.has(country.code);
                  return (
                    <div key={country.code} className="fs-loc-country">
                      <div className="fs-loc-row fs-loc-country-row">
                        <label className="fs-loc-checkrow">
                          <input
                            type="checkbox"
                            checked={isCountrySelected}
                            onChange={() => onToggleCountry?.(country.code)}
                          />
                          <span className="fs-loc-name">{country.name}</span>
                        </label>
                        {hasSubs && (
                          <button
                            type="button"
                            className="fs-loc-expand"
                            onClick={() => toggleCountryOpen(country.code)}
                            aria-expanded={isCountryOpen}
                            aria-label={isCountryOpen ? `Collapse ${country.name} states` : `Expand ${country.name} states`}
                          >
                            {isCountryOpen ? '▾' : '▸'}
                            {subSelectedCount > 0 && (
                              <span className="fs-loc-badge fs-loc-badge-sm">{subSelectedCount}</span>
                            )}
                          </button>
                        )}
                      </div>

                      {hasSubs && isCountryOpen && (
                        <div className="fs-loc-subs">
                          {country.subdivisions.map((sub) => (
                            <label key={sub.code} className="fs-loc-checkrow fs-loc-sub">
                              <input
                                type="checkbox"
                                checked={selectedStates.includes(sub.code)}
                                onChange={() => onToggleState?.(sub.code)}
                              />
                              <span className="fs-loc-name">{sub.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {hiddenRegions > 0 && (
        <button
          type="button"
          className="fs-loc-more"
          onClick={() => setExpandAll(true)}
        >
          Show {hiddenRegions} more region{hiddenRegions === 1 ? '' : 's'}
        </button>
      )}
      {expandAll && orderedRegions.length > DEFAULT_REGION_LIMIT && (
        <button
          type="button"
          className="fs-loc-more"
          onClick={() => setExpandAll(false)}
        >
          Show fewer
        </button>
      )}
    </div>
  );
}
