import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: order, error } = await supabase
      .from('pathology_orders')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name
        ),
        providers!pathology_orders_provider_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching pathology order:', error)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in pathology order GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const updateData: any = {}

    if (data.status) {
      updateData.status = data.status
    }
    if (data.dateReceived) {
      updateData.date_received = data.dateReceived
    }
    if (data.dateReviewed) {
      updateData.date_reviewed = data.dateReviewed
    }
    if (data.diagnosis !== undefined) {
      updateData.diagnosis = data.diagnosis
    }
    if (data.margins !== undefined) {
      updateData.margins = data.margins
    }
    if (data.pathReport !== undefined) {
      updateData.path_report = data.pathReport
    }
    if (data.followUpNotes !== undefined) {
      updateData.follow_up_notes = data.followUpNotes
    }
    if (data.microscopicDescription !== undefined) {
      updateData.microscopic_description = data.microscopicDescription
    }
    if (data.pathologistName !== undefined) {
      updateData.pathologist_name = data.pathologistName
    }
    if (data.recommendations !== undefined) {
      updateData.recommendations = data.recommendations
    }
    if (data.pathReportUrl !== undefined) {
      updateData.path_report_url = data.pathReportUrl
    }
    if (data.patientNotified !== undefined) {
      updateData.patient_notified = data.patientNotified
    }
    if (data.notificationDate !== undefined) {
      updateData.notification_date = data.notificationDate
    }
    if (data.notificationMethod !== undefined) {
      updateData.notification_method = data.notificationMethod
    }
    if (data.followUpAppointmentId !== undefined) {
      updateData.follow_up_appointment_id = data.followUpAppointmentId
    }

    updateData.updated_at = new Date().toISOString()

    const { data: order, error } = await supabase
      .from('pathology_orders')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        patients (
          id,
          practice_id
        )
      `)
      .single()

    if (error) {
      console.error('Error updating pathology order:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Auto-create communication log entry when patient is notified
    if (data.patientNotified && order && order.patients) {
      const patient = Array.isArray(order.patients) ? order.patients[0] : order.patients

      const communicationType = data.notificationMethod || 'Other'
      const diagnosisText = order.diagnosis ? `${order.diagnosis}` : 'Results available'

      const communication = {
        patient_id: patient.id,
        practice_id: patient.practice_id,
        communication_date: data.notificationDate || new Date().toISOString(),
        communication_type: communicationType,
        direction: 'Outbound',
        subject: 'Pathology results notification',
        notes: `Patient notified of pathology results. Diagnosis: ${diagnosisText}${order.follow_up_notes ? `\n\nFollow-up: ${order.follow_up_notes}` : ''}`,
        follow_up_needed: order.recommendations ? true : false,
        follow_up_due_date: null,
        follow_up_completed: false,
        logged_by_name: 'System',
        related_pathology_order_id: order.id
      }

      await supabase
        .from('patient_communications')
        .insert(communication)
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in pathology order PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
