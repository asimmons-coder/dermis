// Database types for Dermis EMR

export interface Practice {
  id: string;
  name: string;
  slug: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  fax?: string;
  email?: string;
  npi?: string;
  tax_id?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  practice_id: string;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  practice_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  credentials?: string;
  specialty: string;
  npi?: string;
  dea_number?: string;
  state_license?: string;
  email?: string;
  phone?: string;
  signature_url?: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  practice_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'ma' | 'front_desk' | 'biller' | 'manager';
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Allergy {
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface Medication {
  name: string;
  dose?: string;
  frequency?: string;
  prescriber?: string;
}

export interface MedicalCondition {
  condition: string;
  onset_date?: string;
  status?: 'active' | 'resolved' | 'chronic';
}

export interface InsuranceInfo {
  carrier: string;
  plan?: string;
  member_id: string;
  group_id?: string;
  subscriber?: string;
  relationship?: 'self' | 'spouse' | 'child' | 'other';
}

export interface Patient {
  id: string;
  practice_id: string;
  mrn?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  sex?: 'M' | 'F' | 'O';
  gender_identity?: string;
  pronouns?: string;
  email?: string;
  phone_primary?: string;
  phone_secondary?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferred_contact: 'phone' | 'email' | 'text';
  preferred_pharmacy?: Record<string, unknown>;
  emergency_contact?: Record<string, unknown>;
  insurance_primary?: InsuranceInfo;
  insurance_secondary?: InsuranceInfo;
  allergies: Allergy[];
  medications: Medication[];
  medical_history: MedicalCondition[];
  surgical_history: Array<{ procedure: string; date?: string; notes?: string }>;
  family_history: Array<{ relationship: string; condition: string }>;
  social_history: Record<string, unknown>;
  skin_type?: string;
  skin_cancer_history: boolean;
  tanning_history?: string;
  sun_exposure?: string;
  cosmetic_interests: string[];
  cosmetic_history: Array<Record<string, unknown>>;
  is_active: boolean;
  last_visit_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientPhoto {
  id: string;
  patient_id: string;
  encounter_id?: string;
  storage_path: string;
  photo_type: 'clinical' | 'cosmetic_before' | 'cosmetic_after' | 'pathology' | 'dermoscopy';
  body_location?: string;
  body_location_detail?: string;
  description?: string;
  ai_analysis?: Record<string, unknown>;
  tags: string[];
  taken_at: string;
  taken_by?: string;
  created_at: string;
}

export type EncounterStatus = 'scheduled' | 'checked_in' | 'roomed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type EncounterType = 'office_visit' | 'telehealth' | 'procedure' | 'cosmetic_consult' | 'follow_up';

export interface Vitals {
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse?: number;
  temp?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface DiagnosisCode {
  code: string;
  description: string;
}

export interface ProcedureCode {
  code: string;
  description: string;
  units?: number;
  modifiers?: string[];
}

export interface Encounter {
  id: string;
  practice_id: string;
  patient_id: string;
  provider_id?: string;
  location_id?: string;
  encounter_type: EncounterType;
  visit_reason?: string;
  scheduled_at?: string;
  checked_in_at?: string;
  roomed_at?: string;
  started_at?: string;
  completed_at?: string;
  status: EncounterStatus;
  chief_complaint?: string;
  vitals?: Vitals;
  billing_status: 'pending' | 'coded' | 'submitted' | 'paid' | 'denied';
  icd10_codes: DiagnosisCode[];
  cpt_codes: ProcedureCode[];
  created_at: string;
  updated_at: string;
  // Joined fields
  patient?: Patient;
  provider?: Provider;
}

export interface AISuggestions {
  icd10: DiagnosisCode[];
  cpt: ProcedureCode[];
  differentials?: string[];
}

export interface ClinicalNote {
  id: string;
  encounter_id: string;
  provider_id?: string;
  note_type: 'progress' | 'procedure' | 'consult' | 'addendum';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  quick_input?: string;
  ai_generated_note?: string;
  ai_suggestions?: AISuggestions;
  ai_model_version?: string;
  is_draft: boolean;
  signed_at?: string;
  signed_by?: string;
  parent_note_id?: string;
  amendment_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  provider?: Provider;
}

export interface CosmeticConcern {
  area: string;
  concern: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface TreatmentRecommendation {
  treatment: string;
  area: string;
  notes?: string;
  estimated_cost?: number;
}

export interface CosmeticConsult {
  id: string;
  encounter_id: string;
  patient_id: string;
  provider_id?: string;
  patient_goals?: string;
  concerns: CosmeticConcern[];
  recommended_treatments: TreatmentRecommendation[];
  treatment_plan_notes?: string;
  consent_signed: boolean;
  consent_signed_at?: string;
  consent_document_url?: string;
  follow_up_scheduled?: string;
  follow_up_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentArea {
  area: string;
  units_or_amount?: number;
  technique?: string;
}

export interface DeviceSettings {
  device?: string;
  wavelength?: string;
  fluence?: string;
  pulse_width?: string;
  [key: string]: unknown;
}

export interface CosmeticTreatment {
  id: string;
  consult_id?: string;
  encounter_id?: string;
  patient_id: string;
  provider_id?: string;
  treatment_type: string;
  product_name?: string;
  areas_treated: TreatmentArea[];
  total_units?: number;
  total_volume_ml?: number;
  device_settings?: DeviceSettings;
  patient_satisfaction?: number;
  provider_notes?: string;
  complications?: string;
  before_photo_ids: string[];
  after_photo_ids: string[];
  performed_at: string;
  created_at: string;
}

export interface PathologyOrder {
  id: string;
  encounter_id?: string;
  patient_id: string;
  ordering_provider_id?: string;
  specimen_type?: string;
  body_site?: string;
  body_site_detail?: string;
  laterality?: 'left' | 'right' | 'bilateral' | 'midline';
  clinical_description?: string;
  clinical_diagnosis?: string;
  lab_name?: string;
  accession_number?: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'received' | 'resulted';
  created_at: string;
  updated_at: string;
}

export interface PathologyResult {
  id: string;
  order_id: string;
  patient_id: string;
  diagnosis?: string;
  diagnosis_code?: string;
  microscopic_description?: string;
  gross_description?: string;
  special_stains?: Record<string, unknown>;
  margins_status?: 'clear' | 'positive' | 'close';
  margin_details?: string;
  pathologist_name?: string;
  pathologist_npi?: string;
  report_url?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  follow_up_required: boolean;
  follow_up_notes?: string;
  resulted_at?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  practice_id?: string;
  user_id?: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'sign' | 'export';
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
