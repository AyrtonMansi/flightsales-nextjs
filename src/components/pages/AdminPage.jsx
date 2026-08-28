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

function OpsCard({ label, value, description, action, onClick, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: 'white', value: 'var(--fs-ink)' },
    attention: { bg: '#fffbf0', value: '#8a5a00' },
    urgent: { bg: '#fff4f2', value: '#a62a1f' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', minWidth: 0, border: '1px solid var(--fs-line)', borderRadius: 12,
        background: t.bg, padding: '18px 20px', cursor: 'pointer', textAlign: 'left',
        fontFamily: 'var(--fs-font)', display: 'flex', justifyContent: 'space-between', gap: 14,
      }}
    >
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: 27, lineHeight: 1, letterSpacing: '-0.035em', color: t.value }}>{value}</strong>
        <span style={{ display: 'block', marginTop: 7, fontSize: 13, fontWeight: 650 }}>{label}</span>
        <span style={{ display: 'block', marginTop: 3, color: 'var(--fs-ink-3)', fontSize: 12, lineHeight: 1.45 }}>{description}</span>
      </span>
      <span style={{ alignSelf: 'center', fontSize: 13, fontWeight: 650, whiteSpace: 'nowrap' }}>{action} →</span>
    </button>
  );
}

const AdminPage = ({ user, setPage, signOut }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { listings = [] } = useAdminListings();
  const { users = [] } = useAdminUsers();
  const { enquiries = [] } = useAdminEnquiries();
  const { apps: dealerApps = [] } = useDealerApplications();
  const { articles = [] } = useNewsArticles();

  const counts = useMemo(() => ({
    listingsPending: listings.filter(l => (l.status || 'pending') === 'pending').length,
    listingsActive: listings.filter(l => l.status === 'active').length,
    enquiriesNew: enquiries.filter(e => (!e.type || e.type === 'enquiry') && (e.status || 'new') === 'new').length,
    leadsNew: enquiries.filter(e => e.type && e.type !== 'enquiry' && (e.status || 'new') === 'new').length,
    dealerAppsPending: dealerApps.filter(a => (a.status || 'pending') === 'pending').length,
    dealers: users.filter(u => u.is_dealer || u.role === 'dealer').length,
    suspended: users.filter(u => !!u.suspended_at).length,
  }), [listings, users, enquiries, dealerApps]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'listings', label: 'Listings', badge: counts.listingsPending },
    { id: 'users', label: 'Users' },
    { id: 'dealers', label: 'Dealer applications', badge: counts.dealerAppsPending },
    { id: 'enquiries', label: 'Enquiries', badge: counts.enquiriesNew },
    { id: 'leads', label: 'Lead management', badge: counts.leadsNew },
    { id: 'affiliates', label: 'Affiliates' },
    { id: 'content', label: 'Content' },
    { id: 'audit', label: 'Audit' },
  ];

  const totalAttention = counts.listingsPending + counts.dealerAppsPending + counts.enquiriesNew + counts.leadsNew;

  return (
    <>
      <section className="fs-dash-hero">
        <div className="fs-container fs-dash-hero-inner">
          <div className="fs-dash-hero-id">
            <div className="fs-dash-hero-avatar" style={{ background: '#fff4f2', color: '#a62a1f' }}>{Icons.shield}</div>
            <div>
              <span className="fs-dash-hero-eyebrow">FlightSales operations</span>
              <h1 className="fs-dash-hero-title">Admin control centre</h1>
              <p className="fs-dash-hero-sub">{totalAttention ? `${totalAttention} item${totalAttention === 1 ? '' : 's'} need attention` : 'No outstanding review queues'}</p>
            </div>
          </div>
          <button className="fs-dash-hero-signout" onClick={async () => { await signOut(); setPage('home'); }}>Sign out</button>
        </div>
      </section>

      <section className="fs-section" style={{ padding: '24px 0 48px' }}>
        <div className="fs-container">
          <AdminTwoFactorPrompt />

          <div className="fs-admin-tabs" role="tablist" aria-label="Admin sections" style={{ marginTop: 18 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`admin-panel-${tab.id}`}
                className={`fs-admin-tab${activeTab === tab.id ? ' on' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.badge > 0 && <span className="fs-admin-tab-badge">{tab.badge}</span>}
              </button>
            ))}
          </div>

          <div className="fs-admin-tabbody" id={`admin-panel-${activeTab}`} role="tabpanel" aria-labelledby={`admin-tab-${activeTab}`}>
            {activeTab === 'overview' && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ fontSize: 24, margin: 0, letterSpacing: '-0.025em' }}>Operations overview</h2>
                  <p style={{ color: 'var(--fs-ink-3)', fontSize: 13, marginTop: 4 }}>Review queues first, then platform health.</p>
                </div>

                <div className="fs-dash-overview-stats" style={{ marginBottom: 26 }}>
                  <OpsCard label="Listings pending" value={counts.listingsPending} description="Aircraft waiting for moderation before publication." action="Review" onClick={() => setActiveTab('listings')} tone={counts.listingsPending ? 'attention' : 'neutral'} />
                  <OpsCard label="Dealer applications" value={counts.dealerAppsPending} description="Business accounts waiting for an admin decision." action="Review" onClick={() => setActiveTab('dealers')} tone={counts.dealerAppsPending ? 'attention' : 'neutral'} />
                  <OpsCard label="New enquiries" value={counts.enquiriesNew} description="Marketplace enquiries not yet progressed." action="Open" onClick={() => setActiveTab('enquiries')} tone={counts.enquiriesNew ? 'urgent' : 'neutral'} />
                  <OpsCard label="New partner leads" value={counts.leadsNew} description="Non-aircraft enquiries requiring follow-up." action="Open" onClick={() => setActiveTab('leads')} tone={counts.leadsNew ? 'attention' : 'neutral'} />
                </div>

                <div className="fs-dash-overview-grid">
                  <section className="fs-detail-specs" style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--fs-line)' }}>
                      <h3 style={{ margin: 0, fontSize: 15 }}>Platform snapshot</h3>
                    </div>
                    {[
                      ['Active listings', counts.listingsActive],
                      ['Registered users', users.length],
                      ['Verified dealers', counts.dealers],
                      ['Published / draft articles', articles.length],
                    ].map(([label, value], i, arr) => (
                      <div key={label} style={{ padding: '13px 18px', display: 'flex', justifyContent: 'space-between', borderBottom: i < arr.length - 1 ? '1px solid var(--fs-line)' : 0 }}>
                        <span style={{ color: 'var(--fs-ink-3)', fontSize: 13 }}>{label}</span>
                        <strong style={{ fontSize: 13 }}>{Number(value).toLocaleString()}</strong>
                      </div>
                    ))}
                  </section>

                  <section className="fs-detail-specs" style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--fs-line)' }}>
                      <h3 style={{ margin: 0, fontSize: 15 }}>Risk & governance</h3>
                    </div>
                    <button type="button" onClick={() => setActiveTab('users')} style={{ width: '100%', padding: '14px 18px', background: 'white', border: 0, borderBottom: '1px solid var(--fs-line)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
                      <span><strong style={{ fontSize: 13 }}>Suspended accounts</strong><span style={{ display: 'block', fontSize: 12, color: 'var(--fs-ink-3)', marginTop: 2 }}>Review access and reinstatement decisions.</span></span><span style={{ fontWeight: 700 }}>{counts.suspended}</span>
                    </button>
                    <button type="button" onClick={() => setActiveTab('audit')} style={{ width: '100%', padding: '14px 18px', background: 'white', border: 0, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
                      <span><strong style={{ fontSize: 13 }}>Audit trail</strong><span style={{ display: 'block', fontSize: 12, color: 'var(--fs-ink-3)', marginTop: 2 }}>Inspect administrative actions and changes.</span></span><span aria-hidden="true">→</span>
                    </button>
                  </section>
                </div>
              </>
            )}

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
