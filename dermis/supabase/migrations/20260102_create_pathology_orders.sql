-- Create pathology orders table
CREATE TABLE IF NOT EXISTS pathology_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

  -- Order details
  specimen_type VARCHAR(100) NOT NULL, -- shave, punch, excision, etc.
  body_site VARCHAR(200) NOT NULL,
  clinical_description TEXT,
  lab_name VARCHAR(200),

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, received, reviewed, needs_action
  date_sent TIMESTAMP,
  date_received TIMESTAMP,
  date_reviewed TIMESTAMP,

  -- Results
  diagnosis TEXT,
  margins TEXT,
  path_report TEXT,
  follow_up_notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  reviewed_by UUID REFERENCES providers(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pathology_orders_patient ON pathology_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_pathology_orders_status ON pathology_orders(status);
CREATE INDEX IF NOT EXISTS idx_pathology_orders_provider ON pathology_orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_pathology_orders_date_sent ON pathology_orders(date_sent);

-- Enable RLS
ALTER TABLE pathology_orders ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all access for authenticated users" ON pathology_orders
  FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE pathology_orders IS 'Tracks pathology/biopsy orders and results';
