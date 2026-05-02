'use client';

import { useState, useEffect } from 'react';

export default function PasswordGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem('fs_site_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

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
        sessionStorage.setItem('fs_site_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  // Don't show gate if password protection is disabled
  if (process.env.NEXT_PUBLIC_SITE_PASSWORD_PROTECTED !== 'true') {
    return children;
  }

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
