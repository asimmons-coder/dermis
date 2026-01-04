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

async function runMigration() {
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

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log('Running migration...')
  console.log('Migration file size:', sql.length, 'bytes')

  try {
    // Execute the SQL using Supabase's raw SQL execution
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Migration error:', error)
      process.exit(1)
    }

    console.log('Migration completed successfully!')
    console.log('Result:', data)
  } catch (err) {
    console.error('Error running migration:', err.message)

    // Try alternative approach - execute via REST API
    console.log('\nTrying alternative approach via REST API...')

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('REST API error:', result)
      console.log('\n⚠️  Please run this SQL manually in the Supabase SQL Editor:')
      console.log(`${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`)
      process.exit(1)
    }

    console.log('Migration completed via REST API!')
    console.log('Result:', result)
  }
}

runMigration()
