'use client';
import { supabase } from './supabase';

// fetch() that carries the signed-in user's Supabase access token.
//
// The browser client keeps its session in localStorage (not cookies), so a
// plain fetch() to our own API routes arrives with no usable credentials —
// which is why every /api/admin/*, /api/abn-verify and /api/bulk-import/*
// call used to come back 403 even for a legitimate admin or dealer. The
// server side of this contract is src/lib/serverAuth.ts.
//
// Falls through to an unauthenticated request when there is no session, so
// routes that accept anonymous callers (reports, affiliate leads) keep
// working for logged-out visitors and simply attribute the row to nobody.
export async function authedFetch(url, options = {}) {
  let token = null;
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token ?? null;
  } catch {
    // No session available — send the request unauthenticated.
  }

  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(url, { ...options, headers });
}

// Convenience wrapper for the common "POST JSON, get JSON back" shape.
export async function authedPostJson(url, body, options = {}) {
  const res = await authedFetch(url, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON error body */ }
  return { res, json };
}
