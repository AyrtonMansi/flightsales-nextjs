// Aircraft catalogue runtime — single API for the make/model picker, hero
// search, /buy filter rail, and listing detail page. Merges the static
// seed (src/lib/aircraftCatalogueSeed.js) with whatever the
// aircraft_models table has in Supabase, so admin/import additions show
// up automatically without a code release.
//
// Fail-safe by design: if the DB query fails or returns nothing, the
// seed alone is still ~150 models with full specs. Nothing in this file
// throws to the caller — DB errors are logged and swallowed.

import { useEffect, useMemo, useState } from 'react';
import { MAKES_SEED, MODELS_SEED } from './aircraftCatalogueSeed';
import { supabase } from './supabase';

// ── Normalisation helpers ────────────────────────────────────────────

/**
 * Lowercase, strip diacritics, collapse non-alphanumerics. Used for
 * alias matching so "C-172", "C 172", "c172" all hash to "c172".
 */
export function normalize(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

/** URL-safe slug. Hyphens between words, lowercase. */
export function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Catalogue assembly ───────────────────────────────────────────────

/**
 * Merge seed + DB rows. DB wins on slug collisions (lets admins override
 * seed entries via Supabase). Returns { makes, models, makeBySlug,
 * modelBySlug, modelsByMake, aliasIndex }.
 */
export function buildCatalogue(extraMakes = [], extraModels = []) {
  // Makes — DB wins on slug collision
  const makesBySlug = new Map();
  for (const mk of MAKES_SEED) makesBySlug.set(mk.slug, mk);
  for (const mk of extraMakes) {
    if (!mk?.slug) continue;
    makesBySlug.set(mk.slug, { ...makesBySlug.get(mk.slug), ...mk });
  }
  const makes = [...makesBySlug.values()].sort((a, b) => a.name.localeCompare(b.name));

  // Models — DB wins on slug collision
  const modelsBySlug = new Map();
  for (const mdl of MODELS_SEED) modelsBySlug.set(mdl.slug, mdl);
  for (const mdl of extraModels) {
    if (!mdl?.slug) continue;
    modelsBySlug.set(mdl.slug, { ...modelsBySlug.get(mdl.slug), ...mdl });
  }
  const models = [...modelsBySlug.values()].sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );

  // models grouped by make slug for fast typeahead
  const modelsByMake = new Map();
  for (const mdl of models) {
    const list = modelsByMake.get(mdl.make) ?? [];
    list.push(mdl);
    modelsByMake.set(mdl.make, list);
  }

  // alias index — maps every alias + the canonical full_name + the type
  // designator to the model row. All keys normalised so lookup is
  // case + punctuation insensitive.
  const aliasIndex = new Map();
  const add = (key, model) => {
    const k = normalize(key);
    if (!k) return;
    // First-write-wins so explicit aliases beat broader fallbacks.
    if (!aliasIndex.has(k)) aliasIndex.set(k, model);
  };
  for (const mdl of models) {
    add(mdl.full_name, mdl);
    add(mdl.slug, mdl);
    if (mdl.type_designator) add(mdl.type_designator, mdl);
    if (Array.isArray(mdl.aliases)) {
      for (const a of mdl.aliases) add(a, mdl);
    }
  }

  return { makes, models, makesBySlug, modelsBySlug, modelsByMake, aliasIndex };
}

// Build a singleton seed-only catalogue once at module load. Used as
// fallback when no DB extras are available (SSR, error path).
const SEED_CATALOGUE = buildCatalogue([], []);

// ── React hook ───────────────────────────────────────────────────────

/**
 * Returns the merged catalogue. On first render, returns the seed-only
 * version (instant). Then async-fetches additions from Supabase and
 * re-renders with the merged result. If the fetch fails the seed remains.
 *
 * Pass `{ skipDb: true }` to opt out of the network call (useful in tests
 * or pages that don't need DB extras).
 */
export function useAircraftCatalogue({ skipDb = false } = {}) {
  const [extras, setExtras] = useState({ makes: [], models: [] });

  useEffect(() => {
    if (skipDb) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [{ data: makeRows }, { data: modelRows }] = await Promise.all([
          supabase.from('aircraft_makes').select('*'),
          supabase.from('aircraft_models').select('*'),
        ]);
        if (cancelled) return;
        setExtras({
          makes: makeRows ?? [],
          models: modelRows ?? [],
        });
      } catch (err) {
        // Swallow — seed is the fallback. Only log so devs notice.
        if (typeof console !== 'undefined') {
          console.warn('useAircraftCatalogue: DB fetch failed, using seed only', err);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [skipDb]);

  return useMemo(
    () => (extras.makes.length || extras.models.length
      ? buildCatalogue(extras.makes, extras.models)
      : SEED_CATALOGUE),
    [extras.makes, extras.models]
  );
}

// ── Lookup / search ──────────────────────────────────────────────────

/**
 * Resolve a free-text input ("Cessna 172", "C172", "skyhawk") to a model
 * row. Returns null if no match. Case + punctuation insensitive.
 */
export function findModel(catalogue, text) {
  if (!text) return null;
  return catalogue.aliasIndex.get(normalize(text)) ?? null;
}

/**
 * Typeahead search. Returns up to `limit` models ranked by:
 *   1. Exact alias match
 *   2. Prefix match on full_name / family
 *   3. Substring match on full_name / family / variant / type designator
 */
export function searchModels(catalogue, query, { limit = 12, makeSlug = null } = {}) {
  const q = normalize(query);
  if (!q) {
    // No query — return first N models, optionally filtered by make.
    const pool = makeSlug
      ? (catalogue.modelsByMake.get(makeSlug) ?? [])
      : catalogue.models;
    return pool.slice(0, limit);
  }

  const exact = catalogue.aliasIndex.get(q);
  const seen = new Set();
  const result = [];
  if (exact && (!makeSlug || exact.make === makeSlug)) {
    result.push(exact); seen.add(exact.slug);
  }

  const pool = makeSlug
    ? (catalogue.modelsByMake.get(makeSlug) ?? [])
    : catalogue.models;

  // Prefix pass
  for (const mdl of pool) {
    if (result.length >= limit) break;
    if (seen.has(mdl.slug)) continue;
    const hay = normalize(mdl.full_name);
    if (hay.startsWith(q) || normalize(mdl.family).startsWith(q)) {
      result.push(mdl); seen.add(mdl.slug);
    }
  }

  // Substring pass
  if (result.length < limit) {
    for (const mdl of pool) {
      if (result.length >= limit) break;
      if (seen.has(mdl.slug)) continue;
      const hay = normalize(mdl.full_name)
        + ' ' + normalize(mdl.type_designator || '')
        + ' ' + normalize(mdl.variant || '');
      if (hay.includes(q)) {
        result.push(mdl); seen.add(mdl.slug);
      }
    }
  }

  // Alias substring pass — catches "skyhawk" → 172S
  if (result.length < limit) {
    for (const mdl of pool) {
      if (result.length >= limit) break;
      if (seen.has(mdl.slug)) continue;
      if ((mdl.aliases || []).some((a) => normalize(a).includes(q))) {
        result.push(mdl); seen.add(mdl.slug);
      }
    }
  }

  return result;
}

/**
 * Search across makes only. Returns up to `limit` makes matching the
 * query, ranked by prefix match then substring.
 */
export function searchMakes(catalogue, query, { limit = 12 } = {}) {
  const q = normalize(query);
  if (!q) return catalogue.makes.slice(0, limit);
  const result = [];
  const seen = new Set();
  for (const mk of catalogue.makes) {
    if (result.length >= limit) break;
    if (normalize(mk.name).startsWith(q) || mk.slug.startsWith(q)) {
      result.push(mk); seen.add(mk.slug);
    }
  }
  if (result.length < limit) {
    for (const mk of catalogue.makes) {
      if (result.length >= limit) break;
      if (seen.has(mk.slug)) continue;
      if (normalize(mk.name).includes(q)) {
        result.push(mk); seen.add(mk.slug);
      }
    }
  }
  return result;
}

/**
 * Map a model row to the form-field shape SellPage expects, so a single
 * spread fills year, manufacturer, model, category, MTOW, seats, etc.
 * Pass-through nulls (callers shouldn't blow away user-entered values
 * when the catalogue field is unknown).
 */
export function modelToFormFields(model, makesBySlug) {
  if (!model) return {};
  const make = makesBySlug?.get(model.make);
  const out = {
    manufacturer: make?.name ?? model.make,
    model: model.full_name.replace(`${make?.name ?? ''} `, '').trim(),
    category: model.category,
    model_slug: model.slug,
  };
  if (model.seats != null) out.seats = String(model.seats);
  if (model.mtow_kg != null) out.mtow = String(model.mtow_kg);
  if (model.engine_type) out.engineType = model.engine_type;
  if (model.year_first && model.year_last) {
    // Leave year unset — user picks a specific year within the production range.
  }
  return out;
}

// Test seam — return the seed-only catalogue without a hook (for unit tests).
export function getSeedCatalogue() {
  return SEED_CATALOGUE;
}
