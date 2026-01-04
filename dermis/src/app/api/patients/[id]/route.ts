import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create fresh client for each request to avoid caching
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const patientId = params.id

    // Fetch patient details
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*, insurance_primary, insurance_secondary')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      console.error('Patient query error:', patientError)
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Try to fetch preferred provider if ID exists
    let preferredProvider = null
    if (patient.preferred_provider_id) {
      const { data: provider } = await supabase
        .from('providers')
        .select('id, first_name, last_name, credentials')
        .eq('id', patient.preferred_provider_id)
        .single()
      preferredProvider = provider
    }

    // Fetch encounters with clinical notes
    const { data: encounters, error: encountersError } = await supabase
      .from('encounters')
      .select(`
        *,
        clinical_notes (*),
        providers (
          id,
          first_name,
          last_name,
          credentials
        )
      `)
      .eq('patient_id', patientId)
      .order('completed_at', { ascending: false })

    if (encountersError) {
      console.error('Encounters error:', encountersError)
      return NextResponse.json({ error: encountersError.message }, { status: 500 })
    }

    // Format the data
    const patientData = {
      id: patient.id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      middleName: patient.middle_name,
      mrn: patient.mrn,
      dateOfBirth: patient.date_of_birth,
      sex: patient.sex,
      genderIdentity: patient.gender_identity,
      pronouns: patient.pronouns,
      age: calculateAge(patient.date_of_birth),

      // Contact info
      email: patient.email,
      phone: patient.phone_primary,
      phoneSecondary: patient.phone_secondary,
      preferredContact: patient.preferred_contact,
      address: {
        line1: patient.address_line1,
        line2: patient.address_line2,
        city: patient.city,
        state: patient.state,
        zip: patient.zip,
      },

      // Insurance
      insurancePrimary: patient.insurance_primary,
      insuranceSecondary: patient.insurance_secondary,

      // Emergency contact
      emergencyContact: patient.emergency_contact,

      // Medical info
      allergies: patient.allergies || [],
      medications: patient.medications || [],
      medicalHistory: patient.medical_history || [],
      surgicalHistory: patient.surgical_history || [],
      familyHistory: patient.family_history || [],
      skinType: patient.skin_type,
      skinCancerHistory: patient.skin_cancer_history,
      sunExposure: patient.sun_exposure,
      tanningHistory: patient.tanning_history,
      cosmeticInterests: patient.cosmetic_interests || [],

      // Preferences
      preferredProviderId: patient.preferred_provider_id,
      preferredProvider: preferredProvider ? {
        id: preferredProvider.id,
        name: `Dr. ${preferredProvider.first_name} ${preferredProvider.last_name}`,
        credentials: preferredProvider.credentials
      } : null,
      preferredPharmacy: patient.preferred_pharmacy,

      // Status
      isActive: patient.is_active,
      notes: patient.notes,

      // Encounters
      encounters: encounters?.map(e => ({
        id: e.id,
        date: e.completed_at || e.scheduled_at,
        type: e.encounter_type,
        chiefComplaint: e.chief_complaint,
        status: e.status,
        icd10Codes: e.icd10_codes || [],
        cptCodes: e.cpt_codes || [],
        provider: e.providers ? {
          id: e.providers.id,
          name: `Dr. ${e.providers.first_name} ${e.providers.last_name}`,
          fullName: `${e.providers.first_name} ${e.providers.last_name}, ${e.providers.credentials}`,
        } : null,
        notes: e.clinical_notes?.map((n: any) => ({
          id: n.id,
          type: n.note_type,
          subjective: n.subjective,
          objective: n.objective,
          assessment: n.assessment,
          plan: n.plan,
          quickInput: n.quick_input,
          isDraft: n.is_draft,
          signedAt: n.signed_at,
          createdAt: n.created_at,
        })) || [],
      })) || [],
    }

    return NextResponse.json({ patient: patientData })
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create fresh client for each request to avoid caching
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const patientId = params.id
    const data = await request.json()

    // Prepare update data
    const updateData = {
      first_name: data.firstName,
      last_name: data.lastName,
      middle_name: data.middleName || null,
      date_of_birth: data.dateOfBirth,
      sex: data.sex,
      gender_identity: data.genderIdentity || null,
      pronouns: data.pronouns || null,
      email: data.email || null,
      phone_primary: data.phonePrimary,
      phone_secondary: data.phoneSecondary || null,
      address_line1: data.addressLine1 || null,
      address_line2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      preferred_contact: data.preferredContact || 'phone',
      preferred_pharmacy: data.preferredPharmacy && data.preferredPharmacy.name ? data.preferredPharmacy : null,
      preferred_provider_id: data.preferredProviderId || null,
      emergency_contact: data.emergencyContact && data.emergencyContact.name ? data.emergencyContact : null,
      insurance_primary: data.insurancePrimary && data.insurancePrimary.carrier ? data.insurancePrimary : null,
      insurance_secondary: data.insuranceSecondary && data.insuranceSecondary.carrier ? data.insuranceSecondary : null,
      allergies: data.allergies || [],
      medications: data.medications || [],
      medical_history: data.medicalHistory || [],
      surgical_history: data.surgicalHistory || [],
      family_history: data.familyHistory || [],
      skin_type: data.skinType || null,
      skin_cancer_history: data.skinCancerHistory || false,
      sun_exposure: data.sunExposure || null,
      tanning_history: data.tanningHistory || null,
      cosmetic_interests: data.cosmeticInterests || [],
      is_active: data.isActive !== undefined ? data.isActive : true,
      notes: data.notes || null,
      updated_at: new Date().toISOString()
    }

    // Update patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId)
      .select()
      .single()

    if (patientError) {
      console.error('Error updating patient:', patientError)
      return NextResponse.json({ error: patientError.message }, { status: 500 })
    }

    return NextResponse.json({
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        name: `${patient.first_name} ${patient.last_name}`
      }
    })
  } catch (error) {
    console.error('Error in PUT /api/patients/[id]:', error)
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
  }
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
