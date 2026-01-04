// Helper functions for automated patient messaging
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AppointmentData {
  id: string
  patient_id: string
  practice_id: string
  provider_id?: string
  scheduled_at: string
  patient?: {
    first_name: string
    last_name: string
    phone_primary?: string
    email?: string
  }
  provider?: {
    first_name: string
    last_name: string
  }
  location?: {
    name: string
    phone?: string
  }
}

// Replace template variables with actual values
function fillTemplate(template: string, data: {
  patient_name: string
  provider: string
  date: string
  time: string
  location?: string
  phone?: string
}): string {
  return template
    .replace(/\{patient_name\}/g, data.patient_name)
    .replace(/\{provider\}/g, data.provider)
    .replace(/\{date\}/g, data.date)
    .replace(/\{time\}/g, data.time)
    .replace(/\{location\}/g, data.location || '')
    .replace(/\{phone\}/g, data.phone || '')
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

// Format time for display
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Schedule automated messages for an appointment
export async function scheduleAppointmentMessages(appointment: AppointmentData) {
  try {
    // Get automation settings
    const { data: settings, error: settingsError } = await supabase
      .from('automation_settings')
      .select('*')
      .eq('practice_id', appointment.practice_id)
      .single()

    if (settingsError || !settings) {
      console.error('Could not load automation settings:', settingsError)
      return
    }

    // Get message templates
    const { data: templates, error: templatesError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('practice_id', appointment.practice_id)
      .eq('is_active', true)

    if (templatesError || !templates) {
      console.error('Could not load message templates:', templatesError)
      return
    }

    const appointmentDate = new Date(appointment.scheduled_at)
    const patient = appointment.patient
    const provider = appointment.provider

    if (!patient) return

    const templateData = {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      provider: provider ? `Dr. ${provider.last_name}` : 'your provider',
      date: formatDate(appointment.scheduled_at),
      time: formatTime(appointment.scheduled_at),
      location: appointment.location?.name,
      phone: appointment.location?.phone
    }

    const messages: any[] = []

    // Appointment confirmation
    if (settings.confirmation_enabled && settings.confirmation_channel !== 'off') {
      const template = templates.find(t => t.template_key === 'appointment_confirmation')
      if (template) {
        const channels = settings.confirmation_channel === 'both'
          ? ['sms', 'email']
          : [settings.confirmation_channel]

        for (const channel of channels) {
          const recipient = channel === 'sms' ? patient.phone_primary : patient.email
          if (recipient) {
            messages.push({
              practice_id: appointment.practice_id,
              patient_id: appointment.patient_id,
              encounter_id: appointment.id,
              template_id: template.id,
              message_type: 'appointment_confirmation',
              channel,
              recipient,
              subject: template.subject,
              message_body: fillTemplate(template.body, templateData),
              scheduled_for: new Date().toISOString(),
              status: 'pending'
            })
          }
        }
      }
    }

    // 48 hour reminder
    if (settings.reminder_48hr_enabled && settings.reminder_48hr_channel !== 'off') {
      const template = templates.find(t => t.template_key === 'reminder_48hr')
      if (template) {
        const reminderTime = new Date(appointmentDate.getTime() - 48 * 60 * 60 * 1000)

        // Only schedule if appointment is more than 48 hours away
        if (reminderTime > new Date()) {
          const channels = settings.reminder_48hr_channel === 'both'
            ? ['sms', 'email']
            : [settings.reminder_48hr_channel]

          for (const channel of channels) {
            const recipient = channel === 'sms' ? patient.phone_primary : patient.email
            if (recipient) {
              messages.push({
                practice_id: appointment.practice_id,
                patient_id: appointment.patient_id,
                encounter_id: appointment.id,
                template_id: template.id,
                message_type: 'reminder_48hr',
                channel,
                recipient,
                subject: template.subject,
                message_body: fillTemplate(template.body, templateData),
                scheduled_for: reminderTime.toISOString(),
                status: 'pending'
              })
            }
          }
        }
      }
    }

    // 24 hour reminder
    if (settings.reminder_24hr_enabled && settings.reminder_24hr_channel !== 'off') {
      const template = templates.find(t => t.template_key === 'reminder_24hr')
      if (template) {
        const reminderTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000)

        // Only schedule if appointment is more than 24 hours away
        if (reminderTime > new Date()) {
          const channels = settings.reminder_24hr_channel === 'both'
            ? ['sms', 'email']
            : [settings.reminder_24hr_channel]

          for (const channel of channels) {
            const recipient = channel === 'sms' ? patient.phone_primary : patient.email
            if (recipient) {
              messages.push({
                practice_id: appointment.practice_id,
                patient_id: appointment.patient_id,
                encounter_id: appointment.id,
                template_id: template.id,
                message_type: 'reminder_24hr',
                channel,
                recipient,
                subject: template.subject,
                message_body: fillTemplate(template.body, templateData),
                scheduled_for: reminderTime.toISOString(),
                status: 'pending'
              })
            }
          }
        }
      }
    }

    // Insert all messages
    if (messages.length > 0) {
      // Check demo mode and mark messages accordingly
      if (settings.demo_mode) {
        messages.forEach(m => {
          m.status = 'demo'
          m.sent_at = new Date().toISOString()
        })
      }

      const { error: insertError } = await supabase
        .from('automated_messages')
        .insert(messages)

      if (insertError) {
        console.error('Error inserting automated messages:', insertError)
      } else {
        console.log(`Scheduled ${messages.length} automated messages for appointment ${appointment.id}`)
      }
    }
  } catch (error) {
    console.error('Error in scheduleAppointmentMessages:', error)
  }
}
