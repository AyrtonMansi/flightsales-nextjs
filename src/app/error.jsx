'use client';

// Route-level error boundary. Without this file, an uncaught render error
// anywhere in the app shows Next.js's own unstyled error screen — in
// production that's a blank page with a digest hash and no way back, which
// reads as "this site is broken" rather than "something went wrong on this
// page". Every other route stays fine, so the important part is offering a
// retry and a route out.

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // The global handler installed by lib/errorLogger only sees uncaught
    // window errors; React swallows render errors into this boundary, so
    // report them explicitly or they never reach Sentry.
    // eslint-disable-next-line no-console
    console.error('[fs-error] route boundary:', error);
    if (typeof window !== 'undefined' && typeof window.__fsReportError === 'function') {
      window.__fsReportError(error);
    }
  }, [error]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: 'var(--fs-ink-3)', lineHeight: 1.6, marginBottom: 24 }}>
          This page hit an unexpected error. Trying again usually works — if it
          keeps happening, <a className="fs-link" href="/contact">let us know</a> and
          we&apos;ll look into it.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="fs-detail-cta fs-detail-cta-primary" onClick={() => reset()}>
            Try again
          </button>
          <a className="fs-detail-cta fs-detail-cta-secondary" href="/">
            Back to home
          </a>
        </div>
        {error?.digest && (
          <p style={{ fontSize: 11, color: 'var(--fs-ink-4, #9ca3af)', marginTop: 20 }}>
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
