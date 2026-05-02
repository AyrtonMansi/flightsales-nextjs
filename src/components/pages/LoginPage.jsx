'use client';
import { useState } from 'react';
import { Icons } from '../Icons';

const LoginPage = ({ setPage, signIn, signUp, signInWithGoogle, resetPassword, loginDemo }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Google OAuth redirects — page will reload
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (!email) throw new Error('Enter your email');
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset link.');
    } finally { setLoading(false); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        setPage('dashboard');
      } else if (mode === 'register') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        await signUp(email, password, {
          full_name: fullName,
          phone,
          account_type: accountType
        });
        setRegisterSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fs-login-shell">
      <aside className="fs-login-brand">
        <div className="fs-login-brand-inner">
          <div className="fs-login-brand-wordmark">FlightSales</div>
          <p className="fs-login-brand-tagline">Australia's marketplace for aircraft.</p>
        </div>
      </aside>
      <div className="fs-login-form-col">
        <div className="fs-login-form-inner">
        {/* Back Button */}
        <button 
          onClick={() => setPage('home')}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 6, 
            fontSize: 14, 
            color: "var(--fs-gray-500)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 24,
            padding: "8px 0",
            transition: "color 0.15s ease"
          }}
          onMouseEnter={e => e.target.style.color = "var(--fs-gray-900)"}
          onMouseLeave={e => e.target.style.color = "var(--fs-gray-500)"}
        >
          <span style={{ fontSize: 12 }}>←</span> Back to home
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 28, marginBottom: 8, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 15, color: "var(--fs-gray-500)", lineHeight: 1.5 }}>
            {mode === 'login' ? 'Sign in to manage your listings and saved aircraft' : 'Join Flightsales to buy and sell aircraft across Australia'}
          </p>
        </div>

        <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-lg)", padding: "32px", borderRadius: "var(--fs-radius)", background: "white" }}>
          {/* Google Auth */}
          <button 
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "14px", 
              border: "1px solid var(--fs-gray-200)", 
              borderRadius: "var(--fs-radius-sm)", 
              background: "white", 
              fontSize: 15, 
              fontWeight: 600, 
              cursor: loading ? "not-allowed" : "pointer", 
              fontFamily: "var(--fs-font)", 
              marginBottom: 24, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 12,
              opacity: loading ? 0.6 : 1,
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={e => { if (!loading) { e.target.style.borderColor = "var(--fs-gray-400)"; e.target.style.background = "var(--fs-gray-50)"; }}}
            onMouseLeave={e => { e.target.style.borderColor = "var(--fs-gray-200)"; e.target.style.background = "white"; }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  width: 18,
                  height: 18,
                  border: "2px solid var(--fs-gray-200)",
                  borderTopColor: "var(--fs-accent)",
                  borderRadius: "50%",
                  animation: "fs-spin 1s linear infinite",
                  display: "inline-block"
                }} />
                Connecting...
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </>
            )}
          </button>

          <div style={{ textAlign: "center", color: "var(--fs-gray-400)", fontSize: 13, margin: "20px 0", position: "relative" }}>
            <span style={{ background: "white", padding: "0 12px", position: "relative", zIndex: 1 }}>or continue with email</span>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--fs-gray-200)" }} />
          </div>

          {error && (
            <div className="fs-form-error" style={{ 
              padding: "12px 16px", 
              background: "#fef2f2", 
              borderRadius: "var(--fs-radius-sm)", 
              marginBottom: 20,
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          {mode === 'forgot' ? (
            <form onSubmit={handleResetPassword}>
              {resetSent ? (
                <div style={{ padding: "32px 20px", textAlign: "center", background: "var(--fs-bg-2)", borderRadius: "var(--fs-radius)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--fs-ink)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>{Icons.check}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>Check your email</h3>
                  <p style={{ fontSize: 14, color: "var(--fs-ink-3)" }}>We've sent a password reset link to <strong>{email}</strong>. The link expires in 1 hour.</p>
                  <button type="button" onClick={() => { setMode('login'); setResetSent(false); setError(null); }} style={{ marginTop: 16, background: "none", border: "none", color: "var(--fs-ink)", fontSize: 14, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: "var(--fs-ink-3)", marginBottom: 16 }}>Enter your email and we'll send you a link to reset your password.</p>
                  <div className="fs-form-group">
                    <label className="fs-form-label" htmlFor="auth-reset-email">Email *</label>
                    <input id="auth-reset-email" className="fs-form-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={{ fontSize: 15 }} />
                  </div>
                  <button type="submit" className="fs-form-submit" disabled={loading || !email} style={{ opacity: loading || !email ? 0.6 : 1 }}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                  <p style={{ fontSize: 14, textAlign: "center", marginTop: 20, color: "var(--fs-ink-3)" }}>
                    Remembered it?{' '}
                    <button type="button" onClick={() => { setMode('login'); setError(null); }} style={{ background: "none", border: "none", color: "var(--fs-ink)", fontWeight: 600, fontSize: 14, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                      Back to sign in
                    </button>
                  </p>
                </>
              )}
            </form>
          ) : (
          <form onSubmit={handleEmailAuth}>
            {mode === 'register' && (
              <>
                <div className="fs-form-group">
                  <label className="fs-form-label">Account Type *</label>
                  <div className="fs-grid-2">
                    <div
                      onClick={() => setAccountType('private')}
                      style={{ 
                        padding: "14px 12px", 
                        borderRadius: "var(--fs-radius-sm)",
                        border: accountType === 'private' ? "2px solid var(--fs-ink)" : "1px solid var(--fs-gray-200)",
                        background: accountType === 'private' ? "#eff6ff" : "white",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 20 }}>👤</span>
                      <span style={{ fontSize: 14, fontWeight: accountType === 'private' ? 600 : 400, color: accountType === 'private' ? "var(--fs-ink)" : "var(--fs-gray-700)" }}>
                        Private Seller
                      </span>
                      <span style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>Individual owner</span>
                    </div>
                    <div
                      onClick={() => setAccountType('business')}
                      style={{ 
                        padding: "14px 12px", 
                        borderRadius: "var(--fs-radius-sm)",
                        border: accountType === 'business' ? "2px solid var(--fs-ink)" : "1px solid var(--fs-gray-200)",
                        background: accountType === 'business' ? "#eff6ff" : "white",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 20 }}>🏢</span>
                      <span style={{ fontSize: 14, fontWeight: accountType === 'business' ? 600 : 400, color: accountType === 'business' ? "var(--fs-ink)" : "var(--fs-gray-700)" }}>
                        Dealer
                      </span>
                      <span style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>Business account</span>
                    </div>
                  </div>
                  <input type="hidden" name="accountType" value={accountType} />
                </div>

                <div className="fs-form-group">
                  <label className="fs-form-label" htmlFor="auth-fullname">Full Name *</label>
                  <input
                    id="auth-fullname"
                    className="fs-form-input"
                    type="text"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required={mode === 'register'}
                    autoComplete="name"
                    style={{ fontSize: 15 }}
                  />
                </div>

                <div className="fs-form-group">
                  <label className="fs-form-label" htmlFor="auth-phone">Phone Number</label>
                  <input
                    id="auth-phone"
                    className="fs-form-input"
                    type="tel"
                    placeholder="04XX XXX XXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    autoComplete="tel"
                    style={{ fontSize: 15 }}
                  />
                </div>
              </>
            )}

            <div className="fs-form-group">
              <label className="fs-form-label" htmlFor="auth-email">Email *</label>
              <input
                id="auth-email"
                className="fs-form-input"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ fontSize: 15 }}
              />
            </div>

            <div className="fs-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="fs-form-label" htmlFor="auth-password" style={{ marginBottom: 0 }}>Password *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setPassword(''); }}
                    style={{ background: "none", border: "none", color: "var(--fs-ink)", fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                className="fs-form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? "current-password" : "new-password"}
                style={{ fontSize: 15 }}
              />
              {mode === 'register' && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: password.length >= 8 ? "var(--fs-green)" : password.length > 0 ? "var(--fs-amber)" : "var(--fs-line-2)",
                    transition: "all 0.2s"
                  }} />
                  <span style={{ fontSize: 11, color: password.length >= 8 ? "var(--fs-green)" : password.length > 0 ? "var(--fs-amber)" : "var(--fs-ink-4)" }}>
                    {password.length >= 8 ? "Password looks good" : password.length > 0 ? "At least 8 characters required" : "Must be at least 8 characters"}
                  </span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="fs-form-submit"
              disabled={loading || (mode === 'register' && password.length < 8)}
              style={{ 
                opacity: loading || (mode === 'register' && password.length < 8) ? 0.6 : 1,
                cursor: loading || (mode === 'register' && password.length < 8) ? "not-allowed" : "pointer",
                marginTop: 8
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ 
                    width: 16, 
                    height: 16, 
                    border: "2px solid rgba(255,255,255,0.3)", 
                    borderTopColor: "white", 
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite",
                    display: "inline-block"
                  }} />
                  Please wait...
                </span>
              ) : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
          )}

          {mode !== 'forgot' && (
          <p style={{ fontSize: 14, textAlign: "center", marginTop: 24, color: "var(--fs-gray-500)" }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setPassword('');
              }}
              style={{ 
                color: "var(--fs-ink)", 
                fontWeight: 600, 
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: "4px 8px",
                fontSize: 14,
                borderRadius: "var(--fs-radius-sm)",
                transition: "all 0.15s ease",
                marginLeft: 4
              }}
              onMouseEnter={e => e.target.style.background = "var(--fs-gray-100)"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
          )}

          {mode === 'register' && !registerSuccess && (
            <p style={{ fontSize: 12, textAlign: "center", marginTop: 20, color: "var(--fs-gray-400)", lineHeight: 1.6, padding: "0 16px" }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              <br />Dealer accounts require verification before listings go live.
            </p>
          )}
        </div>

        {registerSuccess && (
          <div style={{ marginTop: 24, padding: "20px", background: "#d1fae5", borderRadius: "var(--fs-radius)", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✉️</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#065f46", marginBottom: 4 }}>Check your email!</p>
            <p style={{ fontSize: 13, color: "#065f46" }}>We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          </div>
        )}

        {/* Demo Access — dev/preview only. process.env.NODE_ENV is statically
            replaced at build time, so this entire block (including the
            decorative emoji glyphs in the labels) is tree-shaken out of the
            production bundle. */}
        {process.env.NODE_ENV !== 'production' && (
          <div style={{ marginTop: 32, padding: "24px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius)", border: "1px dashed var(--fs-gray-300)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fs-gray-700)", marginBottom: 12, textAlign: "center" }}>Demo Access (dev only)</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {['private', 'dealer', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => loginDemo(role)}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: "10px 16px",
                    background: "white",
                    border: "1px solid var(--fs-gray-200)",
                    borderRadius: "var(--fs-radius-sm)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    color: "var(--fs-gray-700)",
                    textTransform: "capitalize"
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
