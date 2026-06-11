// Core domain types — derived from supabase/schema.sql.
// First TypeScript surface in the project. Add to this file as you
// migrate JS modules to .ts; treat it as the canonical record-shape
// reference until we generate types straight from Supabase.

// ── Aircraft listing ────────────────────────────────────────────────
export type ListingStatus = 'active' | 'sold' | 'pending';
export type ListingCondition = 'New' | 'Pre-Owned' | 'Project/Restoration';

export interface Listing {
  id: string;
  title: string;
  price: number;
  manufacturer: string;
  model: string;
  year: number;
  category: string;
  condition: ListingCondition;
  state: string;
  city: string;
  ttaf: number;
  eng_hours: number | null;
  eng_tbo: number | null;
  avionics: string | null;
  rego: string | null;
  description: string | null;
  images: string[];
  featured: boolean;
  status: ListingStatus;
  user_id: string | null;
  dealer_id: string | null;
  view_count?: number;
  created_at: string;
  updated_at: string;
  rejection_reason?: string | null;
}

// ── Profile (extends auth.users) ────────────────────────────────────
export type Role = 'private' | 'dealer' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  is_dealer: boolean;
  dealer_id: string | null;
  role: Role;
  suspended_at: string | null;
  suspension_reason: string | null;
  // ABN verification (auto-stamped by /api/abn-verify when ABR returns Active)
  abn: string | null;
  abn_verified_at: string | null;
  abn_business_name: string | null;
  abn_entity_type: string | null;
  abn_status: string | null;
  abn_gst_registered: boolean | null;
  abn_postcode: string | null;
  abn_state: string | null;
  created_at: string;
  updated_at: string;
}

// ── Affiliate (partner) ─────────────────────────────────────────────
export type AffiliateType =
  | 'finance' | 'insurance' | 'escrow' | 'inspection'
  | 'maintenance' | 'training' | 'transport' | 'other';
export type AffiliateStatus = 'pending' | 'active' | 'paused' | 'archived';
export type LeadDeliveryMethod = 'email' | 'webhook' | 'api';

export interface Affiliate {
  id: string;
  slug: string;
  name: string;
  type: AffiliateType;
  status: AffiliateStatus;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  display_priority: number;
  min_listing_price: number | null;
  max_listing_price: number | null;
  categories: string[] | null;
  states: string[] | null;
  lead_delivery_method: LeadDeliveryMethod;
  lead_delivery_email: string | null;
  lead_delivery_webhook: string | null;
  commission_rate: number | null;
  created_at: string;
  updated_at: string;
}

// ── Enquiry ─────────────────────────────────────────────────────────
export type EnquiryStatus = 'new' | 'read' | 'replied' | 'spam' | 'archived';
export type EnquiryType = 'enquiry' | 'finance' | 'insurance' | 'valuation' | 'contact';

export interface Enquiry {
  id: string;
  aircraft_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  finance_status: string | null;
  type: EnquiryType;
  status: EnquiryStatus;
  created_at: string;
}

// ── API response envelopes ──────────────────────────────────────────
export type ApiOk<T = Record<string, unknown>> = { ok: true } & T;
export type ApiErr = { ok: false; error: string; detail?: string };
export type ApiResult<T = Record<string, unknown>> = ApiOk<T> | ApiErr;
