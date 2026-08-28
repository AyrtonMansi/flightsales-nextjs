'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Icons } from '../Icons';
import ListingCard from '../ListingCard';
import ListingEditModal from '../ListingEditModal';
import ProfileTab from '../dashboard/tabs/ProfileTab';
import { useMyListings, useMyEnquiries, useProfile } from '../../lib/hooks';
import { showToast } from '../../lib/toast';

const STATUS_META = {
  new: { label: 'New', bg: '#eef6fc', color: '#226f9f' },
  contacted: { label: 'Contacted', bg: '#f3f4f6', color: '#374151' },
  replied: { label: 'Contacted', bg: '#f3f4f6', color: '#374151' },
  negotiating: { label: 'Negotiating', bg: '#fff7df', color: '#8a5a00' },
  sold: { label: 'Closed', bg: '#e9f8ef', color: '#17643a' },
  archived: { label: 'Archived', bg: '#f3f4f6', color: '#6b7280' },
  spam: { label: 'Spam', bg: '#fff0ee', color: '#a62a1f' },
};

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const value = new Date(dateString).getTime();
  if (!Number.isFinite(value)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - value) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.new;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 650, background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>
      {meta.label}
    </span>
  );
}

function Metric({ value, label, detail, onClick }) {
  const content = <><strong style={{ display: 'block', fontSize: 27, letterSpacing: '-0.035em', lineHeight: 1.1 }}>{value}</strong><span style={{ display: 'block', fontSize: 13, color: 'var(--fs-ink-3)', marginTop: 5 }}>{label}</span>{detail && <span style={{ display: 'block', fontSize: 11, color: 'var(--fs-ink-4)', marginTop: 4 }}>{detail}</span>}</>;
  const style = { minWidth: 0, padding: '18px 20px', border: '1px solid var(--fs-line)', borderRadius: 12, background: 'var(--fs-white)', textAlign: 'left', fontFamily: 'var(--fs-font)' };
  return onClick ? <button type="button" onClick={onClick} style={{ ...style, cursor: 'pointer' }}>{content}</button> : <div style={style}>{content}</div>;
}

export default function DashboardPage({ user, setPage, signOut, savedListings, onSave, activeTab: activeTabProp, setActiveTab: setActiveTabProp }) {
  const [internalTab, setInternalTab] = useState('overview');
  const activeTab = activeTabProp ?? internalTab;
  const setActiveTab = setActiveTabProp ?? setInternalTab;
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [enquiryFilter, setEnquiryFilter] = useState('all');
  const [editingListing, setEditingListing] = useState(null);
  const [editProfile, setEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', location: user.location || '' });

  const { listings: myListingsRaw = [], loading: listingsLoading, updateListingStatus, refetch: refetchListings } = useMyListings(user.id);
  const { enquiries: myEnquiriesRaw = [], loading: enquiriesLoading, updateStatus: updateEnquiryStatus } = useMyEnquiries(user.id);
  const { updateProfile } = useProfile(user.id);
  const savedAircraft = savedListings || [];

  const myEnquiries = useMemo(() => myEnquiriesRaw.map(e => ({ id: e.id, from: e.name || 'Buyer', email: e.email || '', phone: e.phone || '', message: e.message || '', status: e.status || 'new', date: e.created_at, aircraft: e.aircraft?.title || '(Listing unavailable)', aircraftId: e.aircraft?.id || e.aircraft_id })), [myEnquiriesRaw]);

  const myListings = useMemo(() => {
    const enquiryCounts = myEnquiriesRaw.reduce((acc, e) => { const key = e.aircraft?.id || e.aircraft_id; if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    return myListingsRaw.map(l => ({ ...l, image: Array.isArray(l.images) ? l.images[0] : null, daysListed: l.created_at ? Math.max(0, Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000)) : null, views: Number(l.view_count || 0), enquiries: enquiryCounts[l.id] || 0 }));
  }, [myListingsRaw, myEnquiriesRaw]);

  const stats = useMemo(() => ({ activeListings: myListings.filter(l => l.status === 'active').length, pendingListings: myListings.filter(l => l.status === 'pending').length, newEnquiries: myEnquiries.filter(e => e.status === 'new').length, totalViews: myListings.reduce((sum, l) => sum + l.views, 0) }), [myListings, myEnquiries]);

  const activity = useMemo(() => [
    ...myEnquiries.slice(0, 5).map(e => ({ id: `e-${e.id}`, kind: 'Enquiry', title: `${e.from} · ${e.aircraft}`, time: formatTimeAgo(e.date), tab: 'enquiries', ts: new Date(e.date || 0).getTime() })),
    ...myListings.slice(0, 4).map(l => ({ id: `l-${l.id}`, kind: 'Listing', title: `${l.title || 'Aircraft'} · ${l.status || 'pending'}`, time: formatTimeAgo(l.created_at), tab: 'listings', ts: new Date(l.created_at || 0).getTime() })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 6), [myEnquiries, myListings]);

  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : null;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Icons.home },
    { id: 'listings', label: 'My aircraft', icon: Icons.plane, count: myListings.length },
    { id: 'saved', label: 'Saved', icon: Icons.heart, count: savedAircraft.length },
    { id: 'enquiries', label: 'Messages', icon: Icons.mail, count: stats.newEnquiries },
    { id: 'profile', label: 'Profile', icon: Icons.user },
  ];
  const goTab = (id) => { setActiveTab(id); setSelectedEnquiry(null); };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try { await updateProfile({ full_name: profileData.full_name, phone: profileData.phone, location: profileData.location }); setEditProfile(false); showToast('Profile saved'); }
    catch (err) { showToast(err?.message ? `Save failed: ${err.message}` : 'Save failed'); }
    finally { setSavingProfile(false); }
  };
  const cancelProfileEdit = () => { setProfileData({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', location: user.location || '' }); setEditProfile(false); };
  const setEnquiryStatus = async (id, status) => { try { await updateEnquiryStatus(id, status); if (selectedEnquiry?.id === id) setSelectedEnquiry(prev => ({ ...prev, status })); showToast('Lead status updated'); } catch (err) { showToast(err?.message || 'Failed to update lead'); } };
  const setListingStatus = async (id, status) => { try { await updateListingStatus(id, status); showToast('Listing status updated'); } catch (err) { showToast(err?.message || 'Failed to update listing'); } };
  const handleLogout = async () => { await signOut(); setPage('home'); };

  return (
    <>
      <section className="fs-dash-hero"><div className="fs-container fs-dash-hero-inner"><div className="fs-dash-hero-id"><img src={user.avatar} alt="" width="52" height="52" style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(255,255,255,.22)' }} /><div><span className="fs-dash-hero-eyebrow">My FlightSales</span><h1 className="fs-dash-hero-title" style={{ fontSize: 26 }}>{user.full_name ? `Hi, ${user.full_name.split(' ')[0]}` : 'Your account'}</h1><p className="fs-dash-hero-sub">Private account{memberSince ? ` · Member since ${memberSince}` : ''}</p></div></div><div className="fs-dash-hero-actions"><button type="button" className="fs-dash-hero-btn primary" onClick={() => setPage('sell')}>List aircraft</button><button type="button" className="fs-dash-hero-btn ghost" onClick={handleLogout}>Sign out</button></div></div></section>

      <section className="fs-section" style={{ padding: '24px 0 48px' }}><div className="fs-container fs-dash-shell">
        <aside className="fs-dash-sidebar" aria-label="Account navigation"><nav style={{ border: '1px solid var(--fs-line)', borderRadius: 12, overflow: 'hidden', background: 'white', padding: 6 }}>{tabs.map(tab => <button key={tab.id} type="button" onClick={() => goTab(tab.id)} className={`fs-dash-sidebar-item${activeTab === tab.id ? ' on' : ''}`} aria-current={activeTab === tab.id ? 'page' : undefined}><span className="fs-dash-sidebar-icon" aria-hidden="true">{tab.icon}</span><span className="fs-dash-sidebar-label">{tab.label}</span>{!!tab.count && <span className="fs-dash-sidebar-badge">{tab.count}</span>}</button>)}</nav></aside>

        <main className="fs-dash-body">
          {activeTab === 'overview' && <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, marginBottom: 18 }}><div><h2 style={{ fontSize: 24, letterSpacing: '-0.025em', margin: 0 }}>Overview</h2><p style={{ fontSize: 13, color: 'var(--fs-ink-3)', marginTop: 4 }}>Your marketplace activity at a glance.</p></div></div><div className="fs-dash-overview-stats" style={{ marginBottom: 22 }}><Metric value={stats.activeListings} label="Active listings" detail={stats.pendingListings ? `${stats.pendingListings} pending review` : undefined} onClick={() => goTab('listings')} /><Metric value={stats.newEnquiries} label="New enquiries" detail={myEnquiries.length ? `${myEnquiries.length} total` : undefined} onClick={() => goTab('enquiries')} /><Metric value={savedAircraft.length} label="Saved aircraft" onClick={() => goTab('saved')} /><Metric value={stats.totalViews.toLocaleString()} label="Listing views" /></div><div className="fs-dash-overview-grid"><section className="fs-detail-specs" style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}><div style={{ padding: '16px 18px', borderBottom: '1px solid var(--fs-line)' }}><h3 style={{ fontSize: 15, margin: 0 }}>Needs attention</h3><p style={{ fontSize: 12, color: 'var(--fs-ink-3)', marginTop: 2 }}>Items that can move a sale forward.</p></div>{stats.newEnquiries === 0 && stats.pendingListings === 0 ? <p style={{ padding: 20, margin: 0, fontSize: 13, color: 'var(--fs-ink-3)' }}>You’re caught up.</p> : <div>{stats.newEnquiries > 0 && <button type="button" onClick={() => goTab('enquiries')} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--fs-line)', background: 'white', padding: '15px 18px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}><span><strong>{stats.newEnquiries} new buyer {stats.newEnquiries === 1 ? 'enquiry' : 'enquiries'}</strong><span style={{ display: 'block', color: 'var(--fs-ink-3)', fontSize: 12, marginTop: 2 }}>Review contact details and progress each lead.</span></span><span aria-hidden="true">→</span></button>}{stats.pendingListings > 0 && <button type="button" onClick={() => goTab('listings')} style={{ width: '100%', border: 0, background: 'white', padding: '15px 18px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}><span><strong>{stats.pendingListings} {stats.pendingListings === 1 ? 'listing' : 'listings'} pending review</strong><span style={{ display: 'block', color: 'var(--fs-ink-3)', fontSize: 12, marginTop: 2 }}>Track status from My aircraft.</span></span><span aria-hidden="true">→</span></button>}</div>}</section><section className="fs-detail-specs" style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}><div style={{ padding: '16px 18px', borderBottom: '1px solid var(--fs-line)' }}><h3 style={{ fontSize: 15, margin: 0 }}>Recent activity</h3></div>{activity.length === 0 ? <p style={{ padding: 20, margin: 0, fontSize: 13, color: 'var(--fs-ink-3)' }}>Activity will appear here as you list, save and receive enquiries.</p> : activity.map(item => <button key={item.id} type="button" onClick={() => goTab(item.tab)} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--fs-line)', background: 'white', padding: '13px 18px', display: 'flex', justifyContent: 'space-between', gap: 12, cursor: 'pointer', textAlign: 'left' }}><span style={{ minWidth: 0 }}><span style={{ fontSize: 11, color: 'var(--fs-ink-4)' }}>{item.kind}</span><strong style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</strong></span><span style={{ flexShrink: 0, fontSize: 11, color: 'var(--fs-ink-4)' }}>{item.time}</span></button>)}</section></div></>}

          {activeTab === 'listings' && <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}><div><h2 style={{ fontSize: 24, margin: 0 }}>My aircraft</h2><p style={{ fontSize: 13, color: 'var(--fs-ink-3)', marginTop: 4 }}>Manage live, pending and closed listings.</p></div><button type="button" className="fs-nav-btn-primary" onClick={() => setPage('sell')}>Add listing</button></div>{listingsLoading ? <p className="fs-dash-empty">Loading listings…</p> : myListings.length === 0 ? <div className="fs-detail-specs" style={{ padding: '44px 24px', textAlign: 'center', borderRadius: 12 }}><h3 style={{ marginBottom: 6 }}>No aircraft listed</h3><p style={{ color: 'var(--fs-ink-3)', fontSize: 14, marginBottom: 18 }}>Create your first listing when you’re ready to sell.</p><button type="button" className="fs-nav-btn-primary" onClick={() => setPage('sell')}>List aircraft</button></div> : <div className="fs-admin-tablewrap"><table className="fs-admin-table"><thead><tr><th>Aircraft</th><th>Price</th><th>Views</th><th>Enquiries</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{myListings.map(listing => <tr key={listing.id}><td><div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 210 }}>{listing.image ? <Image src={listing.image} alt="" width={56} height={38} style={{ objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 56, height: 38, borderRadius: 6, background: 'var(--fs-bg-2)', display: 'grid', placeItems: 'center' }}>{Icons.plane}</div>}<div><strong className="fs-admin-cell-strong">{listing.title || 'Aircraft'}</strong><span className="fs-admin-cell-muted">{listing.daysListed == null ? '' : `${listing.daysListed}d listed`}</span></div></div></td><td>{listing.price != null ? `$${Number(listing.price).toLocaleString()}` : 'POA'}</td><td>{listing.views.toLocaleString()}</td><td>{listing.enquiries}</td><td><select value={listing.status || 'pending'} onChange={e => setListingStatus(listing.id, e.target.value)} className="fs-sort-select" aria-label={`Status for ${listing.title}`}><option value="pending">Pending</option><option value="active">Active</option><option value="sold">Sold</option><option value="archived">Archived</option></select></td><td style={{ textAlign: 'right' }}><button type="button" className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm" onClick={() => setEditingListing(myListingsRaw.find(r => r.id === listing.id))}>Edit</button></td></tr>)}</tbody></table></div>}</>}

          {activeTab === 'saved' && <><div style={{ marginBottom: 18 }}><h2 style={{ fontSize: 24, margin: 0 }}>Saved aircraft</h2><p style={{ fontSize: 13, color: 'var(--fs-ink-3)', marginTop: 4 }}>Your shortlist in one place.</p></div>{savedAircraft.length === 0 ? <div className="fs-detail-specs" style={{ padding: '44px 24px', textAlign: 'center', borderRadius: 12 }}><h3 style={{ marginBottom: 6 }}>Nothing saved yet</h3><p style={{ color: 'var(--fs-ink-3)', fontSize: 14, marginBottom: 18 }}>Save aircraft while browsing to build a shortlist.</p><button type="button" className="fs-nav-btn-primary" onClick={() => setPage('buy')}>Browse aircraft</button></div> : <div className="fs-grid">{savedAircraft.map(listing => <ListingCard key={listing.id} listing={listing} onSave={onSave} saved />)}</div>}</>}

          {activeTab === 'enquiries' && <><div className="fs-enq-head" style={{ marginBottom: 18 }}><div><h2 style={{ fontSize: 24, margin: 0 }}>Messages</h2><p style={{ fontSize: 13, color: 'var(--fs-ink-3)', marginTop: 4 }}>Buyer enquiries attached to your listings.</p></div>{!selectedEnquiry && <div className="fs-enq-filters">{['all','new','contacted','negotiating'].map(filter => <button key={filter} type="button" className={`fs-enq-filter${enquiryFilter === filter ? ' on' : ''}`} onClick={() => setEnquiryFilter(filter)}>{filter}</button>)}</div>}</div>{enquiriesLoading ? <p className="fs-dash-empty">Loading enquiries…</p> : selectedEnquiry ? <div><button type="button" onClick={() => setSelectedEnquiry(null)} className="fs-link" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', marginBottom: 16 }}>← Back to messages</button><div className="fs-detail-specs" style={{ borderRadius: 12, padding: 22 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}><div><h3 style={{ margin: 0, fontSize: 18 }}>{selectedEnquiry.from}</h3><p style={{ color: 'var(--fs-ink-3)', fontSize: 13, marginTop: 3 }}>{selectedEnquiry.aircraft} · {formatTimeAgo(selectedEnquiry.date)}</p></div><StatusBadge status={selectedEnquiry.status} /></div><p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 20 }}>{selectedEnquiry.message || 'No message supplied.'}</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>{selectedEnquiry.email && <a className="fs-confirm-btn fs-confirm-btn-primary" href={`mailto:${selectedEnquiry.email}?subject=${encodeURIComponent(`FlightSales enquiry — ${selectedEnquiry.aircraft}`)}`}>Email buyer</a>}{selectedEnquiry.phone && <a className="fs-confirm-btn fs-confirm-btn-secondary" href={`tel:${selectedEnquiry.phone}`}>Call {selectedEnquiry.phone}</a>}</div><label className="fs-form-label" htmlFor="lead-status">Lead status</label><select id="lead-status" className="fs-form-select" value={selectedEnquiry.status} onChange={e => setEnquiryStatus(selectedEnquiry.id, e.target.value)} style={{ maxWidth: 220 }}><option value="new">New</option><option value="contacted">Contacted</option><option value="negotiating">Negotiating</option><option value="sold">Closed</option><option value="archived">Archived</option><option value="spam">Spam</option></select></div></div> : (() => { const visible = myEnquiries.filter(e => e.status !== 'spam').filter(e => enquiryFilter === 'all' || e.status === enquiryFilter || (enquiryFilter === 'contacted' && e.status === 'replied')); return visible.length === 0 ? <div className="fs-detail-specs" style={{ padding: '44px 24px', textAlign: 'center', borderRadius: 12 }}><h3>No messages here</h3><p style={{ color: 'var(--fs-ink-3)', fontSize: 14, marginTop: 6 }}>New buyer enquiries will appear here automatically.</p></div> : <div style={{ border: '1px solid var(--fs-line)', borderRadius: 12, overflow: 'hidden' }}>{visible.map((enquiry, index) => <button key={enquiry.id} type="button" onClick={() => setSelectedEnquiry(enquiry)} style={{ width: '100%', border: 0, borderBottom: index < visible.length - 1 ? '1px solid var(--fs-line)' : 0, background: 'white', padding: '16px 18px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 16, cursor: 'pointer', textAlign: 'left' }}><span style={{ minWidth: 0 }}><strong style={{ fontSize: 14 }}>{enquiry.from}</strong><span style={{ display: 'block', color: 'var(--fs-ink-3)', fontSize: 12, marginTop: 2 }}>{enquiry.aircraft}</span><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fs-ink-2)', fontSize: 13, marginTop: 6 }}>{enquiry.message || 'No message supplied'}</span></span><span style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 6 }}><StatusBadge status={enquiry.status} /><span style={{ fontSize: 11, color: 'var(--fs-ink-4)' }}>{formatTimeAgo(enquiry.date)}</span></span></button>)}</div>; })()}</>}

          {activeTab === 'profile' && <ProfileTab user={user} profileData={profileData} setProfileData={setProfileData} editProfile={editProfile} setEditProfile={setEditProfile} savingProfile={savingProfile} onSave={handleSaveProfile} onCancel={cancelProfileEdit} />}
        </main>
      </div></section>

      {editingListing && <ListingEditModal listing={editingListing} onClose={() => setEditingListing(null)} onSaved={() => refetchListings?.()} />}
    </>
  );
}
