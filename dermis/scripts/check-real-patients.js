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

async function checkPatients() {
  console.log('Checking actual patients in database...\n')

  // Get all patients directly from database
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, mrn')
    .order('last_name')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Actual patients in database: ${patients.length}\n`)
  patients.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.first_name} ${p.last_name} (MRN: ${p.mrn})`)
    console.log(`   ID: ${p.id}\n`)
  })
}

checkPatients()
