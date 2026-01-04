-- Create patient_products join table
CREATE TABLE IF NOT EXISTS patient_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  frequency TEXT DEFAULT 'Daily',
  time_of_day TEXT DEFAULT 'Both', -- 'AM', 'PM', or 'Both'
  notes TEXT,
  recommended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_products_patient_id ON patient_products(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_products_product_id ON patient_products(product_id);
CREATE INDEX IF NOT EXISTS idx_patient_products_recommended_at ON patient_products(recommended_at);

-- Enable RLS
ALTER TABLE patient_products ENABLE ROW LEVEL SECURITY;

-- Policies for patient_products
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON patient_products;
CREATE POLICY "Enable all access for authenticated users" ON patient_products
  FOR ALL USING (true);
