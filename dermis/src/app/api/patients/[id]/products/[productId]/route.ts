import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const patientId = params.id
    const { productId } = params

    // Delete the patient product entry
    const { error } = await supabase
      .from('patient_products')
      .delete()
      .eq('id', productId)
      .eq('patient_id', patientId)

    if (error) {
      console.error('Error deleting patient product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/patients/[id]/products/[productId]:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
