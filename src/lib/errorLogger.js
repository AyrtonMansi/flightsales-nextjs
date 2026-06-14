'use client';

// Lightweight unhandled-error logger. Two backends:
//
//   1. Sentry — when NEXT_PUBLIC_SENTRY_DSN is set in Vercel env.
//      Posts via the Sentry Store API (no @sentry/browser dependency,
//      keeps the bundle ~30KB lighter). Captures uncaught errors,
//      unhandled promise rejections, and the URL where they happened.
//   2. Console — when DSN is unset (development). Logs to console with
//      a [fs-error] prefix.
//
// Lives outside the React tree so it catches errors during render, not
// just in event handlers. Initialised once from layout / app root.
//
// Why not @sentry/nextjs: that package adds ~40KB and pulls in a
// build-time webpack plugin. For our volume (low single-digit
// errors/day expected), the simpler REST endpoint is enough.

let installed = false;

function parseDsn(dsn) {
  // DSN format: https://<key>@oXXX.ingest.sentry.io/<project>
  try {
    const u = new URL(dsn);
    const project = u.pathname.replace(/^\//, '');
    const key = u.username;
    const host = u.host;
    return { key, host, project };
  } catch {
    return null;
  }
}

async function postToSentry(dsn, eventBody) {
  const parsed = parseDsn(dsn);
  if (!parsed) return;
  const url = `https://${parsed.host}/api/${parsed.project}/store/`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7,sentry_key=${parsed.key},sentry_client=fs-error-logger/1.0`,
      },
      body: JSON.stringify(eventBody),
      keepalive: true,
    });
  } catch {
    // Last-resort: don't loop the logger when the logger itself fails.
  }
}

function buildEvent(level, message, error, extra = {}) {
  return {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    level,
    message,
    platform: 'javascript',
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'local',
    request: {
      url: typeof window !== 'undefined' ? window.location.href : '',
      headers: {
        'User-Agent': typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
    },
    exception: error ? {
      values: [{
        type: error.name || 'Error',
        value: error.message || String(error),
        stacktrace: error.stack ? { frames: parseStack(error.stack) } : undefined,
      }],
    } : undefined,
    extra,
  };
}

function parseStack(stack) {
  // Sentry expects frames in reverse order (bottom of stack first).
  // This is a best-effort parser — production-grade source mapping
  // would need the official SDK. Good enough for triage.
  return stack
    .split('\n')
    .slice(1, 11)
    .map(line => ({ function: line.trim() }))
    .reverse();
}

export function installErrorLogger() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  const handler = (level, msg, err, extra) => {
    if (dsn) {
      postToSentry(dsn, buildEvent(level, msg, err, extra));
    } else {
      console.warn('[fs-error]', msg, err || '', extra || '');
    }
  };

  window.addEventListener('error', (e) => {
    handler('error', e.message, e.error, { source: e.filename, line: e.lineno, col: e.colno });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    handler('error', r?.message || 'Unhandled promise rejection', r instanceof Error ? r : null, { reason: String(r) });
  });
}
