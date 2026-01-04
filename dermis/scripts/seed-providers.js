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

async function seedProviders() {
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

  const practiceId = '00000000-0000-0000-0000-000000000001' // Novice Group Dermatology

  console.log('Creating seed providers for Novice Group Dermatology...\n')

  const providers = [
    {
      id: '00000000-0000-0000-0000-000000000101', // Fixed UUID for consistency
      practice_id: practiceId,
      first_name: 'Karlee',
      last_name: 'Novice',
      credentials: 'MD',
      specialty: 'Dermatology',
      email: 'karlee.novice@novicegroup.com',
      phone: '(248) 555-0201',
      is_active: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000102',
      practice_id: practiceId,
      first_name: 'Fred',
      last_name: 'Novice',
      credentials: 'MD',
      specialty: 'Dermatology',
      email: 'fred.novice@novicegroup.com',
      phone: '(248) 555-0202',
      is_active: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000103',
      practice_id: practiceId,
      first_name: 'Taylor',
      last_name: 'Novice',
      credentials: 'MD',
      specialty: 'Dermatology',
      email: 'taylor.novice@novicegroup.com',
      phone: '(248) 555-0203',
      is_active: true,
    }
  ]

  // Insert providers
  for (const provider of providers) {
    const { data, error } = await supabase
      .from('providers')
      .insert([provider])
      .select()

    if (error) {
      // If provider already exists, update instead
      if (error.code === '23505') {
        console.log(`⚠️  Provider ${provider.first_name} ${provider.last_name} already exists, skipping...`)
      } else {
        console.error(`❌ Error creating provider ${provider.first_name} ${provider.last_name}:`, error)
      }
    } else {
      console.log(`✅ Created provider: Dr. ${provider.first_name} ${provider.last_name}, ${provider.credentials}`)
    }
  }

  console.log('\n✨ Provider seeding complete!')
}

seedProviders().catch(console.error)
