import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { encounterId: string } }
) {
  const supabase = await createClient()
  const { encounterId } = params

  try {
    // Fetch encounter with patient, provider info
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .select(`
        *,
        patient:patients(
          id,
          first_name,
          last_name,
          middle_name,
          date_of_birth,
          insurance_primary,
          insurance_secondary
        ),
        provider:providers(id, first_name, last_name, credentials)
      `)
      .eq('id', encounterId)
      .single()

    if (encounterError) throw encounterError

    // Fetch cosmetic treatments for this encounter
    const { data: cosmeticTreatments } = await supabase
      .from('cosmetic_treatments')
      .select('*')
      .eq('encounter_id', encounterId)

    // Extract billing info from insurance_secondary (if type === 'billing')
    const patient = encounter.patient
    const billingInfo = patient?.insurance_secondary?.type === 'billing'
      ? patient.insurance_secondary
      : null

    // Extract insurance details
    const insurance = patient?.insurance_primary || null
    const hasInsurance = insurance && insurance.carrier

    // Calculate insurance details
    const insuranceDetails = hasInsurance ? {
      carrier: insurance.carrier,
      plan: insurance.plan,
      memberId: insurance.memberId,
      copay: insurance.copay_specialist || 35,
      deductibleTotal: insurance.deductible_total || 0,
      deductibleMet: insurance.deductible_met || 0,
      deductibleRemaining: Math.max(0, (insurance.deductible_total || 0) - (insurance.deductible_met || 0)),
      coinsurancePercent: insurance.coinsurance_percent || 0,
      isDeductibleMet: (insurance.deductible_met || 0) >= (insurance.deductible_total || 0)
    } : null

    // Fetch fee schedule for CPT codes
    const cptCodes = (encounter.cpt_codes as any[]) || []
    const cptCodesList = cptCodes.map((c: any) => c.code)

    const { data: feeSchedule } = await supabase
      .from('fee_schedule')
      .select('*')
      .eq('practice_id', encounter.practice_id)
      .in('cpt_code', cptCodesList)

    // Check if checkout transaction already exists
    const { data: existingTransaction } = await supabase
      .from('checkout_transactions')
      .select('*')
      .eq('encounter_id', encounterId)
      .maybeSingle()

    // Build patient account info
    const patientAccount = {
      balance: billingInfo?.account_balance || 0,
      outstandingCharges: billingInfo?.outstanding_charges || [],
      lastPaymentDate: billingInfo?.last_payment_date || null
    }

    return NextResponse.json({
      encounter,
      cosmeticTreatments: cosmeticTreatments || [],
      patientAccount,
      insuranceDetails,
      hasInsurance,
      feeSchedule: feeSchedule || [],
      existingTransaction,
    })
  } catch (error: any) {
    console.error('Error fetching checkout data:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
