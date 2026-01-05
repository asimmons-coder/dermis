import { NextRequest, NextResponse } from 'next/server'

// Reference the same store from parent route
const labOrderStore: Map<string, any> = (global as any).labOrderStore || new Map()
if (!(global as any).labOrderStore) {
  (global as any).labOrderStore = labOrderStore
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = labOrderStore.get(id)

  if (!order) {
    return NextResponse.json({ error: 'Lab order not found' }, { status: 404 })
  }

  return NextResponse.json({ order })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const order = labOrderStore.get(id)
    if (!order) {
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 })
    }

    // Handle "send" action
    if (data.action === 'send') {
      // Simulate sending to lab
      await new Promise(resolve => setTimeout(resolve, 1000))

      const updated = {
        ...order,
        status: 'sent',
        sent_at: new Date().toISOString(),
        confirmation_number: `${order.lab_id.toUpperCase()}-${Date.now().toString().slice(-10)}`,
        estimated_results: order.priority === 'stat'
          ? 'Same day'
          : order.priority === 'urgent'
            ? '24 hours'
            : '2-3 business days',
        updated_at: new Date().toISOString()
      }

      labOrderStore.set(id, updated)

      return NextResponse.json({
        order: updated,
        message: `Lab order sent successfully to ${order.lab_name}`,
        confirmation: {
          confirmation_number: updated.confirmation_number,
          lab: order.lab_name,
          sent_at: updated.sent_at,
          estimated_results: updated.estimated_results,
          fasting_required: order.fasting_required
        }
      })
    }

    // Handle "receive results" action (for demo)
    if (data.action === 'receive_results') {
      const updated = {
        ...order,
        status: 'resulted',
        results_received_at: new Date().toISOString(),
        results: data.results || generateMockResults(order.tests),
        updated_at: new Date().toISOString()
      }

      labOrderStore.set(id, updated)
      return NextResponse.json({ order: updated })
    }

    // Handle "cancel" action
    if (data.action === 'cancel') {
      const updated = {
        ...order,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: data.reason,
        updated_at: new Date().toISOString()
      }

      labOrderStore.set(id, updated)
      return NextResponse.json({ order: updated })
    }

    // General update
    const updated = {
      ...order,
      ...data,
      updated_at: new Date().toISOString()
    }

    labOrderStore.set(id, updated)
    return NextResponse.json({ order: updated })
  } catch (error) {
    console.error('Error updating lab order:', error)
    return NextResponse.json({ error: 'Failed to update lab order' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!labOrderStore.has(id)) {
    return NextResponse.json({ error: 'Lab order not found' }, { status: 404 })
  }

  labOrderStore.delete(id)
  return NextResponse.json({ success: true })
}

// Generate mock results for demo
function generateMockResults(tests: any[]) {
  const results: any[] = []

  for (const test of tests) {
    if (test.code === '85025' || test.name?.includes('CBC')) {
      results.push({
        test: 'CBC with Differential',
        components: [
          { name: 'WBC', value: 7.2, unit: 'K/uL', range: '4.5-11.0', status: 'normal' },
          { name: 'RBC', value: 4.8, unit: 'M/uL', range: '4.2-5.4', status: 'normal' },
          { name: 'Hemoglobin', value: 14.2, unit: 'g/dL', range: '12.0-16.0', status: 'normal' },
          { name: 'Hematocrit', value: 42, unit: '%', range: '36-46', status: 'normal' },
          { name: 'Platelets', value: 245, unit: 'K/uL', range: '150-400', status: 'normal' }
        ]
      })
    }
    if (test.code === '80061' || test.name?.includes('Lipid')) {
      results.push({
        test: 'Lipid Panel',
        components: [
          { name: 'Total Cholesterol', value: 195, unit: 'mg/dL', range: '<200', status: 'normal' },
          { name: 'HDL', value: 55, unit: 'mg/dL', range: '>40', status: 'normal' },
          { name: 'LDL', value: 118, unit: 'mg/dL', range: '<130', status: 'normal' },
          { name: 'Triglycerides', value: 110, unit: 'mg/dL', range: '<150', status: 'normal' }
        ]
      })
    }
    if (test.code === '80053' || test.name?.includes('CMP')) {
      results.push({
        test: 'Comprehensive Metabolic Panel',
        components: [
          { name: 'Glucose', value: 92, unit: 'mg/dL', range: '70-100', status: 'normal' },
          { name: 'BUN', value: 15, unit: 'mg/dL', range: '7-20', status: 'normal' },
          { name: 'Creatinine', value: 0.9, unit: 'mg/dL', range: '0.6-1.2', status: 'normal' },
          { name: 'AST', value: 25, unit: 'U/L', range: '10-40', status: 'normal' },
          { name: 'ALT', value: 28, unit: 'U/L', range: '7-56', status: 'normal' }
        ]
      })
    }
  }

  return results
}
