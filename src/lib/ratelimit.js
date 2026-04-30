// Lightweight rate limiter. Two backends:
//
//   1. Upstash Redis (preferred for prod) — when UPSTASH_REDIS_REST_URL
//      and UPSTASH_REDIS_REST_TOKEN are set in Vercel env.
//   2. In-memory fallback (per-instance, dev-only) — when those vars
//      are unset. Useful for local development; useless in production
//      because Vercel functions are stateless and can scale across
//      instances.
//
// Returns { ok: true } if under limit, { ok: false, retryAfter } if
// over. Caller should respond with 429 on { ok: false }.
//
// Identifier strategy: callers pass a stable string (typically IP +
// route name). For abuse-resistant rate limiting, hash this with a
// rolling pepper before sending to Upstash.

const MEM_BUCKETS = new Map();

function memTake(key, limit, windowMs) {
  const now = Date.now();
  const bucket = MEM_BUCKETS.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  MEM_BUCKETS.set(key, bucket);
  return {
    ok: bucket.count <= limit,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

async function upstashTake(key, limit, windowMs) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const windowSec = Math.ceil(windowMs / 1000);
  // INCR + EXPIRE in one pipeline. Atomic enough for rate limiting at
  // our scale; for billions of req/day you'd want a lua script.
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec, 'NX'],
      ]),
    });
    const json = await res.json();
    const count = Number(json?.[0]?.result || 1);
    return {
      ok: count <= limit,
      retryAfter: windowSec,
    };
  } catch {
    return null;
  }
}

// Public API. `id` should be like "ip:1.2.3.4:enquiries".
// limit / windowMs default to 10 per hour, suitable for form submits.
export async function rateLimit(id, { limit = 10, windowMs = 60 * 60 * 1000 } = {}) {
  const upstash = await upstashTake(id, limit, windowMs);
  if (upstash) return upstash;
  return memTake(id, limit, windowMs);
}

// Pull the caller's IP from request headers. Vercel sets x-forwarded-for
// to a comma list; the client IP is the first entry. Falls back to a
// constant so the rate limit at least applies in dev.
export function callerIp(req) {
  const fwd = req.headers.get('x-forwarded-for') || '';
  const first = fwd.split(',')[0].trim();
  return first || req.headers.get('x-real-ip') || 'unknown';
}
