import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRACTICE_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, mrn, date_of_birth')
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format patient data
    const formattedPatients = patients?.map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      mrn: p.mrn,
      dateOfBirth: p.date_of_birth
    })) || []

    return NextResponse.json({ patients: formattedPatients })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Generate MRN using the database function
    const { data: mrnData, error: mrnError } = await supabase
      .rpc('generate_mrn', { practice_uuid: PRACTICE_ID })

    if (mrnError || !mrnData) {
      console.error('Error generating MRN:', mrnError)
      return NextResponse.json({ error: 'Failed to generate MRN' }, { status: 500 })
    }

    const mrn = mrnData

    // Prepare patient data
    const patientData = {
      practice_id: PRACTICE_ID,
      mrn,
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
      notes: data.notes || null
    }

    // Insert patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single()

    if (patientError) {
      console.error('Error creating patient:', patientError)
      return NextResponse.json({ error: patientError.message }, { status: 500 })
    }

    return NextResponse.json({
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        name: `${patient.first_name} ${patient.last_name}`
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/patients:', error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}
