'use client';
import { useCallback } from 'react';

// Dual-handle range slider. We use two stacked native <input type="range">
// (one for min, one for max) with the lower handle on top via z-index +
// pointer-events trickery. Pure CSS approach beats a JS lib for bundle size
// and accessibility — keyboard users get arrow keys for free.
//
// Props:
//   min, max   — bounds
//   step       — increment
//   minValue / maxValue — current selection (string or number; '' allowed)
//   onChange   — ({min, max}) => void  (always emits both as strings)
//   format     — (n) => string for display (e.g. price formatter)
//   unit       — optional trailing unit if format isn't given
export default function RangeSlider({
  min, max, step = 1,
  minValue, maxValue,
  onChange,
  format,
  unit = '',
}) {
  const lo = minValue === '' || minValue == null ? min : Number(minValue);
  const hi = maxValue === '' || maxValue == null ? max : Number(maxValue);

  // Keep handles from crossing — clamp on commit
  const handleMin = useCallback((e) => {
    const v = Math.min(Number(e.target.value), hi);
    onChange({ min: String(v), max: String(hi) });
  }, [hi, onChange]);

  const handleMax = useCallback((e) => {
    const v = Math.max(Number(e.target.value), lo);
    onChange({ min: String(lo), max: String(v) });
  }, [lo, onChange]);

  // Position the selected-range fill bar between the two handles.
  const pctLo = ((lo - min) / (max - min)) * 100;
  const pctHi = ((hi - min) / (max - min)) * 100;

  const fmt = format || ((n) => `${Number(n).toLocaleString()}${unit ? ' ' + unit : ''}`);

  return (
    <div className="fs-fc-range">
      <div className="fs-fc-range-track">
        <div
          className="fs-fc-range-fill"
          style={{ left: `${pctLo}%`, width: `${Math.max(0, pctHi - pctLo)}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={handleMin}
          aria-label="Minimum value"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={handleMax}
          aria-label="Maximum value"
        />
      </div>
      <div className="fs-fc-range-readout">
        {fmt(lo)} <span className="fs-fc-range-sep">—</span> {fmt(hi)}
      </div>
    </div>
  );
}
