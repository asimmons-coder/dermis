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

async function createProductsTable() {
  console.log('Creating products table...\n')

  const sql = `
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  type TEXT,
  usage_instructions TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Error creating table:', error)
      console.log('\nTrying alternative method...')

      // Try using the REST API directly
      const { error: createError } = await supabase
        .from('products')
        .select('id')
        .limit(1)

      if (createError && createError.code === 'PGRST205') {
        console.error('Products table does not exist.')
        console.log('\nPlease run this SQL in your Supabase SQL Editor:')
        console.log('-------------------------------------------')
        console.log(sql)
        console.log('-------------------------------------------')
      }

      return
    }

    console.log('✓ Products table created successfully!')

  } catch (err) {
    console.error('Error:', err.message)
    console.log('\nPlease create the products table manually in Supabase SQL Editor.')
    console.log('Run the SQL from the file: /tmp/create-products-table.sql')
  }
}

createProductsTable()
