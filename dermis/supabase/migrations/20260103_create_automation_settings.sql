-- Create automation_settings table for practice-level automation preferences
CREATE TABLE IF NOT EXISTS automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE UNIQUE,

  -- Appointment reminders
  reminder_48hr_enabled BOOLEAN DEFAULT true,
  reminder_48hr_channel VARCHAR(20) DEFAULT 'sms', -- 'sms', 'email', 'both', 'off'

  reminder_24hr_enabled BOOLEAN DEFAULT true,
  reminder_24hr_channel VARCHAR(20) DEFAULT 'sms', -- 'sms', 'email', 'both', 'off'

  -- Appointment confirmation
  confirmation_enabled BOOLEAN DEFAULT true,
  confirmation_channel VARCHAR(20) DEFAULT 'sms', -- 'sms', 'email', 'both', 'off'

  -- Post-visit follow-up
  post_visit_enabled BOOLEAN DEFAULT false,
  post_visit_channel VARCHAR(20) DEFAULT 'email', -- 'email', 'off'
  post_visit_delay_hours INTEGER DEFAULT 24, -- Send X hours after visit

  -- Demo mode
  demo_mode BOOLEAN DEFAULT true, -- Don't send real messages in demo mode

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_automation_settings_practice_id ON automation_settings(practice_id);

-- Enable RLS
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

-- Policies for automation_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON automation_settings;
CREATE POLICY "Enable all access for authenticated users" ON automation_settings
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_automation_settings_updated_at_trigger ON automation_settings;
CREATE TRIGGER update_automation_settings_updated_at_trigger
  BEFORE UPDATE ON automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_settings_updated_at();

-- Insert default settings for existing practices
INSERT INTO automation_settings (practice_id, demo_mode)
SELECT id, true
FROM practices
WHERE NOT EXISTS (
  SELECT 1 FROM automation_settings WHERE practice_id = practices.id
);
