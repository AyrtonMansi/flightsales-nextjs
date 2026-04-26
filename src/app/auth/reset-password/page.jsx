'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase puts the session in URL hash on redirect — ensure we have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionReady(!!session);
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => router.push('/'), 2500);
    } catch (err) {
      setError(err.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#FFFFFF', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 440, padding: 32, border: '1px solid #EEEEEE', borderRadius: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 8, color: '#000' }}>Set a new password</h1>
        <p style={{ fontSize: 14, color: '#545454', marginBottom: 24, lineHeight: 1.5 }}>Choose a secure password — at least 8 characters.</p>

        {!sessionReady && !done && (
          <div style={{ padding: 16, background: '#F6F6F6', borderRadius: 8, fontSize: 14, color: '#545454', marginBottom: 16 }}>
            Verifying reset link...
          </div>
        )}

        {done ? (
          <div style={{ padding: 24, background: '#F6F6F6', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#000', marginBottom: 4 }}>Password updated</div>
            <p style={{ fontSize: 14, color: '#545454' }}>Redirecting to homepage...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ fontSize: 13, color: '#E11900', marginBottom: 12 }}>{error}</p>}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>New password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: 12, border: '1px solid #EEEEEE', borderRadius: 8, fontSize: 14.5, fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#000'}
                onBlur={e => e.target.style.borderColor = '#EEEEEE'}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: 12, border: '1px solid #EEEEEE', borderRadius: 8, fontSize: 14.5, fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#000'}
                onBlur={e => e.target.style.borderColor = '#EEEEEE'}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !sessionReady}
              style={{ width: '100%', padding: 14, background: '#000', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading || !sessionReady ? 'not-allowed' : 'pointer', opacity: loading || !sessionReady ? 0.5 : 1, fontFamily: 'inherit' }}
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
