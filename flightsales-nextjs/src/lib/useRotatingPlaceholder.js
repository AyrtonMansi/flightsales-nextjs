'use client';
import { useEffect, useState } from 'react';

// Rotating typewriter placeholder for the AI search input. Types out one
// character at a time, holds, deletes, and rotates to the next phrase —
// like an IDE demo. Three concrete query shapes plus a meta
// "AI quick search" label so users see what the field is for even before
// the rotation kicks in.

export const AI_SEARCH_EXAMPLES = [
  'AI quick search',
  'Cirrus SR22 under $700k',
  'Low-hours Robinson R44',
  'IFR turboprop in QLD',
];

const TYPING_MS = 55;
const DELETING_MS = 30;
const HOLD_MS = 1400;
const POST_CLEAR_MS = 380;

export function useRotatingPlaceholder(examples = AI_SEARCH_EXAMPLES) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!examples || examples.length === 0) return undefined;

    let cancelled = false;
    let timer = null;
    let phraseIndex = 0;
    let charIndex = 0;
    let phase = 'typing'; // 'typing' | 'holding' | 'deleting' | 'rotating'

    const schedule = (fn, ms) => {
      timer = setTimeout(() => { if (!cancelled) fn(); }, ms);
    };

    const tick = () => {
      const phrase = examples[phraseIndex];
      if (phase === 'typing') {
        if (charIndex < phrase.length) {
          charIndex += 1;
          setText(phrase.slice(0, charIndex));
          schedule(tick, TYPING_MS);
        } else {
          phase = 'holding';
          schedule(tick, HOLD_MS);
        }
      } else if (phase === 'holding') {
        phase = 'deleting';
        schedule(tick, DELETING_MS);
      } else if (phase === 'deleting') {
        if (charIndex > 0) {
          charIndex -= 1;
          setText(phrase.slice(0, charIndex));
          schedule(tick, DELETING_MS);
        } else {
          phase = 'rotating';
          schedule(tick, POST_CLEAR_MS);
        }
      } else if (phase === 'rotating') {
        phraseIndex = (phraseIndex + 1) % examples.length;
        phase = 'typing';
        tick();
      }
    };

    schedule(tick, 200);
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [examples]);

  return text;
}
