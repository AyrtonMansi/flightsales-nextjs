'use client';

// Aircraft type icon row — horizontal scroll of black silhouettes that
// pre-fill the Type dropdown in the hero search when clicked.
//
// Design rules enforced across all 9:
//   - 40x24 viewBox, plane heading LEFT (nose on the left)
//   - 3-5 geometric primitives per icon (rect, ellipse, circle, or
//     polygon path with L-segments only). No freehand Bezier
//     curves — that's what made the previous pass read as
//     "slightly off".
//   - Whole or half-pixel coordinates so paths render crisp at 1x/2x/3x
//   - Shared horizontal centerline (y=12) for top-down views so the
//     row reads as a cohesive family at a glance
//   - Top-down planform for fixed-wing where wingspan is the defining
//     silhouette; side view for helicopter/gyrocopter where the
//     rotor is the defining feature
//
// Type reference points (real aircraft used for proportions):
//   Cessna 172   - single piston   - high wing, big spinner
//   Beech Baron  - multi piston    - low wing twin, wing-mounted props
//   Pilatus PC-12 / King Air - turboprop - low wing, large prop nacelles
//   Citation Mustang - light jet   - swept wing, rear-mount engines
//   Robinson R44 - helicopter      - side view, main + tail rotor + skids
//   Sling 2 / Tecnam P92 - LSA     - low wing, slim, bubble canopy
//   ASW 28       - glider          - very long thin wings
//   Magni M16    - gyrocopter      - top rotor disc + pusher prop pod
//   Generic quad - drone & eVTOL   - top-down quad
//
// Inline SVGs use currentColor so the active-state colour inversion
// (white-on-ink) works without per-icon variants. Categories match
// CATEGORIES in lib/constants.js so clicking pre-fills correctly.

const TYPES = [
  {
    // Cessna 172 from above. Long fuselage running x=4..32, full-width
    // high wing perpendicular at the cabin, small horizontal stab at
    // the tail, prop spinner on the nose.
    value: 'Single Engine Piston',
    label: 'Single piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <circle cx="4" cy="12" r="1.6" />
        <rect x="4" y="11" width="28" height="2" rx="1" />
        <rect x="13" y="2" width="6" height="20" rx="1" />
        <rect x="28" y="8" width="4" height="8" rx="0.7" />
      </svg>
    ),
  },
  {
    // Beech Baron from above. Pointed nose (no engine in nose), low-wing
    // monoplane with TWO engine nacelles on the wings; small prop disc
    // hint ahead of each nacelle.
    value: 'Multi Engine Piston',
    label: 'Twin piston',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M 3 11 L 6 10 L 6 14 L 3 13 Z" />
        <rect x="6" y="11" width="26" height="2" rx="1" />
        <rect x="13" y="2" width="6" height="20" rx="1" />
        <ellipse cx="15" cy="5" rx="1.9" ry="1.2" />
        <ellipse cx="15" cy="19" rx="1.9" ry="1.2" />
        <rect x="13" y="2.3" width="4" height="0.9" rx="0.3" />
        <rect x="13" y="20.8" width="4" height="0.9" rx="0.3" />
        <rect x="28" y="8" width="4" height="8" rx="0.7" />
      </svg>
    ),
  },
  {
    // Pilatus PC-12 / King Air from above. Larger plane than the Baron
    // and the wing has slight forward sweep (leading edge straight,
    // trailing edge tapers inward toward the tail). Wider prop discs
    // sized for 4/5-blade props.
    value: 'Turboprop',
    label: 'Turboprop',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M 3 11 L 6 10 L 6 14 L 3 13 Z" />
        <rect x="6" y="10.5" width="24" height="3" rx="1.4" />
        <path d="M 11 2 L 18 2 L 19 11 L 13 11 Z" />
        <path d="M 11 22 L 18 22 L 19 13 L 13 13 Z" />
        <ellipse cx="14" cy="5" rx="2.4" ry="1.6" />
        <ellipse cx="14" cy="19" rx="2.4" ry="1.6" />
        <rect x="11" y="2.3" width="6" height="1" rx="0.4" />
        <rect x="11" y="20.7" width="6" height="1" rx="0.4" />
        <rect x="28" y="7.5" width="3" height="9" rx="0.6" />
      </svg>
    ),
  },
  {
    // Citation Mustang from above. Two distinguishing features:
    // significant wing sweep (leading edges angle back from the wing
    // root) and engine pods on the back fuselage sides instead of on
    // the wings. T-tail at the rear.
    value: 'Light Jet',
    label: 'Jet',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <path d="M 4 10 L 6 10 L 6 14 L 4 14 L 2 12 Z" />
        <rect x="6" y="10" width="20" height="4" rx="1.8" />
        <path d="M 14 2 L 18 2 L 26 10 L 14 10 Z" />
        <path d="M 14 22 L 18 22 L 26 14 L 14 14 Z" />
        <ellipse cx="29" cy="8.5" rx="3" ry="1.5" />
        <ellipse cx="29" cy="15.5" rx="3" ry="1.5" />
        <rect x="30" y="8" width="3" height="8" rx="0.6" />
        <path d="M 33 11 L 37 11.6 L 37 12.4 L 33 13 Z" />
      </svg>
    ),
  },
  {
    // Robinson R44 / Bell JetRanger from the side. Long main-rotor
    // disc at top, short mast, rounded forward cabin, slim tail boom,
    // vertical tail rotor, skids underneath with two struts.
    value: 'Helicopter',
    label: 'Helicopter',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="5" y="4.5" width="22" height="1.4" rx="0.6" />
        <rect x="15.4" y="5.9" width="1.6" height="2.6" rx="0.4" />
        <path d="M 6 9 L 20 9 L 24 9 L 27 12 L 27 14 L 20 16 L 9 16 L 6 14 Z" />
        <rect x="26" y="11.6" width="11" height="1.6" rx="0.6" />
        <rect x="35" y="9.5" width="1.4" height="6" rx="0.4" />
        <rect x="33.5" y="11.8" width="4" height="0.9" rx="0.3" />
        <rect x="9" y="18" width="18" height="1" rx="0.4" />
        <rect x="11" y="15.5" width="0.9" height="3" />
        <rect x="24" y="15.5" width="0.9" height="3" />
      </svg>
    ),
  },
  {
    // Sling 2 / Tecnam P92 from above. Low-wing sport profile to
    // differentiate from the high-wing 172 — slimmer fuselage, smaller
    // wing chord, bubble-canopy bulge mid-fuselage. Same small
    // horizontal stab as a piston single.
    value: 'LSA',
    label: 'LSA',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="12" r="1.4" />
        <rect x="5" y="11.2" width="25" height="1.6" rx="0.8" />
        <ellipse cx="13" cy="12" rx="3" ry="1.6" />
        <rect x="13" y="5" width="5" height="14" rx="0.8" />
        <rect x="26" y="9.5" width="3" height="5" rx="0.5" />
      </svg>
    ),
  },
  {
    // ASW 28 from above. Wingspan dominates the silhouette — long thin
    // wings span the full viewBox width. Teardrop fuselage tapered
    // both ends, tiny T-tail at the back.
    value: 'Glider',
    label: 'Glider',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="2" y="11.3" width="36" height="1.4" rx="0.7" />
        <path d="M 5 12 L 12 10 L 26 10 L 31 12 L 26 14 L 12 14 Z" />
        <rect x="24" y="8.5" width="3" height="7" rx="0.5" />
        <rect x="22.5" y="8.5" width="6" height="1" rx="0.3" />
      </svg>
    ),
  },
  {
    // Magni M16 from the side. Unpowered main rotor disc on top,
    // central pod cabin, pusher-prop at the rear, two wheels.
    // Top-down would just look like a helicopter — side view
    // disambiguates via the pusher prop.
    value: 'Gyrocopter',
    label: 'Gyro',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="4" y="4.5" width="32" height="1.4" rx="0.6" />
        <rect x="19.2" y="5.9" width="1.6" height="2.6" rx="0.4" />
        <ellipse cx="19" cy="14" rx="6" ry="2.8" />
        <rect x="25.5" y="10.5" width="1.4" height="7" rx="0.4" />
        <rect x="24" y="13.6" width="4" height="0.9" rx="0.3" />
        <circle cx="14" cy="20" r="1.4" />
        <circle cx="24" cy="20" r="1.4" />
      </svg>
    ),
  },
  {
    // Generic quadcopter from above — cross arms at right angles,
    // central body, four propeller discs at the arm ends. Covers
    // commercial drones AND manned eVTOLs (Joby, Lilium, Wisk)
    // under one umbrella.
    value: 'Drone & eVTOL',
    label: 'Drone',
    icon: (
      <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="11.2" width="28" height="1.6" rx="0.8" />
        <rect x="19.2" y="3" width="1.6" height="18" rx="0.8" />
        <rect x="15" y="9" width="10" height="6" rx="1.5" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="34" cy="12" r="3" />
        <circle cx="20" cy="3" r="2.6" />
        <circle cx="20" cy="21" r="2.6" />
      </svg>
    ),
  },
];

export default function HomeTypeRow({ activeType, onPick }) {
  return (
    <div className="fs-type-row-wrap" role="group" aria-label="Browse by aircraft type">
      <div className="fs-type-row">
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
      {/* Scroll hint — lives OUTSIDE the scroll container so it stays
          fixed in place while the silhouettes scroll horizontally. */}
      <div className="fs-type-row-scrollhint" aria-hidden="true" />
    </div>
  );
}
