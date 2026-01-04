import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const {
      encounterId,
      patientId,
      providerId,
      practiceId,
      medicalCharges,
      medicalTotal,
      cosmeticCharges,
      cosmeticSubtotal,
      discountsApplied,
      totalDiscounts,
      cosmeticTotal,
      productCharges,
      productsTotal,
      previousBalance,
      totalAmount,
      amountPaid,
      amountRemaining,
      paymentMethod,
      paymentDetails,
      paymentStatus,
      notes,
    } = body

    // Get current user (staff member processing)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Insert checkout transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('checkout_transactions')
      .insert({
        practice_id: practiceId,
        encounter_id: encounterId,
        patient_id: patientId,
        provider_id: providerId,
        medical_charges: medicalCharges,
        medical_total: medicalTotal,
        cosmetic_charges: cosmeticCharges,
        cosmetic_subtotal: cosmeticSubtotal,
        discounts_applied: discountsApplied,
        total_discounts: totalDiscounts,
        cosmetic_total: cosmeticTotal,
        product_charges: productCharges,
        products_total: productsTotal,
        previous_balance: previousBalance,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        amount_remaining: amountRemaining,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        payment_status: paymentStatus,
        processed_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
        notes,
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // If payment made, add to payment history
    if (amountPaid > 0) {
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          transaction_id: transaction.id,
          patient_id: patientId,
          amount: amountPaid,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          notes,
        })

      if (paymentError) throw paymentError

      // Update patient account balance
      const { data: currentAccount } = await supabase
        .from('patient_accounts')
        .select('balance')
        .eq('patient_id', patientId)
        .maybeSingle()

      const newBalance = (currentAccount?.balance || 0) + amountRemaining

      if (currentAccount) {
        await supabase
          .from('patient_accounts')
          .update({
            balance: newBalance,
            last_payment_date: new Date().toISOString(),
            last_payment_amount: amountPaid,
          })
          .eq('patient_id', patientId)
      } else {
        await supabase.from('patient_accounts').insert({
          practice_id: practiceId,
          patient_id: patientId,
          balance: newBalance,
          last_payment_date: new Date().toISOString(),
          last_payment_amount: amountPaid,
        })
      }
    }

    // Update encounter billing status
    await supabase
      .from('encounters')
      .update({
        billing_status: paymentStatus === 'paid' ? 'paid' : 'coded',
      })
      .eq('id', encounterId)

    return NextResponse.json({ transaction })
  } catch (error: any) {
    console.error('Error processing checkout:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
