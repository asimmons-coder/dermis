import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const encounterId = params.id

    // Fetch encounter with patient data
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          date_of_birth,
          sex,
          allergies
        ),
        providers (
          id,
          first_name,
          last_name,
          credentials
        ),
        clinical_notes (
          id,
          note_type,
          subjective,
          objective,
          assessment,
          plan,
          quick_input,
          ai_suggestions,
          is_draft,
          signed_at,
          created_at
        )
      `)
      .eq('id', encounterId)
      .single()

    if (encounterError || !encounter) {
      console.error('Encounter query error:', encounterError)
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
    }

    // Calculate age
    const calculateAge = (dob: string): number => {
      const birthDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }

    const encounterData = {
      id: encounter.id,
      chiefComplaint: encounter.chief_complaint,
      encounterType: encounter.encounter_type,
      status: encounter.status,
      scheduledAt: encounter.scheduled_at,
      startedAt: encounter.started_at,
      icd10Codes: encounter.icd10_codes || [],
      cptCodes: encounter.cpt_codes || [],
      patient: (() => {
        const patient = Array.isArray(encounter.patients) ? encounter.patients[0] : encounter.patients
        return patient ? {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`,
          dateOfBirth: patient.date_of_birth,
          age: calculateAge(patient.date_of_birth),
          sex: patient.sex || 'U',
          allergies: patient.allergies || []
        } : null
      })(),
      provider: (() => {
        const provider = Array.isArray(encounter.providers) ? encounter.providers[0] : encounter.providers
        return provider ? {
          id: provider.id,
          name: `Dr. ${provider.first_name} ${provider.last_name}`,
          fullName: `${provider.first_name} ${provider.last_name}, ${provider.credentials}`
        } : null
      })(),
      clinicalNotes: encounter.clinical_notes || []
    }

    return NextResponse.json({ encounter: encounterData })
  } catch (error) {
    console.error('Error fetching encounter:', error)
    return NextResponse.json({ error: 'Failed to fetch encounter' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const encounterId = params.id
    const data = await request.json()

    const updateData: any = {}

    if (data.status) {
      updateData.status = data.status

      // Set timestamps based on status
      if (data.status === 'checked_in' && !updateData.checked_in_at) {
        updateData.checked_in_at = data.checkedInAt || new Date().toISOString()
      } else if (data.status === 'roomed') {
        updateData.roomed_at = new Date().toISOString()
      } else if (data.status === 'in_progress') {
        updateData.started_at = data.started_at || new Date().toISOString()
      } else if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
    }

    // Check-in specific fields
    if (data.copay !== undefined) {
      updateData.copay = data.copay
    }
    if (data.insuranceCardPhoto) {
      updateData.insurance_card_photo = data.insuranceCardPhoto
    }
    if (data.idPhoto) {
      updateData.id_photo = data.idPhoto
    }
    if (data.signature) {
      updateData.signature = data.signature
    }

    const { data: encounter, error } = await supabase
      .from('encounters')
      .update(updateData)
      .eq('id', encounterId)
      .select()
      .single()

    if (error) {
      console.error('Error updating encounter:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      encounter: {
        id: encounter.id,
        status: encounter.status
      }
    })
  } catch (error) {
    console.error('Error in PATCH /api/encounters/[id]:', error)
    return NextResponse.json({ error: 'Failed to update encounter' }, { status: 500 })
  }
}
