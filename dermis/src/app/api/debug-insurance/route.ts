import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Query Maria Santos directly
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, insurance_primary, insurance_secondary')
      .eq('id', '7824ccc8-9139-41dd-b859-8cc47d16d16b')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      raw_data: data,
      insurance_primary_type: typeof data.insurance_primary,
      insurance_primary_value: data.insurance_primary,
      insurance_primary_json: JSON.stringify(data.insurance_primary)
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
