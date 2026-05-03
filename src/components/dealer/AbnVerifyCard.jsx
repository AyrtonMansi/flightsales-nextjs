'use client';
import { useState } from 'react';

// ABN verification card — sits in the dealer dashboard's Business profile
// section. Single input + Verify button. Calls /api/abn-verify which hits
// the Australian Business Register, then displays the matched legal name,
// entity type, GST status, and a green "Verified" badge if the ABN is
// active. Caches everything on profiles so the badge persists.
//
// `user` here is the loaded profile row — we read user.abn,
// user.abn_verified_at, user.abn_business_name, etc. for the initial
// state. After a successful verify, the API returns the fresh values
// and we mirror them locally without forcing a profile refetch.

function fmtAbn(raw) {
  const d = String(raw || '').replace(/\D+/g, '');
  if (d.length !== 11) return raw || '';
  // ATO standard format: 11 222 333 444
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 11)}`;
}

export default function AbnVerifyCard({ user }) {
  const [abn, setAbn] = useState(user?.abn || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(() => (
    user?.abn_verified_at ? {
      verified: true,
      abn: user.abn,
      business_name: user.abn_business_name,
      entity_type: user.abn_entity_type,
      status: user.abn_status,
      gst_registered: user.abn_gst_registered,
      postcode: user.abn_postcode,
      state: user.abn_state,
      verified_at: user.abn_verified_at,
    } : null
  ));

  const handleVerify = async () => {
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/abn-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ abn }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        const msg = j.error === 'invalid_abn'        ? 'That ABN doesn’t look right — check the 11 digits.'
                  : j.error === 'abr_error'          ? `ABR couldn’t find that ABN.${j.detail ? ` (${j.detail})` : ''}`
                  : j.error === 'abr_unreachable'    ? 'Couldn’t reach the Australian Business Register. Try again in a minute.'
                  : j.error === 'abr_not_configured' ? 'ABN verification isn’t configured on this site yet. Email support@flightsales.com.au.'
                  : j.error === 'unauthenticated'    ? 'Sign in first.'
                  : 'Verification failed. Try again.';
        setError(msg);
        setResult(null);
        return;
      }
      setResult({ ...j, verified_at: new Date().toISOString() });
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const verified = result?.verified;

  return (
    <div className="fs-abn-card">
      <div className="fs-abn-head">
        <div>
          <h3 className="fs-abn-title">Business verification</h3>
          <p className="fs-abn-sub">
            We verify your business automatically against the Australian Business
            Register. Listings from verified businesses get a badge buyers trust.
          </p>
        </div>
        {verified && (
          <span className="fs-abn-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Verified by ABR
          </span>
        )}
      </div>

      <div className="fs-abn-row">
        <input
          type="text"
          className="fs-form-input"
          inputMode="numeric"
          placeholder="11-digit ABN"
          value={abn}
          onChange={(e) => setAbn(e.target.value)}
          maxLength={14}      /* 11 digits + 3 spaces */
          disabled={busy}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="fs-form-submit"
          onClick={handleVerify}
          disabled={busy || !abn.replace(/\D+/g, '')}
          style={{ width: 'auto', padding: '12px 24px' }}
        >
          {busy ? 'Checking ABR…' : verified ? 'Re-verify' : 'Verify'}
        </button>
      </div>

      {error && <p className="fs-abn-error">{error}</p>}

      {result && (
        <div className={`fs-abn-result fs-abn-result-${verified ? 'ok' : 'warn'}`}>
          <dl>
            <div><dt>Legal name</dt><dd>{result.business_name || '—'}</dd></div>
            <div><dt>ABN</dt><dd>{fmtAbn(result.abn)}</dd></div>
            <div><dt>Status</dt><dd>{result.status || '—'}</dd></div>
            <div><dt>Entity type</dt><dd>{result.entity_type || '—'}</dd></div>
            <div><dt>GST</dt><dd>{result.gst_registered ? 'Registered' : 'Not registered'}</dd></div>
            {(result.state || result.postcode) && (
              <div><dt>Registered address</dt><dd>{[result.state, result.postcode].filter(Boolean).join(' ')}</dd></div>
            )}
          </dl>
          {!verified && (
            <p className="fs-abn-hint">
              The ABR returned this ABN but it’s not currently <strong>Active</strong>.
              Reactivate it with the ATO and re-verify here to get your badge.
            </p>
          )}
        </div>
      )}

      <p className="fs-abn-foot">
        We only store the ABN, the registered legal name, and the active status.
        We never see your TFN, financials, or anything ABR doesn’t publish on the
        free ABN Lookup service.
      </p>
    </div>
  );
}
