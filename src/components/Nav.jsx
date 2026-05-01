'use client';
import { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import NotificationBell from './NotificationBell';

// Top bar plus mobile drawer. Single source of truth for both layouts —
// the desktop horizontal nav and the mobile slide-in menu render from the
// same JSX so item parity stays automatic.
//
// Mobile drawer fixes vs prior version:
//   - Single full-viewport panel (was two absolute panels overlapping at
//     top:64px, which is why "Buy" was hidden under "Sell" on some renders)
//   - Solid white background that fully covers the page below (was
//     transparent so the underlying page bled through at the bottom)
//   - Slide-in transition + click-outside backdrop + body scroll lock
//   - Browse / Account section dividers
//   - Sign-out, Dashboard, Saved, My Listings reachable from the drawer
//     (used to be desktop-dropdown only — invisible on mobile)
const Nav = ({ page, setPage, setMobileOpen, mobileOpen, user, signOut }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Desktop avatar dropdown — close on click-outside.
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mobile drawer — ESC closes; body scroll locks while open.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, setMobileOpen]);

  const go = (target) => () => { setPage(target); setMobileOpen(false); };
  const handleSignOut = async () => {
    if (signOut) await signOut();
    setPage('home');
    setMobileOpen(false);
  };

  const browseItems = [
    { id: 'buy', label: 'Buy aircraft', icon: Icons.search },
    { id: 'sell', label: 'Sell aircraft', icon: Icons.tag },
    { id: 'dealers', label: 'Dealers', icon: Icons.user },
    { id: 'news', label: 'News', icon: Icons.file },
  ];

  return (
    <>
      <nav className="fs-nav">
        <div className="fs-container fs-nav-inner">
          <div className="fs-nav-logo" onClick={go('home')}>
            {/* Horizontal jet silhouette — paper-airplane chevron
                pointing right. Single solid-black path, currentColor
                so it inherits the wordmark's ink. Reads instantly as
                "flight / aircraft" without literal aircraft detail. */}
            <svg className="fs-nav-logo-mark" width="24" height="16" viewBox="0 0 24 16" fill="currentColor" aria-hidden="true">
              <path d="M22.6 8 1.6 .8a.6.6 0 0 0-.78.74L2.9 7.4a.6.6 0 0 1 0 .4 .6.6 0 0 0 0 .4L.82 14.46a.6.6 0 0 0 .78.74L22.6 8a.6.6 0 0 0 0-1.16Z" />
            </svg>
            <span className="fs-nav-logo-text">
              FlightSales<span className="fs-nav-logo-tld">.com.au</span>
            </span>
          </div>

          {/* Desktop nav links — hidden under 768px via CSS */}
          <div className="fs-nav-links">
            {browseItems.slice(0, 4).map(item => (
              <button
                key={item.id}
                className={`fs-nav-link${page === item.id ? ' active' : ''}`}
                onClick={go(item.id)}
              >
                {item.label.replace(' aircraft', '')}
              </button>
            ))}
          </div>

          {/* Desktop actions — hidden under 768px via CSS */}
          <div className="fs-nav-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <NotificationBell user={user} setPage={setPage} />
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    className="fs-nav-avatar-btn"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'U')}&background=0a0a0a&color=fff`}
                      alt={user.full_name || user.email}
                    />
                    <span>{user.full_name?.split(' ')[0] || user.email?.split('@')[0]}</span>
                  </button>
                  {dropdownOpen && (
                    <div className="fs-nav-dropdown">
                      <button onClick={() => { setPage('dashboard'); setDropdownOpen(false); }}>Dashboard</button>
                      <button onClick={() => { setPage('dashboard'); setDropdownOpen(false); }}>Saved aircraft</button>
                      <button onClick={() => { setPage('dashboard'); setDropdownOpen(false); }}>My listings</button>
                      <div className="fs-nav-dropdown-sep" />
                      <button className="danger" onClick={handleSignOut}>Sign out</button>
                    </div>
                  )}
                </div>
                <button className="fs-nav-btn fs-nav-btn-primary" onClick={go('sell')}>List Aircraft</button>
              </div>
            ) : (
              <>
                <button className="fs-nav-btn fs-nav-btn-ghost" onClick={go('login')}>Sign in</button>
                <button className="fs-nav-btn fs-nav-btn-primary" onClick={go('sell')}>List Aircraft</button>
              </>
            )}
          </div>

          <button
            className="fs-nav-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? Icons.x : Icons.menu}
          </button>
        </div>
      </nav>

      {/* Mobile drawer — separate fixed-position panel + backdrop. Sits
          outside <nav> so the slide animation doesn't fight the nav's
          sticky positioning. Always rendered (with a class toggle) so
          the slide-out transition has time to play before unmounting. */}
      <div
        className={`fs-mnav-backdrop${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fs-mnav${mobileOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        {/* Identity block — signed-in users get a real header; signed-out
            users get a smaller "Sign in" CTA so the menu doesn't feel
            empty up top. */}
        {user ? (
          <div className="fs-mnav-id">
            <img
              className="fs-mnav-avatar"
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'U')}&background=0a0a0a&color=fff`}
              alt=""
              aria-hidden="true"
            />
            <div className="fs-mnav-id-text">
              <p className="fs-mnav-name">{user.full_name || user.email}</p>
              <p className="fs-mnav-sub">
                {user.role === 'admin' ? 'Admin' : (user.is_dealer ? 'Verified Dealer' : 'Private Seller')}
              </p>
            </div>
          </div>
        ) : (
          <div className="fs-mnav-anon">
            <p className="fs-mnav-anon-title">FlightSales</p>
            <p className="fs-mnav-anon-sub">Sign in to save aircraft and manage listings.</p>
            <button className="fs-mnav-anon-btn" onClick={go('login')}>Sign in</button>
          </div>
        )}

        {/* Browse section */}
        <div className="fs-mnav-section">
          <p className="fs-mnav-section-label">Browse</p>
          {browseItems.map(item => (
            <button
              key={item.id}
              className={`fs-mnav-item${page === item.id ? ' active' : ''}`}
              onClick={go(item.id)}
            >
              <span className="fs-mnav-item-icon" aria-hidden="true">{item.icon}</span>
              <span className="fs-mnav-item-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Account section — signed in only */}
        {user && (
          <div className="fs-mnav-section">
            <p className="fs-mnav-section-label">Account</p>
            <button className="fs-mnav-item" onClick={go('dashboard')}>
              <span className="fs-mnav-item-icon" aria-hidden="true">{Icons.home}</span>
              <span className="fs-mnav-item-label">Dashboard</span>
            </button>
            <button className="fs-mnav-item" onClick={go('dashboard')}>
              <span className="fs-mnav-item-icon" aria-hidden="true">{Icons.heart}</span>
              <span className="fs-mnav-item-label">Saved aircraft</span>
            </button>
            <button className="fs-mnav-item" onClick={go('dashboard')}>
              <span className="fs-mnav-item-icon" aria-hidden="true">{Icons.plane}</span>
              <span className="fs-mnav-item-label">My listings</span>
            </button>
            {user.role === 'admin' && (
              <button className="fs-mnav-item" onClick={go('admin')}>
                <span className="fs-mnav-item-icon" aria-hidden="true">{Icons.shield}</span>
                <span className="fs-mnav-item-label">Admin</span>
              </button>
            )}
            <button className="fs-mnav-item danger" onClick={handleSignOut}>
              <span className="fs-mnav-item-icon" aria-hidden="true">{Icons.logout || Icons.x}</span>
              <span className="fs-mnav-item-label">Sign out</span>
            </button>
          </div>
        )}

        {/* Sticky bottom CTA */}
        <div className="fs-mnav-cta">
          <button className="fs-nav-btn fs-nav-btn-primary" onClick={go('sell')}>
            + List your aircraft
          </button>
        </div>
      </aside>
    </>
  );
};

export default Nav;
