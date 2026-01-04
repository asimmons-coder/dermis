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

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function resetPathologyOrders() {
  console.log('Deleting existing pathology orders...')

  try {
    // Delete all existing pathology orders
    const { error: deleteError } = await supabase
      .from('pathology_orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error deleting orders:', deleteError)
      return
    }

    console.log('✓ Deleted existing orders')
    console.log('Creating fresh pathology orders...')

    // Get patients and providers
    const { data: patients } = await supabase.from('patients').select('id').limit(5)
    const { data: providers } = await supabase.from('providers').select('id').limit(1)

    if (!patients || !providers || patients.length === 0 || providers.length === 0) {
      console.error('Need patients and providers first')
      return
    }

    const pathOrders = [
      {
        patient_id: patients[0].id,
        provider_id: providers[0].id,
        specimen_type: 'Shave biopsy',
        body_site: 'Left forearm',
        clinical_description: 'Suspicious pigmented lesion, rule out melanoma',
        lab_name: 'DermPath Diagnostics',
        status: 'pending',
        date_sent: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      },
      {
        patient_id: patients[1].id,
        provider_id: providers[0].id,
        specimen_type: 'Punch biopsy',
        body_site: 'Right cheek',
        clinical_description: 'Erythematous patch, rule out BCC',
        lab_name: 'Quest Diagnostics',
        status: 'received',
        date_sent: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        date_received: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        diagnosis: 'Basal cell carcinoma, nodular type',
        margins: 'Margins involved',
        path_report: 'Sections show infiltrative basal cell carcinoma extending to the deep and lateral margins. No perineural invasion identified.'
      },
      {
        patient_id: patients[2].id,
        provider_id: providers[0].id,
        specimen_type: 'Excision',
        body_site: 'Back, upper',
        clinical_description: 'Melanocytic nevus',
        lab_name: 'DermPath Diagnostics',
        status: 'reviewed',
        date_sent: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        date_received: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        date_reviewed: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        diagnosis: 'Compound nevus, benign',
        margins: 'Clear',
        path_report: 'Benign compound melanocytic nevus with clear margins.',
        follow_up_notes: 'Patient notified of benign results. No further action needed.'
      },
      {
        patient_id: patients[3].id,
        provider_id: providers[0].id,
        specimen_type: 'Shave biopsy',
        body_site: 'Nose, tip',
        clinical_description: 'Pearly papule, suspected BCC',
        lab_name: 'Quest Diagnostics',
        status: 'needs_action',
        date_sent: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        date_received: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        diagnosis: 'Basal cell carcinoma, positive margins',
        margins: 'Positive deep and lateral margins',
        path_report: 'Basal cell carcinoma with tumor extension to margins. Recommend complete excision or Mohs surgery.',
        follow_up_notes: 'Need to schedule Mohs surgery'
      },
      {
        patient_id: patients[4].id,
        provider_id: providers[0].id,
        specimen_type: 'Punch biopsy',
        body_site: 'Left shin',
        clinical_description: 'Chronic ulcer, rule out malignancy',
        lab_name: 'DermPath Diagnostics',
        status: 'pending',
        date_sent: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { data, error } = await supabase
      .from('pathology_orders')
      .insert(pathOrders)
      .select()

    if (error) {
      console.error('Error creating pathology orders:', error)
      return
    }

    console.log(`✓ Created ${data.length} fresh pathology orders`)
    console.log('✓ Reset complete!')
  } catch (err) {
    console.error('Reset error:', err)
  }
}

resetPathologyOrders()
