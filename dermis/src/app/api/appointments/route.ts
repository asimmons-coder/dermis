import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRACTICE_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Create encounter/appointment
    const encounterData = {
      practice_id: PRACTICE_ID,
      patient_id: data.patientId,
      provider_id: data.providerId,
      encounter_type: data.encounterType || 'office_visit',
      visit_reason: data.visitReason || null,
      scheduled_at: data.scheduledAt,
      status: data.status || 'scheduled',
      chief_complaint: data.visitReason || null
    }

    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .insert(encounterData)
      .select()
      .single()

    if (encounterError) {
      console.error('Error creating appointment:', encounterError)
      return NextResponse.json({ error: encounterError.message }, { status: 500 })
    }

    return NextResponse.json({
      appointment: {
        id: encounter.id,
        patientId: encounter.patient_id,
        providerId: encounter.provider_id,
        scheduledAt: encounter.scheduled_at,
        status: encounter.status
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/appointments:', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
