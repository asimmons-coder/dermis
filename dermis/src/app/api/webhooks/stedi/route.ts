/**
 * Stedi Webhook Handler
 *
 * Receives webhook events from Stedi for:
 * - 277CA: Claim acknowledgments (accepted/rejected)
 * - 835: Electronic Remittance Advice (payment details)
 *
 * Setup:
 * 1. Configure webhook URL in Stedi dashboard: https://your-domain.com/api/webhooks/stedi
 * 2. Set STEDI_WEBHOOK_SECRET environment variable
 *
 * @see https://www.stedi.com/docs/healthcare/receive-claim-responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// Types
// =============================================================================

interface StediWebhookEvent {
  eventType: '277CA' | '835' | 'CLAIM_STATUS_UPDATE'
  transactionId: string
  timestamp: string
  data: ClaimAcknowledgment | RemittanceAdvice | ClaimStatusUpdate
}

interface ClaimAcknowledgment {
  // 277CA data
  controlNumber: string
  patientControlNumber: string
  status: 'A' | 'R' | 'P' // Accepted, Rejected, Pending
  statusCategoryCode: string
  statusCategoryDescription: string
  statusCode?: string
  statusDescription?: string
  effectiveDate?: string
  errors?: Array<{
    code: string
    description: string
    location?: string
  }>
}

interface RemittanceAdvice {
  // 835 ERA data
  controlNumber: string
  checkNumber?: string
  checkDate?: string
  paymentAmount: string
  paymentMethodCode: string // 'CHK' = Check, 'ACH' = Electronic
  payerName: string
  payerId: string
  claims: Array<{
    patientControlNumber: string
    claimStatusCode: string // '1' = Processed, '2' = Denied, '4' = Denied (partial)
    chargeAmount: string
    paymentAmount: string
    patientResponsibilityAmount: string
    serviceLines: Array<{
      lineItemControlNumber: string
      procedureCode: string
      chargeAmount: string
      paymentAmount: string
      adjustments?: Array<{
        groupCode: string // 'CO' = Contractual, 'PR' = Patient Responsibility, 'OA' = Other
        reasonCode: string
        amount: string
      }>
    }>
  }>
}

interface ClaimStatusUpdate {
  patientControlNumber: string
  status: string
  statusCode: string
  effectiveDate: string
}

// =============================================================================
// Webhook Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (if configured)
    const webhookSecret = process.env.STEDI_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-stedi-signature')
      // TODO: Implement signature verification
      // For now, log warning if signature is missing
      if (!signature) {
        console.warn('[Stedi Webhook] Missing signature header')
      }
    }

    const event = (await request.json()) as StediWebhookEvent
    console.log(`[Stedi Webhook] Received ${event.eventType} event:`, event.transactionId)

    switch (event.eventType) {
      case '277CA':
        await handleClaimAcknowledgment(event.data as ClaimAcknowledgment)
        break

      case '835':
        await handleRemittanceAdvice(event.data as RemittanceAdvice)
        break

      case 'CLAIM_STATUS_UPDATE':
        await handleClaimStatusUpdate(event.data as ClaimStatusUpdate)
        break

      default:
        console.warn(`[Stedi Webhook] Unknown event type: ${event.eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stedi Webhook] Error processing event:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// =============================================================================
// Event Handlers
// =============================================================================

async function handleClaimAcknowledgment(ack: ClaimAcknowledgment) {
  console.log(`[277CA] Claim ${ack.patientControlNumber}: ${ack.status}`)

  // Map status to our internal status
  const statusMap: Record<string, string> = {
    A: 'accepted',
    R: 'rejected',
    P: 'pending',
  }

  // Update claim status in database
  // TODO: Create claims table and update status
  // For now, log the acknowledgment
  const logEntry = {
    type: '277CA',
    claim_number: ack.patientControlNumber,
    status: statusMap[ack.status] || 'unknown',
    status_code: ack.statusCode,
    status_description: ack.statusDescription,
    errors: ack.errors,
    received_at: new Date().toISOString(),
  }

  console.log('[277CA] Would update claim:', logEntry)

  // TODO: Implement when claims table exists
  // await supabase.from('claims').update({
  //   status: logEntry.status,
  //   acknowledgment_received_at: logEntry.received_at,
  //   acknowledgment_data: logEntry,
  // }).eq('claim_number', ack.patientControlNumber)
}

async function handleRemittanceAdvice(era: RemittanceAdvice) {
  console.log(`[835] Payment received: Check #${era.checkNumber}, Amount: $${era.paymentAmount}`)

  for (const claim of era.claims) {
    console.log(`[835] Claim ${claim.patientControlNumber}:`)
    console.log(`  - Charged: $${claim.chargeAmount}`)
    console.log(`  - Paid: $${claim.paymentAmount}`)
    console.log(`  - Patient Responsibility: $${claim.patientResponsibilityAmount}`)

    // Process adjustments for each service line
    for (const line of claim.serviceLines) {
      if (line.adjustments) {
        for (const adj of line.adjustments) {
          console.log(
            `  - Adjustment: ${adj.groupCode}-${adj.reasonCode}: $${adj.amount}`
          )
        }
      }
    }

    // TODO: Auto-post payment when claims table exists
    // await supabase.from('payments').insert({
    //   claim_number: claim.patientControlNumber,
    //   check_number: era.checkNumber,
    //   check_date: era.checkDate,
    //   payer_name: era.payerName,
    //   charge_amount: parseFloat(claim.chargeAmount),
    //   payment_amount: parseFloat(claim.paymentAmount),
    //   patient_responsibility: parseFloat(claim.patientResponsibilityAmount),
    //   service_lines: claim.serviceLines,
    //   posted_at: new Date().toISOString(),
    // })
  }
}

async function handleClaimStatusUpdate(update: ClaimStatusUpdate) {
  console.log(
    `[Claim Status] ${update.patientControlNumber}: ${update.status} (${update.statusCode})`
  )

  // TODO: Update claim status in database
}

// =============================================================================
// GET handler for webhook verification
// =============================================================================

export async function GET(request: NextRequest) {
  // Some webhook systems send a GET request to verify the endpoint
  return NextResponse.json({
    status: 'ok',
    message: 'Stedi webhook endpoint is active',
    timestamp: new Date().toISOString(),
  })
}
