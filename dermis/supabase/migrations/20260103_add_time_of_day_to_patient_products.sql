-- Add time_of_day column to patient_products table
ALTER TABLE patient_products
ADD COLUMN IF NOT EXISTS time_of_day TEXT DEFAULT 'Both';

-- Update existing records to have 'Both' as default
UPDATE patient_products
SET time_of_day = 'Both'
WHERE time_of_day IS NULL;
