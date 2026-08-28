import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // The app intentionally starts async Supabase fetches from effects; those
      // fetch functions set loading state before awaiting the network request.
      // React 19's blanket rule treats that established data-hook pattern as an
      // error even though it is not a render loop. Keep the higher-signal hook
      // rules (purity, static components, immutability, Rules of Hooks) enabled.
      'react-hooks/set-state-in-effect': 'off',
      // Apostrophes/quotes in user-facing JSX copy are not a correctness or
      // security boundary. Do not let copy punctuation block production CI.
      'react/no-unescaped-entities': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
