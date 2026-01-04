import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      chiefComplaint,
      quickInput,
      encounterType,
      note,
      providerId,
      encounterId,
      selectedIcd10Codes,
      selectedCptCodes
    } = body

    if (!patientId || !note || !providerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use selected codes if provided, otherwise fall back to AI suggestions
    const icd10Codes = selectedIcd10Codes || note.suggestions.icd10 || []
    const cptCodes = selectedCptCodes || note.suggestions.cpt || []

    // Get patient's practice_id
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('practice_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    let encounter

    if (encounterId) {
      // Update existing encounter from schedule workflow
      const { data: existingEncounter, error: updateError } = await supabase
        .from('encounters')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          icd10_codes: icd10Codes,
          cpt_codes: cptCodes,
        })
        .eq('id', encounterId)
        .select()
        .single()

      if (updateError) {
        console.error('Encounter update error:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      encounter = existingEncounter
    } else {
      // Create new encounter for ad-hoc visits
      const { data: newEncounter, error: encounterError } = await supabase
        .from('encounters')
        .insert({
          practice_id: patient.practice_id,
          patient_id: patientId,
          provider_id: providerId,
          encounter_type: encounterType,
          chief_complaint: chiefComplaint,
          status: 'completed',
          completed_at: new Date().toISOString(),
          icd10_codes: icd10Codes,
          cpt_codes: cptCodes,
        })
        .select()
        .single()

      if (encounterError) {
        console.error('Encounter error:', encounterError)
        return NextResponse.json({ error: encounterError.message }, { status: 500 })
      }

      encounter = newEncounter
    }

    // Create clinical note
    const { data: clinicalNote, error: noteError } = await supabase
      .from('clinical_notes')
      .insert({
        encounter_id: encounter.id,
        provider_id: providerId,
        note_type: 'progress',
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        quick_input: quickInput,
        ai_generated_note: note.fullNote,
        ai_suggestions: note.suggestions,
        ai_model_version: 'claude-sonnet-4',
        is_draft: true,
      })
      .select()
      .single()

    if (noteError) {
      console.error('Note error:', noteError)
      return NextResponse.json({ error: noteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      encounterId: encounter.id,
      noteId: clinicalNote.id
    })
  } catch (error) {
    console.error('Error saving note:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}
