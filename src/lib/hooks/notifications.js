import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// Per-user notification feed driving the nav-bell. Realtime
// subscription handles the hot path (insert/update push events into
// state); a 60s polling fallback catches missed events when Realtime
// isn't enabled on the Supabase project.

export function useNotifications(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setItems(data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime subscription — push insert/update events into local state
  // so the bell updates the moment a notification lands. Falls back to
  // the polling interval below if Realtime isn't enabled.
  useEffect(() => {
    if (!userId) return undefined;
    let channel;
    try {
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => { setItems(prev => [payload.new, ...prev].slice(0, 50)); },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => { setItems(prev => prev.map(n => n.id === payload.new.id ? payload.new : n)); },
        )
        .subscribe();
    } catch {
      // Realtime not available — fall through to polling below.
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [userId]);

  // Polling fallback — kept on a longer interval (60s) when Realtime
  // is connected. Catches the rare case of a missed Realtime event.
  useEffect(() => {
    if (!userId) return undefined;
    const tick = () => { if (document.visibilityState === 'visible') fetchAll(); };
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [userId, fetchAll]);

  const unreadCount = items.filter(n => !n.read_at).length;

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const markAllRead = async () => {
    const unreadIds = items.filter(n => !n.read_at).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
    setItems(prev => prev.map(n => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
  };

  return { items, loading, unreadCount, refetch: fetchAll, markRead, markAllRead };
}
