/**
 * Stedi Test Endpoint
 *
 * Standalone endpoint to test Stedi API connectivity without Supabase.
 * Uses mock patient data to verify the integration works.
 *
 * GET /api/stedi/test - Check configuration
 * POST /api/stedi/test - Run eligibility test with mock data
 */

import { NextRequest, NextResponse } from 'next/server'
import { isStediConfigured, getStediMode, stediRequest } from '@/lib/stedi/client'
import { checkEligibility, parseEligibilityResponse, PAYER_IDS } from '@/lib/stedi/eligibility'

// GET - Check if Stedi is configured
export async function GET() {
  const configured = isStediConfigured()
  const mode = configured ? getStediMode() : null

  return NextResponse.json({
    configured,
    mode,
    message: configured
      ? `Stedi is configured in ${mode} mode`
      : 'Stedi API key not configured. Set STEDI_API_KEY in .env.local',
    testEndpoint: 'POST /api/stedi/test to run eligibility test',
  })
}

// POST - Run eligibility test
export async function POST(request: NextRequest) {
  if (!isStediConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Stedi API key not configured',
        help: 'Add STEDI_API_KEY to your .env.local file',
      },
      { status: 400 }
    )
  }

  // Use test patient data or accept custom data
  let testData = {
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '19850315', // YYYYMMDD
    memberId: 'U1234567890', // Test member ID
    payerId: PAYER_IDS.AETNA, // Aetna
  }

  // Allow custom test data
  try {
    const body = await request.json()
    if (body.firstName) testData.firstName = body.firstName
    if (body.lastName) testData.lastName = body.lastName
    if (body.dateOfBirth) testData.dateOfBirth = body.dateOfBirth.replace(/-/g, '')
    if (body.memberId) testData.memberId = body.memberId
    if (body.payerId) testData.payerId = body.payerId
  } catch {
    // Use defaults if no body
  }

  console.log('[Stedi Test] Running eligibility check with:', testData)

  // Build request
  const controlNumber = `TEST${Date.now()}`
  const eligibilityRequest = {
    controlNumber,
    tradingPartnerServiceId: testData.payerId,
    provider: {
      organizationName: 'Novice Group Dermatology',
      npi: '1234567890',
    },
    subscriber: {
      memberId: testData.memberId,
      firstName: testData.firstName,
      lastName: testData.lastName,
      dateOfBirth: testData.dateOfBirth,
    },
    encounter: {
      dateOfService: new Date().toISOString().split('T')[0].replace(/-/g, ''),
      serviceTypeCodes: ['30'], // Health Benefit Plan Coverage
    },
  }

  const startTime = Date.now()

  try {
    const response = await checkEligibility(eligibilityRequest)
    const duration = Date.now() - startTime

    if (!response.success) {
      return NextResponse.json({
        success: false,
        mode: getStediMode(),
        duration: `${duration}ms`,
        error: response.error,
        request: eligibilityRequest,
      })
    }

    // Parse the response
    const parsed = parseEligibilityResponse(response.data!)

    return NextResponse.json({
      success: true,
      mode: getStediMode(),
      duration: `${duration}ms`,
      testData,
      parsed: {
        isActive: parsed.isActive,
        statusMessage: parsed.statusMessage,
        planType: parsed.planType,
        isHDHP: parsed.isHDHP,
        deductible: parsed.individual.deductible,
        copays: parsed.copays,
        coinsurance: `${parsed.individual.coinsurancePercent}%`,
      },
      raw: response.data,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({
      success: false,
      mode: getStediMode(),
      duration: `${duration}ms`,
      error: errorMessage,
      request: eligibilityRequest,
    })
  }
}
