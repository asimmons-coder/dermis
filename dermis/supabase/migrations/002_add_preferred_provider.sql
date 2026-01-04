-- Add preferred_provider_id to patients table
ALTER TABLE patients ADD COLUMN preferred_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_patients_preferred_provider ON patients(preferred_provider_id);

-- Add MRN sequence tracking to practices
ALTER TABLE practices ADD COLUMN mrn_sequence INTEGER DEFAULT 1;

-- Function to generate MRN for a practice
CREATE OR REPLACE FUNCTION generate_mrn(practice_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    next_seq INTEGER;
    new_mrn TEXT;
BEGIN
    -- Get and increment the sequence
    UPDATE practices
    SET mrn_sequence = mrn_sequence + 1
    WHERE id = practice_uuid
    RETURNING mrn_sequence INTO next_seq;

    -- Format as NGD-XXXX
    new_mrn := 'NGD-' || LPAD(next_seq::TEXT, 4, '0');

    RETURN new_mrn;
END;
$$ LANGUAGE plpgsql;
