#!/usr/bin/env node

/**
 * Setup script for Supabase Storage bucket
 * Creates a private 'patient-photos' bucket for storing patient clinical photos
 */

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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupStorageBucket() {
  console.log('Setting up patient-photos storage bucket...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }

    const existingBucket = buckets?.find(b => b.name === 'patient-photos')

    if (existingBucket) {
      console.log('✓ Bucket "patient-photos" already exists')
      console.log('  - ID:', existingBucket.id)
      console.log('  - Public:', existingBucket.public ? 'Yes' : 'No (Private)')
      console.log('  - Created:', existingBucket.created_at)
      return
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket('patient-photos', {
      public: false, // Private bucket - requires signed URLs
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
    })

    if (error) {
      console.error('❌ Error creating bucket:', error)
      return
    }

    console.log('✅ Successfully created "patient-photos" bucket')
    console.log('  - Access: Private (requires signed URLs)')
    console.log('  - Max file size: 10MB')
    console.log('  - Allowed types: JPEG, PNG, HEIC, WebP')

    // Note: Storage policies are automatically handled by Supabase RLS
    // The patient_photos table already has proper RLS policies
    console.log('\n✓ Storage bucket ready for use!')
    console.log('  Photos will be accessible via signed URLs (1 hour expiry)')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setupStorageBucket()
