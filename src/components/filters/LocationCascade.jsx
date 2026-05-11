'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  WORLD_REGIONS,
  orderRegionsForUser,
  regionKeyForCountry,
} from '../../lib/worldRegions';

// Region → Country → Subdivision cascade.
//
// Visibility rules (the "hybrid" pattern):
//   - Region appears if ANY of its countries has listings, OR it
//     contains the user's home country (we always pin the user's
//     own region).
//   - Country appears if it has listings, OR it's the user's home
//     country (always pinned, even at zero listings — disorientation
//     defence so a US visitor doesn't open the filter and see no US).
//   - Subdivision (state / province) appears if it has listings.
//     The user's home country is always expanded with its top
//     subdivisions visible.
//
// A "Show all locations" toggle bypasses the count filter for power
// users who want to type-ahead or set up a saved search before stock
// arrives. Count badges on regions/countries reflect the FACET count
// (matches that would result if you ticked that filter); they're the
// same numbers the make/model facets show.

const DEFAULT_REGION_LIMIT = 3;

export default function LocationCascade({
  selectedCountries = [],
  selectedStates = [],
  onToggleCountry,
  onToggleState,
  countryCounts,     // Map<countryCode, number>  (from useFacets)
  stateCounts,       // Map<stateCode, number>    (from useFacets)
}) {
  const [userCountry, setUserCountry] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [openRegions, setOpenRegions] = useState(new Set());
  const [openCountries, setOpenCountries] = useState(new Set());

  // Detect the user's country once on mount. Soft-fail: when /api/geo
  // returns null or the request errors, the cascade just falls back
  // to the default region order with no pinned country.
  useEffect(() => {
    fetch('/api/geo', { cache: 'force-cache' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.country) setUserCountry(j.country);
      })
      .catch(() => { /* leave as null */ });
  }, []);

  const userRegionKey = regionKeyForCountry(userCountry);

  // Auto-open the user's region + country once the geo resolves.
  useEffect(() => {
    if (!userRegionKey) return;
    setOpenRegions((prev) => {
      if (prev.has(userRegionKey)) return prev;
      const next = new Set(prev);
      next.add(userRegionKey);
      return next;
    });
    if (userCountry) {
      setOpenCountries((prev) => {
        if (prev.has(userCountry)) return prev;
        const next = new Set(prev);
        next.add(userCountry);
        return next;
      });
    }
  }, [userRegionKey, userCountry]);

  // Helpers for count lookups — accept Map or plain object.
  const countFor = (map, key) => {
    if (!map) return 0;
    if (typeof map.get === 'function') return map.get(key) || 0;
    return map[key] || 0;
  };

  // Build the visible-region/country list using the hybrid rule.
  // "showAll" toggle bypasses the count filter entirely.
  const orderedRegions = useMemo(() => orderRegionsForUser(userRegionKey), [userRegionKey]);

  const filteredRegions = useMemo(() => {
    if (showAll) return orderedRegions;
    return orderedRegions
      .map((region) => {
        const countriesWithStock = region.countries.filter((c) => {
          if (c.code === userCountry) return true;                   // always pin home country
          if (selectedCountries.includes(c.code)) return true;       // keep selected visible
          return countFor(countryCounts, c.code) > 0;
        });
        const isHomeRegion = region.key === userRegionKey;
        const keepRegion = isHomeRegion || countriesWithStock.length > 0;
        if (!keepRegion) return null;
        return { ...region, countries: countriesWithStock };
      })
      .filter(Boolean);
  }, [orderedRegions, countryCounts, userCountry, userRegionKey, selectedCountries, showAll]);

  const visibleRegions = expandAll ? filteredRegions : filteredRegions.slice(0, DEFAULT_REGION_LIMIT);
  const hiddenRegions = filteredRegions.length - visibleRegions.length;

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

  // When the count map is empty (still loading on first paint, or
  // zero universe), don't aggressively cull — fall back to showing
  // everything. This avoids a flash of empty filter.
  const totalCounted = useMemo(() => {
    if (!countryCounts) return 0;
    if (typeof countryCounts.size === 'number' && countryCounts.size > 0) return countryCounts.size;
    return Object.keys(countryCounts || {}).length;
  }, [countryCounts]);
  const effectiveRegions = totalCounted === 0 && !showAll ? orderedRegions.slice(0, DEFAULT_REGION_LIMIT) : visibleRegions;

  return (
    <div className="fs-loc-cascade">
      {effectiveRegions.map((region) => {
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
                  const cCount = countFor(countryCounts, country.code);
                  // Subdivision filter: only show subs that have stock,
                  // OR all subs when the user is browsing their home
                  // country (helps them see neighbouring states they
                  // might want to set a saved-search for), OR when
                  // showAll is on.
                  const subsToShow = hasSubs
                    ? country.subdivisions.filter((s) => {
                        if (showAll) return true;
                        if (country.code === userCountry) return true;
                        if (selectedStates.includes(s.code)) return true;
                        return countFor(stateCounts, s.code) > 0;
                      })
                    : [];
                  const subSelectedCount = subsToShow.reduce(
                    (n, s) => n + (selectedStates.includes(s.code) ? 1 : 0),
                    0,
                  );
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
                          {cCount > 0 && (
                            <span className="fs-loc-count">{cCount}</span>
                          )}
                        </label>
                        {subsToShow.length > 0 && (
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

                      {subsToShow.length > 0 && isCountryOpen && (
                        <div className="fs-loc-subs">
                          {subsToShow.map((sub) => {
                            const sCount = countFor(stateCounts, sub.code);
                            return (
                              <label key={sub.code} className="fs-loc-checkrow fs-loc-sub">
                                <input
                                  type="checkbox"
                                  checked={selectedStates.includes(sub.code)}
                                  onChange={() => onToggleState?.(sub.code)}
                                />
                                <span className="fs-loc-name">{sub.name}</span>
                                {sCount > 0 && <span className="fs-loc-count">{sCount}</span>}
                              </label>
                            );
                          })}
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

      {hiddenRegions > 0 && !expandAll && (
        <button
          type="button"
          className="fs-loc-more"
          onClick={() => setExpandAll(true)}
        >
          Show {hiddenRegions} more region{hiddenRegions === 1 ? '' : 's'} with listings
        </button>
      )}
      {expandAll && filteredRegions.length > DEFAULT_REGION_LIMIT && (
        <button
          type="button"
          className="fs-loc-more"
          onClick={() => setExpandAll(false)}
        >
          Show fewer
        </button>
      )}

      {/* Power-user escape hatch — show every country we support,
          even ones with zero listings. Useful for saved-searches
          on emerging markets before stock arrives. */}
      <button
        type="button"
        className="fs-loc-more fs-loc-more-muted"
        onClick={() => setShowAll((v) => !v)}
      >
        {showAll ? '↑ Hide empty locations' : '↓ Show all locations worldwide'}
      </button>
    </div>
  );
}
