import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mock eligibility responses based on common insurance plans
const ELIGIBILITY_RESPONSES = {
  active_good: {
    status: 'active',
    coverage_level: 'excellent',
    plan_name: 'Blue Cross PPO Gold',
    group_number: 'GRP-78542',
    effective_date: '2024-01-01',
    term_date: null,
    subscriber: {
      name: 'Self',
      relationship: 'Subscriber'
    },
    benefits: {
      copay_office_visit: 25,
      copay_specialist: 40,
      copay_urgent_care: 75,
      copay_er: 250,
      deductible_individual: 500,
      deductible_family: 1500,
      deductible_met: 425,
      out_of_pocket_max: 4000,
      out_of_pocket_met: 892,
      coinsurance: 20,
      prior_auth_required: ['Biologics', 'Phototherapy', 'Mohs Surgery > 2 stages']
    },
    dermatology_specific: {
      skin_cancer_screening: 'Covered 100% preventive',
      biopsy: 'Subject to deductible, then 20% coinsurance',
      cryotherapy: 'Covered, $40 copay',
      excision: 'Subject to deductible, then 20% coinsurance',
      mohs_surgery: 'Prior auth required, then covered 80%',
      phototherapy: 'Prior auth required, 30 sessions/year',
      biologics: 'Prior auth + step therapy required',
      cosmetic: 'Not covered'
    }
  },
  active_hmo: {
    status: 'active',
    coverage_level: 'good',
    plan_name: 'Aetna HMO Select',
    group_number: 'AET-33219',
    effective_date: '2024-01-01',
    term_date: null,
    subscriber: {
      name: 'Self',
      relationship: 'Subscriber'
    },
    benefits: {
      copay_office_visit: 20,
      copay_specialist: 35,
      copay_urgent_care: 50,
      copay_er: 200,
      deductible_individual: 1000,
      deductible_family: 3000,
      deductible_met: 750,
      out_of_pocket_max: 6000,
      out_of_pocket_met: 1250,
      coinsurance: 25,
      prior_auth_required: ['All procedures', 'Specialty medications', 'Out-of-network care']
    },
    dermatology_specific: {
      skin_cancer_screening: 'Covered 100% preventive',
      biopsy: 'Subject to deductible, then 25% coinsurance',
      cryotherapy: 'Covered, $35 copay',
      excision: 'Prior auth required',
      mohs_surgery: 'Prior auth required, referral needed',
      phototherapy: 'Prior auth required, 20 sessions/year',
      biologics: 'Prior auth + step therapy + peer-to-peer',
      cosmetic: 'Not covered'
    }
  },
  active_high_deductible: {
    status: 'active',
    coverage_level: 'basic',
    plan_name: 'UnitedHealthcare HDHP Bronze',
    group_number: 'UHC-90123',
    effective_date: '2024-01-01',
    term_date: null,
    subscriber: {
      name: 'Self',
      relationship: 'Subscriber'
    },
    benefits: {
      copay_office_visit: null, // Deductible applies
      copay_specialist: null,
      copay_urgent_care: null,
      copay_er: null,
      deductible_individual: 3000,
      deductible_family: 6000,
      deductible_met: 850,
      out_of_pocket_max: 7500,
      out_of_pocket_met: 850,
      coinsurance: 30,
      prior_auth_required: ['Biologics', 'Mohs Surgery', 'Hospital procedures']
    },
    dermatology_specific: {
      skin_cancer_screening: 'Covered 100% preventive',
      biopsy: 'Subject to $3000 deductible',
      cryotherapy: 'Subject to deductible',
      excision: 'Subject to deductible',
      mohs_surgery: 'Prior auth, subject to deductible',
      phototherapy: 'Prior auth required',
      biologics: 'Prior auth required, specialty pharmacy',
      cosmetic: 'Not covered'
    },
    hsa_eligible: true,
    hsa_balance: 2450
  },
  inactive: {
    status: 'inactive',
    coverage_level: 'none',
    plan_name: 'Cigna PPO',
    term_date: '2024-06-30',
    reason: 'Coverage terminated - non-payment',
    recommendation: 'Contact patient to verify current coverage or collect self-pay'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json()

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID required' }, { status: 400 })
    }

    // Fetch patient with insurance info
    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, date_of_birth, insurance_primary, insurance_secondary')
      .eq('id', patientId)
      .single()

    if (error || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200))

    // Determine which mock response to use based on insurance carrier
    const carrier = patient.insurance_primary?.carrier?.toLowerCase() || ''
    let eligibilityData

    if (carrier.includes('blue') || carrier.includes('bcbs')) {
      eligibilityData = ELIGIBILITY_RESPONSES.active_good
    } else if (carrier.includes('aetna') || carrier.includes('hmo')) {
      eligibilityData = ELIGIBILITY_RESPONSES.active_hmo
    } else if (carrier.includes('united') || carrier.includes('uhc')) {
      eligibilityData = ELIGIBILITY_RESPONSES.active_high_deductible
    } else if (!patient.insurance_primary?.carrier) {
      eligibilityData = ELIGIBILITY_RESPONSES.inactive
    } else {
      // Default to good coverage for demo
      eligibilityData = ELIGIBILITY_RESPONSES.active_good
    }

    // Merge with patient's actual insurance data
    const response = {
      verified_at: new Date().toISOString(),
      payer: patient.insurance_primary?.carrier || 'Unknown',
      payer_id: 'PAYERID-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      member_id: patient.insurance_primary?.member_id || 'Unknown',
      patient: {
        id: patient.id,
        name: `${patient.first_name} ${patient.last_name}`,
        dob: patient.date_of_birth
      },
      ...eligibilityData,
      // Override plan name with actual if available
      plan_name: patient.insurance_primary?.plan || eligibilityData.plan_name,
      clearinghouse: 'Availity',
      transaction_id: `270-${Date.now()}`
    }

    return NextResponse.json({ eligibility: response })
  } catch (error) {
    console.error('Eligibility check error:', error)
    return NextResponse.json({ error: 'Failed to verify eligibility' }, { status: 500 })
  }
}
