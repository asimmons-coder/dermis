import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Sign a clinical note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; encounterId: string; noteId: string } }
) {
  try {
    const { noteId } = params

    // Fetch the note to verify it exists and is a draft
    const { data: note, error: fetchError } = await supabase
      .from('clinical_notes')
      .select('id, is_draft, signed_at')
      .eq('id', noteId)
      .single()

    if (fetchError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    if (!note.is_draft) {
      return NextResponse.json(
        { error: 'Note is already signed' },
        { status: 400 }
      )
    }

    // Sign the note
    const { error: updateError } = await supabase
      .from('clinical_notes')
      .update({
        is_draft: false,
        signed_at: new Date().toISOString(),
        // In a real app, signed_by would be the current user's provider ID
        // For demo purposes, we'll leave it null or set a default
      })
      .eq('id', noteId)

    if (updateError) {
      console.error('Error signing note:', updateError)
      return NextResponse.json(
        { error: `Failed to sign note: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Note signed successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/patients/[id]/encounters/[encounterId]/notes/[noteId]/sign:', error)
    return NextResponse.json(
      { error: 'Failed to sign note' },
      { status: 500 }
    )
  }
}
