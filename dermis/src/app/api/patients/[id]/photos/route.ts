import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch all photos for a patient with signed URLs
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Fetch patient photos from database
    const { data: photos, error } = await supabase
      .from('patient_photos')
      .select('*')
      .eq('patient_id', patientId)
      .order('taken_at', { ascending: false })

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('patient-photos')
          .createSignedUrl(photo.storage_path, 3600) // 1 hour expiry

        if (urlError) {
          console.error('Error creating signed URL:', urlError)
          return {
            ...photo,
            url: null,
            urlError: urlError.message,
          }
        }

        return {
          ...photo,
          url: signedUrlData.signedUrl,
        }
      })
    )

    return NextResponse.json({ photos: photosWithUrls })
  } catch (error) {
    console.error('Error in GET /api/patients/[id]/photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}

// POST: Upload a new photo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id
    const body = await request.json()

    const {
      image,
      bodyLocation,
      encounterId,
      aiAnalysis,
      filename = 'photo.jpg',
    } = body

    if (!image || !bodyLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: image, bodyLocation' },
        { status: 400 }
      )
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Extract base64 data from data URL
    const matches = image.match(/^data:image\/([a-z]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      )
    }

    const imageType = matches[1]
    const base64Data = matches[2]

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate storage path: {patient_id}/{timestamp}_{filename}
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${patientId}/${timestamp}_${sanitizedFilename}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('patient-photos')
      .upload(storagePath, buffer, {
        contentType: `image/${imageType === 'jpg' ? 'jpeg' : imageType}`,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload photo: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Save photo metadata to database
    const { data: photoRecord, error: dbError } = await supabase
      .from('patient_photos')
      .insert({
        patient_id: patientId,
        encounter_id: encounterId || null,
        storage_path: storagePath,
        photo_type: 'clinical',
        body_location: bodyLocation,
        ai_analysis: aiAnalysis || null,
        taken_at: new Date().toISOString(),
        // taken_by would be set to current user's provider ID in a real app
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving photo metadata:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('patient-photos').remove([storagePath])
      return NextResponse.json(
        { error: `Failed to save photo metadata: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Generate signed URL for the new photo
    const { data: signedUrlData } = await supabase.storage
      .from('patient-photos')
      .createSignedUrl(storagePath, 3600)

    return NextResponse.json({
      success: true,
      photo: {
        ...photoRecord,
        url: signedUrlData?.signedUrl || null,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/patients/[id]/photos:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
