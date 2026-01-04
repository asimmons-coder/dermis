import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get('practiceId')

    if (!practiceId) {
      return NextResponse.json({ error: 'Practice ID required' }, { status: 400 })
    }

    const { data: providers, error } = await supabase
      .from('providers')
      .select('id, first_name, last_name, credentials, specialty')
      .eq('practice_id', practiceId)
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error fetching providers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedProviders = providers?.map(p => ({
      id: p.id,
      name: `Dr. ${p.first_name} ${p.last_name}`,
      fullName: `${p.first_name} ${p.last_name}, ${p.credentials}`,
      firstName: p.first_name,
      lastName: p.last_name,
      credentials: p.credentials,
      specialty: p.specialty,
    })) || []

    return NextResponse.json({ providers: formattedProviders })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}
