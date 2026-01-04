import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { data: orders, error } = await supabase
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
      .order('date_sent', { ascending: false })

    if (error) {
      console.error('Error fetching pathology orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    const formattedOrders = orders?.map(o => {
      const dateSent = new Date(o.date_sent)
      const now = new Date()
      const daysPending = Math.floor((now.getTime() - dateSent.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: o.id,
        patientId: o.patients?.id,
        patientName: `${o.patients?.first_name} ${o.patients?.last_name}`,
        providerId: o.providers?.id,
        providerName: `Dr. ${o.providers?.first_name} ${o.providers?.last_name}`,
        specimenType: o.specimen_type,
        bodySite: o.body_site,
        clinicalDescription: o.clinical_description,
        labName: o.lab_name,
        status: o.status,
        dateSent: o.date_sent,
        dateReceived: o.date_received,
        dateReviewed: o.date_reviewed,
        diagnosis: o.diagnosis,
        margins: o.margins,
        pathReport: o.path_report,
        followUpNotes: o.follow_up_notes,
        microscopicDescription: o.microscopic_description,
        pathologistName: o.pathologist_name,
        recommendations: o.recommendations,
        pathReportUrl: o.path_report_url,
        patientNotified: o.patient_notified,
        notificationDate: o.notification_date,
        notificationMethod: o.notification_method,
        followUpAppointmentId: o.follow_up_appointment_id,
        daysPending
      }
    }) || []

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error('Error in pathology orders API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const { data: order, error } = await supabase
      .from('pathology_orders')
      .insert({
        patient_id: data.patientId,
        encounter_id: data.encounterId,
        provider_id: data.providerId,
        specimen_type: data.specimenType,
        body_site: data.bodySite,
        clinical_description: data.clinicalDescription,
        lab_name: data.labName,
        status: 'pending',
        date_sent: data.dateSent || new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pathology order:', error)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in pathology orders POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
