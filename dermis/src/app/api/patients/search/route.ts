import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return NextResponse.json({ patients: [] })
    }

    const searchTerm = query.toLowerCase().trim()

    // Search patients by name, MRN, or DOB
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, mrn, date_of_birth')
      .eq('is_active', true)
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,mrn.ilike.%${searchTerm}%,date_of_birth.ilike.%${searchTerm}%`)
      .order('last_name', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedPatients = patients?.map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      mrn: p.mrn,
      dateOfBirth: p.date_of_birth,
    })) || []

    return NextResponse.json({ patients: formattedPatients })
  } catch (error) {
    console.error('Error searching patients:', error)
    return NextResponse.json({ error: 'Failed to search patients' }, { status: 500 })
  }
}
