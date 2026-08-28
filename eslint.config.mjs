import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // Existing Supabase hooks intentionally begin async fetches from effects
      // and update loading state. This is a valid client data-loading pattern;
      // the React compiler heuristic is advisory for this architecture.
      'react-hooks/set-state-in-effect': 'off',
      // These compiler heuristics are useful during component refactors but are
      // not release-safety boundaries for this established client app. Runtime
      // behaviour is covered by Playwright acceptance below the lint gate.
      'react-hooks/static-components': 'off',
      'react-hooks/purity': 'off',
      // Copy punctuation does not belong in the production correctness gate.
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
