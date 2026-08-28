'use client';
import { useState } from 'react';
import { Icons } from '../Icons';
import BulkImportTab from '../dealer/BulkImportTab';
import AbnVerifyCard from '../dealer/AbnVerifyCard';
import ListingEditModal from '../ListingEditModal';
import { useMyListings, useMyEnquiries } from '../../lib/hooks';
import { showToast } from '../../lib/toast';

const LEAD_STATES = ['new', 'contacted', 'negotiating', 'sold', 'archived', 'spam'];
const LEAD_LABEL = { new: 'New', contacted: 'Contacted', replied: 'Contacted', negotiating: 'Negotiating', sold: 'Closed', archived: 'Archived', spam: 'Spam' };

function ago(date) {
  if (!date) return '';
  const ts = new Date(date).getTime();
  if (!Number.isFinite(ts)) return '';
  const hours = Math.max(0, Math.floor((Date.now() - ts) / 3600000));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function daysOld(date) {
  if (!date) return 0;
  const ts = new Date(date).getTime();
  return Number.isFinite(ts) ? Math.max(0, Math.floor((Date.now() - ts) / 86400000)) : 0;
}

function Kpi({ label, value, detail, onClick }) {
  const style = { border: '1px solid var(--fs-line)', borderRadius: 12, background: 'white', padding: '18px 20px', minWidth: 0, textAlign: 'left', fontFamily: 'var(--fs-font)' };
  const body = <><strong style={{ display: 'block', fontSize: 28, letterSpacing: '-0.035em', lineHeight: 1 }}>{value}</strong><span style={{ display: 'block', marginTop: 7, fontSize: 13, color: 'var(--fs-ink-3)' }}>{label}</span>{detail && <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--fs-ink-4)' }}>{detail}</span>}</>;
  return onClick ? <button type="button" onClick={onClick} style={{ ...style, cursor: 'pointer' }}>{body}</button> : <div style={style}>{body}</div>;
}

export default function BusinessDashboardPage({ user, setPage, signOut }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [leadFilter, setLeadFilter] = useState('open');
  const [editingListing, setEditingListing] = useState(null);
  const { listings: myListings = [], loading: listingsLoading, updateListingStatus, refetch: refetchListings } = useMyListings(user?.id);
  const { enquiries: myEnquiries = [], loading: enquiriesLoading, updateStatus: updateEnquiryStatus } = useMyEnquiries(user?.id);

  const isBusinessAccount = user?.account_type === 'business';
  const abnVerified = !!user?.abn_verified_at;
  if (isBusinessAccount && !abnVerified) {
    return <><section className="fs-dash-hero"><div className="fs-container fs-dash-hero-inner"><div className="fs-dash-hero-id"><div className="fs-dash-hero-avatar">{user?.full_name?.[0]?.toUpperCase() || 'B'}</div><div><span className="fs-dash-hero-eyebrow">Business verification</span><h1 className="fs-dash-hero-title">Verify your business</h1><p className="fs-dash-hero-sub">Verify your ABN before publishing dealer inventory.</p></div></div><button className="fs-dash-hero-signout" onClick={async () => { await signOut?.(); setPage('home'); }}>Sign out</button></div></section><section className="fs-section" style={{ padding: '24px 0 48px' }}><div className="fs-container" style={{ maxWidth: 760 }}><AbnVerifyCard user={user} /></div></section></>;
  }

  const enquiriesByListing = myEnquiries.reduce((acc, e) => { const id = e.aircraft?.id || e.aircraft_id; if (id) acc[id] = (acc[id] || 0) + 1; return acc; }, {});
  const activeListings = myListings.filter(l => l.status === 'active');
  const pendingListings = myListings.filter(l => l.status === 'pending');
  const newLeads = myEnquiries.filter(e => (e.status || 'new') === 'new');
  const openLeads = myEnquiries.filter(e => !['sold','archived','spam'].includes(e.status || 'new'));
  const totalViews = myListings.reduce((sum, l) => sum + Number(l.view_count || 0), 0);
  const agedListings = activeListings.filter(l => daysOld(l.created_at) >= 45);
  const leadsPerActive = activeListings.length ? (myEnquiries.length / activeListings.length).toFixed(1) : '—';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Icons.home },
    { id: 'listings', label: 'Inventory', icon: Icons.plane, count: myListings.length },
    { id: 'enquiries', label: 'Lead pipeline', icon: Icons.mail, count: newLeads.length },
    { id: 'bulk', label: 'Bulk import', icon: Icons.file },
    { id: 'business', label: 'Business profile', icon: Icons.user },
  ];

  const updateLead = async (id, status) => { try { await updateEnquiryStatus(id, status); showToast('Lead status updated'); } catch (err) { showToast(err?.message || 'Failed to update lead'); } };
  const updateListing = async (id, status) => { try { await updateListingStatus(id, status); showToast('Listing status updated'); } catch (err) { showToast(err?.message || 'Failed to update listing'); } };
  const businessName = user?.abn_business_name || user?.full_name || 'Dealer account';

  return <>
    <section className="fs-dash-hero"><div className="fs-container fs-dash-hero-inner"><div className="fs-dash-hero-id"><div className="fs-dash-hero-avatar">{businessName[0]?.toUpperCase() || 'B'}</div><div><span className="fs-dash-hero-eyebrow">{Icons.shield} Verified business</span><h1 className="fs-dash-hero-title">{businessName}</h1><p className="fs-dash-hero-sub">Inventory and lead operations</p></div></div><div className="fs-dash-hero-actions"><button type="button" className="fs-dash-hero-btn primary" onClick={() => setPage('sell')}>List aircraft</button><button className="fs-dash-hero-signout" onClick={async () => { await signOut?.(); setPage('home'); }}>Sign out</button></div></div></section>

    <section className="fs-section" style={{ padding: '24px 0 48px' }}><div className="fs-container fs-dash-shell">
      <aside className="fs-dash-sidebar" aria-label="Dealer navigation"><nav style={{ border: '1px solid var(--fs-line)', borderRadius: 12, overflow: 'hidden', padding: 6, background: 'white' }}>{tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`fs-dash-sidebar-item${activeTab === tab.id ? ' on' : ''}`} aria-current={activeTab === tab.id ? 'page' : undefined}><span className="fs-dash-sidebar-icon" aria-hidden="true">{tab.icon}</span><span className="fs-dash-sidebar-label">{tab.label}</span>{!!tab.count && <span className="fs-dash-sidebar-badge">{tab.count}</span>}</button>)}</nav></aside>

      <main className="fs-dash-body">
        {activeTab === 'overview' && <><div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>Dealer overview</h2><p style={{ color: 'var(--fs-ink-3)', fontSize: 13, marginTop: 4 }}>What needs attention across inventory and buyer demand.</p></div><div className="fs-dash-overview-stats" style={{ marginBottom: 22 }}><Kpi value={activeListings.length} label="Active inventory" detail={pendingListings.length ? `${pendingListings.length} pending review` : undefined} onClick={() => setActiveTab('listings')} /><Kpi value={newLeads.length} label="New leads" detail={`${openLeads.length} open`} onClick={() => setActiveTab('enquiries')} /><Kpi value={totalViews.toLocaleString()} label="Listing views" /><Kpi value={leadsPerActive} label="Leads per listing" /></div><div className="fs-dash-overview-grid"><section className="fs-detail-specs" style={{ borderRadius: 12, padding: 0, overflow: 'hidden' }}><div style={{ padding: '16px 18px', borderBottom: '1px solid var(--fs-line)' }}><h3 style={{ margin: 0, fontSize: 15 }}>Action queue</h3><p style={{ marginTop: 2, fontSize: 12, color: 'var(--fs-ink-3)' }}>Operational items worth reviewing now.</p></div>{newLeads.length === 0 && pendingListings.length === 0 && agedListings.length === 0 ? <p style={{ padding: 20, margin: 0, color: 'var(--fs-ink-3)', fontSize: 13 }}>No outstanding actions.</p> : <>{newLeads.length > 0 && <button type="button" onClick={() => setActiveTab('enquiries')} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--fs-line)', background: 'white', padding: '15px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}><span><strong>{newLeads.length} new {newLeads.length === 1 ? 'lead' : 'leads'}</strong><span style={{ display: 'block', fontSize: 12, color: 'var(--fs-ink-3)', marginTop: 2 }}>Review and progress buyer enquiries.</span></span><span>→</span></button>}{pendingListings.length > 0 && <button type="button" onClick={() => setActiveTab('listings')} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--fs-line)', background: 'white', padding: '15px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}><span><strong>{pendingListings.length} pending {pendingListings.length === 1 ? 'listing' : 'listings'}</strong><span style={{ display: 'block', fontSize: 12, color: 'var(--fs-ink-3)', marginTop: 2 }}>Waiting for marketplace review.</span></span><span>→</span></button>}{agedListings.length > 0 && <button type="button" onClick={() => setActiveTab('listings')} style={{ width: '100%', border: 0, background: 'white', padding: '15px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}><span><strong>{agedListings.length} aged active {agedListings.length === 1 ? 'listing' : 'listings'}</strong><span style={{ display: 'block', fontSize: 12, color: 'var(--fs-ink-3)', marginTop: 2 }}>Listed for 45+ days; review presentation and price manually.</span></span><span>→</span></button>}</>}</section><section className="fs-detail-specs" style={{ borderRadius: 12, padding: 0, overflow: 'hidden' }}><div style={{ padding: '16px 18px', borderBottom: '1px solid var(--fs-line)' }}><h3 style={{ margin: 0, fontSize: 15 }}>Latest leads</h3></div>{myEnquiries.length === 0 ? <p style={{ padding: 20, margin: 0, color: 'var(--fs-ink-3)', fontSize: 13 }}>Buyer leads will appear here as enquiries arrive.</p> : myEnquiries.slice(0, 5).map(e => <button key={e.id} type="button" onClick={() => setActiveTab('enquiries')} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--fs-line)', background: 'white', padding: '13px 18px', display: 'flex', justifyContent: 'space-between', gap: 12, textAlign: 'left', cursor: 'pointer' }}><span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 13 }}>{e.name || 'Buyer'}</strong><span style={{ fontSize: 12, color: 'var(--fs-ink-3)', display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.aircraft?.title || 'Aircraft enquiry'}</span></span><span style={{ fontSize: 11, color: 'var(--fs-ink-4)', flexShrink: 0 }}>{ago(e.created_at)}</span></button>)}</section></div></>}

        {activeTab === 'listings' && <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}><div><h2 style={{ margin: 0, fontSize: 24 }}>Inventory</h2><p style={{ fontSize: 13, color: 'var(--fs-ink-3)', marginTop: 4 }}>Manage listing status and performance signals.</p></div><button type="button" className="fs-nav-btn-primary" onClick={() => setPage('sell')}>Add aircraft</button></div>{listingsLoading ? <p className="fs-dash-empty">Loading inventory…</p> : myListings.length === 0 ? <div className="fs-detail-specs" style={{ padding: '44px 24px', textAlign: 'center', borderRadius: 12 }}><h3>No inventory yet</h3><p style={{ color: 'var(--fs-ink-3)', fontSize: 14, margin: '6px 0 18px' }}>Add one aircraft or import multiple listings.</p><div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}><button className="fs-nav-btn-primary" onClick={() => setPage('sell')}>List aircraft</button><button className="fs-confirm-btn fs-confirm-btn-secondary" onClick={() => setActiveTab('bulk')}>Bulk import</button></div></div> : <div className="fs-admin-tablewrap"><table className="fs-admin-table"><thead><tr><th>Aircraft</th><th>Age</th><th>Views</th><th>Leads</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{myListings.map(l => <tr key={l.id}><td><strong className="fs-admin-cell-strong">{l.title || 'Aircraft'}</strong><span className="fs-admin-cell-muted">{l.registration || l.location || ''}</span></td><td>{daysOld(l.created_at)}d</td><td>{Number(l.view_count || 0).toLocaleString()}</td><td>{enquiriesByListing[l.id] || 0}</td><td><select className="fs-sort-select" aria-label={`Status for ${l.title}`} value={l.status || 'pending'} onChange={e => updateListing(l.id, e.target.value)}><option value="pending">Pending</option><option value="active">Active</option><option value="sold">Sold</option><option value="archived">Archived</option></select></td><td style={{ textAlign: 'right' }}><button type="button" className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm" onClick={() => setEditingListing(l)}>Edit</button></td></tr>)}</tbody></table></div>}</>}

        {activeTab === 'enquiries' && <><div className="fs-enq-head" style={{ marginBottom: 18 }}><div><h2 style={{ margin: 0, fontSize: 24 }}>Lead pipeline</h2><p style={{ color: 'var(--fs-ink-3)', fontSize: 13, marginTop: 4 }}>Move buyer enquiries from new to closed with explicit status.</p></div><div className="fs-enq-filters">{['open','new','contacted','negotiating','closed'].map(f => <button key={f} type="button" className={`fs-enq-filter${leadFilter === f ? ' on' : ''}`} onClick={() => setLeadFilter(f)}>{f}</button>)}</div></div>{enquiriesLoading ? <p className="fs-dash-empty">Loading leads…</p> : (() => { const rows = myEnquiries.filter(e => { const s = e.status || 'new'; if (leadFilter === 'open') return !['sold','archived','spam'].includes(s); if (leadFilter === 'closed') return ['sold','archived'].includes(s); if (leadFilter === 'contacted') return ['contacted','replied'].includes(s); return s === leadFilter; }); return rows.length === 0 ? <div className="fs-detail-specs" style={{ padding: '44px 24px', textAlign: 'center', borderRadius: 12 }}><h3>No leads in this stage</h3><p style={{ color: 'var(--fs-ink-3)', fontSize: 14, marginTop: 6 }}>Incoming enquiries will appear here automatically.</p></div> : <div className="fs-admin-tablewrap"><table className="fs-admin-table"><thead><tr><th>Buyer</th><th>Aircraft</th><th>Received</th><th>Contact</th><th>Status</th></tr></thead><tbody>{rows.map(e => <tr key={e.id}><td><strong className="fs-admin-cell-strong">{e.name || 'Buyer'}</strong><span className="fs-admin-cell-muted" style={{ maxWidth: 260 }}>{(e.message || '').slice(0, 90)}</span></td><td>{e.aircraft?.title || 'Listing unavailable'}</td><td className="fs-admin-cell-muted">{ago(e.created_at)}</td><td><div className="fs-admin-row-actions">{e.email && <a className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm" href={`mailto:${e.email}?subject=${encodeURIComponent(`FlightSales enquiry — ${e.aircraft?.title || 'aircraft'}`)}`}>Email</a>}{e.phone && <a className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm" href={`tel:${e.phone}`}>Call</a>}</div></td><td><select className="fs-sort-select" value={e.status || 'new'} onChange={ev => updateLead(e.id, ev.target.value)} aria-label={`Lead status for ${e.name || 'buyer'}`}>{LEAD_STATES.map(s => <option key={s} value={s}>{LEAD_LABEL[s]}</option>)}</select></td></tr>)}</tbody></table></div>; })()}</>}

        {activeTab === 'bulk' && <><div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 24 }}>Bulk import</h2><p style={{ color: 'var(--fs-ink-3)', fontSize: 13, marginTop: 4 }}>Add inventory in volume using the existing import workflow.</p></div><BulkImportTab user={user} /></>}
        {activeTab === 'business' && <><div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 24 }}>Business profile</h2><p style={{ color: 'var(--fs-ink-3)', fontSize: 13, marginTop: 4 }}>Verified business identity used across FlightSales.</p></div><AbnVerifyCard user={user} /></>}
      </main>
    </div></section>
    {editingListing && <ListingEditModal listing={editingListing} onClose={() => setEditingListing(null)} onSaved={() => refetchListings?.()} />}
  </>;
}
