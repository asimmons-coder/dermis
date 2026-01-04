import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/message-templates - Get all templates for a practice
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get('practiceId')

    if (!practiceId) {
      return NextResponse.json({ error: 'Practice ID required' }, { status: 400 })
    }

    const { data: templates, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('practice_id', practiceId)
      .order('template_key', { ascending: true })

    if (error) {
      console.error('Error fetching message templates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error: any) {
    console.error('Error in GET /api/message-templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/message-templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: template, error } = await supabase
      .from('message_templates')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating message template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Error in POST /api/message-templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
