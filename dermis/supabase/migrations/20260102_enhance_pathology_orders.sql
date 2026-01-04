-- Add enhanced pathology tracking fields

ALTER TABLE pathology_orders
ADD COLUMN IF NOT EXISTS microscopic_description TEXT,
ADD COLUMN IF NOT EXISTS pathologist_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS recommendations TEXT,
ADD COLUMN IF NOT EXISTS path_report_url TEXT,
ADD COLUMN IF NOT EXISTS patient_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS notification_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS follow_up_appointment_id UUID REFERENCES encounters(id) ON DELETE SET NULL;

-- Create index for follow-up appointments
CREATE INDEX IF NOT EXISTS idx_pathology_orders_follow_up ON pathology_orders(follow_up_appointment_id);

-- Add comment explaining the notification methods
COMMENT ON COLUMN pathology_orders.notification_method IS 'Phone, Portal, Letter, or In-Person';
