/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint runs at build now (was previously suppressed). Errors fail the
  // build — same lint signal as CI/PRs locally.
  eslint: {
    dirs: ['src'],
  },
  experimental: {
    serverComponentsExternalPackages: ['playwright-core'],
  },
  images: {
    // Next 14 deprecates images.domains in favour of remotePatterns; keeping
    // remotePatterns only.
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: https: blob:; " +
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
              "frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
