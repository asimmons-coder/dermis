import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/automated-messages - Get all automated messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get('practiceId')
    const patientId = searchParams.get('patientId')

    let query = supabase
      .from('automated_messages')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    if (practiceId) {
      query = query.eq('practice_id', practiceId)
    }

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching automated messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error: any) {
    console.error('Error in GET /api/automated-messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/automated-messages - Create/queue a new automated message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if demo mode is enabled for the practice
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('demo_mode')
      .eq('practice_id', body.practice_id)
      .single()

    const demoMode = settings?.demo_mode ?? true

    const messageData = {
      ...body,
      status: demoMode ? 'demo' : 'pending',
      sent_at: demoMode ? new Date().toISOString() : null
    }

    const { data: message, error } = await supabase
      .from('automated_messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Error creating automated message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message,
      demoMode,
      info: demoMode ? 'Message queued in demo mode - not actually sent' : 'Message queued for delivery'
    })
  } catch (error: any) {
    console.error('Error in POST /api/automated-messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
