import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addCheckInFields() {
  console.log('Adding check-in fields to encounters table...')

  try {
    // Use direct SQL execution via RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE encounters
        ADD COLUMN IF NOT EXISTS copay DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS insurance_card_photo TEXT,
        ADD COLUMN IF NOT EXISTS id_photo TEXT,
        ADD COLUMN IF NOT EXISTS signature TEXT;
      `
    })

    if (error) {
      console.log('Note: If columns already exist, you can ignore this error.')
      console.error('Error:', error.message)
      return
    }

    console.log('✓ Check-in fields added successfully')
  } catch (err) {
    console.error('Migration error:', err)
  }
}

addCheckInFields()
