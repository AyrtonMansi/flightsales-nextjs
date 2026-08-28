import { createHash, createHmac } from 'node:crypto';

// Distributed rate limiter for public write endpoints.
// Upstash Redis is the production backend. Development may fall back to a
// per-process memory bucket, but production deliberately reports an unavailable
// limiter when Redis is missing/unreachable so callers can fail closed instead
// of silently running without abuse protection.

const MEM_BUCKETS = new Map();

function memTake(key, limit, windowMs) {
  const now = Date.now();
  const bucket = MEM_BUCKETS.get(key) || { count: 0, resetAt: now + windowMs };
  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  MEM_BUCKETS.set(key, bucket);
  return {
    ok: bucket.count <= limit,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    backend: 'memory',
  };
}

function privateKey(id) {
  const raw = String(id || 'unknown');
  const pepper = process.env.RATELIMIT_PEPPER;
  const digest = pepper
    ? createHmac('sha256', pepper).update(raw).digest('hex')
    : createHash('sha256').update(raw).digest('hex');
  return `fs:rl:${digest}`;
}

async function upstashTake(key, limit, windowMs) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec, 'NX'],
        ['TTL', key],
      ]),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const count = Number(json?.[0]?.result || 1);
    const ttl = Number(json?.[2]?.result || windowSec);
    return {
      ok: count <= limit,
      retryAfter: Math.max(1, ttl > 0 ? ttl : windowSec),
      backend: 'redis',
    };
  } catch {
    return null;
  }
}

export async function rateLimit(id, { limit = 10, windowMs = 60 * 60 * 1000 } = {}) {
  const key = privateKey(id);
  const distributed = await upstashTake(key, limit, windowMs);
  if (distributed) return distributed;

  if (process.env.NODE_ENV === 'production') {
    // Security control unavailable. Public write routes should return 503 rather
    // than become unlimited because a Redis secret was omitted or the backend
    // failed. Callers can distinguish this from a genuine 429 via unavailable.
    return { ok: false, retryAfter: 60, unavailable: true, backend: 'unavailable' };
  }

  return memTake(key, limit, windowMs);
}

export function callerIp(req) {
  // Vercel/proxies append hops to x-forwarded-for; the first value is the
  // originating client in the supported deployment topology. We never persist
  // the raw IP in the limiter backend: rateLimit hashes it before storage.
  const fwd = req.headers.get('x-forwarded-for') || '';
  const first = fwd.split(',')[0].trim();
  return first || req.headers.get('x-real-ip') || 'unknown';
}
