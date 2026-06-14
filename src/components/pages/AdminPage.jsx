'use client';
import { useMemo, useState } from 'react';
import { Icons } from '../Icons';
import { useAdminListings, useAdminUsers, useAdminEnquiries, useDealerApplications, useNewsArticles } from '../../lib/hooks';
import ListingsTab from '../admin/tabs/ListingsTab';
import UsersTab from '../admin/tabs/UsersTab';
import DealerAppsTab from '../admin/tabs/DealerAppsTab';
import EnquiriesTab from '../admin/tabs/EnquiriesTab';
import LeadsTab from '../admin/tabs/LeadsTab';
import ContentTab from '../admin/tabs/ContentTab';
import AuditTab from '../admin/tabs/AuditTab';
import AffiliatesTab from '../admin/tabs/AffiliatesTab';
import AdminTwoFactorPrompt from '../admin/AdminTwoFactorPrompt';

// Thin tab-switching shell. All tab logic lives in src/components/admin/tabs/.
// Each tab owns its own data hook, search, sort, pagination, and modals.
// Counts shown in the tab nav are computed from light shared hooks here so
// each tab doesn't have to load the data twice — but the tab itself still
// owns the authoritative copy.
const AdminPage = ({ user, setPage, signOut }) => {
  const [activeTab, setActiveTab] = useState('listings');

  // Light shared queries for the badge counts on the tab nav. These are the
  // same hooks each tab uses — Supabase / React state will cache across tabs
  // since hook instances unmount when a tab is hidden.
  const { listings } = useAdminListings();
  const { users } = useAdminUsers();
  const { enquiries } = useAdminEnquiries();
  const { apps: dealerApps } = useDealerApplications();
  const { articles } = useNewsArticles();

  const counts = useMemo(() => ({
    listingsPending: (listings || []).filter(l => (l.status || 'pending') === 'pending').length,
    enquiriesNew: (enquiries || []).filter(e => (!e.type || e.type === 'enquiry') && (e.status || 'new') === 'new').length,
    leadsNew: (enquiries || []).filter(e => e.type && e.type !== 'enquiry' && (e.status || 'new') === 'new').length,
    dealerAppsPending: (dealerApps || []).filter(a => (a.status || 'pending') === 'pending').length,
  }), [listings, enquiries, dealerApps]);

  const stats = useMemo(() => [
    { label: 'Total Listings', value: listings?.length || 0 },
    { label: 'Pending Review', value: counts.listingsPending, accent: 'var(--fs-amber)' },
    { label: 'Active Users', value: users?.length || 0, accent: 'var(--fs-green)' },
    { label: 'Dealers', value: (users || []).filter(u => u.is_dealer).length },
  ], [listings, users, counts.listingsPending]);

  const tabs = [
    { id: 'listings', label: 'Listings', badge: counts.listingsPending },
    { id: 'users', label: 'Users' },
    { id: 'dealers', label: 'Dealer Applications', badge: counts.dealerAppsPending },
    { id: 'enquiries', label: 'Enquiries', badge: counts.enquiriesNew },
    { id: 'leads', label: 'Lead Management', badge: counts.leadsNew },
    { id: 'affiliates', label: 'Affiliates' },
    { id: 'content', label: 'Content' },
    { id: 'audit', label: 'Audit' },
  ];

  return (
    <>
      <div className="fs-about-hero" style={{ padding: '32px 0', background: '#1a1a1a' }}>
        <div className="fs-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--fs-red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>{Icons.shield}</div>
              <div>
                <h1 style={{ fontFamily: 'var(--fs-font)', fontSize: 24, marginBottom: 4 }}>
                  Admin Dashboard
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                  Manage listings, users, applications, and content
                </p>
              </div>
            </div>
            <button
              onClick={async () => { await signOut(); setPage('home'); }}
              style={{
                padding: '8px 16px', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'var(--fs-radius-sm)', color: 'white',
                cursor: 'pointer', fontSize: 13,
              }}
            >Logout</button>
          </div>
        </div>
      </div>

      <section className="fs-section" style={{ padding: '32px 0' }}>
        <div className="fs-container">
          {/* 2FA enrolment prompt — shows only when the signed-in admin
              hasn't enrolled a TOTP factor yet. Self-dismisses on
              successful enrol. */}
          <AdminTwoFactorPrompt />
          {/* Stats */}
          <div className="fs-admin-stats">
            {stats.map(stat => (
              <div key={stat.label} className="fs-admin-stat">
                <p className="fs-admin-stat-num" style={stat.accent ? { color: stat.accent } : undefined}>
                  {stat.value}
                </p>
                <p className="fs-admin-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tab nav */}
          <div className="fs-admin-tabs" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`fs-admin-tab${activeTab === tab.id ? ' on' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className="fs-admin-tab-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Active tab body */}
          <div className="fs-admin-tabbody">
            {activeTab === 'listings' && <ListingsTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'dealers' && <DealerAppsTab adminId={user?.id} />}
            {activeTab === 'enquiries' && <EnquiriesTab />}
            {activeTab === 'leads' && <LeadsTab />}
            {activeTab === 'affiliates' && <AffiliatesTab />}
            {activeTab === 'content' && <ContentTab />}
            {activeTab === 'audit' && <AuditTab />}
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPage;
