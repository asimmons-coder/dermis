import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory store for demo
const labOrderStore: Map<string, any> = (global as any).labOrderStore || new Map()
if (!(global as any).labOrderStore) {
  (global as any).labOrderStore = labOrderStore
}

// Common dermatology lab tests
const LAB_TEST_CATALOG = [
  // Isotretinoin Monitoring
  {
    code: 'ISO-PANEL',
    name: 'Isotretinoin Monitoring Panel',
    description: 'CBC, CMP, Lipid Panel, Pregnancy Test (if applicable)',
    category: 'Monitoring',
    components: ['CBC', 'CMP', 'Lipid Panel', 'hCG'],
    turnaround: '1-2 days',
    fasting: true
  },
  {
    code: '80061',
    name: 'Lipid Panel',
    description: 'Total cholesterol, HDL, LDL, Triglycerides',
    category: 'Chemistry',
    components: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides'],
    turnaround: '1 day',
    fasting: true
  },
  {
    code: '80053',
    name: 'Comprehensive Metabolic Panel (CMP)',
    description: 'Kidney function, liver enzymes, electrolytes, glucose',
    category: 'Chemistry',
    components: ['Glucose', 'BUN', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium', 'Total Protein', 'Albumin', 'Bilirubin', 'Alk Phos', 'AST', 'ALT'],
    turnaround: '1 day',
    fasting: true
  },
  {
    code: '85025',
    name: 'Complete Blood Count (CBC) with Differential',
    description: 'WBC, RBC, Hemoglobin, Hematocrit, Platelets',
    category: 'Hematology',
    components: ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'RDW', 'Platelets', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'],
    turnaround: '1 day',
    fasting: false
  },
  {
    code: '80076',
    name: 'Hepatic Function Panel',
    description: 'Liver enzymes and function tests',
    category: 'Chemistry',
    components: ['Total Protein', 'Albumin', 'Total Bilirubin', 'Direct Bilirubin', 'Alk Phos', 'AST', 'ALT'],
    turnaround: '1 day',
    fasting: false
  },
  // Autoimmune/Inflammatory
  {
    code: '86038',
    name: 'Antinuclear Antibodies (ANA)',
    description: 'Screen for autoimmune conditions',
    category: 'Immunology',
    components: ['ANA Screen', 'ANA Titer', 'ANA Pattern'],
    turnaround: '2-3 days',
    fasting: false
  },
  {
    code: '86200',
    name: 'Anti-dsDNA Antibodies',
    description: 'Specific for lupus',
    category: 'Immunology',
    components: ['Anti-dsDNA IgG'],
    turnaround: '2-3 days',
    fasting: false
  },
  {
    code: '82728',
    name: 'Ferritin',
    description: 'Iron stores - hair loss workup',
    category: 'Chemistry',
    components: ['Ferritin'],
    turnaround: '1 day',
    fasting: false
  },
  // Thyroid (hair/skin)
  {
    code: '84443',
    name: 'TSH',
    description: 'Thyroid function - hair loss, dry skin workup',
    category: 'Endocrine',
    components: ['TSH'],
    turnaround: '1 day',
    fasting: false
  },
  {
    code: '84439',
    name: 'Free T4',
    description: 'Thyroid hormone level',
    category: 'Endocrine',
    components: ['Free T4'],
    turnaround: '1 day',
    fasting: false
  },
  {
    code: 'THYROID-PANEL',
    name: 'Thyroid Panel',
    description: 'TSH, Free T4, Free T3',
    category: 'Endocrine',
    components: ['TSH', 'Free T4', 'Free T3'],
    turnaround: '1-2 days',
    fasting: false
  },
  // Vitamin/Nutritional
  {
    code: '82306',
    name: 'Vitamin D, 25-Hydroxy',
    description: 'Vitamin D level - skin health, psoriasis',
    category: 'Chemistry',
    components: ['25-OH Vitamin D'],
    turnaround: '2-3 days',
    fasting: false
  },
  {
    code: '84520',
    name: 'Urea Nitrogen (BUN)',
    description: 'Kidney function marker',
    category: 'Chemistry',
    components: ['BUN'],
    turnaround: '1 day',
    fasting: false
  },
  {
    code: '83036',
    name: 'Hemoglobin A1C',
    description: 'Diabetes screening - acanthosis nigricans, skin infections',
    category: 'Chemistry',
    components: ['HbA1c'],
    turnaround: '1 day',
    fasting: false
  },
  // Pregnancy
  {
    code: '84703',
    name: 'hCG, Qualitative (Pregnancy Test)',
    description: 'Required before isotretinoin, contraindicated medications',
    category: 'Reproductive',
    components: ['hCG Qualitative'],
    turnaround: 'Same day',
    fasting: false
  },
  // Allergy
  {
    code: '86003',
    name: 'Allergen Specific IgE Panel',
    description: 'Environmental and food allergens',
    category: 'Allergy',
    components: ['Various allergen-specific IgE'],
    turnaround: '3-5 days',
    fasting: false
  },
  // Zinc (for acne, wound healing)
  {
    code: '84630',
    name: 'Zinc Level',
    description: 'Zinc deficiency - acrodermatitis, poor wound healing',
    category: 'Chemistry',
    components: ['Zinc'],
    turnaround: '2-3 days',
    fasting: false
  },
  // ESR/CRP for inflammation
  {
    code: '86140',
    name: 'C-Reactive Protein (CRP)',
    description: 'Inflammation marker',
    category: 'Immunology',
    components: ['CRP'],
    turnaround: '1 day',
    fasting: false
  },
  {
    code: '85651',
    name: 'Erythrocyte Sedimentation Rate (ESR)',
    description: 'Inflammation marker',
    category: 'Hematology',
    components: ['ESR'],
    turnaround: '1 day',
    fasting: false
  }
]

const LABS = [
  { id: 'quest', name: 'Quest Diagnostics', address: '500 Plaza Drive, Secaucus, NJ 07094' },
  { id: 'labcorp', name: 'LabCorp', address: '358 S Main St, Burlington, NC 27215' }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')
  const search = searchParams.get('search')
  const getLabs = searchParams.get('labs')

  // Get available labs
  if (getLabs === 'true') {
    return NextResponse.json({ labs: LABS })
  }

  // Search for lab tests
  if (search !== null) {
    const query = search.toLowerCase()
    const results = LAB_TEST_CATALOG.filter(test =>
      test.name.toLowerCase().includes(query) ||
      test.code.toLowerCase().includes(query) ||
      test.category.toLowerCase().includes(query) ||
      test.description.toLowerCase().includes(query)
    ).slice(0, 10)

    return NextResponse.json({ tests: results })
  }

  // Get lab orders for a patient
  if (patientId) {
    const orders = Array.from(labOrderStore.values())
      .filter(order => order.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ orders })
  }

  // Get all lab orders
  const orders = Array.from(labOrderStore.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ orders })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Get patient info
    let patient = null
    if (data.patientId) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, first_name, last_name, date_of_birth')
        .eq('id', data.patientId)
        .single()
      patient = patientData
    }

    // Get provider info
    let provider = null
    if (data.providerId) {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id, first_name, last_name, credentials, npi')
        .eq('id', data.providerId)
        .single()
      provider = providerData
    }

    const selectedLab = LABS.find(l => l.id === data.labId) || LABS[0]

    const labOrder = {
      id: `lab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patient_id: data.patientId,
      provider_id: data.providerId,
      encounter_id: data.encounterId,
      tests: data.tests, // Array of test objects
      lab_id: selectedLab.id,
      lab_name: selectedLab.name,
      lab_address: selectedLab.address,
      diagnosis_codes: data.diagnosisCodes || [],
      clinical_notes: data.clinicalNotes,
      priority: data.priority || 'routine', // routine, urgent, stat
      fasting_required: data.tests?.some((t: any) => t.fasting) || false,
      status: 'pending',
      order_number: `ORD-${Date.now().toString().slice(-8)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Joined data
      patient: patient ? {
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth
      } : null,
      provider: provider ? {
        first_name: provider.first_name,
        last_name: provider.last_name,
        credentials: provider.credentials,
        npi: provider.npi
      } : null
    }

    labOrderStore.set(labOrder.id, labOrder)

    return NextResponse.json({ order: labOrder })
  } catch (error) {
    console.error('Error creating lab order:', error)
    return NextResponse.json({ error: 'Failed to create lab order' }, { status: 500 })
  }
}
