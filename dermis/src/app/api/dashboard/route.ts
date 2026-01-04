import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get('practiceId') || '00000000-0000-0000-0000-000000000001'
    const providerId = searchParams.get('providerId')

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log('[DASHBOARD] Fetching appointments for date range:', today.toISOString(), 'to', tomorrow.toISOString())

    // Fetch today's appointments
    let appointmentsQuery = supabase
      .from('encounters')
      .select(`
        id,
        encounter_type,
        chief_complaint,
        status,
        scheduled_at,
        patients (
          id,
          first_name,
          last_name
        ),
        providers (
          id,
          first_name,
          last_name
        )
      `)
      .eq('practice_id', practiceId)
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10)

    if (providerId) {
      appointmentsQuery = appointmentsQuery.eq('provider_id', providerId)
    }

    const { data: appointments } = await appointmentsQuery

    console.log('[DASHBOARD] Found', appointments?.length || 0, 'appointments')

    // Fetch unsigned notes
    let unsignedQuery = supabase
      .from('clinical_notes')
      .select(`
        id,
        created_at,
        encounter_id,
        encounters (
          id,
          chief_complaint,
          patient_id,
          patients (
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq('is_draft', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (providerId) {
      unsignedQuery = unsignedQuery.eq('provider_id', providerId)
    }

    const { data: unsignedNotes } = await unsignedQuery

    // Fetch recent patients (last 7 days of activity)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    let recentPatientsQuery = supabase
      .from('encounters')
      .select(`
        patient_id,
        completed_at,
        patients (
          id,
          first_name,
          last_name,
          mrn
        )
      `)
      .eq('practice_id', practiceId)
      .eq('status', 'completed')
      .gte('completed_at', weekAgo.toISOString())
      .order('completed_at', { ascending: false })

    if (providerId) {
      recentPatientsQuery = recentPatientsQuery.eq('provider_id', providerId)
    }

    const { data: recentEncounters } = await recentPatientsQuery

    // Deduplicate patients and take most recent 5
    const uniquePatients = new Map()
    recentEncounters?.forEach(e => {
      if (e.patients && !uniquePatients.has(e.patient_id)) {
        const patient = Array.isArray(e.patients) ? e.patients[0] : e.patients
        if (patient) {
          uniquePatients.set(e.patient_id, {
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            mrn: patient.mrn,
            lastVisit: e.completed_at
          })
        }
      }
    })
    const recentPatients = Array.from(uniquePatients.values()).slice(0, 5)

    // Format response
    const formattedAppointments = appointments?.map(a => {
      const patient = Array.isArray(a.patients) ? a.patients[0] : a.patients
      const provider = Array.isArray(a.providers) ? a.providers[0] : a.providers
      return {
        id: a.id,
        type: a.encounter_type,
        chiefComplaint: a.chief_complaint,
        status: a.status,
        scheduledAt: a.scheduled_at,
        patient: patient ? {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`,
        } : null,
        provider: provider ? {
          id: provider.id,
          name: `Dr. ${provider.first_name} ${provider.last_name}`,
          firstName: provider.first_name,
        } : null,
      }
    }) || []

    const formattedUnsigned = unsignedNotes?.map(n => {
      const encounter = Array.isArray(n.encounters) ? n.encounters[0] : n.encounters
      const patient = encounter?.patients ? (Array.isArray(encounter.patients) ? encounter.patients[0] : encounter.patients) : null
      return {
        id: n.id,
        encounterId: n.encounter_id,
        createdAt: n.created_at,
        chiefComplaint: encounter?.chief_complaint || 'No chief complaint',
        patient: patient ? {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`,
        } : null,
      }
    }) || []

    return NextResponse.json({
      appointments: formattedAppointments,
      unsignedNotes: formattedUnsigned,
      recentPatients,
      stats: {
        todayAppointments: formattedAppointments.length,
        unsignedCount: formattedUnsigned.length,
        recentPatientsCount: recentPatients.length,
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
