-- Create message_templates table for automated patient messaging
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,

  -- Template details
  name VARCHAR(100) NOT NULL,
  template_key VARCHAR(50) NOT NULL, -- appointment_confirmation, reminder_48hr, reminder_24hr, post_visit
  channel VARCHAR(20) NOT NULL, -- 'sms', 'email', 'both'
  subject VARCHAR(200), -- for email
  body TEXT NOT NULL,

  -- Template variables supported: {patient_name}, {provider}, {date}, {time}, {location}, {phone}

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_templates_practice_id ON message_templates(practice_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_template_key ON message_templates(template_key);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Policies for message_templates
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON message_templates;
CREATE POLICY "Enable all access for authenticated users" ON message_templates
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_message_templates_updated_at_trigger ON message_templates;
CREATE TRIGGER update_message_templates_updated_at_trigger
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Insert default templates
INSERT INTO message_templates (practice_id, name, template_key, channel, subject, body)
SELECT
  p.id,
  'Appointment Confirmation',
  'appointment_confirmation',
  'sms',
  NULL,
  'Hi {patient_name}, your appointment with {provider} is confirmed for {date} at {time}. Reply C to confirm or call (248) 555-DERM to reschedule.'
FROM practices p
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates mt WHERE mt.practice_id = p.id AND mt.template_key = 'appointment_confirmation'
);

INSERT INTO message_templates (practice_id, name, template_key, channel, subject, body)
SELECT
  p.id,
  '48 Hour Reminder',
  'reminder_48hr',
  'sms',
  NULL,
  'Reminder: You have an appointment at Novice Dermatology tomorrow at {time} with {provider}.'
FROM practices p
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates mt WHERE mt.practice_id = p.id AND mt.template_key = 'reminder_48hr'
);

INSERT INTO message_templates (practice_id, name, template_key, channel, subject, body)
SELECT
  p.id,
  '24 Hour Reminder',
  'reminder_24hr',
  'sms',
  NULL,
  'Your appointment is tomorrow at {time}. Please arrive 10 minutes early. Reply CONFIRM or call to reschedule.'
FROM practices p
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates mt WHERE mt.practice_id = p.id AND mt.template_key = 'reminder_24hr'
);

INSERT INTO message_templates (practice_id, name, template_key, channel, subject, body)
SELECT
  p.id,
  'Post-Visit Follow-up',
  'post_visit',
  'email',
  'Thank you for visiting Novice Dermatology',
  'Thank you for visiting Novice Dermatology. How was your experience? Please rate us 1-5 stars.'
FROM practices p
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates mt WHERE mt.practice_id = p.id AND mt.template_key = 'post_visit'
);
