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
    // Top-down: vertical-blade propeller on nose, spinner, slim
    // fuselage, STRAIGHT (non-swept) rectangular wings, small straight
    // tail wings + vertical fin. Reads as Cessna 172 / similar GA piston.
    value: 'Single Engine Piston',
    label: 'Single piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="0.5" y="7.5" width="1" height="9" rx="0.5" />
        <circle cx="2.5" cy="12" r="1.5" />
        <rect x="4" y="10.8" width="26" height="2.4" rx="1.2" />
        <path d="M13 11 L23 11 L21.5 4 L14.5 4 Z" />
        <path d="M13 13 L23 13 L21.5 20 L14.5 20 Z" />
        <path d="M28 11 L33 11 L32 7 L29 7 Z" />
        <path d="M28 13 L33 13 L32 17 L29 17 Z" />
        <path d="M33 11.5 L38 12 L33 12.5 Z" />
      </svg>
    ),
  },
  {
    // Top-down: same straight-wing GA airframe as single piston, but
    // NO nose prop and ONE propeller blade + nacelle on each wing.
    // Reads as Beech Baron / Piper Seneca twin.
    value: 'Multi Engine Piston',
    label: 'Twin piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <circle cx="3" cy="12" r="1.6" />
        <rect x="4" y="10.8" width="26" height="2.4" rx="1.2" />
        <path d="M13 11 L23 11 L21.5 4 L14.5 4 Z" />
        <path d="M13 13 L23 13 L21.5 20 L14.5 20 Z" />
        <rect x="14" y="5" width="3.5" height="2.5" rx="0.6" />
        <rect x="12.5" y="5" width="1.2" height="2.5" rx="0.3" />
        <rect x="14" y="16.5" width="3.5" height="2.5" rx="0.6" />
        <rect x="12.5" y="16.5" width="1.2" height="2.5" rx="0.3" />
        <path d="M28 11 L33 11 L32 7 L29 7 Z" />
        <path d="M28 13 L33 13 L32 17 L29 17 Z" />
        <path d="M33 11.5 L38 12 L33 12.5 Z" />
      </svg>
    ),
  },
  {
    // Top-down: sleeker, more jet-like fuselage than piston twin.
    // Slightly swept wings, BIGGER nacelles + LARGER propeller blades
    // on each wing. Reads as King Air / PC-12 turboprop.
    value: 'Turboprop',
    label: 'Turboprop',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <ellipse cx="3" cy="12" rx="2.4" ry="1.8" />
        <rect x="5" y="10" width="25" height="4" rx="1.8" />
        <path d="M13 11 L24 11 L25 3 L17 3 Z" />
        <path d="M13 13 L24 13 L25 21 L17 21 Z" />
        <rect x="14" y="4" width="5" height="3" rx="0.8" />
        <rect x="12" y="4" width="1.6" height="3" rx="0.4" />
        <rect x="14" y="17" width="5" height="3" rx="0.8" />
        <rect x="12" y="17" width="1.6" height="3" rx="0.4" />
        <path d="M28 11 L33 11 L36 7 L32 7 Z" />
        <path d="M28 13 L33 13 L36 17 L32 17 Z" />
        <path d="M33 11 L38 12 L33 13 Z" />
      </svg>
    ),
  },
  {
    // Top-down: ROUNDED (not pointed) nose, moderate-sweep wings,
    // rear-mounted engine pods alongside the fuselage, T-tail.
    // Reads as Citation / Cirrus Vision / Phenom — business jet,
    // not fighter.
    value: 'Light Jet',
    label: 'Jet',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <circle cx="3" cy="12" r="2" />
        <rect x="4" y="10" width="22" height="4" rx="1.8" />
        <path d="M13 11 L21 11 L25 5 L18 5 Z" />
        <path d="M13 13 L21 13 L25 19 L18 19 Z" />
        <ellipse cx="27" cy="9" rx="2.4" ry="1.5" />
        <ellipse cx="27" cy="15" rx="2.4" ry="1.5" />
        <path d="M30 11 L34 11 L36 8 L32 8 Z" />
        <path d="M30 13 L34 13 L36 16 L32 16 Z" />
        <path d="M33 11.5 L38 12 L33 12.5 Z" />
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
