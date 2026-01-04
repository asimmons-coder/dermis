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

async function seedPatients() {
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

  console.log('Creating seed patients for Novice Group Dermatology...\n')

  const patients = [
    {
      practice_id: practiceId,
      mrn: 'NGD-1001',
      first_name: 'Maria',
      last_name: 'Santos',
      date_of_birth: '1957-03-15',
      sex: 'F',
      email: 'maria.santos@email.com',
      phone_primary: '(248) 555-0101',
      address_line1: '1234 Main Street',
      city: 'Bloomfield',
      state: 'MI',
      zip: '48301',
      allergies: [
        { allergen: 'Sulfa drugs', reaction: 'Rash', severity: 'Moderate' }
      ],
      medications: [
        { name: 'Lisinopril', dose: '10mg', frequency: 'Daily' },
        { name: 'Metformin', dose: '500mg', frequency: 'Twice daily' }
      ],
      medical_history: [
        { condition: 'Basal cell carcinoma', onset_date: '2019-06-01', status: 'Treated' },
        { condition: 'Type 2 diabetes', onset_date: '2015-01-01', status: 'Active' },
        { condition: 'Hypertension', onset_date: '2012-01-01', status: 'Active' }
      ],
      skin_type: 'III',
      skin_cancer_history: true,
      sun_exposure: 'High - outdoor gardening hobby',
      notes: 'Regular skin checks every 6 months. History of BCC on left cheek, excised 2019.'
    },
    {
      practice_id: practiceId,
      mrn: 'NGD-1002',
      first_name: 'Tyler',
      last_name: 'Johnson',
      date_of_birth: '2005-09-22',
      sex: 'M',
      email: 'tyler.johnson@email.com',
      phone_primary: '(248) 555-0102',
      address_line1: '5678 Oak Avenue',
      city: 'Birmingham',
      state: 'MI',
      zip: '48009',
      allergies: [],
      medications: [
        { name: 'Isotretinoin', dose: '60mg', frequency: 'Daily', prescriber: 'Dr. Novice' }
      ],
      medical_history: [
        { condition: 'Severe cystic acne', onset_date: '2022-01-01', status: 'Active - on treatment' }
      ],
      skin_type: 'II',
      skin_cancer_history: false,
      notes: 'Started isotretinoin 2 months ago. Monthly follow-ups required. Parents involved in care.'
    },
    {
      practice_id: practiceId,
      mrn: 'NGD-1003',
      first_name: 'Rebecca',
      last_name: 'Chen',
      date_of_birth: '1979-11-08',
      sex: 'F',
      email: 'rebecca.chen@email.com',
      phone_primary: '(248) 555-0103',
      address_line1: '9012 Maple Drive',
      city: 'West Bloomfield',
      state: 'MI',
      zip: '48322',
      allergies: [],
      medications: [],
      medical_history: [],
      skin_type: 'II',
      skin_cancer_history: false,
      cosmetic_interests: ['botox', 'filler', 'chemical_peel', 'microneedling'],
      cosmetic_history: [
        { treatment: 'Botox - forehead & glabella', date: '2024-09-15', provider: 'Dr. Novice', units: 30 },
        { treatment: 'Juvederm - nasolabial folds', date: '2024-06-20', provider: 'Dr. Novice', volume_ml: 1.0 },
        { treatment: 'Chemical peel - glycolic 30%', date: '2024-03-10' }
      ],
      notes: 'VIP cosmetic patient. Regular Botox every 3-4 months. Very knowledgeable about treatments.'
    },
    {
      practice_id: practiceId,
      mrn: 'NGD-1004',
      first_name: 'David',
      last_name: 'Williams',
      date_of_birth: '1972-07-30',
      sex: 'M',
      email: 'david.williams@email.com',
      phone_primary: '(248) 555-0104',
      address_line1: '3456 Pine Street',
      city: 'Troy',
      state: 'MI',
      zip: '48083',
      allergies: [],
      medications: [
        { name: 'Humira', dose: '40mg', frequency: 'Every 2 weeks', prescriber: 'Dr. Novice' },
        { name: 'Clobetasol ointment', dose: '0.05%', frequency: 'As needed' }
      ],
      medical_history: [
        { condition: 'Psoriasis', onset_date: '2010-01-01', status: 'Active - on biologic' },
        { condition: 'Psoriatic arthritis', onset_date: '2018-01-01', status: 'Active' }
      ],
      family_history: [
        { relationship: 'Father', condition: 'Psoriasis' }
      ],
      social_history: {
        smoking: 'Former smoker, quit 2015',
        alcohol: 'Occasional',
        occupation: 'Software engineer'
      },
      skin_type: 'II',
      skin_cancer_history: false,
      notes: 'Excellent response to Humira. PASI improved from 18 to 3. Sees rheumatology for PsA.'
    }
  ]

  try {
    for (const patient of patients) {
      console.log(`Creating patient: ${patient.first_name} ${patient.last_name} (${patient.mrn})`)

      const { data, error } = await supabase
        .from('patients')
        .insert(patient)
        .select()

      if (error) {
        console.error(`Error creating ${patient.first_name} ${patient.last_name}:`, error.message)
      } else {
        console.log(`✓ Created ${patient.first_name} ${patient.last_name}`)
      }
    }

    console.log('\n✅ Seed patients created successfully!')

  } catch (err) {
    console.error('Error seeding patients:', err.message)
    process.exit(1)
  }
}

seedPatients()
