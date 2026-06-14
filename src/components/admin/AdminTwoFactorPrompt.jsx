'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Inline banner shown at the top of the admin dashboard when the
// signed-in admin doesn't have a TOTP factor enrolled. Provides a
// "Set up 2FA" button that walks through Supabase's MFA enrol flow
// (returns a QR code → user scans → user submits 6-digit code).
//
// We don't HARD block admin access without 2FA — that would lock the
// initial admin out of their own dashboard. Instead we surface the
// prompt prominently every visit until enrol completes.
export default function AdminTwoFactorPrompt() {
  const [factor, setFactor] = useState(null); // null = unknown, [] = none, [...] = enrolled
  const [enrolling, setEnrolling] = useState(false);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  // Initial probe — does this admin have any factors yet?
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        setFactor(data?.totp || []);
      } catch {
        setFactor([]);
      }
    })();
  }, []);

  if (factor === null) return null;
  // Already enrolled or just enrolled in this session.
  if ((factor && factor.length > 0) || done) return null;

  const startEnrol = async () => {
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (err) throw err;
      setSecret({ factorId: data.id, qr: data.totp.qr_code, code: data.totp.secret });
      setEnrolling(true);
    } catch (err) {
      setError(err.message || 'Failed to start enrolment');
    }
  };

  const verifyEnrol = async (e) => {
    e.preventDefault();
    setError(null);
    if (!secret) return;
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: secret.factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: secret.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (vErr) throw vErr;
      setDone(true);
    } catch (err) {
      setError(err.message || 'Code rejected. Check your authenticator app.');
    }
  };

  return (
    <div className="fs-2fa-prompt">
      {!enrolling ? (
        <div className="fs-2fa-prompt-row">
          <div>
            <strong>Two-factor authentication isn't set up.</strong>
            <p>Admin accounts should use an authenticator app. Takes 30 seconds.</p>
          </div>
          <button type="button" onClick={startEnrol}>Set up 2FA</button>
        </div>
      ) : (
        <form onSubmit={verifyEnrol} className="fs-2fa-prompt-enrol">
          <div className="fs-2fa-prompt-enrol-grid">
            {secret?.qr && (
              <img src={secret.qr} alt="2FA QR code" width="160" height="160" style={{ background: 'white', padding: 8, borderRadius: 8 }} />
            )}
            <div>
              <p><strong>Scan with Google Authenticator / 1Password / Authy</strong></p>
              <p style={{ fontSize: 12, color: 'var(--fs-ink-3)' }}>
                Or enter manually: <code style={{ fontSize: 11 }}>{secret?.code}</code>
              </p>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ marginTop: 8, padding: '8px 10px', fontSize: 14, border: '1px solid var(--fs-line)', borderRadius: 6, width: 140, fontFamily: 'monospace', letterSpacing: 4 }}
              />
              {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{error}</p>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button type="submit" className="fs-confirm-btn fs-confirm-btn-primary fs-confirm-btn-sm">Verify & enable</button>
                <button type="button" onClick={() => { setEnrolling(false); setSecret(null); setCode(''); }} className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm">Cancel</button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
