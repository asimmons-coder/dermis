import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const patientId = params.id

  try {
    // Fetch patient with insurance information
    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, insurance_primary, insurance_secondary')
      .eq('id', patientId)
      .single()

    if (error) throw error

    // If no insurance on file, return null
    if (!patient.insurance_primary || Object.keys(patient.insurance_primary).length === 0) {
      return NextResponse.json({
        verificationData: null
      })
    }

    // Mock verification data based on insurance on file
    // In production, this would call a clearinghouse API (Availity, Change Healthcare, etc.)
    const insuranceData = patient.insurance_primary as any

    // Generate mock verification data
    const mockVerificationData = generateMockVerification(insuranceData)

    return NextResponse.json({
      verificationData: mockVerificationData
    })
  } catch (error: any) {
    console.error('Error verifying insurance:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

function generateMockVerification(insuranceData: any) {
  const carrier = insuranceData.carrier || 'Unknown Carrier'
  const memberId = insuranceData.memberId || insuranceData.member_id || 'N/A'
  const groupNumber = insuranceData.groupId || insuranceData.groupNumber || insuranceData.group_number || undefined
  const planName = insuranceData.plan || insuranceData.planName || undefined

  // Simulate different scenarios based on carrier
  const scenarios = {
    'Blue Cross Blue Shield': {
      status: 'active',
      copay: {
        specialist: 35,
        primary: 20
      },
      deductible: {
        individual: 1500,
        remaining: 750
      },
      priorAuthRequired: true,
      lastVerified: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      effectiveDate: '2026-01-01',
      terminationDate: undefined
    },
    'Aetna': {
      status: 'active',
      copay: {
        specialist: 40,
        primary: 25
      },
      deductible: {
        individual: 2000,
        remaining: 1200
      },
      priorAuthRequired: false,
      lastVerified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      effectiveDate: '2026-01-01',
      terminationDate: undefined
    },
    'UnitedHealthcare': {
      status: 'active',
      copay: {
        specialist: 50,
        primary: 30
      },
      deductible: {
        individual: 3000,
        remaining: 2100
      },
      priorAuthRequired: true,
      lastVerified: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago (outdated)
      effectiveDate: '2025-12-01',
      terminationDate: undefined
    },
    'Medicare': {
      status: 'active',
      copay: {
        specialist: 20,
        primary: 0
      },
      deductible: {
        individual: 240,
        remaining: 0
      },
      priorAuthRequired: false,
      lastVerified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      effectiveDate: '2024-01-01',
      terminationDate: undefined
    }
  }

  // Check if we have a specific scenario for this carrier
  const scenario = scenarios[carrier as keyof typeof scenarios]

  if (scenario) {
    return {
      carrier,
      memberId,
      groupNumber,
      planName,
      ...scenario
    }
  }

  // Default scenario for unknown carriers
  return {
    carrier,
    memberId,
    groupNumber,
    planName,
    status: 'active' as const,
    copay: {
      specialist: 25,
      primary: 15
    },
    deductible: {
      individual: 1000,
      remaining: 500
    },
    priorAuthRequired: false,
    lastVerified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    effectiveDate: '2026-01-01',
    terminationDate: undefined
  }
}
