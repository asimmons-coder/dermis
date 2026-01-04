-- Add copay tracking and check-in fields to encounters table
ALTER TABLE encounters
ADD COLUMN IF NOT EXISTS copay DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS insurance_card_photo TEXT,
ADD COLUMN IF NOT EXISTS id_photo TEXT,
ADD COLUMN IF NOT EXISTS signature TEXT;

-- Add comment for copay column
COMMENT ON COLUMN encounters.copay IS 'Copay amount collected at check-in';
COMMENT ON COLUMN encounters.insurance_card_photo IS 'Base64 encoded insurance card photo';
COMMENT ON COLUMN encounters.id_photo IS 'Base64 encoded photo ID';
COMMENT ON COLUMN encounters.signature IS 'Base64 encoded patient signature';
