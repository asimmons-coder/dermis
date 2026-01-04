import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Fetch patient with insurance info using raw fetch to avoid caching
    const patientRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/patients?id=eq.${patientId}&select=id,first_name,last_name,insurance_primary,insurance_secondary`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: 'no-store',
      }
    )

    const patients = await patientRes.json()
    const patient = patients[0]

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Extract billing info from insurance_secondary if it's billing type
    const billingInfo = patient.insurance_secondary?.type === 'billing'
      ? patient.insurance_secondary
      : null

    // Get charges from checkout_transactions
    const txRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/checkout_transactions?patient_id=eq.${patientId}&order=created_at.desc`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: 'no-store',
      }
    )
    const transactions = await txRes.json()

    // Build charges array from transactions and outstanding charges
    const charges: any[] = []

    // Add outstanding charges from billing info
    if (billingInfo?.outstanding_charges) {
      billingInfo.outstanding_charges.forEach((charge: any, idx: number) => {
        charges.push({
          id: `outstanding-${idx}`,
          date: charge.date,
          description: charge.description,
          amount: charge.amount,
          type: charge.type || 'medical',
          status: 'pending',
        })
      })
    }

    // Add charges from checkout transactions
    if (Array.isArray(transactions)) {
      transactions.forEach((tx: any) => {
        // Add medical charges
        if (tx.medical_total > 0) {
          charges.push({
            id: `tx-medical-${tx.id}`,
            date: tx.created_at,
            description: `Office Visit - Medical Services`,
            amount: tx.medical_total,
            type: 'medical',
            status: tx.payment_status === 'paid' ? 'paid' : tx.payment_status === 'partial' ? 'partial' : 'pending',
            encounterId: tx.encounter_id,
          })
        }

        // Add cosmetic charges
        if (tx.cosmetic_total > 0) {
          charges.push({
            id: `tx-cosmetic-${tx.id}`,
            date: tx.created_at,
            description: `Cosmetic Services`,
            amount: tx.cosmetic_total,
            type: 'cosmetic',
            status: tx.payment_status === 'paid' ? 'paid' : tx.payment_status === 'partial' ? 'partial' : 'pending',
            encounterId: tx.encounter_id,
          })
        }

        // Add product charges
        if (tx.products_total > 0) {
          charges.push({
            id: `tx-products-${tx.id}`,
            date: tx.created_at,
            description: `Products`,
            amount: tx.products_total,
            type: 'product',
            status: tx.payment_status === 'paid' ? 'paid' : tx.payment_status === 'partial' ? 'partial' : 'pending',
            encounterId: tx.encounter_id,
          })
        }
      })
    }

    // Build payments array from transactions
    const payments: any[] = []
    if (Array.isArray(transactions)) {
      transactions.forEach((tx: any) => {
        if (tx.amount_paid > 0) {
          payments.push({
            id: `payment-${tx.id}`,
            date: tx.created_at,
            amount: tx.amount_paid,
            method: tx.payment_method || 'card',
            reference: tx.id.slice(0, 8),
            allocatedTo: 'Visit charges',
          })
        }
      })
    }

    // Calculate current balance
    const currentBalance = billingInfo?.account_balance || 0

    return NextResponse.json({
      patient: {
        id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
      },
      billing: {
        currentBalance,
        charges: charges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        payments: payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        insuranceInfo: patient.insurance_primary,
      },
    })
  } catch (error: any) {
    console.error('Error fetching billing data:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
