import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { scheduleAppointmentMessages } from '@/lib/automation/scheduler'

export async function GET(request: NextRequest) {
  // Create fresh client for each request to avoid caching
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get('practiceId') || '00000000-0000-0000-0000-000000000001'
    const providerId = searchParams.get('providerId') // optional filter
    const dateParam = searchParams.get('date') // optional date parameter

    // Get date range - use provided date or default to today
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    console.log('[SCHEDULE] Fetching appointments for date:', targetDate.toISOString())
    console.log('[SCHEDULE] Date range:', targetDate.toISOString(), 'to', nextDay.toISOString())

    // Build query
    let query = supabase
      .from('encounters')
      .select(`
        id,
        encounter_type,
        chief_complaint,
        status,
        scheduled_at,
        completed_at,
        patients (
          id,
          first_name,
          last_name,
          mrn,
          date_of_birth
        ),
        providers (
          id,
          first_name,
          last_name,
          credentials
        )
      `)
      .eq('practice_id', practiceId)
      .gte('scheduled_at', targetDate.toISOString())
      .lt('scheduled_at', nextDay.toISOString())
      .order('scheduled_at', { ascending: true })

    // Apply provider filter if specified
    if (providerId && providerId !== 'all') {
      query = query.eq('provider_id', providerId)
    }

    const { data: encounters, error } = await query

    if (error) {
      console.error('Error fetching schedule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedEncounters = encounters?.map(e => {
      const patient = Array.isArray(e.patients) ? e.patients[0] : e.patients
      const provider = Array.isArray(e.providers) ? e.providers[0] : e.providers
      return {
        id: e.id,
        type: e.encounter_type,
        chiefComplaint: e.chief_complaint,
        status: e.status,
        scheduledAt: e.scheduled_at,
        completedAt: e.completed_at,
        patient: patient ? {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`,
          firstName: patient.first_name,
          lastName: patient.last_name,
          mrn: patient.mrn,
          dateOfBirth: patient.date_of_birth,
        } : null,
        provider: provider ? {
          id: provider.id,
          name: `Dr. ${provider.first_name} ${provider.last_name}`,
          fullName: `${provider.first_name} ${provider.last_name}, ${provider.credentials}`,
          firstName: provider.first_name,
          lastName: provider.last_name,
        } : null,
      }
    }) || []

    return NextResponse.json({ encounters: formattedEncounters })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

// POST - Create a new scheduled encounter/appointment
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const {
      practiceId,
      patientId,
      providerId,
      encounterType,
      chiefComplaint,
      scheduledAt
    } = body

    // Validate required fields
    if (!practiceId || !patientId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: practiceId, patientId, scheduledAt' },
        { status: 400 }
      )
    }

    // Create the encounter
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .insert({
        practice_id: practiceId,
        patient_id: patientId,
        provider_id: providerId || null,
        encounter_type: encounterType || 'office_visit',
        chief_complaint: chiefComplaint || '',
        status: 'scheduled',
        scheduled_at: scheduledAt
      })
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          phone_primary,
          email
        ),
        providers (
          id,
          first_name,
          last_name
        )
      `)
      .single()

    if (encounterError) {
      console.error('Error creating encounter:', encounterError)
      return NextResponse.json({ error: encounterError.message }, { status: 500 })
    }

    // Trigger automated appointment messages
    await scheduleAppointmentMessages({
      id: encounter.id,
      patient_id: encounter.patient_id,
      practice_id: encounter.practice_id,
      provider_id: encounter.provider_id,
      scheduled_at: encounter.scheduled_at,
      patient: encounter.patients,
      provider: encounter.providers
    })

    return NextResponse.json({
      success: true,
      encounter,
      message: 'Appointment created and automated messages scheduled'
    })
  } catch (error: any) {
    console.error('Error in POST /api/schedule:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
