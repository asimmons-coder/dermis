import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

interface RecommendationRequest {
  patientId?: string
  skinType?: string
  conditions?: string[]
  currentTreatments?: string[]
  concerns?: string[]
  age?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()
    const { patientId, skinType, conditions, currentTreatments, concerns, age } = body

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
        .select('first_name, last_name, date_of_birth, skin_type, skin_cancer_history, allergies, medical_history')
        .eq('id', patientId)
        .single()

      patientData = patient
    }

    // Calculate age from DOB if available
    let patientAge = age
    if (patientData?.date_of_birth) {
      const dob = new Date(patientData.date_of_birth)
      const today = new Date()
      patientAge = today.getFullYear() - dob.getFullYear()
    }

    // Use AI to generate personalized recommendations
    const aiRecommendations = await generateAIRecommendations({
      products: products || [],
      skinType: skinType || patientData?.skin_type,
      conditions: conditions || [],
      currentTreatments: currentTreatments || [],
      concerns: concerns || [],
      age: patientAge,
      skinCancerHistory: patientData?.skin_cancer_history,
      allergies: patientData?.allergies,
      patientName: patientData ? `${patientData.first_name} ${patientData.last_name}` : undefined
    })

    return NextResponse.json(aiRecommendations)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    // Fallback to rule-based if AI fails
    return NextResponse.json({
      error: 'Failed to generate recommendations',
      amRoutine: [],
      pmRoutine: [],
      targetedProducts: [],
      aiReasoning: null
    }, { status: 500 })
  }
}

async function generateAIRecommendations(params: {
  products: any[]
  skinType?: string
  conditions: string[]
  currentTreatments: string[]
  concerns: string[]
  age?: number
  skinCancerHistory?: boolean
  allergies?: any[]
  patientName?: string
}) {
  const { products, skinType, conditions, currentTreatments, concerns, age, skinCancerHistory, allergies, patientName } = params

  // If no products available, return empty
  if (!products || products.length === 0) {
    return {
      amRoutine: [],
      pmRoutine: [],
      targetedProducts: [],
      skinType: skinType || 'Not specified',
      concerns: concerns,
      totalProducts: 0,
      aiReasoning: 'No products available in catalog.'
    }
  }

  // Create product catalog for AI
  const productCatalog = products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    type: p.type,
    price: p.price,
    usage_instructions: p.usage_instructions
  }))

  const prompt = `You are a dermatology skincare expert. Based on the patient profile and available products, create a personalized skincare routine.

PATIENT PROFILE:
${patientName ? `- Name: ${patientName}` : '- Name: Not specified'}
- Skin Type: ${skinType || 'Not specified'}
- Age: ${age || 'Not specified'}
- Skin Cancer History: ${skinCancerHistory ? 'Yes - HIGH PRIORITY for sun protection' : 'No'}
- Conditions: ${conditions.length > 0 ? conditions.join(', ') : 'None specified'}
- Concerns: ${concerns.length > 0 ? concerns.join(', ') : 'None specified'}
- Current Treatments: ${currentTreatments.length > 0 ? currentTreatments.join(', ') : 'None'}
- Allergies: ${allergies && allergies.length > 0 ? JSON.stringify(allergies) : 'None known'}

AVAILABLE PRODUCTS:
${JSON.stringify(productCatalog, null, 2)}

Create a personalized routine with these requirements:
1. AM Routine: Cleanser → Treatment (if needed) → Moisturizer → Sunscreen (REQUIRED)
2. PM Routine: Cleanser → Treatment → Moisturizer
3. For each product, explain WHY it's recommended for this specific patient
4. Consider age-appropriate treatments (retinoids for 30+, gentler for sensitive skin)
5. Prioritize sun protection if skin cancer history exists
6. Match product types to concerns (e.g., salicylic acid for acne, vitamin C for hyperpigmentation)

Return ONLY valid JSON in this exact format:
{
  "aiReasoning": "A 2-3 sentence personalized summary of the routine strategy for this patient",
  "amRoutine": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "brand": "Brand",
      "category": "Category",
      "type": "Type",
      "price": 29.99,
      "step": 1,
      "timeOfDay": "AM",
      "category_step": "Cleanser",
      "recommendation_reason": "Specific reason why this product is perfect for this patient"
    }
  ],
  "pmRoutine": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "brand": "Brand",
      "category": "Category",
      "type": "Type",
      "price": 29.99,
      "step": 1,
      "timeOfDay": "PM",
      "category_step": "Cleanser",
      "recommendation_reason": "Specific reason why this product is perfect for this patient"
    }
  ],
  "targetedProducts": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "brand": "Brand",
      "price": 29.99,
      "recommendation_reason": "For addressing specific concern like hyperpigmentation"
    }
  ]
}

Only recommend products from the AVAILABLE PRODUCTS list. Use exact product IDs from the catalog. Be specific and personal in your reasoning.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0])
        return {
          ...recommendations,
          skinType: skinType || 'Not specified',
          concerns: concerns,
          totalProducts: (recommendations.amRoutine?.length || 0) + (recommendations.pmRoutine?.length || 0)
        }
      }
    }

    // Fallback if parsing fails
    return buildFallbackRecommendations(params)
  } catch (aiError) {
    console.error('AI recommendation error:', aiError)
    return buildFallbackRecommendations(params)
  }
}

// Fallback rule-based recommendations if AI fails
function buildFallbackRecommendations(params: {
  products: any[]
  skinType?: string
  conditions: string[]
  currentTreatments: string[]
  concerns: string[]
}) {
  const { products, skinType, conditions, concerns } = params

  const amRoutine: any[] = []
  const pmRoutine: any[] = []

  // Find cleanser
  const cleanser = products.find(p =>
    p.category === 'Necessities' &&
    p.type?.toLowerCase().includes('cleanser') &&
    (skinType === 'Sensitive' ? p.name.toLowerCase().includes('gentle') : true)
  )
  if (cleanser) {
    amRoutine.push({ ...cleanser, step: 1, timeOfDay: 'AM', category_step: 'Cleanser', recommendation_reason: 'Essential daily cleansing for healthy skin' })
    pmRoutine.push({ ...cleanser, step: 1, timeOfDay: 'PM', category_step: 'Cleanser', recommendation_reason: 'Remove daily buildup and prepare skin for treatment' })
  }

  // Find moisturizer
  const moisturizer = products.find(p =>
    p.category === 'Moisturizers & Sunscreens' &&
    p.type?.toLowerCase() === 'moisturizer'
  )
  if (moisturizer) {
    amRoutine.push({ ...moisturizer, step: 3, timeOfDay: 'AM', category_step: 'Moisturizer', recommendation_reason: 'Hydration and barrier support throughout the day' })
    pmRoutine.push({ ...moisturizer, step: 3, timeOfDay: 'PM', category_step: 'Moisturizer', recommendation_reason: 'Overnight hydration and skin repair' })
  }

  // Find sunscreen (required AM)
  const sunscreen = products.find(p =>
    p.category === 'Moisturizers & Sunscreens' &&
    p.type?.toLowerCase() === 'sunscreen'
  )
  if (sunscreen) amRoutine.push({ ...sunscreen, step: 4, timeOfDay: 'AM', category_step: 'Sunscreen', recommendation_reason: 'Essential daily sun protection to prevent photoaging and skin cancer' })

  // PM Treatment for acne or anti-aging
  if (concerns.includes('Anti-aging') || concerns.includes('Acne')) {
    const retinoid = products.find(p =>
      p.type?.toLowerCase().includes('retinoid') ||
      p.type?.toLowerCase().includes('retinol')
    )
    if (retinoid) pmRoutine.push({ ...retinoid, step: 2, timeOfDay: 'PM', category_step: 'Treatment', recommendation_reason: 'Gold standard for anti-aging and acne prevention' })
  }

  return {
    amRoutine: amRoutine.sort((a, b) => a.step - b.step),
    pmRoutine: pmRoutine.sort((a, b) => a.step - b.step),
    targetedProducts: [],
    skinType: skinType || 'Not specified',
    concerns: concerns,
    totalProducts: amRoutine.length + pmRoutine.length,
    aiReasoning: 'Basic routine recommendation based on skin type and standard dermatology guidelines. For a more personalized routine, please provide additional patient information.'
  }
}
