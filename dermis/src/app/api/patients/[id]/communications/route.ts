import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Fetch patient's communications
    const { data: communications, error } = await supabase
      .from('patient_communications')
      .select('*')
      .eq('patient_id', patientId)
      .order('communication_date', { ascending: false })

    if (error) {
      console.error('Error fetching communications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ communications: communications || [] })
  } catch (error: any) {
    console.error('Error in GET /api/patients/[id]/communications:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id
    const body = await request.json()

    // Get patient's practice_id
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('practice_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // For now, we'll use a placeholder for logged_by
    // In production, this would come from the authenticated user
    const communication = {
      patient_id: patientId,
      practice_id: patient.practice_id,
      communication_date: new Date().toISOString(),
      communication_type: body.communication_type || 'Other',
      direction: body.direction || 'Outbound',
      subject: body.subject,
      notes: body.notes || null,
      follow_up_needed: body.follow_up_needed || false,
      follow_up_due_date: body.follow_up_due_date || null,
      follow_up_completed: false,
      logged_by_name: 'System User' // TODO: Get from authenticated user
    }

    const { data, error } = await supabase
      .from('patient_communications')
      .insert(communication)
      .select()
      .single()

    if (error) {
      console.error('Error adding communication:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, communication: data })
  } catch (error: any) {
    console.error('Error in POST /api/patients/[id]/communications:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
