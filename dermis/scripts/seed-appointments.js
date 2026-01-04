const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

async function seedAppointments() {
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const practiceId = '00000000-0000-0000-0000-000000000001' // Novice Group
  const providerIds = [
    '00000000-0000-0000-0000-000000000101', // Dr. Karlee
    '00000000-0000-0000-0000-000000000102', // Dr. Fred
    '00000000-0000-0000-0000-000000000103', // Dr. Taylor
  ]

  // Get existing patients
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id')
    .eq('practice_id', practiceId)
    .limit(4)

  if (patientsError || !patients || patients.length === 0) {
    console.error('No patients found. Please seed patients first.')
    process.exit(1)
  }

  console.log('Creating today\'s appointments...\n')

  // Create today's date with different times
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const appointments = [
    {
      practice_id: practiceId,
      patient_id: patients[0].id,
      provider_id: providerIds[0], // Dr. Karlee
      encounter_type: 'office_visit',
      chief_complaint: 'Annual skin check',
      status: 'completed',
      scheduled_at: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(), // 9 AM
      completed_at: new Date(today.getTime() + 9.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      practice_id: practiceId,
      patient_id: patients[1].id,
      provider_id: providerIds[0], // Dr. Karlee
      encounter_type: 'office_visit',
      chief_complaint: 'Acne follow-up',
      status: 'in_progress',
      scheduled_at: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(), // 10 AM
    },
    {
      practice_id: practiceId,
      patient_id: patients[2].id,
      provider_id: providerIds[1], // Dr. Fred
      encounter_type: 'procedure',
      chief_complaint: 'Lesion removal - left arm',
      status: 'checked_in',
      scheduled_at: new Date(today.getTime() + 10.5 * 60 * 60 * 1000).toISOString(), // 10:30 AM
    },
    {
      practice_id: practiceId,
      patient_id: patients[3].id,
      provider_id: providerIds[1], // Dr. Fred
      encounter_type: 'office_visit',
      chief_complaint: 'Rash evaluation',
      status: 'scheduled',
      scheduled_at: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(), // 2 PM
    },
    {
      practice_id: practiceId,
      patient_id: patients[0].id,
      provider_id: providerIds[2], // Dr. Taylor
      encounter_type: 'cosmetic_consult',
      chief_complaint: 'Botox consultation',
      status: 'scheduled',
      scheduled_at: new Date(today.getTime() + 15 * 60 * 60 * 1000).toISOString(), // 3 PM
    },
    {
      practice_id: practiceId,
      patient_id: patients[1].id,
      provider_id: providerIds[2], // Dr. Taylor
      encounter_type: 'follow_up',
      chief_complaint: 'Post-procedure check',
      status: 'scheduled',
      scheduled_at: new Date(today.getTime() + 16 * 60 * 60 * 1000).toISOString(), // 4 PM
    },
  ]

  // Insert appointments
  for (const appointment of appointments) {
    const { data, error } = await supabase
      .from('encounters')
      .insert([appointment])
      .select()

    if (error) {
      console.error(`❌ Error creating appointment:`, error)
    } else {
      console.log(`✅ Created ${appointment.status} appointment at ${new Date(appointment.scheduled_at).toLocaleTimeString()}`)
    }
  }

  console.log('\n✨ Appointment seeding complete!')
}

seedAppointments().catch(console.error)
