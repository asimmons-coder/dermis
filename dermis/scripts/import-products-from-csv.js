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

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '')

  const lines = cleanContent.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',').map(h => h.trim())

  const records = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Parse CSV line respecting commas in quotes
    const values = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const record = {}
    headers.forEach((header, idx) => {
      record[header] = values[idx] || ''
    })

    records.push(record)
  }

  return records
}

async function importProducts() {
  console.log('Importing products from product_info_new.csv...\n')

  try {
    const csvPath = '/tmp/upload-1802748268/product_info_new.csv'

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found: ${csvPath}`)
      return
    }

    const records = parseCSV(csvPath)

    console.log(`Parsed ${records.length} products from CSV\n`)

    // Map CSV to database format
    const products = records.map(r => {
      // Extract numeric price from string like "$40 " or " Rx Price "
      let price = null
      if (r.Price && r.Price.trim() && !r.Price.includes('Rx')) {
        const priceStr = r.Price.replace(/[$\s]/g, '')
        const priceNum = parseFloat(priceStr)
        if (!isNaN(priceNum)) {
          price = priceNum
        }
      }

      // Extract brand from product name (first word before space)
      const nameParts = r.Product.split(' ')
      let brand = null
      let name = r.Product

      if (nameParts.length > 1) {
        const possibleBrands = ['SkinMedica', 'Revision', 'Biopelle', 'M100', 'Vanishing', 'Novice', 'Benzoyl', 'Purifying', 'Upneeq', 'Latisse', 'Nutrafol', 'Auraderm', 'Oxygenetics', 'Sponges', 'Arnika', 'Bio', 'Topix']
        const firstWord = nameParts[0]

        if (possibleBrands.some(b => firstWord.includes(b))) {
          brand = firstWord
        }
      }

      return {
        name: r.Product.trim(),
        brand: brand,
        category: r['Website Group'].trim(),
        type: r.Type.trim(),
        usage_instructions: r.Usage.trim(),
        price: price,
        image_url: r.Image && r.Image.trim() !== '' ? r.Image.trim() : null,
        is_active: true
      }
    })

    // Delete existing products
    console.log('Clearing existing products...')
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('Error deleting products:', deleteError)
    } else {
      console.log('✓ Cleared existing products\n')
    }

    // Insert new products
    console.log('Inserting products...')
    const { data, error } = await supabase
      .from('products')
      .insert(products)
      .select()

    if (error) {
      console.error('Error inserting products:', error)
      return
    }

    console.log(`✓ Imported ${data.length} products\n`)

    // Summary by category
    const byCategory = {}
    data.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1
    })

    console.log('Products by category:')
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} products`)
      })

    console.log('\nSample products:')
    data.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name} (${p.category} - ${p.type}) ${p.price ? '$' + p.price : 'Rx'}`)
    })

  } catch (err) {
    console.error('Import error:', err)
  }
}

importProducts()
