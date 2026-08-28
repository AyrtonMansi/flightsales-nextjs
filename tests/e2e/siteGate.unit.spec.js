// Unit: pre-launch password wall resolution.
//
// This is the regression test for a launch-day footgun: the gate used to be
// controlled by TWO env vars that had to agree — the API route read
// SITE_PASSWORD_PROTECTED, the client component read
// NEXT_PUBLIC_SITE_PASSWORD_PROTECTED — while LAUNCH.md documented setting
// only the first. Following the documented go-live procedure therefore left
// the server accepting any password while every real visitor still hit the
// wall. isSiteGated() is now the single source of truth; these tests pin its
// semantics so the two can never drift apart again.

import { test, expect } from '@playwright/test';
import { isSiteGated } from '../../src/lib/siteGate.js';

const KEYS = ['SITE_PASSWORD_PROTECTED', 'NEXT_PUBLIC_SITE_PASSWORD_PROTECTED'];

function withEnv(vars, fn) {
  const saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]));
  try {
    for (const k of KEYS) delete process.env[k];
    Object.assign(process.env, vars);
    return fn();
  } finally {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

test.describe('isSiteGated', () => {
  test('defaults to gated when nothing is set (fail safe)', () => {
    expect(withEnv({}, isSiteGated)).toBe(true);
  });

  test('SITE_PASSWORD_PROTECTED=false takes the wall down (the documented launch step)', () => {
    expect(withEnv({ SITE_PASSWORD_PROTECTED: 'false' }, isSiteGated)).toBe(false);
  });

  test('NEXT_PUBLIC_SITE_PASSWORD_PROTECTED=false also takes it down (local dev + Playwright)', () => {
    expect(withEnv({ NEXT_PUBLIC_SITE_PASSWORD_PROTECTED: 'false' }, isSiteGated)).toBe(false);
  });

  test('either var alone is sufficient — they no longer have to agree', () => {
    expect(withEnv(
      { SITE_PASSWORD_PROTECTED: 'false', NEXT_PUBLIC_SITE_PASSWORD_PROTECTED: 'true' },
      isSiteGated,
    )).toBe(false);
    expect(withEnv(
      { SITE_PASSWORD_PROTECTED: 'true', NEXT_PUBLIC_SITE_PASSWORD_PROTECTED: 'false' },
      isSiteGated,
    )).toBe(false);
  });

  test('stays gated for explicit true and for any non-"false" value', () => {
    expect(withEnv({ SITE_PASSWORD_PROTECTED: 'true' }, isSiteGated)).toBe(true);
    // Guards the classic mistake of setting 0/no/off and expecting it to work.
    for (const v of ['0', 'no', 'off', 'FALSE', '']) {
      expect(withEnv({ SITE_PASSWORD_PROTECTED: v }, isSiteGated)).toBe(true);
    }
  });
});
