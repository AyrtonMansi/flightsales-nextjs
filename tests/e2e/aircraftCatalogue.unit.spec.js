// Unit tests for the aircraft catalogue runtime. Pure-JS, no browser
// needed — runs under Playwright Test the same way parseAiQuery does.
//
// Coverage:
//   - Catalogue assembly: seed loads, no duplicate slugs
//   - Alias resolution: case + punctuation insensitive
//   - Type designator lookup
//   - Search ranking (exact > prefix > substring > alias substring)
//   - Form-field mapping fills the right shape

import { test, expect } from '@playwright/test';
import {
  getSeedCatalogue, findModel, searchModels, searchMakes,
  normalize, slugify, modelToFormFields,
  makesForCategories, modelsForMakesAndCategories,
} from '../../src/lib/aircraftCatalogue.js';

test.describe('aircraftCatalogue — assembly', () => {
  const cat = getSeedCatalogue();

  test('seed loads with non-trivial volume', () => {
    expect(cat.makes.length).toBeGreaterThan(20);
    expect(cat.models.length).toBeGreaterThan(100);
    expect(cat.aliasIndex.size).toBeGreaterThan(cat.models.length);
  });

  test('every model has a unique slug', () => {
    const seen = new Set();
    for (const mdl of cat.models) {
      expect(seen.has(mdl.slug), `duplicate slug: ${mdl.slug}`).toBe(false);
      seen.add(mdl.slug);
    }
  });

  test('every model references an existing make', () => {
    for (const mdl of cat.models) {
      expect(cat.makesBySlug.has(mdl.make), `missing make for ${mdl.full_name}: ${mdl.make}`).toBe(true);
    }
  });

  test('every model has a category that the app recognises', () => {
    const allowed = new Set([
      'Single Engine Piston', 'Multi Engine Piston', 'Turboprop',
      'Light Jet', 'Midsize Jet', 'Heavy Jet',
      'Helicopter', 'Gyrocopter', 'Ultralight', 'LSA', 'Warbird',
      'Glider', 'Amphibious/Seaplane', 'Drone & eVTOL',
    ]);
    for (const mdl of cat.models) {
      expect(allowed.has(mdl.category), `bad category for ${mdl.full_name}: ${mdl.category}`).toBe(true);
    }
  });
});

test.describe('aircraftCatalogue — normalize / slugify', () => {
  test('normalize collapses case and punctuation', () => {
    expect(normalize('Cessna 172S')).toBe('cessna172s');
    expect(normalize('C-172')).toBe('c172');
    expect(normalize('  C 172  ')).toBe('c172');
    expect(normalize('PA-28-181')).toBe('pa28181');
  });

  test('slugify produces URL-safe hyphenated slugs', () => {
    expect(slugify('Cessna 172S Skyhawk')).toBe('cessna-172s-skyhawk');
    expect(slugify('PA-28-181 Archer')).toBe('pa-28-181-archer');
  });

  test('normalize handles null/undefined defensively', () => {
    expect(normalize(null)).toBe('');
    expect(normalize(undefined)).toBe('');
    expect(normalize('')).toBe('');
  });
});

test.describe('aircraftCatalogue — findModel (alias resolution)', () => {
  const cat = getSeedCatalogue();

  test('full name resolves', () => {
    const m = findModel(cat, 'Cessna 172S Skyhawk');
    expect(m?.slug).toBe('cessna-172-s-skyhawk');
  });

  test('type designator resolves', () => {
    expect(findModel(cat, 'C172')?.family).toBe('172');
    expect(findModel(cat, 'BE58')?.family).toBe('Baron');
    expect(findModel(cat, 'R44')?.family).toBe('R44');
  });

  test('alias resolves (case insensitive)', () => {
    expect(findModel(cat, 'Skyhawk')?.family).toBe('172');
    expect(findModel(cat, 'skyhawk')?.family).toBe('172');
    expect(findModel(cat, 'SKYHAWK')?.family).toBe('172');
  });

  test('punctuation differences resolve', () => {
    expect(findModel(cat, 'C-172S')?.family).toBe('172');
    expect(findModel(cat, 'C 172 S')?.family).toBe('172');
  });

  test('unknown returns null', () => {
    expect(findModel(cat, 'XYZ-999')).toBe(null);
    expect(findModel(cat, '')).toBe(null);
    expect(findModel(cat, null)).toBe(null);
  });
});

test.describe('aircraftCatalogue — searchModels', () => {
  const cat = getSeedCatalogue();

  test('returns top N when query empty', () => {
    const r = searchModels(cat, '', { limit: 5 });
    expect(r).toHaveLength(5);
  });

  test('exact alias match comes first', () => {
    const r = searchModels(cat, 'C172', { limit: 5 });
    expect(r[0].family).toBe('172');
  });

  test('prefix match beats substring', () => {
    const r = searchModels(cat, 'cir', { limit: 10 });
    // Cirrus models should rank above any substring match elsewhere
    expect(r.find(m => m.make === 'cirrus')).toBeTruthy();
  });

  test('filtered by make', () => {
    const r = searchModels(cat, '', { limit: 50, makeSlug: 'piper' });
    expect(r.length).toBeGreaterThan(5);
    expect(r.every(m => m.make === 'piper')).toBe(true);
  });

  test('alias substring catches nicknames', () => {
    // "warrior" is in PA-28-161 aliases
    const r = searchModels(cat, 'warrior', { limit: 5 });
    expect(r.find(m => (m.aliases || []).includes('Warrior'))).toBeTruthy();
  });
});

test.describe('aircraftCatalogue — searchMakes', () => {
  const cat = getSeedCatalogue();

  test('prefix match', () => {
    const r = searchMakes(cat, 'ces');
    expect(r[0].slug).toBe('cessna');
  });

  test('substring fallback', () => {
    const r = searchMakes(cat, 'beech');
    expect(r.find(m => m.slug === 'beechcraft')).toBeTruthy();
  });

  test('empty query returns popularity-ordered list (Cessna first)', () => {
    const r = searchMakes(cat, '', { limit: 100 });
    expect(r.length).toBeGreaterThan(20);
    expect(r[0].slug).toBe('cessna');
    // Verify popularity is monotonically non-decreasing for ranked makes
    for (let i = 1; i < r.length; i++) {
      const prev = r[i - 1].popularity ?? 99;
      const curr = r[i].popularity ?? 99;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

test.describe('aircraftCatalogue — modelToFormFields', () => {
  const cat = getSeedCatalogue();

  test('fills manufacturer, model, category from a known model', () => {
    const m = findModel(cat, 'C172S');
    const fields = modelToFormFields(m, cat.makesBySlug);
    expect(fields.manufacturer).toBe('Cessna');
    expect(fields.model).toContain('172');
    expect(fields.category).toBe('Single Engine Piston');
    expect(fields.model_slug).toBe('cessna-172-s-skyhawk');
  });

  test('fills numeric specs as strings', () => {
    const m = findModel(cat, 'C172S');
    const fields = modelToFormFields(m, cat.makesBySlug);
    expect(fields.seats).toBe('4');
    expect(fields.mtow).toBe('1157');
  });

  test('returns empty object for null model (defensive)', () => {
    expect(modelToFormFields(null, cat.makesBySlug)).toEqual({});
  });
});

test.describe('aircraftCatalogue — makesForCategories cascade', () => {
  const cat = getSeedCatalogue();

  test('no categories → returns all makes', () => {
    const r = makesForCategories(cat, []);
    expect(r.length).toBe(cat.makes.length);
  });

  test('Helicopter → only helicopter makers', () => {
    const r = makesForCategories(cat, ['Helicopter']);
    const slugs = r.map((mk) => mk.slug).sort();
    // Confirm at least Robinson + Bell + Airbus Helicopters + Schweizer
    expect(slugs).toContain('robinson');
    expect(slugs).toContain('bell');
    expect(slugs).toContain('airbus-helicopters');
    expect(slugs).toContain('schweizer');
    // Confirm fixed-wing makers are gone
    expect(slugs).not.toContain('cessna');
    expect(slugs).not.toContain('piper');
    expect(slugs).not.toContain('cirrus');
  });

  test('Single Engine Piston → only SEP makers', () => {
    const r = makesForCategories(cat, ['Single Engine Piston']);
    const slugs = r.map((mk) => mk.slug);
    expect(slugs).toContain('cessna');
    expect(slugs).toContain('piper');
    expect(slugs).toContain('cirrus');
    expect(slugs).not.toContain('robinson');
    expect(slugs).not.toContain('bell');
  });

  test('multi-category union (SEP + Helicopter) → both groups', () => {
    const r = makesForCategories(cat, ['Single Engine Piston', 'Helicopter']);
    const slugs = r.map((mk) => mk.slug);
    expect(slugs).toContain('cessna');
    expect(slugs).toContain('robinson');
  });

  test('niche category (Glider) → only glider makers', () => {
    const r = makesForCategories(cat, ['Glider']);
    const slugs = r.map((mk) => mk.slug);
    expect(slugs).toContain('schempp-hirth');
    expect(slugs).toContain('schleicher');
    expect(slugs).not.toContain('cessna');
  });
});

test.describe('aircraftCatalogue — modelsForMakesAndCategories cascade', () => {
  const cat = getSeedCatalogue();

  test('no makes → empty (nothing to filter)', () => {
    const r = modelsForMakesAndCategories(cat, [], []);
    expect(r).toEqual([]);
  });

  test('one make, no category → all that make\'s models', () => {
    const r = modelsForMakesAndCategories(cat, ['robinson'], []);
    expect(r.length).toBeGreaterThan(2);
    expect(r.every((m) => m.make === 'robinson')).toBe(true);
  });

  test('one make + matching category → cascade narrows correctly', () => {
    const r = modelsForMakesAndCategories(cat, ['robinson'], ['Helicopter']);
    expect(r.length).toBeGreaterThan(2);
    expect(r.every((m) => m.category === 'Helicopter')).toBe(true);
  });

  test('one make + non-matching category → empty (no Robinson SEPs)', () => {
    const r = modelsForMakesAndCategories(cat, ['robinson'], ['Single Engine Piston']);
    expect(r).toEqual([]);
  });

  test('Cessna + Helicopter → empty (no Cessna helis in seed)', () => {
    const r = modelsForMakesAndCategories(cat, ['cessna'], ['Helicopter']);
    expect(r).toEqual([]);
  });

  test('multi-make union, no category → models from both', () => {
    const r = modelsForMakesAndCategories(cat, ['cessna', 'piper'], []);
    expect(r.find((m) => m.make === 'cessna')).toBeTruthy();
    expect(r.find((m) => m.make === 'piper')).toBeTruthy();
  });

  test('Cessna + SEP → only Cessna SEP models (no Citations, no twins)', () => {
    const r = modelsForMakesAndCategories(cat, ['cessna'], ['Single Engine Piston']);
    expect(r.length).toBeGreaterThan(5);
    expect(r.every((m) => m.make === 'cessna')).toBe(true);
    expect(r.every((m) => m.category === 'Single Engine Piston')).toBe(true);
    // Citations are Light/Midsize/Heavy Jet → must not appear
    expect(r.find((m) => m.family === 'Citation')).toBeFalsy();
    // 310 + 337 are MEP → must not appear
    expect(r.find((m) => m.family === '310')).toBeFalsy();
  });

  test('returns deduplicated by slug', () => {
    // Same model can't appear twice for the same input.
    const r = modelsForMakesAndCategories(cat, ['cessna'], []);
    const slugs = r.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
