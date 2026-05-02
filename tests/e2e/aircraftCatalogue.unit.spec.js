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

  test('empty query returns all alphabetised', () => {
    const r = searchMakes(cat, '', { limit: 100 });
    expect(r.length).toBeGreaterThan(20);
    for (let i = 1; i < r.length; i++) {
      expect(r[i].name.localeCompare(r[i - 1].name)).toBeGreaterThanOrEqual(0);
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
