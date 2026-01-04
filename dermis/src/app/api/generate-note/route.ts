import { NextRequest, NextResponse } from 'next/server'
import { generateClinicalNote, type ClinicalNoteInput } from '@/lib/ai/clinical-notes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const input: ClinicalNoteInput = {
      quickInput: body.quickInput,
      chiefComplaint: body.chiefComplaint,
      patientContext: body.patientContext,
      encounterType: body.encounterType || 'office_visit',
    }

    const result = await generateClinicalNote(input)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating note:', error)
    return NextResponse.json(
      { error: 'Failed to generate clinical note' },
      { status: 500 }
    )
  }
}
