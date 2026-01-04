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

// Sample products based on common dermatology recommendations
const sampleProducts = [
  // Necessities - Cleansers
  {
    name: 'CeraVe Hydrating Facial Cleanser',
    brand: 'CeraVe',
    category: 'Necessities',
    type: 'Cleanser',
    usage_instructions: 'AM & PM: Apply to damp skin, massage gently, rinse with lukewarm water',
    price: 15.99,
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    is_active: true
  },
  {
    name: 'La Roche-Posay Toleriane Hydrating Gentle Cleanser',
    brand: 'La Roche-Posay',
    category: 'Necessities',
    type: 'Cleanser',
    usage_instructions: 'AM & PM: Wet face, apply and massage gently, rinse',
    price: 18.99,
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    is_active: true
  },
  {
    name: 'Cetaphil Gentle Skin Cleanser',
    brand: 'Cetaphil',
    category: 'Necessities',
    type: 'Cleanser',
    usage_instructions: 'AM & PM: Can be used with or without water',
    price: 14.49,
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    is_active: true
  },

  // Moisturizers & Sunscreens - Moisturizers
  {
    name: 'CeraVe Daily Moisturizing Lotion',
    brand: 'CeraVe',
    category: 'Moisturizers & Sunscreens',
    type: 'Moisturizer',
    usage_instructions: 'AM & PM: Apply to face and body after cleansing',
    price: 16.99,
    image_url: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400',
    is_active: true
  },
  {
    name: 'Neutrogena Hydro Boost Water Gel',
    brand: 'Neutrogena',
    category: 'Moisturizers & Sunscreens',
    type: 'Moisturizer',
    usage_instructions: 'AM & PM: Apply to clean face, absorbs quickly',
    price: 19.99,
    image_url: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400',
    is_active: true
  },
  {
    name: 'Vanicream Moisturizing Cream',
    brand: 'Vanicream',
    category: 'Moisturizers & Sunscreens',
    type: 'Moisturizer',
    usage_instructions: 'AM & PM: For sensitive skin, fragrance-free',
    price: 17.49,
    image_url: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400',
    is_active: true
  },

  // Moisturizers & Sunscreens - Sunscreens
  {
    name: 'EltaMD UV Clear Broad-Spectrum SPF 46',
    brand: 'EltaMD',
    category: 'Moisturizers & Sunscreens',
    type: 'Sunscreen',
    usage_instructions: 'AM: Apply liberally 15 minutes before sun exposure. Reapply every 2 hours.',
    price: 37.00,
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
    is_active: true
  },
  {
    name: 'La Roche-Posay Anthelios Melt-in Milk SPF 60',
    brand: 'La Roche-Posay',
    category: 'Moisturizers & Sunscreens',
    type: 'Sunscreen',
    usage_instructions: 'AM: Apply generously before sun exposure',
    price: 35.99,
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
    is_active: true
  },
  {
    name: 'CeraVe Hydrating Mineral Sunscreen SPF 50',
    brand: 'CeraVe',
    category: 'Moisturizers & Sunscreens',
    type: 'Sunscreen',
    usage_instructions: 'AM: Physical sunscreen, gentle for sensitive skin',
    price: 19.99,
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
    is_active: true
  },

  // Acne Products
  {
    name: 'Differin Gel (Adapalene 0.1%)',
    brand: 'Differin',
    category: 'Acne',
    type: 'Retinoid',
    usage_instructions: 'PM: Apply pea-sized amount to clean, dry face. Start 2-3x/week.',
    price: 14.99,
    image_url: 'https://images.unsplash.com/photo-1585652757173-57de5e9fab42?w=400',
    is_active: true
  },
  {
    name: 'Paula\'s Choice 2% BHA Liquid Exfoliant',
    brand: 'Paula\'s Choice',
    category: 'Acne',
    type: 'Exfoliant',
    usage_instructions: 'PM: Apply with cotton pad after cleansing, before moisturizing',
    price: 32.00,
    image_url: 'https://images.unsplash.com/photo-1585652757173-57de5e9fab42?w=400',
    is_active: true
  },
  {
    name: 'Benzoyl Peroxide 5% Gel',
    brand: 'Generic',
    category: 'Acne',
    type: 'Spot Treatment',
    usage_instructions: 'AM or PM: Apply thin layer to affected areas',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1585652757173-57de5e9fab42?w=400',
    is_active: true
  },
  {
    name: 'CeraVe Acne Foaming Cream Cleanser',
    brand: 'CeraVe',
    category: 'Acne',
    type: 'Cleanser',
    usage_instructions: 'AM & PM: Contains benzoyl peroxide for acne-prone skin',
    price: 16.49,
    image_url: 'https://images.unsplash.com/photo-1585652757173-57de5e9fab42?w=400',
    is_active: true
  },

  // Other - Anti-aging & Treatment
  {
    name: 'The Ordinary Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'Other',
    type: 'Serum',
    usage_instructions: 'AM & PM: Apply before moisturizer. Helps with oil control and pore appearance.',
    price: 6.50,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    is_active: true
  },
  {
    name: 'SkinCeuticals C E Ferulic',
    brand: 'SkinCeuticals',
    category: 'Other',
    type: 'Antioxidant Serum',
    usage_instructions: 'AM: Apply 4-5 drops to clean, dry face before moisturizer',
    price: 169.00,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    is_active: true
  },
  {
    name: 'Tretinoin 0.025% Cream',
    brand: 'Generic Rx',
    category: 'Other',
    type: 'Retinoid',
    usage_instructions: 'PM: Prescription strength. Start 2x/week, increase gradually.',
    price: 45.00,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    is_active: true
  },
  {
    name: 'Azelaic Acid 15% Gel',
    brand: 'Finacea',
    category: 'Other',
    type: 'Treatment',
    usage_instructions: 'AM or PM: For hyperpigmentation and rosacea',
    price: 38.00,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    is_active: true
  },
  {
    name: 'Hyaluronic Acid Serum',
    brand: 'The Ordinary',
    category: 'Other',
    type: 'Hydrating Serum',
    usage_instructions: 'AM & PM: Apply to damp skin before moisturizer',
    price: 7.90,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    is_active: true
  }
]

async function seedProducts() {
  console.log('Seeding skincare products...')

  try {
    // Delete existing products
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error deleting existing products:', deleteError)
    } else {
      console.log('✓ Cleared existing products')
    }

    // Insert sample products
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select()

    if (error) {
      console.error('Error seeding products:', error)
      return
    }

    console.log(`✓ Created ${data.length} sample skincare products`)
    console.log('\nProducts by category:')

    const byCategory = {}
    data.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1
    })

    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} products`)
    })

  } catch (err) {
    console.error('Seed error:', err)
  }
}

// Function to import from CSV when available
async function importFromCSV(csvPath) {
  console.log(`Importing products from ${csvPath}...`)

  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8')
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())

    const products = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(',').map(v => v.trim())
      const product = {}

      headers.forEach((header, idx) => {
        product[header.toLowerCase().replace(/ /g, '_')] = values[idx]
      })

      // Map CSV fields to database fields
      products.push({
        name: product.name,
        brand: product.brand || null,
        category: product.category,
        type: product.type,
        usage_instructions: product.usage || product.usage_instructions,
        price: product.price ? parseFloat(product.price) : null,
        image_url: product.image || product.image_url || null,
        is_active: true
      })
    }

    const { data, error } = await supabase
      .from('products')
      .insert(products)
      .select()

    if (error) {
      console.error('Error importing from CSV:', error)
      return
    }

    console.log(`✓ Imported ${data.length} products from CSV`)

  } catch (err) {
    console.error('CSV import error:', err)
  }
}

// Run the appropriate function
const csvPath = process.argv[2]

if (csvPath && fs.existsSync(csvPath)) {
  importFromCSV(csvPath)
} else {
  if (csvPath) {
    console.log(`CSV file not found: ${csvPath}`)
    console.log('Creating sample products instead...\n')
  }
  seedProducts()
}
