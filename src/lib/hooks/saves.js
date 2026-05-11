import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Saved aircraft — heart-icon "save for later" on listing cards.
// Returns both the Set of ids (fast inclusion check) and the full
// listing rows (so the dashboard's Saved tab can render cards
// without an extra fetch).

export function useSavedAircraft(userId) {
  const [savedIds, setSavedIds] = useState(new Set());
  const [savedListings, setSavedListings] = useState([]);

  useEffect(() => {
    if (!userId) { setSavedIds(new Set()); setSavedListings([]); return; }
    async function fetch() {
      const { data } = await supabase
        .from('saved_aircraft')
        .select(`aircraft_id, aircraft:aircraft(*, dealer:dealers(name, rating))`)
        .eq('user_id', userId);
      if (data) {
        setSavedIds(new Set(data.map(s => s.aircraft_id)));
        setSavedListings(data.map(s => s.aircraft).filter(Boolean));
      }
    }
    fetch();
  }, [userId]);

  const toggleSave = async (aircraftId) => {
    if (!userId) return false;
    const isSaved = savedIds.has(aircraftId);
    if (isSaved) {
      await supabase.from('saved_aircraft').delete().eq('user_id', userId).eq('aircraft_id', aircraftId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(aircraftId); return n; });
      setSavedListings(prev => prev.filter(l => l.id !== aircraftId));
      return false;
    } else {
      await supabase.from('saved_aircraft').insert({ user_id: userId, aircraft_id: aircraftId });
      setSavedIds(prev => new Set([...prev, aircraftId]));
      const { data } = await supabase
        .from('aircraft')
        .select(`*, dealer:dealers(name, rating)`)
        .eq('id', aircraftId)
        .single();
      if (data) setSavedListings(prev => [...prev, data]);
      return true;
    }
  };

  return { savedIds, savedListings, toggleSave };
}
