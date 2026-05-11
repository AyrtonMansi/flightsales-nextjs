import { supabase } from '../supabase';

// Generic lead-capture insert. type is one of: 'finance' | 'insurance'
// | 'valuation' | 'contact'. The aircraft_id is null because these
// are not enquiries against a specific listing — they're top-level
// "contact us" or "I want a quote" leads, surfaced in the admin
// enquiries tab with the type column.

export async function submitLead(type, leadData) {
  const { data, error } = await supabase
    .from('enquiries')
    .insert({
      aircraft_id: null,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone || null,
      message: leadData.message || '',
      type,
      status: 'new'
    });
  if (error) throw error;
  return data;
}
