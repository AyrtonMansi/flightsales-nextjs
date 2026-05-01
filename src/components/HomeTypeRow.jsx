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
    value: 'Single Engine Piston',
    label: 'Single piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M37 12 28 9 26 4l-2 0 1 5-12 0-3-3-2 0 1.5 3-7 1-1 2 1 2 7 1-1.5 3 2 0 3-3 12 0-1 5 2 0 2-5 9-3z" />
      </svg>
    ),
  },
  {
    value: 'Multi Engine Piston',
    label: 'Twin piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M38 12 30 10 28 6l-1.5 0 .5 4-7-1V5l-2 0v4l-7 1 .5-4-1.5 0-2 4-8 2v0l8 2 2 4 1.5 0-.5-4 7-1v4l2 0v-4l7 1-.5 4 1.5 0 2-4 8-2z" />
      </svg>
    ),
  },
  {
    value: 'Turboprop',
    label: 'Turboprop',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M38 12 32 9 27 4 24 4l3 6-12 0L11 6 9 6l1.5 4-7.5 1L1 12l2 1 7.5 1L9 18l2 0 4-4 12 0-3 6 3 0 5-5 6-3z" />
      </svg>
    ),
  },
  {
    value: 'Light Jet',
    label: 'Jet',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M38 12 4 4 8 12 4 20z M14 12 22 9 22 15z" />
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
