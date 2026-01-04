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

async function cleanup() {
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Delete appointments with null scheduled_at
  const { data: deleted1, error: error1 } = await supabase
    .from('encounters')
    .delete()
    .is('scheduled_at', null)
    .select()

  if (error1) {
    console.error('Error deleting null scheduled_at:', error1)
  } else {
    console.log(`✅ Deleted ${deleted1.length} appointments with null scheduled_at`)
  }

  // Delete appointments with null chief_complaint
  const { data: deleted2, error: error2 } = await supabase
    .from('encounters')
    .delete()
    .is('chief_complaint', null)
    .select()

  if (error2) {
    console.error('Error deleting null chief_complaint:', error2)
  } else {
    console.log(`✅ Deleted ${deleted2.length} appointments with null chief_complaint`)
  }

  console.log('\n✨ Cleanup complete!')
}

cleanup().catch(console.error)
