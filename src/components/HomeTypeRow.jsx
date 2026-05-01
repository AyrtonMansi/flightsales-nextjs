'use client';

// Aircraft type icon row — horizontal scroll of black silhouettes that
// pre-fill the Type dropdown in the hero search when clicked. Replaces
// the text category pills with a more visual selector.
//
// Icons are inline SVGs at currentColor so the active-state color
// inversion (white-on-ink) works without per-icon variants. Each silhouette
// is intentionally minimal — recognisable shape, not a literal aircraft.
//
// Categories match the values in src/lib/constants.js CATEGORIES so
// clicking pre-fills the dropdown correctly.

const TYPES = [
  {
    // Top-down view: spinner + propeller on the nose, fuselage,
    // 2 wings extending up + down, small tail wings + vertical fin.
    // Single propeller on nose = single engine piston.
    value: 'Single Engine Piston',
    label: 'Single piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="0" y="6" width="1" height="12" rx="0.5" />
        <circle cx="2.5" cy="12" r="1.6" />
        <rect x="4" y="10.5" width="26" height="3" rx="1.5" />
        <path d="M14 11 L22 11 L26 4 L20 4 Z" />
        <path d="M14 13 L22 13 L26 20 L20 20 Z" />
        <path d="M28 11 L33 11 L36 7 L32 7 Z" />
        <path d="M28 13 L33 13 L36 17 L32 17 Z" />
        <path d="M33 11.5 L38 12 L33 12.5 Z" />
      </svg>
    ),
  },
  {
    // Top-down view: same airframe as single, but no nose prop and
    // TWO engine nacelles + propellers on the wings = twin piston.
    value: 'Multi Engine Piston',
    label: 'Twin piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <circle cx="2.5" cy="12" r="1.6" />
        <rect x="4" y="10.5" width="26" height="3" rx="1.5" />
        <path d="M14 11 L22 11 L26 4 L20 4 Z" />
        <path d="M14 13 L22 13 L26 20 L20 20 Z" />
        <rect x="13" y="6" width="6" height="2.4" rx="0.6" />
        <rect x="11" y="6" width="1.2" height="2.4" rx="0.3" />
        <rect x="13" y="15.6" width="6" height="2.4" rx="0.6" />
        <rect x="11" y="15.6" width="1.2" height="2.4" rx="0.3" />
        <path d="M28 11 L33 11 L36 7 L32 7 Z" />
        <path d="M28 13 L33 13 L36 17 L32 17 Z" />
        <path d="M33 11.5 L38 12 L33 12.5 Z" />
      </svg>
    ),
  },
  {
    // Top-down view: bigger fuselage + chunkier engine nacelles +
    // larger propeller blades than the twin piston. Reads as a
    // King-Air-class turboprop.
    value: 'Turboprop',
    label: 'Turboprop',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <ellipse cx="2.5" cy="12" rx="2" ry="2" />
        <rect x="4" y="9.5" width="26" height="5" rx="2" />
        <path d="M13 10 L23 10 L27 3 L20 3 Z" />
        <path d="M13 14 L23 14 L27 21 L20 21 Z" />
        <rect x="13" y="4.5" width="9" height="3.5" rx="1" />
        <rect x="10" y="4.5" width="1.6" height="3.5" rx="0.3" />
        <rect x="13" y="16" width="9" height="3.5" rx="1" />
        <rect x="10" y="16" width="1.6" height="3.5" rx="0.3" />
        <path d="M30 10.5 L34 10.5 L37 7 L33 7 Z" />
        <path d="M30 13.5 L34 13.5 L37 17 L33 17 Z" />
        <path d="M33 11 L38 12 L33 13 Z" />
      </svg>
    ),
  },
  {
    // Top-down view: pointed nose (no spinner), aggressive swept wings,
    // 2 rear-mounted engine pods alongside the fuselage, T-tail.
    // Reads as a business jet (Citation / Cirrus Vision class).
    value: 'Light Jet',
    label: 'Jet',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M0 12 L5 10 L5 14 Z" />
        <rect x="5" y="10" width="25" height="4" rx="2" />
        <path d="M14 11 L24 11 L28 3 L18 3 Z" />
        <path d="M14 13 L24 13 L28 21 L18 21 Z" />
        <ellipse cx="28" cy="8.5" rx="2.4" ry="1.4" />
        <ellipse cx="28" cy="15.5" rx="2.4" ry="1.4" />
        <path d="M32 11 L38 12 L32 13 Z" />
        <rect x="34" y="6" width="3.5" height="1.6" rx="0.5" />
        <rect x="34" y="16.4" width="3.5" height="1.6" rx="0.5" />
      </svg>
    ),
  },
  {
    value: 'Helicopter',
    label: 'Helicopter',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        {/* rotor */}
        <rect x="6" y="6" width="28" height="1.5" rx="0.5" />
        <rect x="19" y="4" width="2" height="4" rx="0.5" />
        {/* body */}
        <path d="M10 10h18l5 4-2 3H12l-3-3 1-4z" />
        {/* tail boom */}
        <rect x="28" y="13" width="9" height="1.5" rx="0.5" />
        {/* tail rotor */}
        <rect x="36" y="11" width="1.5" height="6" rx="0.5" />
        {/* skid */}
        <rect x="11" y="19" width="18" height="1" rx="0.5" />
      </svg>
    ),
  },
  {
    value: 'LSA',
    label: 'LSA',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M36 12 30 10 22 6 20 6 24 11 16 11 11 7 9 7 11 11 4 12 11 13 9 17 11 17 16 13 24 13 20 18 22 18 30 14 36 12z" />
      </svg>
    ),
  },
  {
    value: 'Glider',
    label: 'Glider',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M2 13 38 11l-8-3-2 0-4 3-12 0L2 13z M22 14l8 5 2 0-4-5z" />
      </svg>
    ),
  },
  {
    value: 'Gyrocopter',
    label: 'Gyro',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="4" y="6" width="32" height="1.5" rx="0.5" />
        <rect x="19" y="4" width="2" height="4" rx="0.5" />
        <circle cx="20" cy="14" r="4" />
        <rect x="14" y="13" width="12" height="1.5" rx="0.5" />
        <rect x="20" y="17" width="1.5" height="3" rx="0.5" />
      </svg>
    ),
  },
  {
    // Quadcopter from above — most recognisable drone silhouette.
    // Covers commercial drones AND the manned-drone / eVTOL / air-taxi
    // category (Joby, Lilium, Wisk). One umbrella for now.
    value: 'Drone & eVTOL',
    label: 'Drone',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        {/* arms (+ shape) */}
        <rect x="6" y="11" width="28" height="2" rx="1" />
        <rect x="19" y="3" width="2" height="18" rx="1" />
        {/* center body */}
        <rect x="15" y="9" width="10" height="6" rx="1.5" />
        {/* 4 rotors */}
        <circle cx="6" cy="12" r="3" />
        <circle cx="34" cy="12" r="3" />
        <circle cx="20" cy="3" r="2.5" />
        <circle cx="20" cy="21" r="2.5" />
      </svg>
    ),
  },
];

export default function HomeTypeRow({ activeType, onPick }) {
  return (
    <div className="fs-type-row" role="group" aria-label="Browse by aircraft type">
      <div className="fs-type-row-inner">
        {TYPES.map(t => {
          const active = activeType === t.value;
          return (
            <button
              key={t.value}
              type="button"
              className={`fs-type-tile${active ? ' on' : ''}`}
              onClick={() => onPick(t.value)}
              aria-pressed={active}
            >
              <span className="fs-type-tile-icon">{t.icon}</span>
              <span className="fs-type-tile-label">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
