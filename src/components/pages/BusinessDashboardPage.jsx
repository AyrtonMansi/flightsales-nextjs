'use client';
import { useState } from 'react';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import BulkImportTab from '../dealer/BulkImportTab';
import { useMyListings, useMyEnquiries } from '../../lib/hooks';

// Verified-dealer dashboard. Differs from the private DashboardPage in
// what the user is here to do: businesses sell + run a pipeline, they
// don't shop. The sidebar drops "My Buying" entirely and adds Lead
// Pipeline, Listing Performance, Subscription, Team.
//
// V1 is intentionally a stub — sections render real data where we
// already have it (My Aircraft, Messages) and a clean "Coming soon"
// for sections that need Stripe / analytics work (Subscription,
// Performance, Team). Wiring those up is a separate sprint.

const BusinessDashboardPage = ({ user, setPage, signOut, onSelectListing }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { listings: myListings = [] } = useMyListings(user?.id);
  const { enquiries: myEnquiries = [] } = useMyEnquiries(user?.id);

  const planLabel = (() => {
    switch (user?.subscription_plan) {
      case 'dealer_lite':       return 'Dealer Lite';
      case 'pro':               return 'Pro';
      case 'enterprise':        return 'Enterprise';
      case 'private_premium':   return 'Premium Private';
      default:                  return 'Free';
    }
  })();

  const stats = [
    { label: 'Active listings', value: myListings.filter(l => l.status === 'active').length, icon: Icons.plane },
    { label: 'Total views (30d)', value: myListings.reduce((a, l) => a + (l.view_count || 0), 0), icon: Icons.search },
    { label: 'New enquiries', value: myEnquiries.filter(e => e.status === 'new').length, icon: Icons.mail },
    { label: 'Days-to-sell avg', value: '—', icon: Icons.clock },
  ];

  const sidebar = [
    { id: 'overview',     label: 'Overview',         icon: Icons.home },
    { section: 'Inventory', items: [
      { id: 'listings',     label: 'My Aircraft',      icon: Icons.plane,  count: myListings.length },
      { id: 'drafts',       label: 'Drafts',           icon: Icons.file },
      { id: 'featured',     label: 'Featured slots',   icon: Icons.star },
      { id: 'bulk',         label: 'Bulk import',      icon: Icons.file },
    ]},
    { section: 'Pipeline', items: [
      { id: 'enquiries',    label: 'Lead pipeline',    icon: Icons.mail,   count: myEnquiries.filter(e => e.status === 'new').length },
      { id: 'offers',       label: 'Offers',           icon: Icons.tag },
    ]},
    { section: 'Performance', items: [
      { id: 'analytics',    label: 'Listing analytics', icon: Icons.search },
      { id: 'market',       label: 'Market position',  icon: Icons.location },
    ]},
    { section: 'Account', items: [
      { id: 'business',     label: 'Business profile', icon: Icons.user },
      { id: 'subscription', label: 'Subscription',     icon: Icons.dollar },
      { id: 'team',         label: 'Team members',     icon: Icons.user },
      { id: 'notifications',label: 'Notifications',    icon: Icons.bell },
    ]},
  ];

  return (
    <>
      <section className="fs-dash-hero">
        <div className="fs-container fs-dash-hero-inner">
          <div className="fs-dash-hero-id">
            <div className="fs-dash-hero-avatar">
              {user?.full_name?.[0]?.toUpperCase() || 'B'}
            </div>
            <div>
              <span className="fs-dash-hero-eyebrow">
                {Icons.shield} Verified business
              </span>
              <h1 className="fs-dash-hero-title">
                {user?.full_name || 'Your business'}
              </h1>
              <p className="fs-dash-hero-sub">
                Plan: <strong>{planLabel}</strong>
                {user?.subscription_plan === 'hobby' && (
                  <button
                    type="button"
                    className="fs-dash-hero-upgrade"
                    onClick={() => setActiveTab('subscription')}
                  >
                    Upgrade →
                  </button>
                )}
              </p>
            </div>
          </div>
          <button className="fs-dash-hero-signout" onClick={async () => { await signOut?.(); setPage('home'); }}>
            Sign out
          </button>
        </div>
      </section>

      <section className="fs-section" style={{ padding: '24px 0' }}>
        <div className="fs-container fs-dash-shell">
          {/* Sidebar */}
          <aside className="fs-dash-sidebar">
            <nav>
              {sidebar.map((entry, i) => (
                entry.section ? (
                  <div key={i} className="fs-dash-sidebar-section">
                    <p className="fs-dash-sidebar-section-label">{entry.section}</p>
                    {entry.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`fs-dash-sidebar-item${activeTab === item.id ? ' on' : ''}`}
                      >
                        <span className="fs-dash-sidebar-icon" aria-hidden="true">{item.icon}</span>
                        <span className="fs-dash-sidebar-label">{item.label}</span>
                        {typeof item.count === 'number' && item.count > 0 && (
                          <span className="fs-dash-sidebar-badge">{item.count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    key={entry.id}
                    onClick={() => setActiveTab(entry.id)}
                    className={`fs-dash-sidebar-item${activeTab === entry.id ? ' on' : ''}`}
                  >
                    <span className="fs-dash-sidebar-icon" aria-hidden="true">{entry.icon}</span>
                    <span className="fs-dash-sidebar-label">{entry.label}</span>
                  </button>
                )
              ))}
            </nav>
          </aside>

          {/* Body */}
          <div className="fs-dash-body">
            {activeTab === 'overview' && (
              <>
                <h2 className="fs-section-title" style={{ marginBottom: 16 }}>Overview</h2>
                <div className="fs-dash-stats">
                  {stats.map(s => (
                    <div key={s.label} className="fs-dash-stat">
                      <div className="fs-dash-stat-icon">{s.icon}</div>
                      <p className="fs-dash-stat-num">{s.value}</p>
                      <p className="fs-dash-stat-label">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="fs-dash-block">
                  <h3 className="fs-dash-block-title">Recently listed</h3>
                  {myListings.length === 0 ? (
                    <p className="fs-dash-empty">No active listings yet. Click <strong>List Aircraft</strong> in the nav to add your first.</p>
                  ) : (
                    <div className="fs-grid">
                      {myListings.slice(0, 3).map(l => (
                        <ListingCard key={l.id} listing={l} onSave={() => {}} saved={false} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'listings' && (
              <>
                <h2 className="fs-section-title" style={{ marginBottom: 16 }}>My aircraft</h2>
                {myListings.length === 0 ? (
                  <p className="fs-dash-empty">No listings yet.</p>
                ) : (
                  <div className="fs-grid">
                    {myListings.map(l => (
                      <ListingCard key={l.id} listing={l} onSave={() => {}} saved={false} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'enquiries' && (
              <>
                <h2 className="fs-section-title" style={{ marginBottom: 16 }}>Lead pipeline</h2>
                <p className="fs-dash-empty" style={{ marginBottom: 16 }}>
                  Visual Kanban (New → Replied → Negotiating → Closed) ships next.
                  For now, your enquiries list:
                </p>
                {myEnquiries.length === 0 ? (
                  <p className="fs-dash-empty">No enquiries yet.</p>
                ) : (
                  <ul className="fs-dash-enq-list">
                    {myEnquiries.map(e => (
                      <li key={e.id} className="fs-dash-enq-row">
                        <span className="fs-dash-enq-status">{e.status || 'new'}</span>
                        <span className="fs-dash-enq-name">{e.name || 'Anonymous'}</span>
                        <span className="fs-dash-enq-message">{(e.message || '').slice(0, 80)}…</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {activeTab === 'subscription' && (
              <>
                <h2 className="fs-section-title" style={{ marginBottom: 8 }}>Subscription</h2>
                <p style={{ color: 'var(--fs-ink-3)', marginBottom: 24 }}>
                  Current plan: <strong>{planLabel}</strong> · Status: <strong>{user?.subscription_status || 'inactive'}</strong>
                </p>
                <div className="fs-dash-plans">
                  {[
                    { key: 'dealer_lite', name: 'Dealer Lite', price: '$149/mo', desc: 'Up to 5 active listings, verified badge, lead alerts' },
                    { key: 'pro',         name: 'Pro',         price: '$399/mo', desc: 'Unlimited listings, featured slots, market position, team (3 seats)' },
                    { key: 'enterprise',  name: 'Enterprise',  price: 'From $999/mo', desc: 'Bulk import, white-label dealer page, custom integrations' },
                  ].map(p => (
                    <div key={p.key} className={`fs-dash-plan${user?.subscription_plan === p.key ? ' on' : ''}`}>
                      <h4>{p.name}</h4>
                      <p className="fs-dash-plan-price">{p.price}</p>
                      <p className="fs-dash-plan-desc">{p.desc}</p>
                      <button type="button" className="fs-form-submit" disabled>
                        {user?.subscription_plan === p.key ? 'Current plan' : 'Stripe coming soon'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'bulk' && <BulkImportTab user={user} />}

            {!['overview','listings','enquiries','subscription','bulk'].includes(activeTab) && (
              <>
                <h2 className="fs-section-title" style={{ marginBottom: 16 }}>{
                  sidebar.flatMap(s => s.items || [s])
                    .find(i => i.id === activeTab)?.label || 'Section'
                }</h2>
                <p className="fs-dash-empty">Coming soon. This section unlocks once we wire Stripe + analytics.</p>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default BusinessDashboardPage;
