'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
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
          keeps happening, <Link className="fs-link" href="/contact">let us know</Link> and
          we&apos;ll look into it.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="fs-detail-cta fs-detail-cta-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link className="fs-detail-cta fs-detail-cta-secondary" href="/">
            Back to home
          </Link>
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
