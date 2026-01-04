-- Add sample insurance data to test patients
-- This ensures the insurance verification feature has data to display

-- Maria Santos - Blue Cross Blue Shield
UPDATE patients
SET insurance_primary = jsonb_build_object(
  'carrier', 'Blue Cross Blue Shield',
  'plan', 'PPO Select',
  'memberId', 'MS123456789',
  'groupId', 'GRP001',
  'subscriber', 'Maria Santos',
  'relationship', 'self'
)
WHERE id = '7824ccc8-9139-41dd-b859-8cc47d16d16b';

-- Tyler Johnson - Aetna
UPDATE patients
SET insurance_primary = jsonb_build_object(
  'carrier', 'Aetna',
  'plan', 'HMO',
  'memberId', 'TJ987654321',
  'groupId', 'GRP002',
  'subscriber', 'Tyler Johnson',
  'relationship', 'self'
)
WHERE id = 'ef9496ef-793d-4b83-9ab4-560ed13ef4d3';

-- Rebecca Chen - UnitedHealthcare
UPDATE patients
SET insurance_primary = jsonb_build_object(
  'carrier', 'UnitedHealthcare',
  'plan', 'Choice Plus',
  'memberId', 'RC555666777',
  'groupId', 'GRP003',
  'subscriber', 'Rebecca Chen',
  'relationship', 'self'
)
WHERE id = '4dda17c7-4f5c-4ff9-bd5c-2cdb2067a9e6';

-- David Williams - Medicare (no group number)
UPDATE patients
SET insurance_primary = jsonb_build_object(
  'carrier', 'Medicare',
  'plan', 'Part B',
  'memberId', 'DW111222333A',
  'subscriber', 'David Williams',
  'relationship', 'self'
)
WHERE id = 'b56bb913-7a72-4472-9d3e-b3694daf55b8';
