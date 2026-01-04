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
    const { searchParams } = new URL(request.url)
    const todayOnly = searchParams.get('today') === 'true'

    let query = supabase
      .from('encounters')
      .select(`
        id,
        scheduled_at,
        encounter_type,
        chief_complaint,
        status,
        copay,
        providers (
          id,
          first_name,
          last_name
        )
      `)
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: true })

    if (todayOnly) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      query = query
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
    }

    const { data: encounters, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    const appointments = encounters?.map(e => {
      const provider = Array.isArray(e.providers) ? e.providers[0] : e.providers
      return {
        id: e.id,
        scheduledAt: e.scheduled_at,
        type: e.encounter_type,
        chiefComplaint: e.chief_complaint,
        status: e.status,
        copay: e.copay,
        provider: provider ? {
          id: provider.id,
          name: `Dr. ${provider.first_name} ${provider.last_name}`
        } : null
      }
    }) || []

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Error in appointments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
