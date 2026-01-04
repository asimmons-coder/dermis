import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/automation-settings - Get settings for a practice
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get('practiceId')

    if (!practiceId) {
      return NextResponse.json({ error: 'Practice ID required' }, { status: 400 })
    }

    const { data: settings, error } = await supabase
      .from('automation_settings')
      .select('*')
      .eq('practice_id', practiceId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching automation settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no settings exist, create default ones
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('automation_settings')
        .insert({
          practice_id: practiceId,
          demo_mode: true
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating automation settings:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ settings: newSettings })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Error in GET /api/automation-settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/automation-settings - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { practiceId, ...updateData } = body

    if (!practiceId) {
      return NextResponse.json({ error: 'Practice ID required' }, { status: 400 })
    }

    const { data: settings, error } = await supabase
      .from('automation_settings')
      .update(updateData)
      .eq('practice_id', practiceId)
      .select()
      .single()

    if (error) {
      console.error('Error updating automation settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Error in PATCH /api/automation-settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
