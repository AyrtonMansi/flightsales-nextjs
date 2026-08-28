'use client';

import { useState, useEffect } from 'react';

// `enabled` is decided on the server (src/lib/siteGate.js) and passed in by
// the root layout. This component deliberately reads NO env var itself —
// the previous version checked NEXT_PUBLIC_SITE_PASSWORD_PROTECTED while
// the API route checked SITE_PASSWORD_PROTECTED, so the two could disagree
// and the documented launch procedure left the wall up for real visitors.
export default function PasswordGate({ children, enabled = true }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // When the gate is off there is nothing to look up, so skip the loading
  // state entirely — otherwise every visitor gets a full-screen black
  // "Loading…" flash on first paint of every cold load.
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    // sessionStorage can throw in private mode / when site data is blocked.
    try {
      if (sessionStorage.getItem('fs_site_auth') === 'true') {
        setIsAuthenticated(true);
      }
    } catch { /* treat as not authenticated */ }
    setIsLoading(false);
  }, [enabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/site-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.ok) {
        try { sessionStorage.setItem('fs_site_auth', 'true'); } catch { /* non-fatal */ }
        setIsAuthenticated(true);
      } else if (res.status === 429) {
        setError('Too many attempts. Wait a minute and try again.');
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  // Gate disabled server-side — render the site with no flash, no fetch.
  if (!enabled) return children;

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#fff'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return children;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <svg width="48" height="22" viewBox="0 0 32 14" fill="currentColor" style={{ color: '#fff' }}>
            <path d="M31.4 6.6c-.3-.5-1.1-.8-2.4-.9l-9.7-.4-5.7-3.5h-1.7l1.6 3.4-4.6-.1-3-2.2H4.4l1.6 2.4-4.4.6c-.5.1-.9.4-.9.8v.6c0 .4.4.7.9.8l4.4.6-1.6 2.4h1.5l3-2.2 4.6-.1-1.6 3.4h1.7l5.7-3.5 9.7-.4c1.3-.1 2.1-.4 2.4-.9z"/>
          </svg>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginTop: '16px',
            color: '#fff',
            letterSpacing: '-0.02em'
          }}>
            FlightSales
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#888',
            marginTop: '8px'
          }}>
            Coming soon. Enter password to access.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              border: error ? '1px solid #ef4444' : '1px solid #333',
              background: '#1a1a1a',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            style={{
              padding: '14px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#fff',
              color: '#000',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Enter
          </button>
        </form>

        <p style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '32px'
        }}>
          © 2026 FlightSales. All rights reserved.
        </p>
      </div>
    </div>
  );
}
