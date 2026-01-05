import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory store for demo (prescriptions table may not exist)
// Use global to persist across hot reloads
const prescriptionStore: Map<string, any> = (global as any).prescriptionStore || new Map()
if (!(global as any).prescriptionStore) {
  (global as any).prescriptionStore = prescriptionStore
}

// Common dermatology medications for search
const MEDICATION_CATALOG = [
  // Retinoids
  { name: 'Tretinoin', strengths: ['0.025%', '0.05%', '0.1%'], forms: ['Cream', 'Gel'], category: 'Retinoid' },
  { name: 'Adapalene', strengths: ['0.1%', '0.3%'], forms: ['Gel', 'Cream'], category: 'Retinoid' },
  { name: 'Tazarotene', strengths: ['0.05%', '0.1%'], forms: ['Cream', 'Gel'], category: 'Retinoid' },
  { name: 'Isotretinoin', strengths: ['10mg', '20mg', '30mg', '40mg'], forms: ['Capsule'], category: 'Retinoid' },

  // Topical antibiotics
  { name: 'Clindamycin', strengths: ['1%'], forms: ['Gel', 'Lotion', 'Solution'], category: 'Antibiotic' },
  { name: 'Erythromycin', strengths: ['2%'], forms: ['Gel', 'Solution'], category: 'Antibiotic' },
  { name: 'Metronidazole', strengths: ['0.75%', '1%'], forms: ['Gel', 'Cream'], category: 'Antibiotic' },
  { name: 'Mupirocin', strengths: ['2%'], forms: ['Ointment', 'Cream'], category: 'Antibiotic' },

  // Oral antibiotics
  { name: 'Doxycycline', strengths: ['50mg', '100mg'], forms: ['Capsule', 'Tablet'], category: 'Antibiotic' },
  { name: 'Minocycline', strengths: ['50mg', '100mg'], forms: ['Capsule'], category: 'Antibiotic' },
  { name: 'Cephalexin', strengths: ['250mg', '500mg'], forms: ['Capsule'], category: 'Antibiotic' },

  // Antifungals
  { name: 'Ketoconazole', strengths: ['2%'], forms: ['Cream', 'Shampoo'], category: 'Antifungal' },
  { name: 'Terbinafine', strengths: ['1%', '250mg'], forms: ['Cream', 'Tablet'], category: 'Antifungal' },
  { name: 'Fluconazole', strengths: ['150mg', '200mg'], forms: ['Tablet'], category: 'Antifungal' },

  // Topical steroids
  { name: 'Triamcinolone', strengths: ['0.025%', '0.1%', '0.5%'], forms: ['Cream', 'Ointment'], category: 'Corticosteroid' },
  { name: 'Hydrocortisone', strengths: ['1%', '2.5%'], forms: ['Cream', 'Ointment'], category: 'Corticosteroid' },
  { name: 'Clobetasol', strengths: ['0.05%'], forms: ['Cream', 'Ointment', 'Foam'], category: 'Corticosteroid' },
  { name: 'Betamethasone', strengths: ['0.05%', '0.1%'], forms: ['Cream', 'Ointment', 'Lotion'], category: 'Corticosteroid' },

  // Acne treatments
  { name: 'Benzoyl Peroxide', strengths: ['2.5%', '5%', '10%'], forms: ['Gel', 'Wash', 'Cream'], category: 'Acne' },
  { name: 'Azelaic Acid', strengths: ['15%', '20%'], forms: ['Gel', 'Foam'], category: 'Acne' },
  { name: 'Spironolactone', strengths: ['25mg', '50mg', '100mg'], forms: ['Tablet'], category: 'Acne' },

  // Rosacea
  { name: 'Ivermectin', strengths: ['1%'], forms: ['Cream'], category: 'Rosacea' },
  { name: 'Brimonidine', strengths: ['0.33%'], forms: ['Gel'], category: 'Rosacea' },
  { name: 'Oxymetazoline', strengths: ['1%'], forms: ['Cream'], category: 'Rosacea' },

  // Psoriasis/Eczema
  { name: 'Calcipotriene', strengths: ['0.005%'], forms: ['Cream', 'Ointment', 'Foam'], category: 'Psoriasis' },
  { name: 'Tacrolimus', strengths: ['0.03%', '0.1%'], forms: ['Ointment'], category: 'Immunomodulator' },
  { name: 'Pimecrolimus', strengths: ['1%'], forms: ['Cream'], category: 'Immunomodulator' },

  // Antihistamines
  { name: 'Hydroxyzine', strengths: ['10mg', '25mg', '50mg'], forms: ['Tablet', 'Capsule'], category: 'Antihistamine' },
  { name: 'Cetirizine', strengths: ['5mg', '10mg'], forms: ['Tablet'], category: 'Antihistamine' },

  // Antivirals
  { name: 'Valacyclovir', strengths: ['500mg', '1g'], forms: ['Tablet'], category: 'Antiviral' },
  { name: 'Acyclovir', strengths: ['200mg', '400mg', '800mg', '5%'], forms: ['Capsule', 'Tablet', 'Cream'], category: 'Antiviral' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')
  const search = searchParams.get('search')

  // If searching for medications
  if (search !== null) {
    const query = search.toLowerCase()
    const results = MEDICATION_CATALOG.filter(med =>
      med.name.toLowerCase().includes(query) ||
      med.category.toLowerCase().includes(query)
    ).slice(0, 10)

    return NextResponse.json({ medications: results })
  }

  // Get prescriptions for a patient
  if (patientId) {
    const prescriptions = Array.from(prescriptionStore.values())
      .filter(rx => rx.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ prescriptions })
  }

  // Get all prescriptions
  const prescriptions = Array.from(prescriptionStore.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ prescriptions })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Get patient info for pharmacy
    let patient = null
    if (data.patientId) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, first_name, last_name, preferred_pharmacy')
        .eq('id', data.patientId)
        .single()
      patient = patientData
    }

    // Get provider info
    let provider = null
    if (data.providerId) {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id, first_name, last_name, credentials, dea_number')
        .eq('id', data.providerId)
        .single()
      provider = providerData
    }

    const pharmacy = data.pharmacy || patient?.preferred_pharmacy || {}

    const prescription = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patient_id: data.patientId,
      provider_id: data.providerId,
      encounter_id: data.encounterId,
      medication_name: data.medicationName,
      medication_strength: data.strength,
      medication_form: data.form,
      sig: data.sig,
      quantity: data.quantity,
      quantity_unit: data.quantityUnit || 'each',
      days_supply: data.daysSupply,
      refills: data.refills || 0,
      daw: data.daw || false,
      pharmacy_name: pharmacy.name || data.pharmacyName,
      pharmacy_phone: pharmacy.phone || data.pharmacyPhone,
      pharmacy_address: pharmacy.address || data.pharmacyAddress,
      status: 'pending',
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Include joined data for display
      patient: patient ? { first_name: patient.first_name, last_name: patient.last_name } : null,
      provider: provider ? {
        first_name: provider.first_name,
        last_name: provider.last_name,
        credentials: provider.credentials,
        dea_number: provider.dea_number
      } : null
    }

    prescriptionStore.set(prescription.id, prescription)

    return NextResponse.json({ prescription })
  } catch (error) {
    console.error('Error creating prescription:', error)
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 })
  }
}
