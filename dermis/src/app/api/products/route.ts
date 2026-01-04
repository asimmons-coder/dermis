import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    query = query.order('category').order('name')

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        brand: data.brand,
        category: data.category,
        type: data.type,
        usage_instructions: data.usageInstructions,
        price: data.price,
        image_url: data.imageUrl,
        is_active: data.isActive !== undefined ? data.isActive : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error in products POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
