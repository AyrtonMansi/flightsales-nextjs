'use client';

// Aircraft type icon row — horizontal scroll of black silhouettes that
// pre-fill the Type dropdown in the hero search when clicked.
//
// Icons are inline SVGs at currentColor so the active-state colour
// inversion (white-on-ink) works without per-icon variants. Each
// silhouette is a clean iconic representation, not a literal photo
// rendering — recognisable shape at small sizes.
//
// Design pass: redrawn with simpler primitive geometry. The previous
// versions read as "weird jet" shapes because they had too many
// overlapping micro-shapes; these pare back to 3-5 clean elements per
// icon. Top-down for fixed-wing (clearer wingspan), side-view for
// helicopters / gliders / quadcopters where the rotors / wings define
// the silhouette.
//
// Categories match the values in src/lib/constants.js CATEGORIES so
// clicking pre-fills the dropdown correctly.

const TYPES = [
  {
    // Top-down Cessna 172: nose spinner + slim fuselage + a single
    // wide perpendicular wing (high-wing aircraft read as one
    // continuous wing block from above).
    value: 'Single Engine Piston',
    label: 'Single piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="14" y="3" width="6" height="18" rx="1.6" />
        <rect x="3" y="11" width="28" height="2" rx="1" />
        <circle cx="3.5" cy="12" r="1.8" />
        <rect x="29" y="8.5" width="3" height="7" rx="0.7" />
        <rect x="32" y="11" width="2" height="2" rx="0.4" />
      </svg>
    ),
  },
  {
    // Top-down Beech Baron / Piper Seneca: same straight-wing
    // GA airframe, but two engine pods on the wings (each hinted
    // with a prop blade ahead of the nacelle) and no nose engine.
    value: 'Multi Engine Piston',
    label: 'Twin piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="14" y="3" width="6" height="18" rx="1.6" />
        <ellipse cx="15" cy="5.5" rx="2.4" ry="1.6" />
        <ellipse cx="15" cy="18.5" rx="2.4" ry="1.6" />
        <rect x="13" y="2.2" width="4" height="0.9" rx="0.4" />
        <rect x="13" y="20.9" width="4" height="0.9" rx="0.4" />
        <rect x="3" y="11" width="28" height="2" rx="1" />
        <ellipse cx="3.5" cy="12" rx="2" ry="1.4" />
        <rect x="29" y="8.5" width="3" height="7" rx="0.7" />
        <rect x="32" y="11" width="2" height="2" rx="0.4" />
      </svg>
    ),
  },
  {
    // King Air / PC-12 turboprop: slightly tapered wings, larger
    // engine pods further outboard, bigger props, T-tail at rear.
    value: 'Turboprop',
    label: 'Turboprop',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M 11 3 L 19 3 L 21 11 L 13 11 Z" />
        <path d="M 11 21 L 19 21 L 21 13 L 13 13 Z" />
        <ellipse cx="14" cy="5.5" rx="2.6" ry="2" />
        <ellipse cx="14" cy="18.5" rx="2.6" ry="2" />
        <rect x="11.5" y="1.6" width="5" height="1" rx="0.4" />
        <rect x="11.5" y="21.4" width="5" height="1" rx="0.4" />
        <rect x="3" y="10.6" width="27" height="2.8" rx="1.3" />
        <path d="M 1.5 12 Q 2 10.4, 4 10.4 L 4 13.6 Q 2 13.6, 1.5 12 Z" />
        <rect x="28" y="6.5" width="3" height="11" rx="0.7" />
        <rect x="31" y="11" width="2.5" height="2" rx="0.4" />
      </svg>
    ),
  },
  {
    // Citation / Phenom business jet, top-down: more sweep on the
    // wings, rear-mounted engine pods alongside the fuselage, T-tail.
    // Rounded nose — not a fighter.
    value: 'Light Jet',
    label: 'Jet',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M 13 3 L 18 3 L 25 11 L 14 11 Z" />
        <path d="M 13 21 L 18 21 L 25 13 L 14 13 Z" />
        <path d="M 1.5 12 Q 2 10, 4.5 10 L 28 10 L 28 14 L 4.5 14 Q 2 14, 1.5 12 Z" />
        <ellipse cx="29.5" cy="9" rx="3" ry="1.5" />
        <ellipse cx="29.5" cy="15" rx="3" ry="1.5" />
        <rect x="32" y="9" width="2.5" height="6" rx="0.6" />
        <path d="M 34 11 L 38 11.5 L 38 12.5 L 34 13 Z" />
      </svg>
    ),
  },
  {
    // Side-view Robinson R44 / Bell JetRanger: long horizontal main
    // rotor, mast, rounded nose-forward body, tail boom, tail rotor,
    // skids underneath.
    value: 'Helicopter',
    label: 'Helicopter',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="5" y="5" width="22" height="1.5" rx="0.7" />
        <rect x="15" y="3" width="2" height="4" rx="0.3" />
        <path d="M 6 12 Q 6 8.5, 10 8.5 L 22 8.5 Q 26 8.5, 28 12 L 26 15 L 8 15 Q 6 14, 6 12 Z" />
        <rect x="24" y="11.2" width="11" height="1.6" rx="0.5" />
        <rect x="34" y="9" width="1.2" height="6" rx="0.3" />
        <rect x="32.6" y="11" width="3.5" height="0.9" rx="0.3" />
        <rect x="9" y="17.5" width="18" height="1" rx="0.4" />
        <rect x="11" y="15" width="0.8" height="3" />
        <rect x="24.2" y="15" width="0.8" height="3" />
      </svg>
    ),
  },
  {
    // Light sport aircraft (Tecnam / Sling style): low-wing sport
    // profile to differentiate from the high-wing Cessna single.
    // Bubble canopy hint, slimmer overall.
    value: 'LSA',
    label: 'LSA',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="13" y="6" width="4.5" height="12" rx="1.2" />
        <rect x="6" y="11" width="22" height="2" rx="1" />
        <ellipse cx="13" cy="12" rx="3" ry="1.6" />
        <circle cx="6.5" cy="12" r="1.4" />
        <rect x="26" y="9.5" width="2.5" height="5" rx="0.5" />
        <rect x="28.5" y="11" width="1.5" height="2" rx="0.3" />
      </svg>
    ),
  },
  {
    // Long thin glider wings dominate the silhouette. Slim
    // teardrop body, tiny T-tail.
    value: 'Glider',
    label: 'Glider',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="2" y="11.2" width="36" height="1.6" rx="0.8" />
        <ellipse cx="19" cy="12" rx="7" ry="2.2" />
        <rect x="25" y="9" width="1.4" height="6" rx="0.3" />
        <rect x="23.5" y="9" width="4" height="1" rx="0.3" />
      </svg>
    ),
  },
  {
    // Gyrocopter (Magni / AutoGyro): unpowered top rotor + small
    // pod cabin + pusher prop at the rear.
    value: 'Gyrocopter',
    label: 'Gyro',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="3" y="5" width="32" height="1.5" rx="0.7" />
        <rect x="19" y="3" width="2" height="4" rx="0.3" />
        <ellipse cx="19" cy="14" rx="6.5" ry="3" />
        <rect x="26" y="10" width="1.2" height="8" rx="0.3" />
        <rect x="24.5" y="11.5" width="3.5" height="0.9" rx="0.3" />
        <circle cx="14" cy="20" r="1.5" />
        <circle cx="24" cy="20" r="1.5" />
      </svg>
    ),
  },
  {
    // Quadcopter / eVTOL from above — most recognisable drone
    // silhouette. Covers commercial drones AND manned eVTOLs
    // (Joby, Lilium, Wisk) under one umbrella.
    value: 'Drone & eVTOL',
    label: 'Drone',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="11" width="28" height="2" rx="1" />
        <rect x="19" y="3" width="2" height="18" rx="1" />
        <rect x="15" y="9" width="10" height="6" rx="1.5" />
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
      {/* Subtle scroll indicator — a centred hairline pill under the row
          that hints "this scrolls horizontally" without being intrusive. */}
      <div className="fs-type-row-scrollhint" aria-hidden="true" />
    </div>
  );
}
