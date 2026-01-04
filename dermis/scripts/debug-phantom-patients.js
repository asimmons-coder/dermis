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

const phantomIds = [
  '15018588-1f3b-491c-9c6a-7b249c5752c6',
  '3dc6b292-89b0-4520-85ac-9b4471d363c1',
  'b3917e93-30b9-4b55-aa83-c2c42a7fc4d7',
  '0a3335ce-cdd3-41ed-96ad-d14aaad0c22b'
]

async function checkPhantomPatients() {
  console.log('Checking phantom patient IDs...\n')

  for (const id of phantomIds) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    console.log(`ID: ${id}`)
    if (error) {
      console.log(`  Error: ${error.message}`)
    } else {
      console.log(`  Found: ${data.first_name} ${data.last_name}`)
    }
    console.log()
  }
}

checkPhantomPatients()
