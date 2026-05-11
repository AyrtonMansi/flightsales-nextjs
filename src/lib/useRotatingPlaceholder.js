'use client';
import { useEffect, useState } from 'react';

// Rotating typewriter placeholder for the AI search input. Types out one
// character at a time, holds, deletes, and rotates to the next phrase —
// like an IDE demo.
//
// Previously the first phrase was a meta label ('AI quick search') which
// the user reported reading as a random flicker between concrete examples.
// Dropped — only real example queries now rotate, and the input's static
// fallback was also removed in HeroSearchPro so the user only ever sees
// real-shape queries or a clean empty box.

export const AI_SEARCH_EXAMPLES = [
  'Cirrus SR22 under $700k',
  'Low-hours Robinson R44',
  'IFR turboprop in QLD',
  'Cessna 172 in NSW',
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
