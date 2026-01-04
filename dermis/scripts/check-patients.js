const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.join('/home/vibecode/workspace/dermis', '.env.local')
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
  const { data, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, mrn, created_at')
    .order('mrn', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Total patients in database: ${data.length}\n`)
  data.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.first_name} ${p.last_name} (${p.mrn}) - ${p.id}`)
  })
}

checkPatients()
