import { NextRequest, NextResponse } from 'next/server'

// Reference the same store from parent route
// In production, this would be database-backed
const prescriptionStore: Map<string, any> = (global as any).prescriptionStore || new Map()
if (!(global as any).prescriptionStore) {
  (global as any).prescriptionStore = prescriptionStore
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const prescription = prescriptionStore.get(id)

  if (!prescription) {
    return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
  }

  return NextResponse.json({ prescription })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const prescription = prescriptionStore.get(id)
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Handle "send" action
    if (data.action === 'send') {
      // Simulate sending to Surescripts
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate network delay

      const updated = {
        ...prescription,
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_via: 'erx',
        erx_reference_id: `SRS-${Date.now()}`,
        updated_at: new Date().toISOString()
      }

      prescriptionStore.set(id, updated)

      return NextResponse.json({
        prescription: updated,
        message: 'Prescription sent successfully via Surescripts',
        confirmation: {
          reference_id: updated.erx_reference_id,
          pharmacy: updated.pharmacy_name,
          sent_at: updated.sent_at,
          estimated_ready: '2-4 hours'
        }
      })
    }

    // Handle "cancel" action
    if (data.action === 'cancel') {
      const updated = {
        ...prescription,
        status: 'cancelled',
        updated_at: new Date().toISOString()
      }

      prescriptionStore.set(id, updated)
      return NextResponse.json({ prescription: updated })
    }

    // General update
    const updated = {
      ...prescription,
      ...data,
      updated_at: new Date().toISOString()
    }

    prescriptionStore.set(id, updated)
    return NextResponse.json({ prescription: updated })
  } catch (error) {
    console.error('Error updating prescription:', error)
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!prescriptionStore.has(id)) {
    return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
  }

  prescriptionStore.delete(id)
  return NextResponse.json({ success: true })
}
