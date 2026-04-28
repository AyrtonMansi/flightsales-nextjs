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
