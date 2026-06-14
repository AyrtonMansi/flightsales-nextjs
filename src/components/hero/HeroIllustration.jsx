'use client';

// Clean, minimalist hero illustration — a stylised business jet
// climbing right above a soft horizon. Single inline SVG, no external
// asset, no font/runtime cost. Designed at 600×600 viewBox; scales to
// fit the right column on desktop and hides on mobile via CSS.
//
// Why inline SVG vs a stock illustration:
//   - zero network round trip (paint with the rest of the hero)
//   - matches the brand's monochrome + sky-blue accent palette
//     exactly — a stock asset would always feel "borrowed"
//   - infinitely sharp on retina + dark mode swap is a one-line tweak

export default function HeroIllustration() {
  return (
    <svg
      className="fs-hero-illust"
      viewBox="0 0 600 600"
      role="img"
      aria-label="Aircraft climbing through clouds"
    >
      <defs>
        {/* Sky gradient — soft sky-blue accent at top easing to white. */}
        <linearGradient id="fs-illust-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#dcefff" />
          <stop offset="55%"  stopColor="#f0f7fc" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        {/* Subtle vapour trail behind the jet. */}
        <linearGradient id="fs-illust-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(83,170,226,0)" />
          <stop offset="60%"  stopColor="rgba(83,170,226,0.18)" />
          <stop offset="100%" stopColor="rgba(83,170,226,0.45)" />
        </linearGradient>
        {/* Soft cloud blur. */}
        <filter id="fs-illust-blur"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* Background sky panel with rounded corners */}
      <rect x="0" y="0" width="600" height="600" rx="32" fill="url(#fs-illust-sky)" />

      {/* Distant horizon hint */}
      <rect x="0" y="430" width="600" height="170" fill="#eaf3fa" opacity="0.9" />
      <rect x="0" y="500" width="600" height="100" fill="#dfecf6" opacity="0.7" />

      {/* Soft clouds */}
      <g opacity="0.85" filter="url(#fs-illust-blur)">
        <ellipse cx="120" cy="230" rx="74" ry="14" fill="#ffffff" />
        <ellipse cx="170" cy="240" rx="44" ry="12" fill="#ffffff" />
        <ellipse cx="450" cy="180" rx="70" ry="14" fill="#ffffff" />
        <ellipse cx="500" cy="195" rx="40" ry="10" fill="#ffffff" />
        <ellipse cx="340" cy="395" rx="90" ry="14" fill="#ffffff" />
        <ellipse cx="490" cy="410" rx="60" ry="12" fill="#ffffff" />
      </g>

      {/* Vapour trail — gradient streak behind the jet */}
      <path
        d="M 120 360 Q 240 320, 380 280 L 380 296 Q 240 336, 120 376 Z"
        fill="url(#fs-illust-trail)"
      />

      {/* Jet — solid black silhouette, climbing right + slightly up.
          Built from primitives so it stays crisp at any zoom and
          matches the Nav glyph's silhouette (same brand mark, larger). */}
      <g transform="translate(380, 280) rotate(-8)">
        {/* Fuselage — long teardrop pointing right */}
        <path
          d="
            M 0 0
            C 30 -8, 90 -10, 130 -7
            L 144 -2
            L 130 7
            C 90 10, 30 8, 0 0 Z
          "
          fill="var(--fs-ink, #0a0a0a)"
        />
        {/* Swept wing dropping below mid-fuselage */}
        <path
          d="
            M 50 4
            L 8 30
            L 22 30
            L 78 8 Z
          "
          fill="var(--fs-ink, #0a0a0a)"
        />
        {/* T-tail */}
        <path
          d="
            M 6 -6
            L -6 -22
            L 4 -22
            L 18 -4 Z
          "
          fill="var(--fs-ink, #0a0a0a)"
        />
        <path
          d="M -10 -22 L 10 -22 L 10 -19 L -10 -19 Z"
          fill="var(--fs-ink, #0a0a0a)"
        />
        {/* Rear engine pod */}
        <ellipse cx="14" cy="-2" rx="8" ry="3.5" fill="var(--fs-ink, #0a0a0a)" />
        {/* Cockpit window — single small accent */}
        <ellipse cx="120" cy="-1.5" rx="6" ry="2.4" fill="var(--fs-accent, #53aae2)" />
      </g>

      {/* A subtle airport/runway hint at the bottom — three converging
          lines, fades into the horizon. Reads as "destination" without
          shouting. */}
      <g opacity="0.35">
        <line x1="50"  y1="600" x2="280" y2="525" stroke="#b8d4ea" strokeWidth="1.2" />
        <line x1="150" y1="600" x2="300" y2="525" stroke="#b8d4ea" strokeWidth="1.2" />
        <line x1="250" y1="600" x2="320" y2="525" stroke="#b8d4ea" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
