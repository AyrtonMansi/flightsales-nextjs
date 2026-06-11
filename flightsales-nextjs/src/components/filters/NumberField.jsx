'use client';

// Single labelled number input with a prefix word ("Min" / "Max") and a
// trailing unit suffix ("kts", "NM", "kg", etc.). Used throughout the
// advanced sections for one-sided range constraints.
//
// Props:
//   prefix  — "Min" | "Max"
//   value   — current value (string)
//   onChange — (string) => void
//   unit    — display suffix
//   id      — input id (label htmlFor)
//   placeholder — optional placeholder
export default function NumberField({
  prefix,
  value,
  onChange,
  unit,
  id,
  placeholder = '',
  min = 0,
  step = 1,
}) {
  return (
    <div className="fs-fc-numfield">
      <span className="fs-fc-numfield-prefix">{prefix}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
      {unit && <span className="fs-fc-numfield-unit">{unit}</span>}
    </div>
  );
}
