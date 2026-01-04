# Pathology Tracking Setup

## Quick Setup

### 1. Create Database Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Create pathology orders table
CREATE TABLE IF NOT EXISTS pathology_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

  -- Order details
  specimen_type VARCHAR(100) NOT NULL,
  body_site VARCHAR(200) NOT NULL,
  clinical_description TEXT,
  lab_name VARCHAR(200),

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  date_sent TIMESTAMP,
  date_received TIMESTAMP,
  date_reviewed TIMESTAMP,

  -- Results
  diagnosis TEXT,
  margins TEXT,
  path_report TEXT,
  follow_up_notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  reviewed_by UUID REFERENCES providers(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pathology_orders_patient ON pathology_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_pathology_orders_status ON pathology_orders(status);
CREATE INDEX IF NOT EXISTS idx_pathology_orders_provider ON pathology_orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_pathology_orders_date_sent ON pathology_orders(date_sent);

-- Enable RLS
ALTER TABLE pathology_orders ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all access for authenticated users" ON pathology_orders
  FOR ALL USING (true);
```

### 2. Seed Sample Data (Optional)
```bash
node scripts/seed-pathology-orders.js
```

## Features

### Pathology Inbox (`/inbox/pathology`)
- **List View**: All biopsy results in one place
- **Status Filtering**: Pending, Received, Needs Action, Reviewed
- **Days Pending**: Automatic calculation, highlights >7 days
- **Search**: By patient, body site, or specimen type

### Review Modal
- Click any result to review
- Shows diagnosis, margins, full pathology report
- Action buttons:
  - "Reviewed - Normal"
  - "Reviewed - Needs Follow-up"
  - "Call Patient"
- Add follow-up notes
- Link to patient chart

### Navigation Badge
- Shows count of results needing review
- Visible on all pages
- Updates in real-time

### Status Workflow
1. **Pending**: Biopsy sent to lab
2. **Received**: Results received from lab
3. **Needs Action**: Requires follow-up (positive margins, abnormal findings)
4. **Reviewed**: Provider has reviewed and documented

## API Endpoints

### GET `/api/pathology-orders`
Returns all pathology orders with patient and provider info

### GET `/api/pathology-orders/[id]`
Returns single pathology order details

### POST `/api/pathology-orders`
Create new pathology order
```json
{
  "patientId": "uuid",
  "encounterId": "uuid",
  "providerId": "uuid",
  "specimenType": "Shave biopsy",
  "bodySite": "Left forearm",
  "clinicalDescription": "Suspicious lesion",
  "labName": "DermPath Diagnostics",
  "dateSent": "2025-01-02T10:00:00Z"
}
```

### PATCH `/api/pathology-orders/[id]`
Update order status and results
```json
{
  "status": "reviewed",
  "diagnosis": "Basal cell carcinoma",
  "margins": "Clear",
  "pathReport": "Full report text",
  "followUpNotes": "Patient notified"
}
```

## Future Enhancements
- Email notifications for new results
- Auto-import from lab systems (HL7 integration)
- Print pathology requisition forms
- Track specimen tracking numbers
- Bulk status updates
