import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// Admin-side hooks — read full universes (cross-user). Mutations route
// through /api/admin/* server routes that re-verify role='admin' and
// bypass the profile column-lock + aircraft status-flip triggers via
// service role. Direct client mutations on protected columns would
// be rejected by the triggers regardless.

export function useAdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('aircraft')
        .select(`*, dealer:dealers(id, name)`)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setListings(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const callAdmin = async (action, id, params = {}) => {
    const res = await fetch('/api/admin/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...params }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) throw new Error(j.error || 'admin_listing_failed');
    return j.listing;
  };

  const updateStatus = async (id, status) => {
    // Map old status strings to new server actions.
    const action =
      status === 'active' ? 'approve' :
      status === 'sold'   ? 'archive' :
      'restore';
    const data = await callAdmin(action, id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    return data;
  };

  const rejectListing = async (id, reason) => {
    const data = await callAdmin('reject', id, { reason });
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    return data;
  };

  const setFeatured = async (id, featured) => {
    const data = await callAdmin(featured ? 'feature' : 'unfeature', id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    return data;
  };

  const bulkUpdateStatus = async (ids, status) => {
    const results = await Promise.allSettled(ids.map(id => updateStatus(id, status)));
    return {
      succeeded: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };
  };

  return { listings, loading, error, refetch: fetchAll, updateStatus, rejectListing, setFeatured, bulkUpdateStatus };
}

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Client-side aggregation. Slow at scale, but works without
      // requiring an admin_users_with_listings_count RPC.
      const { data: profiles } = await supabase
        .from('profiles').select('*').order('created_at', { ascending: false });
      const { data: counts } = await supabase
        .from('aircraft').select('user_id');
      const listingsByUser = (counts || []).reduce((acc, r) => {
        if (r.user_id) acc[r.user_id] = (acc[r.user_id] || 0) + 1;
        return acc;
      }, {});
      setUsers((profiles || []).map(p => ({ ...p, listings_count: listingsByUser[p.id] || 0 })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const callAdmin = async (action, userId, params = {}) => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, ...params }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) throw new Error(j.error || 'admin_user_failed');
    return j.user;
  };

  const promoteToDealer = async (userId) => {
    const data = await callAdmin('promote', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
  };

  const suspendUser = async (userId, reason) => {
    const data = await callAdmin('suspend', userId, { reason });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
  };

  const unsuspendUser = async (userId) => {
    const data = await callAdmin('unsuspend', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
  };

  return { users, loading, refetch: fetchAll, promoteToDealer, suspendUser, unsuspendUser };
}

export function useAdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('enquiries')
        .select(`*, aircraft:aircraft(id, title)`)
        .order('created_at', { ascending: false });
      setEnquiries(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Light polling so the admin inbox stays fresh while open.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') fetchAll(); };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const updateStatus = async (id, status) => {
    await supabase.from('enquiries').update({ status }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  return { enquiries, loading, refetch: fetchAll, updateStatus };
}

// Admin audit log (read-only; writes happen server-side via the
// audit() helper in lib/requireAdmin.ts when admin actions land).
export function useAdminAudit({ limit = 200 } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('admin_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      setRows(data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  return { rows, loading, refetch: fetchAll };
}

// dealer_applications stays as an admin-only manual-override path for
// edge cases the ABN auto-promotion flow can't handle. Most new
// business signups go straight through ABN now and never create a
// row here.
export function useDealerApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows, error: err } = await supabase
        .from('dealer_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      const userIds = [...new Set((rows || []).map(r => r.user_id).filter(Boolean))];
      let profileById = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        profileById = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
      }
      setApps((rows || []).map(r => ({ ...r, applicant: profileById[r.user_id] || null })));
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const approveApp = async (app) => {
    const res = await fetch('/api/admin/dealer-apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id, action: 'approve' }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) throw new Error(j.error || 'approve_failed');
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
    return j;
  };

  const rejectApp = async (appId, reason) => {
    const res = await fetch('/api/admin/dealer-apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, action: 'reject', reason }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) throw new Error(j.error || 'reject_failed');
    setApps(prev => prev.map(a => a.id === appId
      ? { ...a, status: 'rejected', rejection_reason: reason || null }
      : a));
    return j;
  };

  return { apps, loading, refetch: fetchAll, approveApp, rejectApp };
}

// News articles — admin CRUD. Public read of `published=true` lives in
// hooks/news.js (used by the homepage News rail and /news page).
export function useNewsArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .order('date', { ascending: false });
      setArticles(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createArticle = async (payload) => {
    const { data, error: err } = await supabase
      .from('news_articles').insert(payload).select().single();
    if (err) throw err;
    setArticles(prev => [data, ...prev]);
    return data;
  };

  const updateArticle = async (id, patch) => {
    const { data, error: err } = await supabase
      .from('news_articles').update(patch).eq('id', id).select().single();
    if (err) throw err;
    setArticles(prev => prev.map(a => a.id === id ? data : a));
    return data;
  };

  const deleteArticle = async (id) => {
    const { error: err } = await supabase
      .from('news_articles').delete().eq('id', id);
    if (err) throw err;
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  return { articles, loading, refetch: fetchAll, createArticle, updateArticle, deleteArticle };
}
