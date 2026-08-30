'use client';

// Premium campaign artwork for the homepage hero. The search block on the
// left is intentionally untouched; this SVG only upgrades the right-hand
// visual so the landing page feels more like a high-value marketplace than a
// generic illustration. Inline SVG keeps the artwork zero-network and crisp.

export default function HeroIllustration() {
  return (
    <svg
      className="fs-hero-illust fs-hero-campaign-art"
      viewBox="0 0 600 600"
      role="img"
      aria-label="Business jet departing over a quiet runway"
    >
      <defs>
        <linearGradient id="fs-campaign-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d7ecff" />
          <stop offset="44%" stopColor="#eef7ff" />
          <stop offset="78%" stopColor="#f9fcff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="fs-campaign-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf3fb" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id="fs-campaign-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="36%" stopColor="#ffffff" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#7fbee8" stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id="fs-campaign-shadow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#050505" />
          <stop offset="100%" stopColor="#1c2a33" />
        </linearGradient>
        <radialGradient id="fs-campaign-glow" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="64%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="fs-campaign-soft"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="fs-campaign-haze"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      <rect x="0" y="0" width="600" height="600" rx="32" fill="url(#fs-campaign-sky)" />
      <rect x="0" y="0" width="600" height="600" rx="32" fill="url(#fs-campaign-glow)" />

      {/* Editorial cloud forms — restrained and atmospheric, not cartoony. */}
      <g filter="url(#fs-campaign-soft)" opacity="0.9">
        <path d="M 84 250 C 112 230 144 228 168 249 C 188 240 210 246 222 264 C 188 272 132 273 76 265 C 72 260 75 254 84 250 Z" fill="#fff" opacity="0.9" />
        <path d="M 358 146 C 375 132 398 133 412 147 C 428 142 444 146 456 158 C 424 162 385 162 346 157 C 346 153 350 149 358 146 Z" fill="#fff" opacity="0.72" />
        <path d="M 402 376 C 432 360 466 363 488 383 C 509 378 535 385 552 402 C 502 408 446 407 382 398 C 382 390 389 382 402 376 Z" fill="#fff" opacity="0.55" />
      </g>

      {/* Far horizon and runway perspective — faint enough to support the jet. */}
      <g opacity="0.72">
        <path d="M 0 438 C 75 423 136 428 197 441 C 265 452 321 432 391 444 C 475 456 526 439 600 448 L 600 600 L 0 600 Z" fill="url(#fs-campaign-ground)" />
        <path d="M 0 462 C 86 454 148 459 215 468 C 281 477 352 462 421 472 C 493 483 543 472 600 481" fill="none" stroke="#c6dff1" strokeWidth="1" opacity="0.45" />
      </g>
      <g opacity="0.38">
        <path d="M 254 600 L 340 468" stroke="#b6d3e9" strokeWidth="1.4" />
        <path d="M 348 600 L 360 470" stroke="#d7e9f5" strokeWidth="3" />
        <path d="M 442 600 L 382 468" stroke="#b6d3e9" strokeWidth="1.4" />
        <path d="M 52 600 L 318 468" stroke="#dcecf7" strokeWidth="1" />
        <path d="M 548 600 L 400 470" stroke="#dcecf7" strokeWidth="1" />
      </g>
      <path d="M 210 594 C 284 562 388 562 466 594" stroke="#ffffff" strokeWidth="3" opacity="0.82" />

      {/* Vapour trail: wider at the aircraft, dissolving into the left field. */}
      <path d="M 63 372 C 176 326 271 293 393 261 L 401 281 C 274 311 176 349 68 392 Z" fill="url(#fs-campaign-trail)" opacity="0.95" />
      <path d="M 88 381 C 202 338 286 309 400 279" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.72" />

      {/* Large, more deliberate 3/4 business jet silhouette. */}
      <g transform="translate(392 258) rotate(-8)">
        <ellipse cx="40" cy="58" rx="96" ry="14" fill="#5c7f95" opacity="0.13" filter="url(#fs-campaign-haze)" />
        <path
          d="M 3 8 C 37 -3 92 -8 142 -5 C 170 -3 187 1 190 7 C 171 18 125 26 75 28 C 42 29 17 23 3 8 Z"
          fill="url(#fs-campaign-shadow)"
        />
        <path
          d="M 54 25 L -18 70 C -23 73 -21 78 -14 78 L 37 78 L 103 28 Z"
          fill="#030303"
        />
        <path
          d="M 23 3 L -8 -24 L 9 -27 L 54 5 Z"
          fill="#050505"
        />
        <path
          d="M -10 -27 L 25 -28 L 25 -23 L -9 -21 Z"
          fill="#050505"
        />
        <path
          d="M 108 -4 C 126 -5 153 -3 174 0" stroke="#64b7e9" strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
        <g opacity="0.5" fill="#73bdea">
          <rect x="80" y="5" width="8" height="2.2" rx="1.1" />
          <rect x="94" y="3.5" width="8" height="2.2" rx="1.1" />
          <rect x="108" y="2.2" width="8" height="2.2" rx="1.1" />
          <rect x="122" y="1.4" width="8" height="2.2" rx="1.1" />
        </g>
        <ellipse cx="162" cy="2.5" rx="7" ry="2.4" fill="var(--fs-accent, #53aae2)" opacity="0.85" />
        <ellipse cx="22" cy="16" rx="14" ry="5" fill="#0b0b0b" opacity="0.9" />
      </g>

      <rect x="0" y="0" width="600" height="600" rx="32" fill="none" stroke="#d7e8f4" strokeWidth="1" opacity="0.55" />
    </svg>
  );
}
