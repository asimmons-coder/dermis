import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch cosmetic consults for a patient
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Fetch cosmetic consults with related data
    const { data: consults, error } = await supabase
      .from('cosmetic_consults')
      .select(`
        *,
        cosmetic_treatments (*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cosmetic consults:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch before/after photos
    const { data: photos, error: photosError } = await supabase
      .from('patient_photos')
      .select('*')
      .eq('patient_id', patientId)
      .in('photo_type', ['cosmetic_before', 'cosmetic_after'])
      .order('taken_at', { ascending: false })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
    }

    // Generate signed URLs for photos
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const { data: signedUrlData } = await supabase.storage
          .from('patient-photos')
          .createSignedUrl(photo.storage_path, 3600)

        return {
          ...photo,
          url: signedUrlData?.signedUrl || null,
        }
      })
    )

    return NextResponse.json({
      consults: consults || [],
      photos: photosWithUrls || [],
    })
  } catch (error) {
    console.error('Error in GET /api/patients/[id]/cosmetic:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cosmetic consults' },
      { status: 500 }
    )
  }
}

// POST: Create a new cosmetic consult
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id
    const body = await request.json()

    const {
      encounterId,
      patientGoals,
      concerns,
      treatmentPlan,
      treatmentPlanNotes,
    } = body

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Create cosmetic consult
    const { data: consult, error: consultError } = await supabase
      .from('cosmetic_consults')
      .insert({
        patient_id: patientId,
        encounter_id: encounterId || null,
        patient_goals: patientGoals || null,
        concerns: concerns || [],
        recommended_treatments: treatmentPlan || [],
        treatment_plan_notes: treatmentPlanNotes || null,
      })
      .select()
      .single()

    if (consultError) {
      console.error('Error creating consult:', consultError)
      return NextResponse.json(
        { error: consultError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consult,
    })
  } catch (error) {
    console.error('Error in POST /api/patients/[id]/cosmetic:', error)
    return NextResponse.json(
      { error: 'Failed to create cosmetic consult' },
      { status: 500 }
    )
  }
}
