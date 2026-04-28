'use client';
import { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

const Nav = ({ page, setPage, setMobileOpen, mobileOpen, user, setUser }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fs-nav">
      <div className="fs-container fs-nav-inner">
        <div className="fs-nav-logo" onClick={() => setPage("home")}>
          <span className="fs-nav-logo-text">FlightSales</span>
        </div>
        <div className={`fs-nav-links${mobileOpen ? " open" : ""}`}>
          {[["buy", "Buy"], ["sell", "Sell"], ["dealers", "Dealers"], ["news", "News"]].map(([p, label]) => (
            <button key={p} className={`fs-nav-link${page === p ? " active" : ""}`} onClick={() => { setPage(p); setMobileOpen(false); }}>{label}</button>
          ))}
          {mobileOpen && (
            <button className="fs-nav-link" onClick={() => { setPage("buy"); setMobileOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {Icons.search} Search Aircraft
            </button>
          )}
        </div>
        <div className={`fs-nav-actions${mobileOpen ? " open" : ""}`}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "var(--fs-radius-sm)"
                  }}
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'U')}&background=0a0a0a&color=fff`}
                    alt={user.full_name || user.email}
                    style={{ width: 32, height: 32, borderRadius: "50%" }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{user.full_name?.split(' ')[0]}</span>
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 8,
                    background: "white",
                    border: "1px solid var(--fs-line)",
                    borderRadius: "var(--fs-radius)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    minWidth: 180,
                    zIndex: 100,
                    padding: "8px 0"
                  }}>
                    <button className="fs-nav-link" onClick={() => { setPage('dashboard'); setDropdownOpen(false); }} style={{ width: "100%", textAlign: "left", padding: "10px 16px", borderRadius: 0 }}>Dashboard</button>
                    <button className="fs-nav-link" onClick={() => { setPage('dashboard'); setDropdownOpen(false); }} style={{ width: "100%", textAlign: "left", padding: "10px 16px", borderRadius: 0 }}>Saved aircraft</button>
                    <button className="fs-nav-link" onClick={() => { setPage('dashboard'); setDropdownOpen(false); }} style={{ width: "100%", textAlign: "left", padding: "10px 16px", borderRadius: 0 }}>My listings</button>
                    <div style={{ borderTop: "1px solid var(--fs-line)", margin: "4px 0" }} />
                    <button className="fs-nav-link" onClick={() => { setUser(null); setDropdownOpen(false); }} style={{ width: "100%", textAlign: "left", padding: "10px 16px", borderRadius: 0, color: "var(--fs-red)" }}>Sign out</button>
                  </div>
                )}
              </div>
              <button className="fs-nav-btn fs-nav-btn-primary" onClick={() => setPage("sell")}>List Aircraft</button>
            </div>
          ) : (
            <>
              <button className="fs-nav-btn fs-nav-btn-ghost" onClick={() => setPage("login")} style={{ fontSize: 14, fontWeight: 500 }}>Sign in</button>
              <button className="fs-nav-btn fs-nav-btn-primary" onClick={() => setPage("sell")}>List Aircraft</button>
            </>
          )}
        </div>
        <button className="fs-nav-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} style={{ minWidth: 44, minHeight: 44 }}>
          {mobileOpen ? Icons.x : Icons.menu}
        </button>
      </div>
    </nav>
  );
};

export default Nav;
