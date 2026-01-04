-- Seed realistic demo appointments for today
-- Creates 10 appointments across all 3 providers with varied statuses

-- First, let's get today's date
DO $$
DECLARE
  today_date DATE := CURRENT_DATE;
  practice_uuid UUID := '00000000-0000-0000-0000-000000000001';

  -- Provider IDs (update these if different in your system)
  dr_karlee UUID := (SELECT id FROM providers WHERE first_name = 'Karlee' LIMIT 1);
  dr_fred UUID := (SELECT id FROM providers WHERE first_name = 'Fred' LIMIT 1);
  dr_taylor UUID := (SELECT id FROM providers WHERE first_name = 'Taylor' LIMIT 1);

  -- Patient IDs
  maria_id UUID := (SELECT id FROM patients WHERE first_name = 'Maria' AND last_name = 'Santos' LIMIT 1);
  rebecca_id UUID := (SELECT id FROM patients WHERE first_name = 'Rebecca' AND last_name = 'Chen' LIMIT 1);
  tyler_id UUID := (SELECT id FROM patients WHERE first_name = 'Tyler' AND last_name = 'Johnson' LIMIT 1);
  david_id UUID := (SELECT id FROM patients WHERE first_name = 'David' AND last_name = 'Williams' LIMIT 1);
  sarah_id UUID := (SELECT id FROM patients WHERE first_name = 'Sarah' AND last_name = 'Martinez' LIMIT 1);
  michael_id UUID := (SELECT id FROM patients WHERE first_name = 'Michael' AND last_name = 'Anderson' LIMIT 1);
  emily_id UUID := (SELECT id FROM patients WHERE first_name = 'Emily' AND last_name = 'Thompson' LIMIT 1);
  james_id UUID := (SELECT id FROM patients WHERE first_name = 'James' AND last_name = 'Wilson' LIMIT 1);

BEGIN
  -- Delete existing appointments for today to avoid duplicates
  DELETE FROM encounters WHERE DATE(scheduled_at) = today_date;

  -- Dr. Karlee's appointments (3 appointments)

  -- 1. Maria Santos - Annual skin check - Completed
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at, checked_in_at, started_at, completed_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, maria_id, dr_karlee,
    'skin_check', 'Annual full body skin examination',
    'completed',
    today_date + TIME '08:00:00',
    today_date + TIME '08:05:00',
    today_date + TIME '08:15:00',
    today_date + TIME '08:45:00'
  );

  -- 2. Rebecca Chen - Botox consultation - Completed
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at, checked_in_at, started_at, completed_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, rebecca_id, dr_karlee,
    'cosmetic_consult', 'Botox consultation for forehead lines and crow''s feet',
    'completed',
    today_date + TIME '09:00:00',
    today_date + TIME '09:02:00',
    today_date + TIME '09:10:00',
    today_date + TIME '09:40:00'
  );

  -- 3. Tyler Johnson - Acne follow-up - In Progress
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at, checked_in_at, started_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, tyler_id, dr_karlee,
    'follow_up', 'Follow-up for acne treatment, isotretinoin month 3',
    'in_progress',
    today_date + TIME '10:00:00',
    today_date + TIME '10:03:00',
    today_date + TIME '10:12:00'
  );

  -- Dr. Fred's appointments (4 appointments)

  -- 4. David Williams - Psoriasis follow-up - Completed
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at, checked_in_at, started_at, completed_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, david_id, dr_fred,
    'follow_up', 'Psoriasis management, biologic therapy assessment',
    'completed',
    today_date + TIME '08:30:00',
    today_date + TIME '08:32:00',
    today_date + TIME '08:40:00',
    today_date + TIME '09:15:00'
  );

  -- 5. Sarah Martinez - Suspicious lesion removal - In Progress
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at, checked_in_at, started_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, sarah_id, dr_fred,
    'procedure', 'Excision of suspicious lesion, right forearm',
    'in_progress',
    today_date + TIME '10:00:00',
    today_date + TIME '10:02:00',
    today_date + TIME '10:15:00'
  );

  -- 6. Michael Anderson - New patient rash evaluation - Checked In
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at, checked_in_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, michael_id, dr_fred,
    'office_visit', 'New patient - itchy rash on trunk and extremities',
    'checked_in',
    today_date + TIME '11:00:00',
    today_date + TIME '10:58:00'
  );

  -- 7. Emily Thompson - Scheduled for later
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, emily_id, dr_fred,
    'office_visit', 'Hair loss consultation',
    'scheduled',
    today_date + TIME '14:00:00'
  );

  -- Dr. Taylor's appointments (3 appointments)

  -- 8. James Wilson - Skin cancer screening - Checked In
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at, checked_in_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, james_id, dr_taylor,
    'skin_check', 'Skin cancer screening, family history of melanoma',
    'checked_in',
    today_date + TIME '09:00:00',
    today_date + TIME '08:55:00'
  );

  -- 9. Maria Santos - Cosmetic consultation - Checked In
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at, checked_in_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, maria_id, dr_taylor,
    'cosmetic_consult', 'Filler consultation for nasolabial folds',
    'checked_in',
    today_date + TIME '11:30:00',
    today_date + TIME '11:25:00'
  );

  -- 10. Rebecca Chen - Mohs surgery post-op - Scheduled
  INSERT INTO encounters (
    id, practice_id, patient_id, provider_id,
    encounter_type, chief_complaint, status,
    scheduled_at
  ) VALUES (
    gen_random_uuid(), practice_uuid, rebecca_id, dr_taylor,
    'follow_up', 'Post-operative check, Mohs surgery site on nose',
    'scheduled',
    today_date + TIME '13:00:00'
  );

  RAISE NOTICE 'Successfully created 10 demo appointments for %', today_date;
END $$;
