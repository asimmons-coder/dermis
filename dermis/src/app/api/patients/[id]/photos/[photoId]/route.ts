import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH: Update photo metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const { id: patientId, photoId } = params
    const body = await request.json()

    const { photo_type, body_location_detail } = body

    // Verify photo exists and belongs to patient
    const { data: photo, error: fetchError } = await supabase
      .from('patient_photos')
      .select('patient_id')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    if (photo.patient_id !== patientId) {
      return NextResponse.json(
        { error: 'Photo does not belong to this patient' },
        { status: 403 }
      )
    }

    // Update photo metadata
    const updateData: any = {}
    if (photo_type) updateData.photo_type = photo_type
    if (body_location_detail) updateData.body_location_detail = body_location_detail

    const { error: updateError } = await supabase
      .from('patient_photos')
      .update(updateData)
      .eq('id', photoId)

    if (updateError) {
      console.error('Error updating photo:', updateError)
      return NextResponse.json(
        { error: `Failed to update photo: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Photo updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/patients/[id]/photos/[photoId]:', error)
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    )
  }
}

// DELETE: Remove a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const { id: patientId, photoId } = params

    // Fetch the photo record to get storage path
    const { data: photo, error: fetchError } = await supabase
      .from('patient_photos')
      .select('storage_path, patient_id')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Verify the photo belongs to the specified patient
    if (photo.patient_id !== patientId) {
      return NextResponse.json(
        { error: 'Photo does not belong to this patient' },
        { status: 403 }
      )
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('patient-photos')
      .remove([photo.storage_path])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      // Continue to delete DB record even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('patient_photos')
      .delete()
      .eq('id', photoId)

    if (dbError) {
      console.error('Error deleting photo record:', dbError)
      return NextResponse.json(
        { error: `Failed to delete photo: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/patients/[id]/photos/[photoId]:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}
