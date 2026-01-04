-- Create patient_communications table for tracking all patient communications
CREATE TABLE IF NOT EXISTS patient_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,

  -- Communication details
  communication_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  communication_type TEXT NOT NULL, -- 'Phone', 'Portal', 'SMS', 'Email', 'In-Person', 'Other'
  direction TEXT NOT NULL, -- 'Inbound', 'Outbound'
  subject TEXT NOT NULL,
  notes TEXT,

  -- Follow-up tracking
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_due_date DATE,
  follow_up_completed BOOLEAN DEFAULT false,
  follow_up_completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  logged_by UUID REFERENCES providers(id),
  logged_by_name TEXT, -- Store name in case provider is deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Related entities (optional)
  related_pathology_order_id UUID REFERENCES pathology_orders(id) ON DELETE SET NULL,
  related_encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_patient_communications_patient_id ON patient_communications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_practice_id ON patient_communications(practice_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_date ON patient_communications(communication_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_communications_follow_up ON patient_communications(follow_up_needed, follow_up_due_date) WHERE follow_up_needed = true AND follow_up_completed = false;

-- Enable RLS
ALTER TABLE patient_communications ENABLE ROW LEVEL SECURITY;

-- Policies for patient_communications
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON patient_communications;
CREATE POLICY "Enable all access for authenticated users" ON patient_communications
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_patient_communications_updated_at_trigger ON patient_communications;
CREATE TRIGGER update_patient_communications_updated_at_trigger
  BEFORE UPDATE ON patient_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_communications_updated_at();
