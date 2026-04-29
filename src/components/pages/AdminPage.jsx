'use client';
import { useState, useMemo } from 'react';
import { Icons } from '../Icons';
import { useAdminListings, useAdminUsers, useAdminEnquiries } from '../../lib/hooks';
import { LEAD_STATUSES, ENQUIRY_STATUS, LISTING_STATUS } from '../../lib/statuses';
import { showToast } from '../../lib/toast';

const AdminPage = ({ user, setPage, signOut }) => {
  // Caller (App) already gates rendering on admin role; no render-time setPage here.
  const [activeTab, setActiveTab] = useState('listings');
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  const { listings: adminListings, loading: listingsLoading, updateStatus: updateListingStatusRaw } = useAdminListings();
  const { users: adminUsers, loading: usersLoading, promoteToDealer } = useAdminUsers();
  const { enquiries: adminEnquiries, updateStatus: updateEnquiryStatus } = useAdminEnquiries();

  // Wrap mutation calls so failures surface to the user via toast instead of
  // disappearing silently. The hook still throws on failure.
  const updateListingStatus = async (id, status) => {
    try { await updateListingStatusRaw(id, status); showToast(`Marked ${status}`); }
    catch (err) { showToast(err?.message ? `Update failed: ${err.message}` : 'Update failed'); }
  };

  // Real listings rows mapped to the existing table's expected shape
  const listingsView = useMemo(() => (adminListings || []).map(l => ({
    id: l.id,
    title: l.title || `${l.year || ''} ${l.manufacturer || ''} ${l.model || ''}`.trim(),
    price: l.price || 0,
    seller: l.dealer?.name || (l.user_id ? 'Private seller' : 'Unknown'),
    status: l.status || 'pending',
    date: l.created_at,
  })), [adminListings]);

  const usersView = useMemo(() => (adminUsers || []).map(u => ({
    id: u.id,
    name: u.full_name || u.email?.split('@')[0] || 'Unnamed',
    email: u.email,
    role: u.is_dealer ? 'dealer' : 'private',
    listings: u.listings_count || 0,
  })), [adminUsers]);

  // Split enquiries into platform-leads (finance/insurance/valuation/contact) vs listing enquiries
  const leads = useMemo(() => (adminEnquiries || [])
    .filter(e => e.type && e.type !== 'enquiry')
    .map(e => ({
      id: e.id,
      type: e.type,
      name: e.name,
      email: e.email,
      phone: e.phone || '',
      aircraft: e.aircraft?.title || '—',
      amount: null,
      status: e.status || 'new',
      provider: null,
      notes: e.message || '',
      date: e.created_at,
      assignedTo: null,
    })), [adminEnquiries]);

  const listingEnquiries = useMemo(() => (adminEnquiries || [])
    .filter(e => !e.type || e.type === 'enquiry'), [adminEnquiries]);

  const handleLeadStatusChange = (leadId, newStatus) => {
    updateEnquiryStatus(leadId, newStatus);
  };

  const handleAssignProvider = (leadId, provider) => {
    // Provider assignment isn't in the schema yet — record as a status change for now
    updateEnquiryStatus(leadId, 'assigned');
  };

  // Live stats from real DB rows
  const adminStats = {
    totalListings: adminListings?.length || 0,
    pendingReview: (adminListings || []).filter(l => l.status === 'pending').length,
    activeUsers: adminUsers?.length || 0,
    dealers: (adminUsers || []).filter(u => u.is_dealer).length,
  };

  const getLeadTypeLabel = (type) => {
    const labels = { finance: 'Finance', insurance: 'Insurance', valuation: 'Valuation' };
    return labels[type] || type;
  };

  const getLeadStatusBadge = (status) => {
    const styles = {
      new: { bg: '#dcfce7', color: '#166534', label: 'New' },
      contacted: { bg: '#dbeafe', color: '#1e40af', label: 'Contacted' },
      qualified: { bg: '#fef3c7', color: '#92400e', label: 'Qualified' },
      assigned: { bg: '#e0e7ff', color: '#3730a3', label: 'Assigned' },
      converted: { bg: '#d1fae5', color: '#065f46', label: 'Converted' },
      lost: { bg: '#fee2e2', color: '#991b1b', label: 'Lost' }
    };
    const s = styles[status] || styles.new;
    return <span style={{ padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <>
      <div className="fs-about-hero" style={{ padding: "32px 0", background: "#1a1a1a" }}>
        <div className="fs-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                background: "var(--fs-red)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: 20
              }}>
                {Icons.shield}
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 24, marginBottom: 4 }}>
                  Admin Dashboard
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                  Manage listings, users, and platform settings
                </p>
              </div>
            </div>
            <button 
              onClick={async () => { await signOut(); setPage('home'); }}
              style={{ 
                padding: "8px 16px", 
                background: "rgba(255,255,255,0.1)", 
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "var(--fs-radius-sm)",
                color: "white",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <section className="fs-section" style={{ padding: "32px 0" }}>
        <div className="fs-container">
          {/* Stats Row — live from DB */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Listings', value: adminStats.totalListings, color: 'var(--fs-ink)' },
              { label: 'Pending Review', value: adminStats.pendingReview, color: 'var(--fs-amber)' },
              { label: 'Active Users', value: adminStats.activeUsers, color: 'var(--fs-green)' },
              { label: 'Dealers', value: adminStats.dealers, color: 'var(--fs-gray-900)' },
            ].map(stat => (
              <div key={stat.label} className="fs-detail-specs" style={{ padding: "20px" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: "var(--fs-gray-500)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--fs-gray-200)", flexWrap: 'wrap' }}>
            {[
              { id: 'listings', label: 'Listings' },
              { id: 'users', label: 'Users' },
              { id: 'dealers', label: 'Dealer Applications' },
              { id: 'enquiries', label: 'Enquiries' },
              { id: 'leads', label: 'Lead Management', badge: leads.filter(l => l.status === 'new').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedLead(null); }}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid var(--fs-ink)" : "2px solid transparent",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? "var(--fs-ink)" : "var(--fs-gray-500)",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{ 
                    background: activeTab === tab.id ? 'var(--fs-ink)' : 'var(--fs-gray-200)', 
                    color: activeTab === tab.id ? 'white' : 'var(--fs-gray-600)', 
                    fontSize: 11, 
                    padding: '2px 8px', 
                    borderRadius: "var(--fs-radius-lg)",
                    fontWeight: 600
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="fs-detail-specs" style={{ padding: 0 }}>
            {activeTab === 'listings' && (
              listingsLoading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--fs-gray-500)' }}>Loading listings…</div>
              ) : listingsView.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No listings yet</h3>
                  <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 24 }}>List your first aircraft to start receiving enquiries.</p>
                  <button className="fs-nav-btn-primary" onClick={() => setPage('sell')}>List Aircraft</button>
                </div>
              ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--fs-gray-200)" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Aircraft</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Price</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Seller</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listingsView.map(listing => (
                    <tr key={listing.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                      <td style={{ padding: "16px", fontWeight: 500 }}>{listing.title}</td>
                      <td style={{ padding: "16px" }}>${(listing.price || 0).toLocaleString()}</td>
                      <td style={{ padding: "16px", color: "var(--fs-gray-600)" }}>{listing.seller}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          background: listing.status === 'active' ? '#dcfce7' : listing.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                          color: listing.status === 'active' ? '#166534' : listing.status === 'pending' ? '#92400e' : 'var(--fs-gray-600)',
                          textTransform: 'capitalize',
                        }}>
                          {listing.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {listing.status !== 'active' && (
                            <button onClick={() => updateListingStatus(listing.id, 'active')} style={{ padding: "6px 12px", background: "var(--fs-green)", color: "white", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Approve</button>
                          )}
                          {listing.status === 'active' && (
                            <button onClick={() => updateListingStatus(listing.id, 'pending')} style={{ padding: "6px 12px", background: "var(--fs-gray-100)", color: "var(--fs-gray-700)", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Unpublish</button>
                          )}
                          <button onClick={() => updateListingStatus(listing.id, 'sold')} style={{ padding: "6px 12px", background: "var(--fs-gray-100)", color: "var(--fs-gray-700)", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Mark Sold</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )
            )}

            {activeTab === 'users' && (
              usersLoading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--fs-gray-500)' }}>Loading users…</div>
              ) : usersView.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--fs-gray-500)' }}>No users yet.</div>
              ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--fs-gray-200)" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>User</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Role</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Listings</th>
                    <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersView.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                      <td style={{ padding: "16px" }}>
                        <p style={{ fontWeight: 500 }}>{u.name}</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-500)" }}>{u.email}</p>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          background: u.role === 'dealer' ? '#eff6ff' : '#f3f4f6',
                          color: u.role === 'dealer' ? 'var(--fs-ink)' : 'var(--fs-gray-600)',
                          textTransform: "capitalize"
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>{u.listings}</td>
                      <td style={{ padding: "16px", textAlign: 'right' }}>
                        {u.role !== 'dealer' && (
                          <button onClick={() => promoteToDealer(u.id)} style={{ padding: "6px 12px", background: "var(--fs-ink)", color: 'white', border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Promote to dealer</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )
            )}

            {activeTab === 'dealers' && (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ color: "var(--fs-gray-500)" }}>No pending dealer applications</p>
              </div>
            )}

            {activeTab === 'enquiries' && (
              listingEnquiries.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center" }}>
                  <p style={{ color: "var(--fs-gray-500)" }}>No listing enquiries yet.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--fs-gray-200)" }}>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>From</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Aircraft</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Received</th>
                      <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listingEnquiries.map(e => (
                      <tr key={e.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                        <td style={{ padding: "16px" }}>
                          <p style={{ fontWeight: 500 }}>{e.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--fs-gray-500)' }}>{e.email}</p>
                        </td>
                        <td style={{ padding: "16px", color: "var(--fs-gray-700)" }}>{e.aircraft?.title || '—'}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: e.status === 'new' ? '#dcfce7' : '#f3f4f6', color: e.status === 'new' ? '#166534' : 'var(--fs-gray-600)', textTransform: 'capitalize' }}>{e.status}</span>
                        </td>
                        <td style={{ padding: "16px", fontSize: 13, color: 'var(--fs-gray-500)' }}>{new Date(e.created_at).toLocaleString()}</td>
                        <td style={{ padding: "16px", textAlign: 'right' }}>
                          <a href={`mailto:${e.email}`} style={{ fontSize: 12, color: 'var(--fs-ink)', marginRight: 12 }}>Email</a>
                          {e.status === 'new' && (
                            <button onClick={() => updateEnquiryStatus(e.id, 'read')} style={{ padding: "6px 12px", background: "var(--fs-gray-100)", color: 'var(--fs-gray-700)', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Mark read</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* LEAD MANAGEMENT TAB */}
            {activeTab === 'leads' && (
              <>
                {!selectedLead ? (
                  <>
                    <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Lead Management</h3>
                        <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Finance, Insurance & Valuation inquiries</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['all', 'finance', 'insurance', 'valuation'].map(filter => (
                          <button 
                            key={filter}
                            onClick={() => setLeadStatusFilter(filter)}
                            style={{ 
                              padding: "6px 12px", 
                              background: leadStatusFilter === filter ? 'var(--fs-ink)' : 'var(--fs-gray-100)', 
                              color: leadStatusFilter === filter ? 'white' : 'var(--fs-gray-700)',
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: "pointer",
                              textTransform: 'capitalize'
                            }}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--fs-gray-200)", background: '#fafafa' }}>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Type</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Contact</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Aircraft/Amount</th>
                          <th style={{ padding: "16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Provider</th>
                          <th style={{ padding: "16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads
                          .filter(l => leadStatusFilter === 'all' || l.type === leadStatusFilter)
                          .map(lead => (
                          <tr key={lead.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <td style={{ padding: "16px" }}>
                              <span style={{ fontSize: 13 }}>{getLeadTypeLabel(lead.type)}</span>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <p style={{ fontWeight: 500, fontSize: 14 }}>{lead.name}</p>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{lead.email}</p>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <p style={{ fontSize: 14 }}>{lead.aircraft}</p>
                              {lead.amount && <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>${lead.amount.toLocaleString()}</p>}
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              {getLeadStatusBadge(lead.status)}
                            </td>
                            <td style={{ padding: "16px" }}>
                              {lead.provider ? (
                                <span style={{ fontSize: 13 }}>{lead.provider}</span>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--fs-gray-400)', fontStyle: 'italic' }}>Unassigned</span>
                              )}
                            </td>
                            <td style={{ padding: "16px", textAlign: "right" }}>
                              <button 
                                onClick={() => setSelectedLead(lead)}
                                style={{ 
                                  padding: "6px 12px", 
                                  background: "var(--fs-ink)", 
                                  color: "white",
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: "pointer"
                                }}
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  /* Lead Detail View */
                  <div style={{ padding: "24px" }}>
                    <button 
                      onClick={() => setSelectedLead(null)}
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
                      ← Back to leads
                    </button>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                      {/* Main Info */}
                      <div>
                        <div className="fs-detail-specs" style={{ padding: "24px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{selectedLead.name}</h2>
                              <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>{getLeadTypeLabel(selectedLead.type)} • {selectedLead.aircraft}</p>
                            </div>
                            {getLeadStatusBadge(selectedLead.status)}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Email</p>
                              <a href={`mailto:${selectedLead.email}`} style={{ fontSize: 14, color: 'var(--fs-ink)' }}>{selectedLead.email}</a>
                            </div>
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Phone</p>
                              <a href={`tel:${selectedLead.phone}`} style={{ fontSize: 14, color: 'var(--fs-ink)' }}>{selectedLead.phone}</a>
                            </div>
                            {selectedLead.amount && (
                              <div>
                                <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Amount</p>
                                <p style={{ fontSize: 14, fontWeight: 600 }}>${selectedLead.amount.toLocaleString()}</p>
                              </div>
                            )}
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Received</p>
                              <p style={{ fontSize: 14 }}>{new Date(selectedLead.date).toLocaleString()}</p>
                            </div>
                          </div>

                          <div>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 8 }}>Notes</p>
                            <p style={{ fontSize: 14, lineHeight: 1.6, padding: 12, background: '#f9fafb', borderRadius: 8 }}>{selectedLead.notes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar Actions */}
                      <div>
                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Update Status</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {LEAD_STATUSES.map(status => (
                              <button
                                key={status}
                                onClick={() => handleLeadStatusChange(selectedLead.id, status)}
                                style={{ 
                                  padding: "10px 16px", 
                                  background: selectedLead.status === status ? '#eff6ff' : 'var(--fs-gray-100)', 
                                  color: selectedLead.status === status ? 'var(--fs-ink)' : 'var(--fs-gray-700)',
                                  border: selectedLead.status === status ? '1px solid var(--fs-ink)' : 'none',
                                  borderRadius: "var(--fs-radius)",
                                  fontSize: 13,
                                  cursor: "pointer",
                                  textAlign: 'left',
                                  textTransform: 'capitalize',
                                  fontWeight: selectedLead.status === status ? 600 : 400
                                }}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: "var(--fs-radius-lg)", marginBottom: 16 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Assign Provider</h4>
                          <select 
                            className="fs-form-select"
                            value={selectedLead.provider || ''}
                            onChange={(e) => handleAssignProvider(selectedLead.id, e.target.value)}
                            style={{ marginBottom: 12 }}
                          >
                            <option value="">Select Provider...</option>
                            {selectedLead.type === 'finance' && (
                              <>
                                <option value="Aviation Finance Australia">Aviation Finance Australia</option>
                                <option value="Aircraft Lending Centre">Aircraft Lending Centre</option>
                                <option value="Bank of Queensland Aviation">Bank of Queensland Aviation</option>
                              </>
                            )}
                            {selectedLead.type === 'insurance' && (
                              <>
                                <option value="Avemco Insurance">Avemco Insurance</option>
                                <option value="QBE Aviation">QBE Aviation</option>
                                <option value="Allianz Aircraft Insurance">Allianz Aircraft Insurance</option>
                              </>
                            )}
                            {selectedLead.type === 'valuation' && (
                              <>
                                <option value="Aircraft Valuations Pty Ltd">Aircraft Valuations Pty Ltd</option>
                                <option value="ASA Accredited Appraiser">ASA Accredited Appraiser</option>
                              </>
                            )}
                          </select>
                          <button className="fs-form-submit" style={{ width: '100%' }}>
                            Send to Provider
                          </button>
                        </div>

                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Staff Notes</h4>
                          <textarea
                            className="fs-form-textarea"
                            placeholder="Add internal notes..."
                            style={{ minHeight: 100, fontSize: 13 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPage;
