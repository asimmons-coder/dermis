import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const patientId = params.id

    // Fetch patient's recommended products with product details
    const { data: patientProducts, error } = await supabase
      .from('patient_products')
      .select(`
        id,
        frequency,
        time_of_day,
        notes,
        recommended_at,
        products (
          id,
          name,
          brand,
          category,
          type,
          usage_instructions,
          price,
          image_url
        )
      `)
      .eq('patient_id', patientId)
      .order('recommended_at', { ascending: false })

    if (error) {
      console.error('Error fetching patient products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    const formattedProducts = patientProducts?.map((pp: any) => ({
      id: pp.id,
      frequency: pp.frequency,
      time_of_day: pp.time_of_day,
      notes: pp.notes,
      recommended_at: pp.recommended_at,
      product: pp.products
    })) || []

    return NextResponse.json({ products: formattedProducts })
  } catch (error: any) {
    console.error('Error in GET /api/patients/[id]/products:', error)
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const patientId = params.id
    const body = await request.json()
    const { product_id, frequency, time_of_day, notes } = body

    // Add product to patient's regimen
    const { data, error } = await supabase
      .from('patient_products')
      .insert({
        patient_id: patientId,
        product_id,
        frequency,
        time_of_day: time_of_day || 'Both',
        notes,
        recommended_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding product to patient:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, patientProduct: data })
  } catch (error: any) {
    console.error('Error in POST /api/patients/[id]/products:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
