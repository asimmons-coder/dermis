-- Create automated_messages table for tracking automated patient communications
CREATE TABLE IF NOT EXISTS automated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,

  -- Message details
  message_type VARCHAR(50) NOT NULL, -- 'appointment_confirmation', 'reminder_48hr', 'reminder_24hr', 'post_visit'
  channel VARCHAR(20) NOT NULL, -- 'sms', 'email'
  recipient VARCHAR(200) NOT NULL, -- phone number or email address
  subject VARCHAR(200), -- for email
  message_body TEXT NOT NULL,

  -- Scheduling and delivery
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'queued', 'sent', 'delivered', 'failed', 'demo'

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Response tracking (for SMS replies)
  response_received_at TIMESTAMP WITH TIME ZONE,
  response_body TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_automated_messages_practice_id ON automated_messages(practice_id);
CREATE INDEX IF NOT EXISTS idx_automated_messages_patient_id ON automated_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_automated_messages_encounter_id ON automated_messages(encounter_id);
CREATE INDEX IF NOT EXISTS idx_automated_messages_status ON automated_messages(status);
CREATE INDEX IF NOT EXISTS idx_automated_messages_scheduled_for ON automated_messages(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_automated_messages_sent_at ON automated_messages(sent_at DESC);

-- Enable RLS
ALTER TABLE automated_messages ENABLE ROW LEVEL SECURITY;

-- Policies for automated_messages
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON automated_messages;
CREATE POLICY "Enable all access for authenticated users" ON automated_messages
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automated_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_automated_messages_updated_at_trigger ON automated_messages;
CREATE TRIGGER update_automated_messages_updated_at_trigger
  BEFORE UPDATE ON automated_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_automated_messages_updated_at();
