import { NextResponse } from 'next/server'

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Use raw fetch instead of Supabase client to avoid caching issues
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/patients?select=id,first_name,last_name,mrn,date_of_birth,last_visit_date,is_active&order=last_name.asc`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      console.error('Fetch error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    const patients = await response.json()

    // Also fetch encounters for each patient using raw fetch
    const formattedPatients = await Promise.all(
      (patients || []).map(async (p: any) => {
        // Get last completed encounter
        const lastEncRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/encounters?patient_id=eq.${p.id}&status=eq.completed&select=completed_at,providers(id,first_name,last_name,credentials)&order=completed_at.desc&limit=1`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
            },
            cache: 'no-store',
          }
        )
        const lastEncounters = await lastEncRes.json()
        const lastEncounter = lastEncounters?.[0]

        // Get next scheduled encounter
        const nextEncRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/encounters?patient_id=eq.${p.id}&status=in.(scheduled,checked_in)&scheduled_at=gte.${new Date().toISOString()}&select=scheduled_at,providers(id,first_name,last_name,credentials)&order=scheduled_at.asc&limit=1`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
            },
            cache: 'no-store',
          }
        )
        const nextEncounters = await nextEncRes.json()
        const nextEncounter = nextEncounters?.[0]

        const lastProvider = lastEncounter?.providers ? (Array.isArray(lastEncounter.providers) ? lastEncounter.providers[0] : lastEncounter.providers) : null
        const nextProvider = nextEncounter?.providers ? (Array.isArray(nextEncounter.providers) ? nextEncounter.providers[0] : nextEncounter.providers) : null

        return {
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          mrn: p.mrn,
          dateOfBirth: p.date_of_birth,
          isActive: p.is_active,
          lastVisit: lastEncounter?.completed_at || p.last_visit_date,
          lastProvider: lastProvider ? {
            id: lastProvider.id,
            name: `Dr. ${lastProvider.first_name} ${lastProvider.last_name}`,
            firstName: lastProvider.first_name,
          } : null,
          nextAppointment: nextEncounter?.scheduled_at || null,
          nextProvider: nextProvider ? {
            id: nextProvider.id,
            name: `Dr. ${nextProvider.first_name} ${nextProvider.last_name}`,
            firstName: nextProvider.first_name,
          } : null,
        }
      })
    )

    return NextResponse.json({ patients: formattedPatients })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
}
