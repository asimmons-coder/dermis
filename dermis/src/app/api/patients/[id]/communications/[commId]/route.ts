import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commId: string } }
) {
  try {
    const commId = params.commId
    const body = await request.json()

    const updateData: any = {}

    if (body.follow_up_completed !== undefined) {
      updateData.follow_up_completed = body.follow_up_completed
    }

    if (body.follow_up_completed_at) {
      updateData.follow_up_completed_at = body.follow_up_completed_at
    }

    const { data, error } = await supabase
      .from('patient_communications')
      .update(updateData)
      .eq('id', commId)
      .select()
      .single()

    if (error) {
      console.error('Error updating communication:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, communication: data })
  } catch (error: any) {
    console.error('Error in PATCH /api/patients/[id]/communications/[commId]:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
