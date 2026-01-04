import { NextRequest, NextResponse } from 'next/server'

// Common dermatology ICD-10 codes
const COMMON_ICD10_CODES = [
  { code: 'L57.0', description: 'Actinic keratosis' },
  { code: 'L98.9', description: 'Disorder of skin and subcutaneous tissue, unspecified' },
  { code: 'L30.9', description: 'Dermatitis, unspecified' },
  { code: 'L70.0', description: 'Acne vulgaris' },
  { code: 'L71.9', description: 'Rosacea, unspecified' },
  { code: 'L20.9', description: 'Atopic dermatitis, unspecified' },
  { code: 'L21.9', description: 'Seborrheic dermatitis, unspecified' },
  { code: 'L50.9', description: 'Urticaria, unspecified' },
  { code: 'L82.1', description: 'Other seborrheic keratosis' },
  { code: 'L72.0', description: 'Epidermal cyst' },
  { code: 'L91.0', description: 'Hypertrophic scar' },
  { code: 'L90.5', description: 'Scar conditions and fibrosis of skin' },
  { code: 'B07.9', description: 'Viral wart, unspecified' },
  { code: 'B08.1', description: 'Molluscum contagiosum' },
  { code: 'L60.0', description: 'Ingrowing nail' },
  { code: 'L84', description: 'Corns and callosities' },
  { code: 'L85.3', description: 'Xerosis cutis' },
  { code: 'L98.8', description: 'Other specified disorders of the skin and subcutaneous tissue' },
  { code: 'D22.9', description: 'Melanocytic nevi, unspecified' },
  { code: 'D23.9', description: 'Other benign neoplasm of skin, unspecified site' },
  { code: 'C44.90', description: 'Unspecified malignant neoplasm of skin, unspecified site' },
  { code: 'C43.9', description: 'Malignant melanoma of skin, unspecified' },
  { code: 'Z12.83', description: 'Encounter for screening for malignant neoplasm of skin' },
  { code: 'Z87.2', description: 'Personal history of diseases of the skin and subcutaneous tissue' },
]

// Common dermatology CPT codes
const COMMON_CPT_CODES = [
  { code: '99201', description: 'Office visit, new patient, straightforward' },
  { code: '99202', description: 'Office visit, new patient, low complexity' },
  { code: '99203', description: 'Office visit, new patient, moderate complexity' },
  { code: '99204', description: 'Office visit, new patient, moderate/high complexity' },
  { code: '99205', description: 'Office visit, new patient, high complexity' },
  { code: '99211', description: 'Office visit, established patient, minimal' },
  { code: '99212', description: 'Office visit, established patient, straightforward' },
  { code: '99213', description: 'Office visit, established patient, low complexity' },
  { code: '99214', description: 'Office visit, established patient, moderate complexity' },
  { code: '99215', description: 'Office visit, established patient, high complexity' },
  { code: '11102', description: 'Tangential biopsy of skin, single lesion' },
  { code: '11103', description: 'Tangential biopsy of skin, each additional lesion' },
  { code: '11104', description: 'Punch biopsy of skin, single lesion' },
  { code: '11105', description: 'Punch biopsy of skin, each additional lesion' },
  { code: '11106', description: 'Incisional biopsy of skin, single lesion' },
  { code: '11107', description: 'Incisional biopsy of skin, each additional lesion' },
  { code: '17000', description: 'Destruction (eg, laser, electrosurgery, cryosurgery), premalignant lesions, first' },
  { code: '17003', description: 'Destruction, premalignant lesions, 2-14 additional' },
  { code: '17004', description: 'Destruction, premalignant lesions, 15 or more' },
  { code: '17110', description: 'Destruction of benign lesions, up to 14' },
  { code: '17111', description: 'Destruction of benign lesions, 15 or more' },
  { code: '11200', description: 'Removal of skin tags, up to 15' },
  { code: '11201', description: 'Removal of skin tags, each additional 10' },
  { code: '11400', description: 'Excision, benign lesion, trunk/arms/legs, 0.5 cm or less' },
  { code: '11401', description: 'Excision, benign lesion, trunk/arms/legs, 0.6-1.0 cm' },
  { code: '11402', description: 'Excision, benign lesion, trunk/arms/legs, 1.1-2.0 cm' },
  { code: '11403', description: 'Excision, benign lesion, trunk/arms/legs, 2.1-3.0 cm' },
  { code: '11600', description: 'Excision, malignant lesion, trunk/arms/legs, 0.5 cm or less' },
  { code: '11601', description: 'Excision, malignant lesion, trunk/arms/legs, 0.6-1.0 cm' },
  { code: '11602', description: 'Excision, malignant lesion, trunk/arms/legs, 1.1-2.0 cm' },
  { code: '96372', description: 'Therapeutic injection, subcutaneous or intramuscular' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'icd10' or 'cpt'
  const query = searchParams.get('query')?.toLowerCase() || ''

  if (!type || !query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  let results: Array<{ code: string; description: string; units?: number }> = []

  if (type === 'icd10') {
    results = COMMON_ICD10_CODES.filter(
      (code) =>
        code.code.toLowerCase().includes(query) ||
        code.description.toLowerCase().includes(query)
    )
  } else if (type === 'cpt') {
    results = COMMON_CPT_CODES.filter(
      (code) =>
        code.code.toLowerCase().includes(query) ||
        code.description.toLowerCase().includes(query)
    )
  }

  // Sort by relevance: exact code matches first, then description matches
  results.sort((a, b) => {
    const aCodeMatch = a.code.toLowerCase().startsWith(query)
    const bCodeMatch = b.code.toLowerCase().startsWith(query)
    if (aCodeMatch && !bCodeMatch) return -1
    if (!aCodeMatch && bCodeMatch) return 1
    return 0
  })

  return NextResponse.json({ results: results.slice(0, 20) })
}
