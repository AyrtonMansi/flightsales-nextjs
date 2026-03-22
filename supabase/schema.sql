-- ============================================
-- FLIGHTSALES DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ============================================
-- DEALERS TABLE
-- ============================================
CREATE TABLE dealers (
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
CREATE TABLE aircraft (
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
  ttaf INTEGER NOT NULL,
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
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'pending')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX idx_aircraft_category ON aircraft(category);
CREATE INDEX idx_aircraft_manufacturer ON aircraft(manufacturer);
CREATE INDEX idx_aircraft_state ON aircraft(state);
CREATE INDEX idx_aircraft_price ON aircraft(price);
CREATE INDEX idx_aircraft_featured ON aircraft(featured) WHERE featured = true;
CREATE INDEX idx_aircraft_status ON aircraft(status);
CREATE INDEX idx_aircraft_condition ON aircraft(condition);
CREATE INDEX idx_aircraft_dealer ON aircraft(dealer_id);

-- ============================================
-- ENQUIRIES TABLE
-- ============================================
CREATE TABLE enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_enquiries_aircraft ON enquiries(aircraft_id);
CREATE INDEX idx_enquiries_status ON enquiries(status);

-- ============================================
-- USER PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_dealer BOOLEAN DEFAULT false,
  dealer_id UUID REFERENCES dealers(id),
  saved_aircraft UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SAVED/WATCHLIST TABLE
-- ============================================
CREATE TABLE saved_aircraft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, aircraft_id)
);

CREATE INDEX idx_saved_user ON saved_aircraft(user_id);

-- ============================================
-- NEWS ARTICLES TABLE
-- ============================================
CREATE TABLE news_articles (
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

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Aircraft: Anyone can read active listings
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aircraft are viewable by everyone" 
  ON aircraft FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Users can insert their own listings" 
  ON aircraft FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" 
  ON aircraft FOR UPDATE 
  USING (auth.uid() = user_id);

-- Dealers: Anyone can read
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers are viewable by everyone" 
  ON dealers FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Enquiries: Users can create, dealers/users can read their own
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create enquiries" 
  ON enquiries FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Aircraft owners can view enquiries" 
  ON enquiries FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM aircraft a 
      WHERE a.id = enquiries.aircraft_id 
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM dealers d 
        WHERE d.id = a.dealer_id 
        AND d.id IN (SELECT dealer_id FROM profiles WHERE id = auth.uid())
      ))
    )
  );

-- Profiles: Users can read/update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Saved aircraft: Users can CRUD their own
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

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aircraft_updated_at 
  BEFORE UPDATE ON aircraft 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's saved aircraft
CREATE OR REPLACE FUNCTION get_user_saved_aircraft(user_uuid UUID)
RETURNS TABLE(aircraft_id UUID) AS $$
BEGIN
  RETURN QUERY SELECT sa.aircraft_id FROM saved_aircraft sa WHERE sa.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert sample dealers
INSERT INTO dealers (name, location, listings, rating, since, logo, speciality, verified) VALUES
  ('Southern Aviation Group', 'Moorabbin, VIC', 14, 4.8, 2015, 'SAG', 'Cirrus, Diamond, Mooney', true),
  ('Queensland Aircraft Sales', 'Archerfield, QLD', 22, 4.9, 2008, 'QAS', 'Multi-engine, Turboprop', true),
  ('Rotorwest Aviation', 'Jandakot, WA', 8, 4.7, 2012, 'RW', 'Robinson, Bell Helicopters', true),
  ('Sling Australia', 'Tyabb, VIC', 6, 5.0, 2019, 'SA', 'Sling Aircraft (Authorised Dealer)', true),
  ('Executive Aviation Group', 'Sydney, NSW', 11, 4.9, 2003, 'EAG', 'Turboprop, Jet, High-value', true),
  ('Australian Light Aircraft', 'Bacchus Marsh, VIC', 9, 4.6, 2017, 'ALA', 'LSA, Ultralight, Recreational', true);

-- Insert sample aircraft
INSERT INTO aircraft (
  title, price, manufacturer, model, year, category, condition, state, city,
  ttaf, eng_hours, eng_tbo, avionics, rego, useful_load, range_nm, fuel_burn, cruise_kts,
  ifr, retractable, pressurised, glass_cockpit, images, featured, dealer_id,
  description, specs, status
) VALUES
  (
    '2018 Cirrus SR22T GTS', 895000, 'Cirrus', 'SR22T GTS', 2018, 'Single Engine Piston', 'Pre-Owned', 'VIC', 'Moorabbin',
    420, 420, 2000, 'Garmin Perspective+', 'VH-XRT', 454, 930, 68, 213,
    true, false, false, true, ARRAY['https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800'], true,
    (SELECT id FROM dealers WHERE name = 'Southern Aviation Group'),
    'Pristine condition with FIKI, A/C, and full TKS. One owner, always hangared. Complete logbooks. Next annual due Sep 2026.',
    '{"engine": "Continental TSIO-550-K", "propeller": "Hartzell 3-blade composite", "seats": 4, "mtow_kg": 1542, "wingspan_m": 11.68, "parachute": "CAPS equipped"}'::jsonb,
    'active'
  ),
  (
    '2005 Cessna 182T Skylane', 385000, 'Cessna', '182T Skylane', 2005, 'Single Engine Piston', 'Pre-Owned', 'NSW', 'Bankstown',
    1850, 620, 2000, 'Garmin G1000', 'VH-DMK', 419, 820, 52, 145,
    true, false, false, true, ARRAY['https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800'], true,
    NULL,
    'Well maintained 182T with G1000 and GFC700 autopilot. Engine overhauled 2022 by Lycoming. Ideal touring aircraft. Fresh annual.',
    '{"engine": "Lycoming IO-540-AB1A5", "propeller": "McCauley 3-blade", "seats": 4, "mtow_kg": 1406, "wingspan_m": 10.97}'::jsonb,
    'active'
  ),
  (
    '2022 Tecnam P2012 Traveller', 2450000, 'Tecnam', 'P2012 Traveller', 2022, 'Multi Engine Piston', 'Pre-Owned', 'QLD', 'Archerfield',
    280, 280, 2000, 'Garmin G1000 NXi', 'VH-TWN', 1134, 950, 120, 194,
    true, false, false, true, ARRAY['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'], true,
    (SELECT id FROM dealers WHERE name = 'Queensland Aircraft Sales'),
    'Exceptional 11-seat commuter. Perfect for charter operations. Low time, full de-ice, cargo pod. Revenue-ready.',
    '{"engine": "2x Lycoming TEO-540-C1A", "propeller": "2x MT 4-blade", "seats": 11, "mtow_kg": 3680, "wingspan_m": 14.24}'::jsonb,
    'active'
  );

-- Insert sample news
INSERT INTO news_articles (title, excerpt, category, date, read_time, slug, published) VALUES
  ('CASA Approves New Electric Aircraft Category for Training Operations', 'The Civil Aviation Safety Authority has approved a new category of electric aircraft for use in pilot training, opening the door for flight schools to adopt zero-emission trainers.', 'Regulation', '2026-03-20', 4, 'casa-electric-training', true),
  ('Market Report: Australian GA Aircraft Values Rise 12% in Q1 2026', 'Strong demand and limited supply continue to drive pre-owned aircraft prices upward across all categories, with single-engine pistons seeing the largest gains.', 'Market', '2026-03-18', 6, 'market-q1-2026', true),
  ('Sling Aircraft Delivers 100th Australian-Assembled TSi', 'Sling Australia''s Tyabb facility has reached a major milestone with the delivery of its 100th locally assembled TSi, cementing the type''s popularity in the Australian market.', 'Industry', '2026-03-15', 3, 'sling-100th-tsi', true),
  ('New Bankstown Airport Hangar Complex Opens with 40 Additional Bays', 'A $28M hangar development at Bankstown Airport has been completed, adding 40 new bays to address Sydney''s chronic aircraft storage shortage.', 'Infrastructure', '2026-03-12', 4, 'bankstown-hangars', true);
