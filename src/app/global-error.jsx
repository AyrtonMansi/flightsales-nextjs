'use client';

// Last-resort boundary: catches errors thrown by the root layout itself,
// where app/error.jsx can't help because the layout that would wrap it is
// the thing that failed. This replaces the entire document, so it must
// render its own <html>/<body> and cannot rely on globals.css having
// loaded — every style here is inline on purpose.
//
// Only active in production builds; in dev Next.js shows its error overlay.

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#ffffff',
          color: '#0a0a0a',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#52525b', lineHeight: 1.6, margin: '0 0 24px' }}>
            FlightSales hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 22px',
              borderRadius: 6,
              border: 'none',
              background: '#0a0a0a',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
          {error?.digest && (
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 20 }}>Reference: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
