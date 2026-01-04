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

async function deduplicatePatients() {
  console.log('Finding duplicate patients...\n')

  try {
    // Get all patients
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching patients:', error)
      return
    }

    console.log(`Found ${patients.length} total patients\n`)

    // Group by name to find duplicates
    const nameGroups = {}
    patients.forEach(p => {
      const key = `${p.first_name} ${p.last_name}`.toLowerCase()
      if (!nameGroups[key]) {
        nameGroups[key] = []
      }
      nameGroups[key].push(p)
    })

    // Find duplicates (keep oldest, delete newer)
    const toDelete = []
    Object.entries(nameGroups).forEach(([name, group]) => {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicates for "${name}":`)
        group.forEach((p, idx) => {
          console.log(`  ${idx + 1}. ${p.first_name} ${p.last_name} (${p.mrn}) - ${p.id}`)
          if (idx > 0) {
            // Keep first (oldest), mark rest for deletion
            toDelete.push(p.id)
          }
        })
        console.log(`  → Keeping first, deleting ${group.length - 1} duplicate(s)\n`)
      }
    })

    if (toDelete.length === 0) {
      console.log('✓ No duplicates found!')
      return
    }

    console.log(`\nDeleting ${toDelete.length} duplicate patient records...`)

    // Delete duplicates
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .in('id', toDelete)

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError)
      return
    }

    console.log(`✓ Successfully deleted ${toDelete.length} duplicate patients\n`)

    // Show final count
    const { data: finalPatients } = await supabase
      .from('patients')
      .select('id, first_name, last_name, mrn')

    console.log(`Final patient count: ${finalPatients.length}`)
    finalPatients.forEach(p => {
      console.log(`  - ${p.first_name} ${p.last_name} (${p.mrn})`)
    })

  } catch (err) {
    console.error('Error:', err)
  }
}

deduplicatePatients()
