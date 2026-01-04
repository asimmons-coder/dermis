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

async function checkAppointments() {
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

  // Get all appointments ordered by date
  const { data: appointments, error } = await supabase
    .from('encounters')
    .select('id, scheduled_at, chief_complaint, status')
    .eq('practice_id', practiceId)
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error)
    process.exit(1)
  }

  console.log(`\nFound ${appointments.length} total appointments:\n`)

  // Group by date
  const byDate = {}
  appointments.forEach(apt => {
    if (!apt.scheduled_at) {
      console.log('⚠️  Found appointment with no scheduled_at:', apt)
      return
    }
    const date = apt.scheduled_at.split('T')[0]
    if (!byDate[date]) {
      byDate[date] = []
    }
    byDate[date].push(apt)
  })

  // Display grouped by date
  Object.keys(byDate).sort().forEach(date => {
    console.log(`\n📅 ${date} (${byDate[date].length} appointments):`)
    byDate[date].forEach(apt => {
      const time = new Date(apt.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      console.log(`  • ${time} - ${apt.status} - ${apt.chief_complaint}`)
    })
  })

  console.log('\n')
}

checkAppointments().catch(console.error)
