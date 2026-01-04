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
    envVars[match[1].trim()] = match[2].trim()
  }
})

async function seedJan3Appointments() {
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

  const practiceId = '00000000-0000-0000-0000-000000000001'

  // Get providers
  const { data: providers, error: provError } = await supabase
    .from('providers')
    .select('id, first_name, last_name')
    .eq('practice_id', practiceId)

  if (provError || !providers?.length) {
    console.error('No providers found:', provError?.message)
    process.exit(1)
  }
  console.log(`Found ${providers.length} providers`)

  // Get patients
  const { data: patients, error: patError } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .eq('practice_id', practiceId)
    .limit(10)

  if (patError || !patients?.length) {
    console.error('No patients found:', patError?.message)
    process.exit(1)
  }
  console.log(`Found ${patients.length} patients`)

  // Jan 3, 2026
  const jan3 = new Date('2026-01-03T00:00:00')

  // Delete existing Jan 3 appointments
  const { error: delError } = await supabase
    .from('encounters')
    .delete()
    .gte('scheduled_at', '2026-01-03T00:00:00')
    .lt('scheduled_at', '2026-01-04T00:00:00')

  if (delError) {
    console.log('Delete error (may be ok):', delError.message)
  }

  const appointments = [
    // Dr. 1's appointments
    {
      practice_id: practiceId,
      patient_id: patients[0]?.id,
      provider_id: providers[0]?.id,
      encounter_type: 'skin_check',
      chief_complaint: 'Annual full body skin examination',
      status: 'completed',
      scheduled_at: new Date(jan3.getTime() + 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      practice_id: practiceId,
      patient_id: patients[1]?.id,
      provider_id: providers[0]?.id,
      encounter_type: 'cosmetic_consult',
      chief_complaint: 'Botox consultation for forehead lines',
      status: 'completed',
      scheduled_at: new Date(jan3.getTime() + 9 * 60 * 60 * 1000).toISOString(),
    },
    {
      practice_id: practiceId,
      patient_id: patients[2]?.id,
      provider_id: providers[0]?.id,
      encounter_type: 'follow_up',
      chief_complaint: 'Follow-up for acne treatment',
      status: 'in_progress',
      scheduled_at: new Date(jan3.getTime() + 10 * 60 * 60 * 1000).toISOString(),
    },
    // Dr. 2's appointments
    {
      practice_id: practiceId,
      patient_id: patients[3]?.id,
      provider_id: providers[1]?.id || providers[0]?.id,
      encounter_type: 'follow_up',
      chief_complaint: 'Psoriasis management assessment',
      status: 'completed',
      scheduled_at: new Date(jan3.getTime() + 8.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      practice_id: practiceId,
      patient_id: patients[4]?.id || patients[0]?.id,
      provider_id: providers[1]?.id || providers[0]?.id,
      encounter_type: 'procedure',
      chief_complaint: 'Excision of suspicious lesion',
      status: 'in_progress',
      scheduled_at: new Date(jan3.getTime() + 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      practice_id: practiceId,
      patient_id: patients[5]?.id || patients[1]?.id,
      provider_id: providers[1]?.id || providers[0]?.id,
      encounter_type: 'office_visit',
      chief_complaint: 'New patient - itchy rash evaluation',
      status: 'checked_in',
      scheduled_at: new Date(jan3.getTime() + 11 * 60 * 60 * 1000).toISOString(),
    },
    {
      practice_id: practiceId,
      patient_id: patients[6]?.id || patients[2]?.id,
      provider_id: providers[1]?.id || providers[0]?.id,
      encounter_type: 'office_visit',
      chief_complaint: 'Hair loss consultation',
      status: 'scheduled',
      scheduled_at: new Date(jan3.getTime() + 14 * 60 * 60 * 1000).toISOString(),
    },
    // Dr. 3's appointments
    {
      practice_id: practiceId,
      patient_id: patients[7]?.id || patients[3]?.id,
      provider_id: providers[2]?.id || providers[0]?.id,
      encounter_type: 'skin_check',
      chief_complaint: 'Skin cancer screening',
      status: 'checked_in',
      scheduled_at: new Date(jan3.getTime() + 9 * 60 * 60 * 1000).toISOString(),
    },
    {
      practice_id: practiceId,
      patient_id: patients[0]?.id,
      provider_id: providers[2]?.id || providers[0]?.id,
      encounter_type: 'cosmetic_consult',
      chief_complaint: 'Filler consultation for nasolabial folds',
      status: 'checked_in',
      scheduled_at: new Date(jan3.getTime() + 11.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      practice_id: practiceId,
      patient_id: patients[1]?.id,
      provider_id: providers[2]?.id || providers[0]?.id,
      encounter_type: 'follow_up',
      chief_complaint: 'Post-operative check, Mohs surgery site',
      status: 'scheduled',
      scheduled_at: new Date(jan3.getTime() + 13 * 60 * 60 * 1000).toISOString(),
    },
  ]

  console.log('\nCreating 10 appointments for January 3, 2026...\n')

  let success = 0
  for (const appt of appointments) {
    if (!appt.patient_id || !appt.provider_id) {
      console.log('⚠️  Skipping - missing patient or provider')
      continue
    }

    const { error } = await supabase.from('encounters').insert([appt])
    if (error) {
      console.log(`❌ Error: ${error.message}`)
    } else {
      console.log(`✅ Created: ${appt.chief_complaint} at ${new Date(appt.scheduled_at).toLocaleTimeString()}`)
      success++
    }
  }

  console.log(`\n✨ Created ${success}/10 appointments for Jan 3, 2026`)
}

seedJan3Appointments().catch(console.error)
