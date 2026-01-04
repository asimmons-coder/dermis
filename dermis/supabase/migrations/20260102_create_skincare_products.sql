-- Create products table for skincare product catalog
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL, -- "Necessities", "Moisturizers & Sunscreens", "Acne", "Other"
  type TEXT, -- "Cleanser", "Retinol", "Moisturizer", "Sunscreen", etc.
  usage_instructions TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on category and type for filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Create patient skincare preferences table
CREATE TABLE IF NOT EXISTS patient_skincare_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  age_group TEXT, -- "18-30", "31-50", "51+"
  skin_type TEXT, -- "Normal", "Dry", "Oily", "Combination", "Sensitive"
  has_acne BOOLEAN DEFAULT false,
  acne_severity TEXT, -- "Mild", "Moderate", "Severe"
  sunscreen_preference TEXT, -- "Chemical", "Physical", "No Preference"
  prefers_tinted BOOLEAN DEFAULT false,
  retinol_tolerance TEXT, -- "None", "Low", "Medium", "High"
  concerns TEXT[], -- ["Anti-aging", "Hyperpigmentation", "Redness", etc.]
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(patient_id)
);

-- Create saved skincare routines table
CREATE TABLE IF NOT EXISTS skincare_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  preference_id UUID REFERENCES patient_skincare_preferences(id) ON DELETE SET NULL,
  routine_name TEXT DEFAULT 'My Routine',
  am_products UUID[] DEFAULT '{}',
  pm_products UUID[] DEFAULT '{}',
  total_price DECIMAL(10,2),
  created_by UUID REFERENCES providers(id),
  created_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_skincare_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE skincare_routines ENABLE ROW LEVEL SECURITY;

-- Policies for products (public read, admin write)
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
CREATE POLICY "Enable read access for all users" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON products;
CREATE POLICY "Enable all access for authenticated users" ON products
  FOR ALL USING (true);

-- Policies for patient preferences
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON patient_skincare_preferences;
CREATE POLICY "Enable all access for authenticated users" ON patient_skincare_preferences
  FOR ALL USING (true);

-- Policies for routines
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON skincare_routines;
CREATE POLICY "Enable all access for authenticated users" ON skincare_routines
  FOR ALL USING (true);
