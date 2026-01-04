import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RecommendationRequest {
  patientId?: string
  skinType?: string
  conditions?: string[]
  currentTreatments?: string[]
  concerns?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()
    const { patientId, skinType, conditions, currentTreatments, concerns } = body

    // Fetch all products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If patient ID provided, fetch patient data
    let patientData = null
    if (patientId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('skin_type, skin_cancer_history')
        .eq('id', patientId)
        .single()

      patientData = patient
    }

    // Build recommendation logic
    const recommendations = buildRecommendations({
      products: products || [],
      skinType: skinType || patientData?.skin_type,
      conditions: conditions || [],
      currentTreatments: currentTreatments || [],
      concerns: concerns || []
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

function buildRecommendations(params: {
  products: any[]
  skinType?: string
  conditions: string[]
  currentTreatments: string[]
  concerns: string[]
}) {
  const { products, skinType, conditions, currentTreatments, concerns } = params

  // Basic AM routine (Cleanser -> Treatment -> Moisturizer -> Sunscreen)
  const amRoutine = []

  // Find cleanser
  const cleanser = products.find(p =>
    p.category === 'Necessities' &&
    p.type?.toLowerCase().includes('cleanser') &&
    (skinType === 'Sensitive' ? p.name.toLowerCase().includes('gentle') : true)
  )
  if (cleanser) amRoutine.push({ ...cleanser, step: 1, timeOfDay: 'AM', category_step: 'Cleanser' })

  // Find treatment based on concerns
  if (concerns.includes('Acne') || conditions.includes('Acne')) {
    const acneTreatment = products.find(p =>
      p.category === 'Acne' &&
      (p.type?.toLowerCase().includes('treatment') || p.type?.toLowerCase().includes('exfoliant'))
    )
    if (acneTreatment) amRoutine.push({ ...acneTreatment, step: 2, timeOfDay: 'AM', category_step: 'Treatment' })
  }

  // Find moisturizer
  const moisturizer = products.find(p =>
    p.category === 'Moisturizers & Sunscreens' &&
    p.type?.toLowerCase() === 'moisturizer'
  )
  if (moisturizer) amRoutine.push({ ...moisturizer, step: 3, timeOfDay: 'AM', category_step: 'Moisturizer' })

  // Find sunscreen (required for AM)
  const sunscreen = products.find(p =>
    p.category === 'Moisturizers & Sunscreens' &&
    p.type?.toLowerCase() === 'sunscreen'
  )
  if (sunscreen) amRoutine.push({ ...sunscreen, step: 4, timeOfDay: 'AM', category_step: 'Sunscreen' })

  // Basic PM routine (Cleanser -> Treatment -> Moisturizer)
  const pmRoutine = []

  // PM Cleanser
  if (cleanser) pmRoutine.push({ ...cleanser, step: 1, timeOfDay: 'PM', category_step: 'Cleanser' })

  // PM Treatment (retinoid for anti-aging or acne)
  if (concerns.includes('Anti-aging') || concerns.includes('Acne')) {
    const retinoid = products.find(p =>
      p.type?.toLowerCase().includes('retinoid') ||
      p.type?.toLowerCase().includes('retinol')
    )
    if (retinoid) pmRoutine.push({ ...retinoid, step: 2, timeOfDay: 'PM', category_step: 'Treatment' })
  }

  // PM Moisturizer
  if (moisturizer) pmRoutine.push({ ...moisturizer, step: 3, timeOfDay: 'PM', category_step: 'Moisturizer' })

  // Find targeted products for specific conditions
  const targetedProducts = []

  if (concerns.includes('Acne') || conditions.includes('Acne')) {
    targetedProducts.push(...products.filter(p => p.category === 'Acne').slice(0, 3))
  }

  if (concerns.includes('Hyperpigmentation')) {
    const hyperpigmentationProducts = products.filter(p =>
      p.name.toLowerCase().includes('vitamin c') ||
      p.name.toLowerCase().includes('niacinamide') ||
      p.name.toLowerCase().includes('azelaic')
    )
    targetedProducts.push(...hyperpigmentationProducts.slice(0, 2))
  }

  return {
    amRoutine,
    pmRoutine,
    targetedProducts,
    skinType: skinType || 'Not specified',
    concerns: concerns,
    totalProducts: amRoutine.length + pmRoutine.length
  }
}
