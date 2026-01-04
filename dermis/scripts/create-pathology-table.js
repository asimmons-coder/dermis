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

async function createPathologyTable() {
  console.log('Creating pathology_orders table...')

  try {
    // Check if table exists
    const { data: tables, error: checkError } = await supabase
      .from('pathology_orders')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✓ Table pathology_orders already exists')
      return
    }

    console.log('Table does not exist. Please run this SQL manually in Supabase SQL Editor:')
    console.log('')
    console.log('------------------------------------------')
    console.log(fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260102_create_pathology_orders.sql'), 'utf8'))
    console.log('------------------------------------------')
    console.log('')
    console.log('After running the SQL, run: node scripts/seed-pathology-orders.js')
  } catch (err) {
    console.error('Error:', err)
  }
}

createPathologyTable()
