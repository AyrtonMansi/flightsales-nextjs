'use client';
import { useState, useEffect } from 'react';

// Rotating placeholder examples for the AI search input.
// Kept short and concrete so users immediately see the kinds of queries that work.
export const AI_SEARCH_EXAMPLES = [
  "Diamond DA40 with glass cockpit",
  "Cirrus SR22 under $700k",
  "Low-hours Robinson R44",
  "IFR turboprop in QLD",
];

export function useRotatingPlaceholder(examples, intervalMs = 2800) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!examples || examples.length < 2) return undefined;
    const t = setInterval(() => setIndex(i => (i + 1) % examples.length), intervalMs);
    return () => clearInterval(t);
  }, [examples, intervalMs]);
  return examples[index];
}
