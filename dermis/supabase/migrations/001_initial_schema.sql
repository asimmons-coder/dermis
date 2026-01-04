-- Dermis EMR Database Schema
-- Multi-tenant dermatology EMR with AI-first architecture

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Practices (tenants)
CREATE TABLE practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT,
    fax TEXT,
    email TEXT,
    npi TEXT, -- National Provider Identifier
    tax_id TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (a practice can have multiple locations)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Providers (doctors, PAs, NPs)
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    credentials TEXT, -- MD, DO, PA-C, NP, etc.
    specialty TEXT DEFAULT 'Dermatology',
    npi TEXT,
    dea_number TEXT, -- For prescribing
    state_license TEXT,
    email TEXT,
    phone TEXT,
    signature_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff (non-provider users)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'ma', 'front_desk', 'biller', 'manager'
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PATIENT TABLES
-- ============================================

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    mrn TEXT, -- Medical Record Number (auto-generated per practice)
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    date_of_birth DATE NOT NULL,
    sex TEXT, -- 'M', 'F', 'O'
    gender_identity TEXT,
    pronouns TEXT,
    email TEXT,
    phone_primary TEXT,
    phone_secondary TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    preferred_contact TEXT DEFAULT 'phone', -- 'phone', 'email', 'text'
    preferred_pharmacy JSONB, -- {name, address, phone, fax, ncpdp_id}
    emergency_contact JSONB, -- {name, relationship, phone}
    
    -- Insurance (primary)
    insurance_primary JSONB, -- {carrier, plan, member_id, group_id, subscriber, relationship}
    insurance_secondary JSONB,
    
    -- Medical background
    allergies JSONB DEFAULT '[]', -- [{allergen, reaction, severity}]
    medications JSONB DEFAULT '[]', -- [{name, dose, frequency, prescriber}]
    medical_history JSONB DEFAULT '[]', -- [{condition, onset_date, status}]
    surgical_history JSONB DEFAULT '[]', -- [{procedure, date, notes}]
    family_history JSONB DEFAULT '[]', -- [{relationship, condition}]
    social_history JSONB DEFAULT '{}', -- {smoking, alcohol, occupation, etc.}
    
    -- Dermatology-specific
    skin_type TEXT, -- Fitzpatrick scale I-VI
    skin_cancer_history BOOLEAN DEFAULT FALSE,
    tanning_history TEXT,
    sun_exposure TEXT,
    
    -- Cosmetic
    cosmetic_interests JSONB DEFAULT '[]', -- ['botox', 'filler', 'laser', etc.]
    cosmetic_history JSONB DEFAULT '[]', -- Previous treatments
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_visit_date DATE,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient photos (for clinical and cosmetic tracking)
CREATE TABLE patient_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID, -- References encounters, added after encounters table
    storage_path TEXT NOT NULL,
    photo_type TEXT NOT NULL, -- 'clinical', 'cosmetic_before', 'cosmetic_after', 'pathology', 'dermoscopy'
    body_location TEXT, -- Standardized body location
    body_location_detail TEXT, -- Specific description
    description TEXT,
    ai_analysis JSONB, -- AI-generated lesion description
    tags JSONB DEFAULT '[]',
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    taken_by UUID REFERENCES providers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENCOUNTER/VISIT TABLES
-- ============================================

-- Encounters (visits)
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),
    location_id UUID REFERENCES locations(id),
    
    encounter_type TEXT NOT NULL, -- 'office_visit', 'telehealth', 'procedure', 'cosmetic_consult', 'follow_up'
    visit_reason TEXT,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ,
    roomed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'checked_in', 'roomed', 'in_progress', 'completed', 'cancelled', 'no_show'
    
    -- Clinical
    chief_complaint TEXT,
    vitals JSONB, -- {bp, pulse, temp, weight, height, bmi}
    
    -- Billing
    billing_status TEXT DEFAULT 'pending', -- 'pending', 'coded', 'submitted', 'paid', 'denied'
    icd10_codes JSONB DEFAULT '[]', -- [{code, description}]
    cpt_codes JSONB DEFAULT '[]', -- [{code, description, units, modifiers}]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for patient_photos
ALTER TABLE patient_photos ADD CONSTRAINT fk_patient_photos_encounter 
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL;

-- Clinical notes (SOAP format with AI)
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),
    
    -- Note type
    note_type TEXT DEFAULT 'progress', -- 'progress', 'procedure', 'consult', 'addendum'
    
    -- SOAP components
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    
    -- Quick input (provider's brief notes that AI expands)
    quick_input TEXT,
    
    -- AI-generated content
    ai_generated_note TEXT,
    ai_suggestions JSONB, -- {icd10: [], cpt: [], differentials: []}
    ai_model_version TEXT,
    
    -- Finalization
    is_draft BOOLEAN DEFAULT TRUE,
    signed_at TIMESTAMPTZ,
    signed_by UUID REFERENCES providers(id),
    
    -- Amendments
    parent_note_id UUID REFERENCES clinical_notes(id),
    amendment_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COSMETIC TABLES
-- ============================================

-- Cosmetic consults
CREATE TABLE cosmetic_consults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),
    
    -- Goals and concerns
    patient_goals TEXT,
    concerns JSONB DEFAULT '[]', -- [{area, concern, severity}]
    
    -- Treatment plan
    recommended_treatments JSONB DEFAULT '[]', -- [{treatment, area, notes, estimated_cost}]
    treatment_plan_notes TEXT,
    
    -- Consent
    consent_signed BOOLEAN DEFAULT FALSE,
    consent_signed_at TIMESTAMPTZ,
    consent_document_url TEXT,
    
    -- Follow-up
    follow_up_scheduled TIMESTAMPTZ,
    follow_up_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cosmetic treatments (individual treatments performed)
CREATE TABLE cosmetic_treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consult_id UUID REFERENCES cosmetic_consults(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES encounters(id),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),
    
    treatment_type TEXT NOT NULL, -- 'botox', 'filler', 'laser', 'chemical_peel', 'microneedling', etc.
    product_name TEXT, -- Specific product used
    
    -- Treatment details
    areas_treated JSONB DEFAULT '[]', -- [{area, units_or_amount, technique}]
    total_units DECIMAL, -- For injectables
    total_volume_ml DECIMAL, -- For fillers
    
    -- Settings (for device-based treatments)
    device_settings JSONB, -- {device, wavelength, fluence, pulse_width, etc.}
    
    -- Outcome
    patient_satisfaction INTEGER, -- 1-10
    provider_notes TEXT,
    complications TEXT,
    
    -- Before/after photo references
    before_photo_ids JSONB DEFAULT '[]',
    after_photo_ids JSONB DEFAULT '[]',
    
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PATHOLOGY TABLES
-- ============================================

-- Pathology orders
CREATE TABLE pathology_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    ordering_provider_id UUID REFERENCES providers(id),
    
    -- Specimen info
    specimen_type TEXT, -- 'biopsy', 'excision', 'shave', etc.
    body_site TEXT,
    body_site_detail TEXT,
    laterality TEXT, -- 'left', 'right', 'bilateral', 'midline'
    clinical_description TEXT,
    clinical_diagnosis TEXT,
    
    -- Lab routing
    lab_name TEXT,
    accession_number TEXT,
    sent_at TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'received', 'resulted'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pathology results
CREATE TABLE pathology_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES pathology_orders(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Results
    diagnosis TEXT,
    diagnosis_code TEXT, -- ICD-10
    microscopic_description TEXT,
    gross_description TEXT,
    special_stains JSONB,
    
    -- Margins (for excisions)
    margins_status TEXT, -- 'clear', 'positive', 'close'
    margin_details TEXT,
    
    -- Pathologist
    pathologist_name TEXT,
    pathologist_npi TEXT,
    
    -- Document
    report_url TEXT,
    
    -- Review
    reviewed_by UUID REFERENCES providers(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    
    resulted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id),
    user_id UUID REFERENCES auth.users(id),
    
    action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'sign', 'export'
    resource_type TEXT NOT NULL, -- 'patient', 'encounter', 'note', 'photo', etc.
    resource_id UUID,
    
    details JSONB, -- Additional context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_patients_practice ON patients(practice_id);
CREATE INDEX idx_patients_mrn ON patients(practice_id, mrn);
CREATE INDEX idx_patients_name ON patients(practice_id, last_name, first_name);
CREATE INDEX idx_patients_dob ON patients(practice_id, date_of_birth);

CREATE INDEX idx_encounters_practice ON encounters(practice_id);
CREATE INDEX idx_encounters_patient ON encounters(patient_id);
CREATE INDEX idx_encounters_provider ON encounters(provider_id);
CREATE INDEX idx_encounters_scheduled ON encounters(practice_id, scheduled_at);
CREATE INDEX idx_encounters_status ON encounters(practice_id, status);

CREATE INDEX idx_clinical_notes_encounter ON clinical_notes(encounter_id);
CREATE INDEX idx_patient_photos_patient ON patient_photos(patient_id);
CREATE INDEX idx_patient_photos_encounter ON patient_photos(encounter_id);

CREATE INDEX idx_pathology_orders_patient ON pathology_orders(patient_id);
CREATE INDEX idx_pathology_results_patient ON pathology_results(patient_id);

CREATE INDEX idx_audit_log_practice ON audit_log(practice_id, created_at);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosmetic_consults ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosmetic_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathology_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathology_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's practice_id
CREATE OR REPLACE FUNCTION get_user_practice_id()
RETURNS UUID AS $$
    SELECT practice_id FROM providers WHERE user_id = auth.uid()
    UNION
    SELECT practice_id FROM staff WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- RLS Policies (practice-scoped access)
CREATE POLICY "Users can view their practice" ON practices
    FOR SELECT USING (id = get_user_practice_id());

CREATE POLICY "Users can view practice locations" ON locations
    FOR SELECT USING (practice_id = get_user_practice_id());

CREATE POLICY "Users can view practice providers" ON providers
    FOR SELECT USING (practice_id = get_user_practice_id());

CREATE POLICY "Users can view practice staff" ON staff
    FOR SELECT USING (practice_id = get_user_practice_id());

CREATE POLICY "Users can access practice patients" ON patients
    FOR ALL USING (practice_id = get_user_practice_id());

CREATE POLICY "Users can access patient photos" ON patient_photos
    FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE practice_id = get_user_practice_id())
    );

CREATE POLICY "Users can access practice encounters" ON encounters
    FOR ALL USING (practice_id = get_user_practice_id());

CREATE POLICY "Users can access clinical notes" ON clinical_notes
    FOR ALL USING (
        encounter_id IN (SELECT id FROM encounters WHERE practice_id = get_user_practice_id())
    );

CREATE POLICY "Users can access cosmetic consults" ON cosmetic_consults
    FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE practice_id = get_user_practice_id())
    );

CREATE POLICY "Users can access cosmetic treatments" ON cosmetic_treatments
    FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE practice_id = get_user_practice_id())
    );

CREATE POLICY "Users can access pathology orders" ON pathology_orders
    FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE practice_id = get_user_practice_id())
    );

CREATE POLICY "Users can access pathology results" ON pathology_results
    FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE practice_id = get_user_practice_id())
    );

CREATE POLICY "Users can view audit log" ON audit_log
    FOR SELECT USING (practice_id = get_user_practice_id());

CREATE POLICY "System can insert audit log" ON audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- SEED DATA: Novice Group Dermatology
-- ============================================

INSERT INTO practices (id, name, slug, city, state, phone, email) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Novice Group Dermatology',
    'novice-group',
    'Bloomfield',
    'MI',
    '(248) 555-DERM',
    'info@novicegroup.com'
);

INSERT INTO locations (practice_id, name, city, state, is_primary) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Bloomfield Hills Office',
    'Bloomfield',
    'MI',
    true
);
