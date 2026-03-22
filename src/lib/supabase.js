import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface Aircraft {
  id: string;
  title: string;
  price: number;
  manufacturer: string;
  model: string;
  year: number;
  category: string;
  condition: string;
  state: string;
  city: string;
  ttaf: number;
  eng_hours: number;
  eng_tbo: number | null;
  avionics: string;
  rego: string;
  useful_load: number;
  range_nm: number;
  fuel_burn: number;
  cruise_kts: number;
  ifr: boolean;
  retractable: boolean;
  pressurised: boolean;
  glass_cockpit: boolean;
  images: string[];
  featured: boolean;
  dealer_id: string | null;
  user_id: string | null;
  description: string;
  specs: Record<string, any>;
  status: 'active' | 'sold' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Dealer {
  id: string;
  name: string;
  location: string;
  listings: number;
  rating: number;
  since: number;
  logo: string;
  speciality: string;
  verified: boolean;
  created_at: string;
}

export interface Enquiry {
  id: string;
  aircraft_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_dealer: boolean;
  dealer_id: string | null;
  saved_aircraft: string[];
  created_at: string;
}
