const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

async function forceDeleteDuplicates() {
  console.log('Checking for all patients in database...\n')

  // Get ALL patients
  const { data: allPatients, error } = await supabase
    .from('patients')
    .select('*')
    .order('mrn')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${allPatients.length} total patients:`)
  allPatients.forEach((p, i) => {
    console.log(`${i + 1}. ${p.first_name} ${p.last_name} (${p.mrn}) - ${p.id} - created: ${p.created_at}`)
  })

  // Manually specify the duplicate IDs to delete (keeping the oldest for each name)
  const idsToDelete = [
    '15018588-1f3b-491c-9c6a-7b249c5752c6', // Rebecca Chen duplicate
    '3dc6b292-89b0-4520-85ac-9b4471d363c1', // Tyler Johnson duplicate
    'b3917e93-30b9-4b55-aa83-c2c42a7fc4d7', // Maria Santos duplicate
    '0a3335ce-cdd3-41ed-96ad-d14aaad0c22b'  // David Williams duplicate
  ]

  console.log(`\nDeleting ${idsToDelete.length} duplicate patient IDs...`)

  for (const id of idsToDelete) {
    const { error: delError } = await supabase
      .from('patients')
      .delete()
      .eq('id', id)

    if (delError) {
      console.error(`Error deleting ${id}:`, delError)
    } else {
      console.log(`✓ Deleted ${id}`)
    }
  }

  // Final check
  const { data: finalPatients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, mrn')

  console.log(`\n✓ Final patient count: ${finalPatients.length}`)
  finalPatients.forEach(p => {
    console.log(`  - ${p.first_name} ${p.last_name} (${p.mrn})`)
  })
}

forceDeleteDuplicates()
