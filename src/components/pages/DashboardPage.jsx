'use client';
import { useState, useMemo } from 'react';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import { useMyListings, useMyEnquiries, useProfile } from '../../lib/hooks';
import { showToast } from '../../lib/toast';
import ListingEditModal from '../ListingEditModal';

const DashboardPage = ({ user, setPage, signOut, savedIds, savedListings, onSave, onSelectListing }) => {
  // Note: caller (App) gates rendering so user is always defined and not an admin here.
  const isDealer = user?.role === 'dealer';
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('overview');
  const [editProfile, setEditProfile] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || ''
  });

  const { listings: myListingsRaw, loading: listingsLoading, updateListingStatus, deleteListing, refetch: refetchListings } = useMyListings(user.id);
  const { enquiries: myEnquiriesRaw, loading: enquiriesLoading, updateStatus: updateEnquiryStatus } = useMyEnquiries(user.id);
  const { updateProfile } = useProfile(user.id);

  const savedAircraft = savedListings || [];

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  // Normalise DB rows into the shape the existing UI expects.
  // DB row → { id, name, email, phone, message, status, created_at, aircraft: { id, title, ... } }
  // UI expects → { id, from, email, phone, message, status, date, aircraft: <title string>, aircraftId, hasReplied }
  const myEnquiries = useMemo(() => (myEnquiriesRaw || []).map(e => ({
    id: e.id,
    from: e.name || 'Unknown',
    email: e.email,
    phone: e.phone || '',
    message: e.message || '',
    status: e.status || 'new',
    date: e.created_at,
    aircraft: e.aircraft?.title || '(Listing removed)',
    aircraftId: e.aircraft?.id || e.aircraft_id,
    hasReplied: e.status === 'replied',
    raw: e,
  })), [myEnquiriesRaw]);

  // Listings: derive image, daysListed, views (0 until analytics table), enquiries count from real data
  const myListings = useMemo(() => {
    const enquiryCounts = (myEnquiriesRaw || []).reduce((acc, e) => {
      const key = e.aircraft?.id || e.aircraft_id;
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return (myListingsRaw || []).map(l => ({
      ...l,
      image: (Array.isArray(l.images) && l.images[0]) || null,
      daysListed: l.created_at ? Math.max(1, Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000)) : 0,
      views: l.view_count || 0,
      enquiries: enquiryCounts[l.id] || 0,
    }));
  }, [myListingsRaw, myEnquiriesRaw]);

  // Recent activity feed: derive from real enquiries + listings (no more undefined `activities`)
  const activities = useMemo(() => {
    const fromEnquiries = (myEnquiriesRaw || []).slice(0, 5).map(e => ({
      id: `enq-${e.id}`,
      type: 'enquiry',
      icon: Icons.mail,
      message: `${e.name || 'Someone'} enquired about ${e.aircraft?.title || 'your listing'}`,
      time: formatTimeAgo(e.created_at),
      ts: new Date(e.created_at).getTime(),
    }));
    const fromListings = (myListingsRaw || []).slice(0, 3).map(l => ({
      id: `lst-${l.id}`,
      type: 'listing',
      icon: Icons.plane,
      message: `${l.title || 'Listing'} ${l.status === 'active' ? 'is live' : `is ${l.status || 'pending'}`}`,
      time: formatTimeAgo(l.created_at),
      ts: new Date(l.created_at || 0).getTime(),
    }));
    return [...fromEnquiries, ...fromListings].sort((a, b) => b.ts - a.ts).slice(0, 6);
  }, [myEnquiriesRaw, myListingsRaw]);

  const stats = {
    totalViews: myListings.reduce((sum, l) => sum + (l.views || 0), 0),
    totalEnquiries: myEnquiries.length,
    activeListings: myListings.filter(l => l.status === 'active').length,
    pendingListings: myListings.filter(l => l.status === 'pending').length,
    totalWatchers: 0,
    newEnquiries: myEnquiries.filter(e => e.status === 'new').length,
  };

  const handleLogout = async () => {
    await signOut();
    setPage('home');
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
        location: profileData.location
      });
      setEditProfile(false);
      showToast('Profile saved');
    } catch (err) {
      showToast(err?.message ? `Save failed: ${err.message}` : 'Save failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEnquiryStatusChange = (enquiryId, newStatus) => {
    updateEnquiryStatus(enquiryId, newStatus);
    if (selectedEnquiry?.id === enquiryId) {
      setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleReplySubmit = (enquiryId) => {
    if (!replyText.trim()) return;
    setReplyText('');
    updateEnquiryStatus(enquiryId, 'replied');
  };

  const handleMarkSpam = (enquiryId) => {
    updateEnquiryStatus(enquiryId, 'spam');
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: { bg: '#dcfce7', color: '#166534', label: 'New' },
      contacted: { bg: '#dbeafe', color: '#1e40af', label: 'Contacted' },
      negotiating: { bg: '#fef3c7', color: '#92400e', label: 'Negotiating' },
      sold: { bg: '#e0e7ff', color: '#3730a3', label: 'Sold' },
      archived: { bg: '#f3f4f6', color: '#6b7280', label: 'Archived' },
      spam: { bg: '#fee2e2', color: '#991b1b', label: 'Spam' }
    };
    const s = styles[status] || styles.new;
    return (
      <span style={{ 
        padding: "4px 12px", 
        borderRadius: 4, 
        fontSize: 12,
        fontWeight: 500,
        background: s.bg,
        color: s.color
      }}>
        {s.label}
      </span>
    );
  };

  // Local state for sections that don't have a DB table yet — start empty so the
  // UI shows real empty states instead of seeded fakes. Wire to DB when tables land.
  const [savedSearches, setSavedSearches] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [drafts, setDrafts] = useState([]);

  const [notifications, setNotifications] = useState({
    emailEnquiries: true,
    emailOffers: true,
    emailSavedSearch: true,
    smsEnquiries: false,
    smsOffers: false,
    pushNotifications: true,
    marketingEmails: false,
  });

  const [discounts] = useState([]);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Icons.home },
    { section: 'My Selling', items: [
      { id: 'listings', label: 'My Aircraft', icon: Icons.plane, count: myListings.length },
      { id: 'drafts', label: 'Manage Ad or Draft', icon: Icons.file, count: drafts.length },
      { id: 'receivedOffers', label: 'Manage Your Offers', icon: Icons.tag, count: receivedOffers.length },
    ]},
    { section: 'My Buying', items: [
      { id: 'saved', label: 'Saved Aircraft', icon: Icons.heart, count: savedAircraft.length },
      { id: 'savedSearches', label: 'Saved Searches', icon: Icons.search, count: savedSearches.length },
      { id: 'myOffers', label: 'My Instant Offers', icon: Icons.dollar, count: myOffers.length },
    ]},
    { section: 'Messages', items: [
      { id: 'enquiries', label: 'Messages', icon: Icons.mail, count: stats.newEnquiries },
    ]},
    { section: 'Account', items: [
      { id: 'profile', label: 'Profile', icon: Icons.user },
      { id: 'notifications', label: 'Notification Preferences', icon: Icons.bell },
      { id: 'discounts', label: 'Discounts', icon: Icons.gift, count: discounts.filter(d => !d.used).length },
    ]},
  ];

  return (
    <>
      {/* Header */}
      <div className="fs-dash-hero">
        <div className="fs-container">
          <div className="fs-dash-hero-row">
            <div className="fs-dash-hero-id">
              <div style={{ position: 'relative' }}>
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'User')}&background=0a0a0a&color=fff`}
                  alt={user.full_name || user.email}
                  style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid white" }}
                />
                {isDealer && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#10b981',
                    color: 'white',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: "var(--fs-radius-lg)",
                    fontWeight: 600
                  }}>✓</span>
                )}
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 28, marginBottom: 6 }}>
                  Welcome back, {user.full_name?.split(' ')[0]}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
                  {isDealer ? 'Verified Dealer Account' : 'Private Seller'} • Member since 2026
                </p>
              </div>
            </div>
            <div className="fs-dash-hero-actions">
              <button
                className="fs-dash-hero-btn primary"
                onClick={() => setPage('sell')}
              >
                + List Aircraft
              </button>
              <button
                className="fs-dash-hero-btn ghost"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="fs-section" style={{ padding: "32px 0" }}>
        <div className="fs-container">
          <div className="fs-dash-shell">
            {/* Sidebar — collapses to a horizontal scrolling tab strip on mobile */}
            <div className="fs-dash-sidebar">
              <div className="fs-detail-specs" style={{ padding: 0, overflow: "hidden", borderRadius: 12 }}>
                <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)" }}>
                  <p style={{ fontSize: 12, color: "var(--fs-gray-500)", marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account Type</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{isDealer ? 'Verified Dealer' : 'Private Seller'}</p>
                    {isDealer && <span style={{ color: '#10b981' }}>✓</span>}
                  </div>
                </div>
                
                <nav style={{ padding: "8px 0" }}>
                  {sidebarItems.map((section, idx) => (
                    <div key={idx}>
                      {section.section && (
                        <p style={{ 
                          fontSize: 10, 
                          color: 'var(--fs-gray-400)', 
                          textTransform: 'uppercase', 
                          letterSpacing: 0.8,
                          padding: '16px 20px 8px',
                          fontWeight: 600
                        }}>
                          {section.section}
                        </p>
                      )}
                      {section.items ? section.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setSelectedEnquiry(null); }}
                          style={{
                            width: "100%",
                            padding: "10px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: activeTab === item.id ? '#eff6ff' : 'none',
                            border: "none",
                            borderLeft: activeTab === item.id ? '3px solid var(--fs-ink)' : '3px solid transparent',
                            cursor: "pointer",
                            fontSize: 14,
                            color: activeTab === item.id ? "var(--fs-ink)" : "var(--fs-gray-700)",
                            fontWeight: activeTab === item.id ? 600 : 400,
                            textAlign: "left",
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ color: activeTab === item.id ? "var(--fs-ink)" : "var(--fs-gray-400)", width: 20 }}>{item.icon}</span>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.count > 0 && (
                            <span style={{ 
                              background: activeTab === item.id ? 'var(--fs-ink)' : 'var(--fs-gray-200)', 
                              color: activeTab === item.id ? 'white' : 'var(--fs-gray-600)', 
                              fontSize: 11, 
                              padding: '2px 8px', 
                              borderRadius: "var(--fs-radius-lg)",
                              fontWeight: 600
                            }}>
                              {item.count}
                            </span>
                          )}
                        </button>
                      )) : (
                        <button
                          key={section.id}
                          onClick={() => { setActiveTab(section.id); setSelectedEnquiry(null); }}
                          style={{
                            width: "100%",
                            padding: "10px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: activeTab === section.id ? '#eff6ff' : 'none',
                            border: "none",
                            borderLeft: activeTab === section.id ? '3px solid var(--fs-ink)' : '3px solid transparent',
                            cursor: "pointer",
                            fontSize: 14,
                            color: activeTab === section.id ? "var(--fs-ink)" : "var(--fs-gray-700)",
                            fontWeight: activeTab === section.id ? 600 : 400,
                            textAlign: "left",
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ color: activeTab === section.id ? "var(--fs-ink)" : "var(--fs-gray-400)", width: 20 }}>{section.icon}</span>
                          <span style={{ flex: 1 }}>{section.label}</span>
                          {section.count > 0 && (
                            <span style={{ 
                              background: activeTab === section.id ? 'var(--fs-ink)' : 'var(--fs-gray-200)', 
                              color: activeTab === section.id ? 'white' : 'var(--fs-gray-600)', 
                              fontSize: 11, 
                              padding: '2px 8px', 
                              borderRadius: "var(--fs-radius-lg)",
                              fontWeight: 600
                            }}>
                              {section.count}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Sign Out */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--fs-gray-100)', marginTop: 8 }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: 'none',
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "var(--fs-gray-500)",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ color: "var(--fs-gray-400)", width: 20 }}>{Icons.logout}</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </nav>

                {isDealer && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid var(--fs-gray-100)", background: '#fafafa' }}>
                    <p style={{ fontSize: 11, color: "var(--fs-gray-500)", marginBottom: 8 }}>Plan: Professional</p>
                    <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ height: '100%', width: '65%', background: 'var(--fs-ink)', borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>13 of 20 listings used</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  {/* Stats Row — uses class so mobile @media can collapse
                      the 4-col grid to 2-col without inline-style fighting. */}
                  <div className="fs-dash-overview-stats">
                    {[
                      { label: 'Total Views', value: stats.totalViews.toLocaleString(), change: stats.totalViews === 0 ? 'Tracking soon' : null, color: 'var(--fs-ink)' },
                      { label: 'Enquiries', value: stats.totalEnquiries, change: stats.newEnquiries > 0 ? `${stats.newEnquiries} new` : (stats.totalEnquiries > 0 ? 'All read' : null), color: 'var(--fs-green)' },
                      { label: 'Active Listings', value: stats.activeListings, change: stats.pendingListings > 0 ? `${stats.pendingListings} pending` : null, color: 'var(--fs-gray-900)' },
                      { label: 'Saved by buyers', value: stats.totalWatchers, change: null, color: 'var(--fs-amber)' },
                    ].map((stat, i) => (
                      <div key={i} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                        <p style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-500)", marginBottom: 4 }}>{stat.label}</p>
                        {stat.change && <p style={{ fontSize: 11, color: "var(--fs-gray-500)", fontWeight: 500 }}>{stat.change}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Activity + Quick Actions — class collapses 2:1 grid
                      to single column on mobile. */}
                  <div className="fs-dash-overview-grid">
                    {/* Recent Activity */}
                    <div className="fs-detail-specs" style={{ padding: 0, borderRadius: "var(--fs-radius-lg)", overflow: 'hidden' }}>
                      <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Activity</h3>
                        <button style={{ fontSize: 13, color: 'var(--fs-ink)', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                      </div>
                      <div style={{ padding: "8px 0" }}>
                        {activities.map(activity => (
                          <div key={activity.id} style={{ padding: "16px 20px", display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: "1px solid var(--fs-gray-50)" }}>
                            <div style={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: "var(--fs-radius)", 
                              background: activity.type === 'enquiry' ? '#dcfce7' : activity.type === 'alert' ? '#fef3c7' : '#eff6ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: activity.type === 'enquiry' ? '#166534' : activity.type === 'alert' ? '#92400e' : 'var(--fs-ink)',
                              flexShrink: 0
                            }}>
                              {activity.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, marginBottom: 2 }}>{activity.message}</p>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <button 
                            onClick={() => setPage('sell')}
                            style={{ 
                              padding: "12px 16px", 
                              background: "var(--fs-gray-900)", 
                              color: "white",
                              border: "none",
                              borderRadius: "var(--fs-radius)",
                              fontSize: 14,
                              cursor: "pointer",
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10
                            }}
                          >
                            <span>+</span> List New Aircraft
                          </button>
                          <button 
                            onClick={() => setActiveTab('enquiries')}
                            style={{ 
                              padding: "12px 16px", 
                              background: "var(--fs-gray-100)", 
                              color: "var(--fs-gray-900)",
                              border: "none",
                              borderRadius: "var(--fs-radius)",
                              fontSize: 14,
                              cursor: "pointer",
                              textAlign: 'left'
                            }}
                          >
                            {stats.newEnquiries > 0 ? `📬 ${stats.newEnquiries} New Enquiries` : '📬 View Enquiries'}
                          </button>
                        </div>
                      </div>

                      {/* Tips Card */}
                      <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>💡 Selling Tip</h3>
                        <p style={{ fontSize: 13, color: 'var(--fs-gray-600)', lineHeight: 1.5 }}>
                          Aircraft with 10+ photos get 3x more enquiries. Add more photos to your listings to increase visibility.
                        </p>
                        <button 
                          onClick={() => setActiveTab('listings')}
                          style={{ 
                            marginTop: 12,
                            fontSize: 13, 
                            color: 'var(--fs-ink)', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Update Listings →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* LISTINGS TAB - TABLE VIEW */}
              {activeTab === 'listings' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>My Listings</h3>
                    <button 
                      className="fs-nav-btn-primary"
                      onClick={() => setPage('sell')}
                    >
                      + Add Listing
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No active listings</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                        Get started by listing your first aircraft. It only takes a few minutes and you'll reach thousands of qualified buyers.
                      </p>
                      <button 
                        className="fs-nav-btn-primary"
                        onClick={() => setPage('sell')}
                        style={{ fontSize: 15, padding: '14px 28px' }}
                      >
                        List Your Aircraft
                      </button>
                    </div>
                  ) : (
                    <div className="fs-detail-specs" style={{ padding: 0, borderRadius: "var(--fs-radius-lg)", overflow: 'hidden' }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--fs-gray-200)", background: '#fafafa' }}>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Aircraft</th>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Price</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Views</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Enquiries</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                            <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myListings.map(listing => (
                            <tr key={listing.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                              <td style={{ padding: "16px" }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  {listing.image ? (
                                    <img src={listing.image} alt={listing.title} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                  ) : (
                                    <div style={{ width: 60, height: 40, borderRadius: 6, background: 'var(--fs-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fs-gray-400)', fontSize: 16 }}>{Icons.plane}</div>
                                  )}
                                  <div>
                                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{listing.title}</p>
                                    <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{listing.daysListed} {listing.daysListed === 1 ? 'day' : 'days'} listed</p>
                                  </div>
                                  {listing.featured && (
                                    <span style={{ 
                                      padding: "2px 8px", 
                                      borderRadius: 4, 
                                      fontSize: 10,
                                      background: '#fef3c7',
                                      color: '#92400e',
                                      fontWeight: 600
                                    }}>FEATURED</span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "16px", fontWeight: 600 }}>${listing.price.toLocaleString()}</td>
                              <td style={{ padding: "16px", textAlign: "center" }}>{listing.views.toLocaleString()}</td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <span style={{ 
                                  padding: "4px 10px", 
                                  borderRadius: "var(--fs-radius-lg)", 
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: listing.enquiries > 0 ? '#dcfce7' : 'transparent',
                                  color: listing.enquiries > 0 ? '#166534' : 'var(--fs-gray-500)'
                                }}>
                                  {listing.enquiries}
                                </span>
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <span style={{ 
                                  padding: "4px 12px", 
                                  borderRadius: 4, 
                                  fontSize: 12, 
                                  fontWeight: 500,
                                  background: listing.status === 'active' ? '#dcfce7' : '#fef3c7',
                                  color: listing.status === 'active' ? '#166534' : '#92400e',
                                  textTransform: 'capitalize'
                                }}>
                                  {listing.status}
                                </span>
                              </td>
                              <td style={{ padding: "16px", textAlign: "right" }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => setEditingListing(myListingsRaw.find(r => r.id === listing.id))}
                                    style={{ padding: "6px 12px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                                  >Edit</button>
                                  <button style={{ padding: "6px 12px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Boost</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* SAVED AIRCRAFT TAB */}
              {activeTab === 'saved' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Saved Aircraft</h3>
                  {savedAircraft.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "48px", textAlign: "center" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>{Icons.heart}</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No saved aircraft</h3>
                      <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>
                        Browse our listings and save aircraft you're interested in.
                      </p>
                      <button 
                        className="fs-nav-btn-primary"
                        onClick={() => setPage('buy')}
                      >
                        Browse Aircraft
                      </button>
                    </div>
                  ) : (
                    <div className="fs-grid">
                      {savedAircraft.map(listing => (
                        <ListingCard key={listing.id} listing={listing} onSave={onSave} saved={true} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ENQUIRIES TAB - CRM STYLE */}
              {activeTab === 'enquiries' && (
                <>
                  {!selectedEnquiry ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Enquiries</h3>
                          <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Manage leads and respond to buyer questions</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['all', 'new', 'contacted', 'negotiating'].map(filter => (
                            <button 
                              key={filter}
                              style={{ 
                                padding: "8px 16px", 
                                background: "var(--fs-gray-100)", 
                                border: "none",
                                borderRadius: 6,
                                fontSize: 13,
                                cursor: "pointer",
                                textTransform: 'capitalize'
                              }}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </div>

                      {myEnquiries.filter(e => e.status !== 'spam').length === 0 ? (
                        <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                          <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.mail}</div>
                          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No enquiries yet</h3>
                          <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                            When buyers contact you about your listings, they'll appear here. Make sure your listings have great photos and descriptions!
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {myEnquiries.filter(e => e.status !== 'spam').map(enquiry => (
                            <div 
                              key={enquiry.id} 
                              className="fs-detail-specs" 
                              style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", cursor: 'pointer', transition: 'all 0.15s' }}
                              onClick={() => setSelectedEnquiry(enquiry)}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--fs-shadow)'}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ 
                                    width: 44, 
                                    height: 44, 
                                    borderRadius: '50%', 
                                    background: 'var(--fs-gray-100)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: 'var(--fs-gray-600)'
                                  }}>
                                    {enquiry.from.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{enquiry.from}</h4>
                                    <p style={{ fontSize: 13, color: "var(--fs-gray-500)" }}>Re: {enquiry.aircraft}</p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  {getStatusBadge(enquiry.status)}
                                  <span style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{formatTimeAgo(enquiry.date)}</span>
                                </div>
                              </div>
                              <p style={{ fontSize: 14, color: "var(--fs-gray-700)", marginBottom: 16, lineHeight: 1.5, paddingLeft: 56 }}>
                                "{enquiry.message.substring(0, 120)}{enquiry.message.length > 120 ? '...' : ''}"
                              </p>
                              {enquiry.hasReplied && (
                                <div style={{ paddingLeft: 56, marginTop: 8 }}>
                                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>
                                    ✓ You've replied
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Enquiry Detail View */
                    <div>
                      <button 
                        onClick={() => setSelectedEnquiry(null)}
                        style={{ 
                          marginBottom: 16,
                          fontSize: 14, 
                          color: 'var(--fs-gray-500)', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        ← Back to enquiries
                      </button>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
                        {/* Message Thread */}
                        <div className="fs-detail-specs" style={{ padding: 0, borderRadius: "var(--fs-radius-lg)", overflow: 'hidden' }}>
                          <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              <div style={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                background: 'var(--fs-gray-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                fontWeight: 600,
                                color: 'var(--fs-gray-600)'
                              }}>
                                {selectedEnquiry.from.charAt(0)}
                              </div>
                              <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selectedEnquiry.from}</h3>
                                <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Re: {selectedEnquiry.aircraft}</p>
                              </div>
                            </div>
                            {getStatusBadge(selectedEnquiry.status)}
                          </div>

                          <div style={{ padding: "20px", maxHeight: 400, overflowY: 'auto' }}>
                            {/* Original Message */}
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: '50%', 
                                  background: 'var(--fs-gray-100)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: 'var(--fs-gray-600)',
                                  flexShrink: 0
                                }}>
                                  {selectedEnquiry.from.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ background: '#f3f4f6', padding: 12, borderRadius: "var(--fs-radius-lg)", borderBottomLeftRadius: 4 }}>
                                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>{selectedEnquiry.message}</p>
                                  </div>
                                  <p style={{ fontSize: 11, color: 'var(--fs-gray-400)', marginTop: 4 }}>{formatTimeAgo(selectedEnquiry.date)}</p>
                                </div>
                              </div>
                            </div>

                            {selectedEnquiry.hasReplied && (
                              <div style={{ padding: "12px 16px", background: '#ecfdf5', borderRadius: "var(--fs-radius)", fontSize: 13, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>✓</span>
                                <span>You've replied to this enquiry. Future replies are tracked by status only — full message threads are coming soon.</span>
                              </div>
                            )}
                          </div>

                          {/* Reply Input */}
                          <div style={{ padding: "20px", borderTop: "1px solid var(--fs-gray-100)" }}>
                            <textarea
                              className="fs-form-textarea"
                              placeholder="Type your reply..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              style={{ minHeight: 80, marginBottom: 12 }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>Buyer will be notified by email</span>
                              <button 
                                onClick={() => handleReplySubmit(selectedEnquiry.id)}
                                disabled={!replyText.trim()}
                                className="fs-form-submit"
                                style={{ width: 'auto', padding: '10px 24px' }}
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sidebar */}
                        <div>
                          {/* Buyer Info */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Buyer Details</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <a href={`mailto:${selectedEnquiry.email}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fs-ink)" }}>
                                {Icons.mail} {selectedEnquiry.email}
                              </a>
                              <a href={`tel:${selectedEnquiry.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fs-ink)" }}>
                                {Icons.phone} {selectedEnquiry.phone}
                              </a>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Actions</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {['new', 'contacted', 'negotiating', 'sold', 'archived'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleEnquiryStatusChange(selectedEnquiry.id, status)}
                                  style={{ 
                                    padding: "10px 16px", 
                                    background: selectedEnquiry.status === status ? '#eff6ff' : 'var(--fs-gray-100)', 
                                    color: selectedEnquiry.status === status ? 'var(--fs-ink)' : 'var(--fs-gray-700)',
                                    border: selectedEnquiry.status === status ? '1px solid var(--fs-ink)' : 'none',
                                    borderRadius: "var(--fs-radius)",
                                    fontSize: 13,
                                    cursor: "pointer",
                                    textAlign: 'left',
                                    textTransform: 'capitalize',
                                    fontWeight: selectedEnquiry.status === status ? 600 : 400
                                  }}
                                >
                                  {status === 'new' && '✨ '} 
                                  {status === 'contacted' && '✓ '} 
                                  {status === 'negotiating' && '💬 '} 
                                  {status === 'sold' && ''}
                                  {status === 'archived' && '📁 '}
                                  Mark as {status}
                                </button>
                              ))}
                              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--fs-gray-200)' }} />
                              <button
                                onClick={() => handleMarkSpam(selectedEnquiry.id)}
                                style={{ 
                                  padding: "10px 16px", 
                                  background: 'transparent', 
                                  color: '#ef4444',
                                  border: 'none',
                                  borderRadius: "var(--fs-radius)",
                                  fontSize: 13,
                                  cursor: "pointer",
                                  textAlign: 'left'
                                }}
                              >
                                🚫 Mark as spam
                              </button>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Private Notes</h4>
                            <textarea
                              className="fs-form-textarea"
                              placeholder="Add notes about this buyer (only visible to you)..."
                              style={{ minHeight: 100, fontSize: 13 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PROFILE SETTINGS TAB */}
              {/* DRAFTS TAB */}
              {activeTab === 'drafts' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Manage Ad or Draft</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Continue editing your saved drafts</p>
                    </div>
                    <button 
                      className="fs-nav-btn-primary"
                      onClick={() => setPage('sell')}
                    >
                      + New Draft
                    </button>
                  </div>

                  {drafts.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.file}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No drafts</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Start creating a listing and save it as a draft to finish later.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {drafts.map(draft => (
                        <div key={draft.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{draft.title}</h4>
                            <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Last edited: {draft.lastEdited}</p>
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 120, height: 6, background: '#e5e5e5', borderRadius: 3 }}>
                                <div style={{ width: `${draft.progress}%`, height: '100%', background: 'var(--fs-ink)', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--fs-gray-500)' }}>{draft.progress}% complete</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ padding: "8px 16px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Delete</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Continue</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* RECEIVED OFFERS TAB */}
              {activeTab === 'receivedOffers' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Manage Your Offers</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offers received on your listings</p>
                    </div>
                  </div>

                  {receivedOffers.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.tag}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No offers yet</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        When buyers make offers on your aircraft, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {receivedOffers.map(offer => (
                        <div key={offer.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{offer.aircraft}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>From: {offer.from}</p>
                            </div>
                            <span style={{ 
                              padding: "4px 12px", 
                              borderRadius: 4, 
                              fontSize: 12,
                              background: offer.status === 'pending' ? '#fef3c7' : '#dcfce7',
                              color: offer.status === 'pending' ? '#92400e' : '#166534',
                              textTransform: 'capitalize'
                            }}>
                              {offer.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "12px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius)", marginBottom: 12 }}>
                            <span style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offer Amount</span>
                            <span style={{ fontSize: 18, fontWeight: 700 }}>${offer.amount.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button style={{ padding: "8px 16px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Decline</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Accept</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* MY OFFERS (MADE) TAB */}
              {activeTab === 'myOffers' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>My Instant Offers</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offers you've made on aircraft</p>
                    </div>
                  </div>

                  {myOffers.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.dollar}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No offers made</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        When you make offers on aircraft, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {myOffers.map(offer => (
                        <div key={offer.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{offer.aircraft}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>To: {offer.to}</p>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-400)', marginTop: 4 }}>Made: {offer.date}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 18, fontWeight: 700 }}>${offer.amount.toLocaleString()}</p>
                              <span style={{ 
                                padding: "4px 12px", 
                                borderRadius: 4, 
                                fontSize: 12,
                                background: offer.status === 'pending' ? '#fef3c7' : offer.status === 'accepted' ? '#dcfce7' : '#fee2e2',
                                color: offer.status === 'pending' ? '#92400e' : offer.status === 'accepted' ? '#166534' : '#991b1b',
                                textTransform: 'capitalize'
                              }}>
                                {offer.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SAVED SEARCHES TAB */}
              {activeTab === 'savedSearches' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Saved Searches</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Get alerts for new matching aircraft</p>
                    </div>
                  </div>

                  {savedSearches.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.search}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No saved searches</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Save your searches to get notified when new aircraft match your criteria.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {savedSearches.map(search => (
                        <div key={search.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{search.name}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-ink)' }}>{search.count} new matches</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, color: search.alerts ? '#10b981' : 'var(--fs-gray-400)' }}>
                                {search.alerts ? '🔔 Alerts on' : '🔕 Alerts off'}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {Object.entries(search.filters).map(([key, value]) => (
                              <span key={key} style={{ padding: "4px 10px", background: "var(--fs-gray-100)", borderRadius: 4, fontSize: 12 }}>
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--fs-gray-200)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Delete</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>View Results</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Notification Preferences</h3>
                  <div className="fs-detail-specs" style={{ padding: "24px", borderRadius: 12 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Email Notifications</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                      {[
                        { key: 'emailEnquiries', label: 'New enquiries on my listings', desc: 'When someone contacts you about your aircraft' },
                        { key: 'emailOffers', label: 'Offers on my listings', desc: 'When someone makes an offer on your aircraft' },
                        { key: 'emailSavedSearch', label: 'Saved search alerts', desc: 'When new aircraft match your saved searches' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: "var(--fs-radius-lg)",
                              background: notifications[item.key] ? 'var(--fs-ink)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>SMS Notifications</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                      {[
                        { key: 'smsEnquiries', label: 'New enquiries', desc: 'Text message for urgent enquiries' },
                        { key: 'smsOffers', label: 'New offers', desc: 'Text message when you receive an offer' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: "var(--fs-radius-lg)",
                              background: notifications[item.key] ? 'var(--fs-ink)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Other</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { key: 'marketingEmails', label: 'Marketing emails', desc: 'Promotions, tips, and news from Flightsales' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: "var(--fs-radius-lg)",
                              background: notifications[item.key] ? 'var(--fs-ink)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* DISCOUNTS TAB */}
              {activeTab === 'discounts' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Discounts</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Your available promo codes</p>
                    </div>
                  </div>

                  {discounts.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.gift}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No discounts</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Check back for special offers and promotions.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                      {discounts.map(discount => (
                        <div key={discount.id} className="fs-detail-specs" style={{ padding: "24px", borderRadius: "var(--fs-radius-lg)", position: 'relative', opacity: discount.used ? 0.6 : 1 }}>
                          {discount.used && (
                            <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 8px', background: 'var(--fs-gray-200)', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>USED</div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: "var(--fs-radius-lg)", background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                              🎁
                            </div>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 700 }}>{discount.discount}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Expires: {discount.expiry}</p>
                            </div>
                          </div>
                          <div style={{ padding: "12px", background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <code style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>{discount.code}</code>
                            {!discount.used && (
                              <button style={{ padding: "6px 12px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Copy</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'profile' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Profile Settings</h3>
                  <div className="fs-detail-specs" style={{ padding: "24px" }}>
                    {!editProfile ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                          <img src={user.avatar} alt={user.full_name} style={{ width: 80, height: 80, borderRadius: "50%" }} />
                          <div>
                            <h4 style={{ fontSize: 18, fontWeight: 600 }}>{profileData.full_name}</h4>
                            <p style={{ fontSize: 14, color: "var(--fs-gray-500)" }}>{profileData.email}</p>
                          </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Phone</span>
                            <span>{profileData.phone || 'Not set'}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Location</span>
                            <span>{profileData.location || 'Not set'}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Account Type</span>
                            <span style={{ textTransform: "capitalize" }}>{user.role}</span>
                          </div>
                        </div>
                        <button 
                          className="fs-detail-cta fs-detail-cta-primary"
                          onClick={() => setEditProfile(true)}
                        >
                          Edit Profile
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Full Name</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.full_name}
                            onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                          />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Email</label>
                          <input className="fs-form-input" value={profileData.email} disabled />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Phone</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.phone}
                            onChange={e => setProfileData({...profileData, phone: e.target.value})}
                            placeholder="04XX XXX XXX"
                          />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Location</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.location}
                            onChange={e => setProfileData({...profileData, location: e.target.value})}
                            placeholder="e.g. Sydney, NSW"
                          />
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button
                            className="fs-form-submit"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            style={{ opacity: savingProfile ? 0.7 : 1 }}
                          >
                            {savingProfile ? "Saving..." : "Save Changes"}
                          </button>
                          <button 
                            className="fs-detail-cta fs-detail-cta-secondary"
                            onClick={() => setEditProfile(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {editingListing && (
        <ListingEditModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSaved={refetchListings}
        />
      )}
    </>
  );
};

export default DashboardPage;
