'use client';
import { useState, useEffect } from "react";
import { useAuth, useProfile, useSavedAircraft } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { Icons } from "./Icons";
import Nav from "./Nav";
import Footer from "./Footer";
import HomePage from "./pages/HomePage";
import BuyPage from "./pages/BuyPage";
import ListingDetail from "./pages/ListingDetail";
import SellPage from "./pages/SellPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import NewsPage from "./pages/NewsPage";
import ContactPage from "./pages/ContactPage";
import DealersPage from "./pages/DealersPage";
import DealerDetailPage from "./pages/DealerDetailPage";

// ============================================================
// FLIGHTSALES.COM.AU — PRODUCTION AVIATION MARKETPLACE
// ============================================================

// --- DATA LAYER ---

// --- UTILITY FUNCTIONS ---
const formatPrice = (p) => p >= 1000000 ? `$${(p/1000000).toFixed(1)}M` : `$${(p/1000).toFixed(0)}K`;

const getCategoryDisplayName = (category) => {
  const mapping = {
    "Single Engine Piston": "Piston",
    "Multi Engine Piston": "Piston",
    "Turboprop": "Turboprop",
    "Light Jet": "Jet",
    "Midsize Jet": "Jet",
    "Heavy Jet": "Jet",
    "Helicopter": "Helicopter",
    "Gyrocopter": "Gyrocopter",
    "Ultralight": "Ultralight",
    "LSA": "LSA",
    "Warbird": "Warbird",
    "Glider": "Glider",
    "Amphibious/Seaplane": "Amphibious"
  };
  return mapping[category] || category;
};

// --- SVG ICONS ---

// --- AIRCRAFT IMAGES (verified aviation only) ---

// --- AIRCRAFT IMAGE COMPONENT ---


// --- CSS ---
// Note: web fonts (Inter, Fraunces) are loaded via <link> tags in src/app/layout.jsx.
// They cannot be @import'd here because React server-renders the apostrophes as
// HTML entities (&#x27;) inside <style> tags, which breaks the CSS parser AND
// causes a hydration mismatch.

// --- LOADING SKELETON COMPONENTS ---

// --- EMPTY STATE COMPONENT ---
// --- MOBILE FILTER BOTTOM SHEET ---

const EmptyState = ({ title, description, searchQuery, activeFilters, onClearFilters, onBrowseAll }) => (
  <div className="fs-empty" style={{ padding: "60px 20px", textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fs-ink)", marginBottom: 8, letterSpacing: "-0.02em" }}>
      {title}
    </div>
    
    <p style={{ color: "var(--fs-ink-3)", fontSize: 14, marginBottom: 20, maxWidth: 400, margin: '0 auto 20', lineHeight: 1.5 }}>
      {searchQuery ? (
        <>We couldn't find any aircraft for "<strong>{searchQuery}</strong>". {description}</>
      ) : (
        description
      )}
    </p>
    
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {activeFilters > 0 && (
        <button 
          className="fs-btn fs-btn-primary" 
          onClick={onClearFilters}
        >
          Clear all filters
        </button>
      )}
      <button 
        className="fs-btn fs-btn-secondary" 
        onClick={onBrowseAll}
      >
        Browse all aircraft
      </button>
    </div>
  </div>
);


// QUICK-LOOK MODAL — preview a listing without leaving the grid

// COMPARE DRAWER — sticky bottom bar with up to 3 listings


// --- PAGES ---





// DEALER DETAIL — storefront page with all the dealer's listings









// --- APP ---
export default function FlightSalesApp({
  initialPage = "home",
  initialListing = null,
  initialListingId = null,
  initialDealer = null,
  initialDealerId = null,
} = {}) {
  const [page, setPage] = useState(initialPage);
  // Seed selected entities from server-side props when the route provides them
  // (e.g. /listings/[id] passes the full listing). Falls back to a client fetch
  // when only an id was given.
  const [selectedListing, setSelectedListingRaw] = useState(initialListing);
  const [selectedDealer, setSelectedDealer] = useState(initialDealer);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchFilters, setSearchFilters] = useState(null);

  // Real auth
  const { user: authUser, loading: authLoading, signIn, signUp, signInWithGoogle, signOut, resetPassword } = useAuth();
  const { profile } = useProfile(authUser?.id);

  // Client-side fallback: when a route gave us only the id (no full row),
  // fetch the entity once on mount.
  useEffect(() => {
    let cancelled = false;
    if (initialListingId && !selectedListing) {
      supabase
        .from('aircraft')
        .select(`*, dealer:dealers(id, name, location, rating, verified)`)
        .eq('id', initialListingId)
        .maybeSingle()
        .then(({ data }) => { if (!cancelled && data) setSelectedListingRaw(data); });
    }
    if (initialDealerId && !selectedDealer) {
      supabase
        .from('dealers')
        .select('*')
        .eq('id', initialDealerId)
        .maybeSingle()
        .then(({ data }) => { if (!cancelled && data) setSelectedDealer(data); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser back/forward → keep React page state in sync with URL.
  // Without this, popping back from /listings/abc would update the address bar
  // but leave the SPA showing the listing-detail view.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePop = () => {
      const path = window.location.pathname;
      if (path === "/" || path === "") return setPage("home");
      if (path === "/buy") return setPage("buy");
      if (path === "/sell") return setPage("sell");
      if (path === "/dealers") return setPage("dealers");
      if (path.startsWith("/dealers/")) {
        const id = path.split("/")[2];
        if (id) {
          supabase.from('dealers').select('*').eq('id', id).maybeSingle()
            .then(({ data }) => { if (data) { setSelectedDealer(data); setPage("dealer-detail"); } });
        }
        return;
      }
      if (path.startsWith("/listings/")) {
        const id = path.split("/")[2];
        if (id) {
          supabase.from('aircraft')
            .select(`*, dealer:dealers(id, name, location, rating, verified)`)
            .eq('id', id).maybeSingle()
            .then(({ data }) => { if (data) { setSelectedListingRaw(data); setPage("detail"); } });
        }
        return;
      }
      if (path === "/dashboard") return setPage("dashboard");
      if (path === "/admin") return setPage("admin");
      if (path === "/login") return setPage("login");
      if (path === "/news") return setPage("news");
      if (path === "/about") return setPage("about");
      if (path === "/contact") return setPage("contact");
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // Construct a user object compatible with all child components
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email,
    full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
    phone: profile?.phone || '',
    location: profile?.location || '',
    // Role priority: explicit profiles.role column > is_dealer flag > private default.
    // Hardcoded admin email check has been removed — admins must be flagged via profiles.role = 'admin' in the DB.
    role: profile?.role === 'admin' ? 'admin' : (profile?.is_dealer ? 'dealer' : 'private'),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || authUser.email || 'User')}&background=0a0a0a&color=fff`,
    created_at: authUser.created_at
  } : null;

  // Real saved aircraft
  const { savedIds, savedListings, toggleSave } = useSavedAircraft(authUser?.id);

  const setSelectedListing = (l) => {
    setSelectedListingRaw(l);
    setPage("detail");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/listings/${l.id}`);
      window.scrollTo(0, 0);
    }
  };

  // Mapping from internal page state to real URLs. Used to keep the browser
  // URL in sync as the user navigates inside the SPA so each page has a
  // shareable, refreshable address.
  const PAGE_URL = {
    home: "/",
    buy: "/buy",
    sell: "/sell",
    dealers: "/dealers",
    news: "/news",
    about: "/about",
    contact: "/contact",
    login: "/login",
    dashboard: "/dashboard",
    admin: "/admin",
  };

  const setPageWrap = (p) => {
    setPage(p);
    setSelectedListingRaw(null);
    setMobileOpen(false);
    if (typeof window !== "undefined") {
      const url = PAGE_URL[p];
      if (url && window.location.pathname !== url) {
        window.history.pushState({}, "", url);
      }
      window.scrollTo(0, 0);
    }
  };

  // Demo mode for testing dashboards without auth
  const [demoUser, setDemoUser] = useState(null);
  const effectiveUser = demoUser || user;
  
  const loginDemo = (role) => {
    setDemoUser({
      id: 'demo-' + role,
      email: role + '@flightsales.demo',
      full_name: 'Demo ' + role.charAt(0).toUpperCase() + role.slice(1),
      role: role,
      created_at: new Date().toISOString(),
    });
    setPage(role === 'admin' ? 'admin' : 'dashboard');
  };

  // Auth-gate redirects (run as side effects, never during render)
  useEffect(() => {
    if (authLoading && !demoUser) return; // wait for session to resolve
    if (page === 'dashboard' && !authUser && !demoUser) setPage('login');
    if (page === 'dashboard' && effectiveUser?.role === 'admin') setPage('admin');
    if (page === 'admin' && effectiveUser?.role !== 'admin') setPage(authUser || demoUser ? 'dashboard' : 'login');
  }, [page, authUser, authLoading, effectiveUser?.role, demoUser]);

  const onSave = async (id) => {
    if (!authUser) { setToast("Sign in to save aircraft"); return; }
    const isSaved = await toggleSave(id);
    setToast(isSaved ? "Added to watchlist ❤️" : "Removed from watchlist");
  };

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }
  }, [toast]);

  const getBreadcrumbs = () => {
    const crumbs = { home: [], buy: [['home', 'Home'], ['buy', 'Buy Aircraft']], detail: [['home', 'Home'], ['buy', 'Buy Aircraft'], ['detail', 'Aircraft Details']], sell: [['home', 'Home'], ['sell', 'Sell Aircraft']], dealers: [['home', 'Home'], ['dealers', 'Dealers']], news: [['home', 'Home'], ['news', 'News']], about: [['home', 'Home'], ['about', 'About Us']], contact: [['home', 'Home'], ['contact', 'Contact']], login: [['home', 'Home'], ['login', 'Sign In']], dashboard: [['home', 'Home'], ['dashboard', 'Dashboard']], admin: [['home', 'Home'], ['admin', 'Admin']] };
    return crumbs[page] || [];
  };

  const Breadcrumbs = () => {
    const crumbs = getBreadcrumbs();
    if (crumbs.length === 0) return null;
    return (
      <div className="fs-container" style={{ paddingTop: 12, paddingBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--fs-gray-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {crumbs.map(([p, label], i) => (
            <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span>{Icons.chevronRight}</span>}
              <button onClick={() => setPageWrap(p)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: i === crumbs.length - 1 ? 'var(--fs-gray-900)' : 'var(--fs-gray-500)', fontWeight: i === crumbs.length - 1 ? 600 : 400, fontSize: 13 }}>{label}</button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Nav page={page} setPage={setPageWrap} setMobileOpen={setMobileOpen} mobileOpen={mobileOpen} user={user} />
      {page !== 'home' && page !== 'detail' && <Breadcrumbs />}

      {page === "home" && <HomePage setPage={setPageWrap} setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} setSearchFilters={setSearchFilters} />}
      {page === "buy" && <BuyPage setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} initialFilters={searchFilters} user={user} setPage={setPageWrap} />}
      {page === "detail" && <ListingDetail listing={selectedListing} onBack={() => setPageWrap("buy")} savedIds={savedIds} onSave={onSave} user={user} onSelectDealer={(d) => { setSelectedDealer(d); setPage("dealer-detail"); if (typeof window !== "undefined" && d?.id) { window.history.pushState({}, "", `/dealers/${d.id}`); } window.scrollTo(0, 0); }} />}
      {page === "sell" && <SellPage user={user} setPage={setPageWrap} />}
      {page === "dealers" && <DealersPage onSelectDealer={(d) => { setSelectedDealer(d); setPage("dealer-detail"); if (typeof window !== "undefined" && d?.id) { window.history.pushState({}, "", `/dealers/${d.id}`); } window.scrollTo(0, 0); }} />}
      {page === "dealer-detail" && <DealerDetailPage dealer={selectedDealer} onBack={() => setPageWrap("dealers")} setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} />}
      {page === "news" && <NewsPage />}
      {page === "about" && <AboutPage />}
      {page === "contact" && <ContactPage />}
      {page === "login" && <LoginPage setPage={setPageWrap} signIn={signIn} signUp={signUp} signInWithGoogle={signInWithGoogle} resetPassword={resetPassword} loginDemo={loginDemo} />}
      {page === "dashboard" && effectiveUser && effectiveUser.role !== 'admin' && <DashboardPage user={effectiveUser} setPage={setPageWrap} signOut={signOut} savedIds={savedIds} savedListings={savedListings} onSave={onSave} onSelectListing={setSelectedListing} />}
      {page === "admin" && effectiveUser?.role === 'admin' && <AdminPage user={effectiveUser} setPage={setPageWrap} signOut={signOut} />}

      <Footer setPage={setPageWrap} />

      {toast && (
        <div className="fs-toast">
          {Icons.check} {toast}
        </div>
      )}
    </>
  );
}
