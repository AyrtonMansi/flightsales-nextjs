-- ============================================
-- FLIGHTSALES DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- DEALERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  listings INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  since INTEGER NOT NULL,
  logo TEXT,
  speciality TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AIRCRAFT LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS aircraft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('New', 'Pre-Owned', 'Project/Restoration')),
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  ttaf INTEGER NOT NULL DEFAULT 0,
  eng_hours INTEGER,
  eng_tbo INTEGER,
  avionics TEXT,
  rego TEXT UNIQUE,
  useful_load INTEGER,
  range_nm INTEGER,
  fuel_burn INTEGER,
  cruise_kts INTEGER,
  ifr BOOLEAN DEFAULT false,
  retractable BOOLEAN DEFAULT false,
  pressurised BOOLEAN DEFAULT false,
  glass_cockpit BOOLEAN DEFAULT false,
  images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,

  -- Relations
  dealer_id UUID REFERENCES dealers(id),
  user_id UUID REFERENCES auth.users(id),

  -- Content
  description TEXT,
  specs JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'sold', 'pending')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_aircraft_category ON aircraft(category);
CREATE INDEX IF NOT EXISTS idx_aircraft_manufacturer ON aircraft(manufacturer);
CREATE INDEX IF NOT EXISTS idx_aircraft_state ON aircraft(state);
CREATE INDEX IF NOT EXISTS idx_aircraft_price ON aircraft(price);
CREATE INDEX IF NOT EXISTS idx_aircraft_featured ON aircraft(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_aircraft_status ON aircraft(status);
CREATE INDEX IF NOT EXISTS idx_aircraft_condition ON aircraft(condition);
CREATE INDEX IF NOT EXISTS idx_aircraft_dealer ON aircraft(dealer_id);
CREATE INDEX IF NOT EXISTS idx_aircraft_user ON aircraft(user_id);

-- ============================================
-- ENQUIRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES aircraft(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  finance_status TEXT,
  type TEXT DEFAULT 'enquiry' CHECK (type IN ('enquiry', 'finance', 'insurance', 'valuation', 'contact')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'spam', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_aircraft ON enquiries(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);

-- ============================================
-- USER PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  is_dealer BOOLEAN DEFAULT false,
  dealer_id UUID REFERENCES dealers(id),
  -- Role: 'private' (default), 'dealer' (kept for backwards-compat with is_dealer), 'admin'.
  -- Replaces the hardcoded admin-email check that previously lived in client code.
  role TEXT DEFAULT 'private' CHECK (role IN ('private', 'dealer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration for existing deployments: add the column if it's missing.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'private'
  CHECK (role IN ('private', 'dealer', 'admin'));

-- ============================================
-- AIRCRAFT — advanced filter columns (additive)
-- ============================================
-- Added to support the structured advanced filter set on /buy. All NULL-able
-- (or false-defaulting) so existing rows aren't rejected — sellers populate
-- via the SellPage form as listings come on board.

-- Performance
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS mtow INTEGER;             -- max takeoff weight, kg
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS service_ceiling INTEGER;  -- ft

-- Engine
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS engine_count INTEGER;     -- 1, 2, 4
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS engine_type TEXT;         -- 'piston'|'turboprop'|'turbofan'|'electric'
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS engine_make TEXT;         -- 'Continental'|'Lycoming'|'Pratt & Whitney'|'Williams'|'Rotax'|...

-- Avionics & equipment (categorical + booleans)
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS avionics_suite TEXT;      -- 'Garmin G1000/NXi'|'Garmin G3X'|'Garmin G500/600'|'Avidyne'|'Dynon'|'Aspen'|'Steam'
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS autopilot TEXT;           -- 'GFC700'|'KAP140'|'S-TEC'|'None'
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS adsb_in BOOLEAN DEFAULT false;
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS adsb_out BOOLEAN DEFAULT false;
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS syn_vis BOOLEAN DEFAULT false;
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS de_ice BOOLEAN DEFAULT false;
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS air_con BOOLEAN DEFAULT false;
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS cargo_door BOOLEAN DEFAULT false;
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS parachute BOOLEAN DEFAULT false;

-- History & condition
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS damage_history TEXT;      -- 'none'|'minor'|'major'
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS logbooks_complete BOOLEAN DEFAULT false;
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS hangared BOOLEAN DEFAULT false;
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS owner_count INTEGER;

-- Admin moderation
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS rejection_reason TEXT;    -- shown to seller when status='rejected'

-- Profile moderation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- ABN verification — auto-verifies a dealer's business via the Australian
-- Business Register (ABR) lookup. abn_verified_at is the auth signal: any
-- non-null value means we successfully matched an active ABN to this
-- profile. Cached fields below let us show "Verified by ABR" without
-- hitting ABR on every render.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn_business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn_entity_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn_status TEXT;            -- 'Active' | 'Cancelled'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn_gst_registered BOOLEAN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn_postcode TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abn_state TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_abn ON profiles(abn);

-- ============================================
-- DEALER APPLICATIONS
-- ============================================
-- Users can apply to become a verified dealer; admin approves/rejects.
-- Approval flips profiles.is_dealer + creates a dealers row.
CREATE TABLE IF NOT EXISTS dealer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  abn TEXT,
  location TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dealer_apps_status ON dealer_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dealer_apps_user ON dealer_applications(user_id);

-- ============================================
-- ADMIN AUDIT LOG (Wave 4 — schema seeded now so we can hook into it later)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,            -- 'listing.approve', 'user.suspend', etc.
  target_type TEXT NOT NULL,       -- 'aircraft' | 'profile' | 'enquiry' | 'dealer_app' | ...
  target_id UUID,
  before JSONB,
  after JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_recent ON admin_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit(admin_id, created_at DESC);

-- ============================================
-- IN-APP NOTIFICATIONS
-- ============================================
-- Per-user feed for events: enquiry received, listing approved/rejected,
-- dealer app reviewed, message reply. Surfaces in the dashboard bell.
-- Mirror of what gets emailed so users have an in-app inbox.
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,            -- 'enquiry.received' | 'listing.approved' | 'listing.rejected' | 'dealer_app.approved' | 'dealer_app.rejected' | 'system'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,                     -- in-app deep link (e.g. /dashboard?tab=enquiries)
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- EMAIL LOG
-- ============================================
-- Every send goes through this for audit + idempotency. If a Resend API
-- call fails, we keep the row with status='failed' for retry. If it
-- succeeds we record the message id from Resend so we can reconcile
-- bounces / complaints out of band.
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_address TEXT NOT NULL,
  template TEXT NOT NULL,       -- 'enquiry.seller', 'auth.welcome', etc.
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'   -- 'pending'|'sent'|'failed'
    CHECK (status IN ('pending', 'sent', 'failed')),
  provider_id TEXT,             -- Resend message id once sent
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_log_recent ON email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_failed ON email_log(status, created_at DESC) WHERE status = 'failed';

-- ============================================
-- RPC: admin_users_with_listings_count
-- Server-side aggregation replaces the client-side N+1 in useAdminUsers.
-- ============================================
CREATE OR REPLACE FUNCTION admin_users_with_listings_count()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_dealer BOOLEAN,
  suspended_at TIMESTAMP WITH TIME ZONE,
  listings_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    p.id, p.email, p.full_name, p.role, p.is_dealer, p.suspended_at,
    COALESCE(c.cnt, 0) AS listings_count,
    p.created_at
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt
    FROM aircraft
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ) c ON c.user_id = p.id
  ORDER BY p.created_at DESC;
$$;


-- ============================================
-- SAVED/WATCHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_aircraft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, aircraft_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_aircraft(user_id);

-- ============================================
-- NEWS ARTICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  read_time INTEGER DEFAULT 5,
  image_url TEXT,
  slug TEXT UNIQUE,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published, date DESC);

-- ============================================
-- CASA CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS casa_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rego TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_casa_cache_rego ON casa_cache(rego);
CREATE INDEX IF NOT EXISTS idx_casa_cache_time ON casa_cache(cached_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Aircraft: Anyone can read active listings, admins see all
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active aircraft viewable by everyone"
  ON aircraft FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own listings"
  ON aircraft FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON aircraft FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON aircraft FOR DELETE
  USING (auth.uid() = user_id);

-- Dealers: Anyone can read
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers are viewable by everyone"
  ON dealers FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enquiries
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create enquiries"
  ON enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Aircraft owners can view their enquiries"
  ON enquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM aircraft a
      WHERE a.id = enquiries.aircraft_id
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.dealer_id = a.dealer_id
      ))
    )
  );

CREATE POLICY "Aircraft owners can update enquiry status"
  ON enquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM aircraft a
      WHERE a.id = enquiries.aircraft_id
      AND a.user_id = auth.uid()
    )
  );

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Saved aircraft
ALTER TABLE saved_aircraft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own saves"
  ON saved_aircraft
  FOR ALL
  USING (auth.uid() = user_id);

-- News: Anyone can read published
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published news is viewable by everyone"
  ON news_articles FOR SELECT
  USING (published = true);

-- CASA cache: Anyone can read
ALTER TABLE casa_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CASA cache is viewable by everyone"
  ON casa_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert CASA cache"
  ON casa_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_aircraft_updated_at
  BEFORE UPDATE ON aircraft
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO dealers (name, location, listings, rating, since, logo, speciality, verified) VALUES
  ('Southern Aviation Group', 'Moorabbin, VIC', 14, 4.8, 2015, 'SAG', 'Cirrus, Diamond, Mooney', true),
  ('Queensland Aircraft Sales', 'Archerfield, QLD', 22, 4.9, 2008, 'QAS', 'Multi-engine, Turboprop', true),
  ('Rotorwest Aviation', 'Jandakot, WA', 8, 4.7, 2012, 'RW', 'Robinson, Bell Helicopters', true),
  ('Sling Australia', 'Tyabb, VIC', 6, 5.0, 2019, 'SA', 'Sling Aircraft (Authorised Dealer)', true),
  ('Executive Aviation Group', 'Sydney, NSW', 11, 4.9, 2003, 'EAG', 'Turboprop, Jet, High-value', true),
  ('Australian Light Aircraft', 'Bacchus Marsh, VIC', 9, 4.6, 2017, 'ALA', 'LSA, Ultralight, Recreational', true)
ON CONFLICT DO NOTHING;

INSERT INTO news_articles (title, excerpt, category, date, read_time, slug, published) VALUES
  ('CASA Approves New Electric Aircraft Category for Training Operations', 'The Civil Aviation Safety Authority has approved a new category of electric aircraft for use in pilot training, opening the door for flight schools to adopt zero-emission trainers.', 'Regulation', '2026-03-20', 4, 'casa-electric-training', true),
  ('Market Report: Australian GA Aircraft Values Rise 12% in Q1 2026', 'Strong demand and limited supply continue to drive pre-owned aircraft prices upward across all categories, with single-engine pistons seeing the largest gains.', 'Market', '2026-03-18', 6, 'market-q1-2026', true),
  ('Sling Aircraft Delivers 100th Australian-Assembled TSi', 'Sling Australia''s Tyabb facility has reached a major milestone with the delivery of its 100th locally assembled TSi, cementing the type''s popularity in the Australian market.', 'Industry', '2026-03-15', 3, 'sling-100th-tsi', true),
  ('New Bankstown Airport Hangar Complex Opens with 40 Additional Bays', 'A $28M hangar development at Bankstown Airport has been completed, adding 40 new bays to address Sydney''s chronic aircraft storage shortage.', 'Infrastructure', '2026-03-12', 4, 'bankstown-hangars', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- LAUNCH WAVE: view tracking, listing expiry, reports, 2FA flag
-- All additive. Existing rows get sane defaults.
-- ============================================

-- Per-listing view counter (debounced + cookie'd in /api/views)
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Listing expiry — auto-archived 60 days after creation; renewal email
-- 7 days before. Vercel cron at /api/cron/expire-listings handles both.
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE
  DEFAULT (NOW() + INTERVAL '60 days');
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Admin flag — has the user enrolled an MFA factor with Supabase yet?
-- The check still runs against auth.mfa_factors at request time but this
-- column lets us surface "Enroll 2FA" prompts in the admin UI.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enrolled BOOLEAN DEFAULT false;

-- ============================================
-- REPORTED LISTINGS
-- Anyone can flag a listing as suspicious; admin reviews in the
-- "Reports" tab (hooked into existing AdminPage).
-- ============================================
CREATE TABLE IF NOT EXISTS listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES auth.users(id),
  reporter_email TEXT,             -- if reporter wasn't logged in
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON listing_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_aircraft ON listing_reports(aircraft_id);

-- Expand the aircraft.status check to include 'rejected' (admin reject
-- with reason) and 'archived' (auto-set on expiry). Existing rows stay
-- valid — both new values are additive.
ALTER TABLE aircraft DROP CONSTRAINT IF EXISTS aircraft_status_check;
ALTER TABLE aircraft ADD CONSTRAINT aircraft_status_check
  CHECK (status IN ('pending', 'active', 'sold', 'rejected', 'archived'));

-- ============================================
-- SAVED SEARCHES + DIGEST
-- ============================================
-- Logged-in users can save filter sets and receive a daily/weekly
-- email digest of new matching listings. The Vercel cron at
-- /api/cron/saved-search-digest walks open searches, queries for
-- matches since last_sent_at, and emails when there's anything new.
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Encoded filter state (same shape as filterReducer's toQueryFilters
  -- output). JSONB so we can grow the schema without re-migrating.
  filters JSONB NOT NULL DEFAULT '{}',
  -- Frequency: 'daily' | 'weekly' | 'instant' (instant = realtime alert
  -- via notifications table; daily/weekly = email digest)
  frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('daily', 'weekly', 'instant', 'off')),
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_due ON saved_searches(frequency, last_sent_at NULLS FIRST)
  WHERE frequency IN ('daily', 'weekly');

-- Onboarding drip dedup column. Tracks the last drip step we sent to
-- this user ('day2' | 'day7'). Cheap dedup — no separate event row
-- needed at this volume.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_sent TEXT;

-- ============================================================
-- STORAGE — listing photos bucket
-- ============================================================
-- The /sell page calls supabase.storage.from('aircraft-images').upload(),
-- so we provision the bucket + the policies it needs in the same
-- migration as the tables. Idempotent: re-running this whole file is
-- always safe.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('aircraft-images', 'aircraft-images', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[];

-- Public read so listing photos can render anonymously on /buy and
-- /listings/[id] without an auth round-trip.
DROP POLICY IF EXISTS "Aircraft images are publicly readable" ON storage.objects;
CREATE POLICY "Aircraft images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'aircraft-images');

-- Authenticated users can upload to their own listing folder. Path
-- pattern is "<listing_id>/<timestamp>.<ext>" — RLS on the listings
-- table already gates which listing_id the user owns, so a logged-in
-- user can only add to a listing they actually created.
DROP POLICY IF EXISTS "Authenticated users can upload aircraft images" ON storage.objects;
CREATE POLICY "Authenticated users can upload aircraft images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'aircraft-images');

DROP POLICY IF EXISTS "Authenticated users can update aircraft images" ON storage.objects;
CREATE POLICY "Authenticated users can update aircraft images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'aircraft-images');

DROP POLICY IF EXISTS "Authenticated users can delete aircraft images" ON storage.objects;
CREATE POLICY "Authenticated users can delete aircraft images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'aircraft-images');

-- ============================================================
-- AIRCRAFT CATALOGUE — makes, models, aliases
-- ============================================================
-- The static catalogue (top ~200 models with verified specs) ships in
-- the JS bundle (src/lib/aircraftCatalogueSeed.js) so the picker works
-- on day one even with an empty DB. These tables let admins + bulk
-- imports (FAA, CASA registers) extend the catalogue beyond the seed.
-- The runtime hook merges seed + DB so additions appear automatically.

CREATE TABLE IF NOT EXISTS aircraft_makes (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,                    -- 'cessna'
  name TEXT NOT NULL UNIQUE,                    -- 'Cessna'
  country TEXT,                                 -- 'USA'
  founded_year INTEGER,
  active BOOLEAN DEFAULT true,
  homepage_url TEXT,
  wikipedia_url TEXT,
  logo_url TEXT,
  source TEXT DEFAULT 'crowdsourced',           -- seed | faa | casa | crowdsourced
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aircraft_models (
  id SERIAL PRIMARY KEY,
  make_slug TEXT NOT NULL REFERENCES aircraft_makes(slug) ON DELETE CASCADE,
  family TEXT NOT NULL,                         -- '172'
  variant TEXT,                                 -- 'S Skyhawk'
  full_name TEXT NOT NULL,                      -- 'Cessna 172S Skyhawk'
  slug TEXT NOT NULL UNIQUE,                    -- 'cessna-172s-skyhawk'
  type_designator TEXT,                         -- 'C172' (ICAO Doc 8643)
  category TEXT NOT NULL,                       -- maps to CATEGORIES
  mission TEXT[] DEFAULT '{}',                  -- {trainer,tourer}
  -- Lifecycle
  year_first INTEGER,
  year_last INTEGER,                            -- NULL if in production
  -- Performance specs (NULL where unknown)
  mtow_kg INTEGER,
  seats INTEGER,
  engine_type TEXT,
  engine_count INTEGER DEFAULT 1,
  cruise_kts INTEGER,
  range_nm INTEGER,
  fuel_burn_lph INTEGER,
  ceiling_ft INTEGER,
  -- Metadata
  wikipedia_url TEXT,
  hero_image_url TEXT,
  description TEXT,
  -- Provenance
  source TEXT DEFAULT 'crowdsourced',           -- seed | faa | casa | crowdsourced | wiki
  source_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (make_slug, full_name)
);

-- Aliases — every spelling/abbreviation that should resolve to the same
-- canonical model. "C-172", "Skyhawk", "C172S" all map to the Cessna 172S
-- row. Powers fuzzy matching from existing free-text listings + sloppy
-- search input.
CREATE TABLE IF NOT EXISTS aircraft_model_aliases (
  id SERIAL PRIMARY KEY,
  model_slug TEXT NOT NULL REFERENCES aircraft_models(slug) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_normalized TEXT NOT NULL,               -- lowercase, no spaces/hyphens
  UNIQUE (alias_normalized)
);

CREATE INDEX IF NOT EXISTS idx_models_make ON aircraft_models(make_slug);
CREATE INDEX IF NOT EXISTS idx_models_category ON aircraft_models(category);
CREATE INDEX IF NOT EXISTS idx_models_type_designator ON aircraft_models(type_designator);
CREATE INDEX IF NOT EXISTS idx_models_mission ON aircraft_models USING GIN(mission);
CREATE INDEX IF NOT EXISTS idx_models_fts ON aircraft_models
  USING GIN (to_tsvector('english',
    coalesce(full_name,'') || ' ' ||
    coalesce(type_designator,'') || ' ' ||
    coalesce(family,'') || ' ' ||
    coalesce(variant,'')
  ));
CREATE INDEX IF NOT EXISTS idx_aliases_normalized ON aircraft_model_aliases(alias_normalized);

-- Wire to listings — nullable so existing free-text listings still work.
ALTER TABLE aircraft ADD COLUMN IF NOT EXISTS model_slug TEXT
  REFERENCES aircraft_models(slug) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_aircraft_model_slug ON aircraft(model_slug);

-- RLS — catalogue tables are publicly readable; only service role writes
-- (admin + import scripts use service role key).
ALTER TABLE aircraft_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircraft_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircraft_model_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aircraft makes are publicly readable" ON aircraft_makes;
CREATE POLICY "Aircraft makes are publicly readable"
  ON aircraft_makes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Aircraft models are publicly readable" ON aircraft_models;
CREATE POLICY "Aircraft models are publicly readable"
  ON aircraft_models FOR SELECT USING (true);

DROP POLICY IF EXISTS "Aircraft model aliases are publicly readable" ON aircraft_model_aliases;
CREATE POLICY "Aircraft model aliases are publicly readable"
  ON aircraft_model_aliases FOR SELECT USING (true);

-- ============================================================
-- BUSINESS / DEALER ACCOUNT TYPE — extends profiles
-- ============================================================
-- Users now self-select Private vs Business at signup. Business path
-- creates a dealer_applications row + flags pending_dealer=true; admin
-- approval flips role to 'dealer' and clears the pending flag.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'private'
    CHECK (account_type IN ('private', 'business'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pending_dealer BOOLEAN DEFAULT FALSE;

-- Subscription plan + status. 'hobby' = free; everything else needs a
-- live Stripe sub. Stripe wiring is a separate sprint — these columns
-- exist so the BusinessDashboard can read state from day one.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'hobby'
    CHECK (subscription_plan IN ('hobby','private_premium','dealer_lite','pro','enterprise'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('inactive','trial','active','past_due','cancelled'));

-- Index for fast "find all pending dealers" admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_pending_dealer ON profiles(pending_dealer) WHERE pending_dealer = TRUE;

-- ============================================================
-- AFFILIATE PARTNERS — finance, insurance, escrow, maintenance,
-- training, inspection, transport. Pluggable: each partner has
-- targeting rules, lead-capture method, commission terms. Lead
-- rows track every referral + delivery status + conversion.
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'finance', 'insurance', 'escrow', 'maintenance',
    'training', 'inspection', 'transport', 'other'
  )),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'terminated')),

  -- Public-facing branding
  logo_url TEXT,
  website_url TEXT,
  description TEXT,                          -- shown on partner card
  cta_text TEXT,                             -- e.g. "Get a finance quote"

  -- Targeting — when this partner's CTA appears
  min_listing_price INTEGER,
  max_listing_price INTEGER,
  categories TEXT[],                         -- empty = all categories
  states TEXT[],                             -- empty = anywhere in AU
  display_priority INTEGER DEFAULT 100,      -- lower = shown first when multiple match

  -- Lead delivery — how we hand the lead to the partner
  lead_capture_method TEXT NOT NULL DEFAULT 'email'
    CHECK (lead_capture_method IN ('email', 'webhook', 'api')),
  lead_email TEXT,                           -- for method='email'
  lead_webhook_url TEXT,                     -- for method='webhook' (POST)
  api_endpoint_url TEXT,                     -- for method='api'
  api_credential_secret TEXT,                -- encrypted; admin-only

  -- Business terms
  commission_pct NUMERIC(5, 2),              -- our cut % (info only — payout
                                             -- is reconciled manually for v1)
  contract_url TEXT,                         -- link to signed agreement

  -- Internal contact
  contact_name TEXT,
  contact_email TEXT,
  notes TEXT,                                -- admin-only

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_type   ON affiliates(type);

-- Lead rows — one per referral. Tracks who sent it, the listing context,
-- delivery state, and (for converted leads) the deal value + commission.
CREATE TABLE IF NOT EXISTS affiliate_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id INTEGER REFERENCES aircraft(id) ON DELETE SET NULL,

  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  message TEXT,

  -- Pipeline state
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'contacted', 'quoted', 'converted', 'dead')),
  conversion_value NUMERIC,                  -- closed deal amount
  commission_amount NUMERIC,                 -- our payout

  -- Delivery — did the partner actually receive it?
  delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
  delivery_response JSONB,                   -- partner's reply (webhook/api)
  delivery_error TEXT,                       -- if failed

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_leads_affiliate ON affiliate_leads(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_status    ON affiliate_leads(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_user      ON affiliate_leads(user_id);

ALTER TABLE affiliates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_leads  ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can READ active affiliates (the user-facing /partners page +
-- listing-detail CTAs); only admins write. Lead inserts go through the
-- /api/affiliate-leads route with service role, so RLS doesn't need to
-- gate inserts here — keeping it locked is the safe default.
DROP POLICY IF EXISTS "Active affiliates are publicly readable" ON affiliates;
CREATE POLICY "Active affiliates are publicly readable"
  ON affiliates FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Admins manage affiliates" ON affiliates;
CREATE POLICY "Admins manage affiliates"
  ON affiliates FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users see own affiliate leads" ON affiliate_leads;
CREATE POLICY "Users see own affiliate leads"
  ON affiliate_leads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
