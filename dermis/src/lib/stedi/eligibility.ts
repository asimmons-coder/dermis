/**
 * Stedi Eligibility Service
 *
 * Real-time insurance eligibility verification using Stedi's 270/271 API.
 * Replaces the mock eligibility system with real payer connections.
 *
 * @see https://www.stedi.com/docs/healthcare/send-eligibility-checks
 */

import { stediRequest, type StediResponse } from './client'

// =============================================================================
// Request Types (270 - Eligibility Inquiry)
// =============================================================================

export interface EligibilityRequest {
  // Control information
  controlNumber: string
  tradingPartnerServiceId: string // Payer ID

  // Provider making the request
  provider: {
    organizationName: string
    npi: string
    // Address for the provider
    address?: {
      address1: string
      city: string
      state: string
      postalCode: string
    }
  }

  // Subscriber (primary insurance holder)
  subscriber: {
    memberId: string
    firstName: string
    lastName: string
    dateOfBirth: string // YYYYMMDD format
    gender?: 'M' | 'F' | 'U'
    // Address (optional but recommended)
    address?: {
      address1: string
      city: string
      state: string
      postalCode: string
    }
  }

  // Dependent (if patient is not the subscriber)
  dependent?: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender?: 'M' | 'F' | 'U'
    relationshipCode: string // '01' = Spouse, '19' = Child, etc.
  }

  // What we're checking eligibility for
  encounter: {
    dateOfService: string // YYYYMMDD format
    serviceTypeCodes: string[] // '30' = Health Benefit Plan Coverage
  }
}

// =============================================================================
// Response Types (271 - Eligibility Response)
// =============================================================================

export interface EligibilityResponse {
  meta: {
    traceId: string
    senderId: string
    submitterId: string
    applicationMode: 'test' | 'production'
  }

  // Plan information
  planInformation?: {
    planNumber?: string
    groupNumber?: string
    groupName?: string
  }

  // Subscriber details from payer
  subscriber?: {
    memberId: string
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender?: string
    address?: {
      address1?: string
      city?: string
      state?: string
      postalCode?: string
    }
  }

  // Coverage status
  planStatus?: Array<{
    statusCode: string // '1' = Active, '6' = Inactive
    status: string
    planDetails?: string
    serviceTypeCodes?: string[]
  }>

  // Benefits information
  benefitsInformation?: BenefitInfo[]

  // Errors if any
  errors?: Array<{
    code: string
    description: string
    followupAction?: string
  }>
}

export interface BenefitInfo {
  code: string // Benefit type code
  name: string // Human-readable name
  coverageLevelCode?: string // 'IND' = Individual, 'FAM' = Family
  coverageLevel?: string
  serviceTypeCodes?: string[]
  serviceTypes?: string[]
  timeQualifierCode?: string
  timeQualifier?: string // 'Calendar Year', 'Remaining', etc.
  benefitAmount?: string
  benefitPercent?: string
  inPlanNetworkIndicatorCode?: string // 'Y' = In-network, 'N' = Out-of-network
  inPlanNetworkIndicator?: string

  // Additional benefit details
  additionalInformation?: Array<{
    description: string
  }>
}

// =============================================================================
// Parsed/Normalized Response
// =============================================================================

export interface ParsedEligibility {
  // Status
  isActive: boolean
  statusMessage: string

  // Plan info
  planName?: string
  groupNumber?: string
  groupName?: string
  memberId: string

  // Subscriber
  subscriberName: string

  // Benefits - Individual In-Network
  individual: {
    deductible: {
      total: number
      remaining: number
      met: number
    }
    outOfPocketMax: {
      total: number
      remaining: number
      met: number
    }
    coinsurancePercent: number // Patient's responsibility (e.g., 20)
  }

  // Copays by service type
  copays: {
    officeVisit?: number
    specialist?: number
    urgentCare?: number
    emergencyRoom?: number
    preventive?: number
  }

  // Coverage flags
  coverage: {
    preventiveCare: boolean
    dermatologyVisits: boolean
    surgicalProcedures: boolean
    diagnosticLab: boolean
    priorAuthRequired: boolean
  }

  // Plan type detection
  planType: 'PPO' | 'HMO' | 'HDHP' | 'EPO' | 'POS' | 'OTHER'
  isHDHP: boolean // High Deductible Health Plan (HSA eligible)

  // Raw data for reference
  raw: EligibilityResponse
}

// =============================================================================
// Service Type Codes (Common ones for dermatology)
// =============================================================================

export const SERVICE_TYPE_CODES = {
  HEALTH_BENEFIT_PLAN: '30', // General coverage
  MEDICAL_CARE: '1',
  SURGICAL: '2',
  CONSULTATION: '3',
  DIAGNOSTIC_XRAY: '4',
  DIAGNOSTIC_LAB: '5',
  PHYSICIAN_VISIT_OFFICE: '98',
  SPECIALIST: 'A4',
  PREVENTIVE_CARE: 'A7',
  DERMATOLOGY: 'DG', // If supported by payer
  OUTPATIENT: 'O', // Outpatient facility
  PROFESSIONAL_PHYSICIAN: '96',
}

// =============================================================================
// Payer IDs (Common ones - would be expanded)
// =============================================================================

export const PAYER_IDS: Record<string, string> = {
  // Major national payers
  AETNA: '60054',
  ANTHEM: '47198',
  BCBS: '00060', // Varies by state
  CIGNA: '62308',
  HUMANA: '61101',
  UNITED: '87726',
  MEDICARE: 'CMS',

  // For testing
  STEDI_TEST: 'STEDI_TEST',
}

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Check insurance eligibility in real-time
 */
export async function checkEligibility(
  request: EligibilityRequest
): Promise<StediResponse<EligibilityResponse>> {
  // Build the Stedi request payload
  const payload = {
    controlNumber: request.controlNumber,
    tradingPartnerServiceId: request.tradingPartnerServiceId,
    provider: {
      organizationName: request.provider.organizationName,
      npi: request.provider.npi,
      ...(request.provider.address && {
        address: request.provider.address,
      }),
    },
    subscriber: {
      memberId: request.subscriber.memberId,
      firstName: request.subscriber.firstName,
      lastName: request.subscriber.lastName,
      dateOfBirth: request.subscriber.dateOfBirth,
      ...(request.subscriber.gender && { gender: request.subscriber.gender }),
      ...(request.subscriber.address && { address: request.subscriber.address }),
    },
    ...(request.dependent && {
      dependents: [
        {
          firstName: request.dependent.firstName,
          lastName: request.dependent.lastName,
          dateOfBirth: request.dependent.dateOfBirth,
          gender: request.dependent.gender,
          relationshipCode: request.dependent.relationshipCode,
        },
      ],
    }),
    encounter: {
      dateOfService: request.encounter.dateOfService,
      serviceTypeCodes: request.encounter.serviceTypeCodes,
    },
  }

  return stediRequest<EligibilityResponse>({
    endpoint: '/change/medicalnetwork/eligibility/v3',
    method: 'POST',
    body: payload,
  })
}

/**
 * Parse the raw eligibility response into a normalized format
 */
export function parseEligibilityResponse(
  response: EligibilityResponse
): ParsedEligibility {
  const benefits = response.benefitsInformation || []
  const planStatus = response.planStatus?.[0]

  // Check if coverage is active
  const isActive = planStatus?.statusCode === '1' ||
    planStatus?.status?.toLowerCase().includes('active') ||
    false

  // Extract deductible info (in-network, individual)
  const deductibleInfo = findBenefit(benefits, 'C', 'IND', 'Y') // C = Deductible
  const deductibleRemaining = findBenefit(benefits, 'C', 'IND', 'Y', '29') // 29 = Remaining
  const deductibleMet = findBenefit(benefits, 'C', 'IND', 'Y', '32') // 32 = Year to Date

  // Extract out-of-pocket max
  const oopInfo = findBenefit(benefits, 'G', 'IND', 'Y') // G = Out of Pocket Stop Loss
  const oopRemaining = findBenefit(benefits, 'G', 'IND', 'Y', '29')

  // Extract coinsurance
  const coinsurance = findBenefit(benefits, 'A', 'IND', 'Y') // A = Co-Insurance

  // Extract copays
  const officeVisitCopay = findCopay(benefits, ['98', '1']) // Office visit or medical care
  const specialistCopay = findCopay(benefits, ['A4', '3']) // Specialist or consultation

  // Determine plan type
  const planType = detectPlanType(response)
  const deductibleTotal = parseAmount(deductibleInfo?.benefitAmount)
  const isHDHP = deductibleTotal >= 1600 // 2024 HDHP threshold for individual

  return {
    isActive,
    statusMessage: planStatus?.status || (isActive ? 'Active Coverage' : 'Inactive or Unknown'),

    planName: response.planInformation?.planNumber,
    groupNumber: response.planInformation?.groupNumber,
    groupName: response.planInformation?.groupName,
    memberId: response.subscriber?.memberId || '',

    subscriberName: response.subscriber
      ? `${response.subscriber.firstName} ${response.subscriber.lastName}`
      : '',

    individual: {
      deductible: {
        total: deductibleTotal,
        remaining: parseAmount(deductibleRemaining?.benefitAmount) || deductibleTotal,
        met: parseAmount(deductibleMet?.benefitAmount) || 0,
      },
      outOfPocketMax: {
        total: parseAmount(oopInfo?.benefitAmount),
        remaining: parseAmount(oopRemaining?.benefitAmount),
        met: 0,
      },
      coinsurancePercent: parsePercent(coinsurance?.benefitPercent) || 20,
    },

    copays: {
      officeVisit: parseAmount(officeVisitCopay?.benefitAmount),
      specialist: parseAmount(specialistCopay?.benefitAmount),
    },

    coverage: {
      preventiveCare: hasCoverage(benefits, 'A7'),
      dermatologyVisits: hasCoverage(benefits, ['98', '1', 'A4']),
      surgicalProcedures: hasCoverage(benefits, '2'),
      diagnosticLab: hasCoverage(benefits, '5'),
      priorAuthRequired: requiresPriorAuth(benefits),
    },

    planType,
    isHDHP,

    raw: response,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function findBenefit(
  benefits: BenefitInfo[],
  code: string,
  coverageLevel?: string,
  inNetwork?: string,
  timeQualifier?: string
): BenefitInfo | undefined {
  return benefits.find(b =>
    b.code === code &&
    (!coverageLevel || b.coverageLevelCode === coverageLevel) &&
    (!inNetwork || b.inPlanNetworkIndicatorCode === inNetwork) &&
    (!timeQualifier || b.timeQualifierCode === timeQualifier)
  )
}

function findCopay(benefits: BenefitInfo[], serviceTypeCodes: string[]): BenefitInfo | undefined {
  return benefits.find(b =>
    b.code === 'B' && // B = Co-Payment
    b.inPlanNetworkIndicatorCode === 'Y' &&
    b.serviceTypeCodes?.some(s => serviceTypeCodes.includes(s))
  )
}

function hasCoverage(benefits: BenefitInfo[], serviceTypeCodes: string | string[]): boolean {
  const codes = Array.isArray(serviceTypeCodes) ? serviceTypeCodes : [serviceTypeCodes]
  return benefits.some(b =>
    b.code === '1' && // 1 = Active Coverage
    b.serviceTypeCodes?.some(s => codes.includes(s))
  )
}

function requiresPriorAuth(benefits: BenefitInfo[]): boolean {
  return benefits.some(b =>
    b.additionalInformation?.some(info =>
      info.description.toLowerCase().includes('prior auth') ||
      info.description.toLowerCase().includes('preauthorization')
    )
  )
}

function parseAmount(amount?: string): number {
  if (!amount) return 0
  const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

function parsePercent(percent?: string): number {
  if (!percent) return 0
  const parsed = parseFloat(percent.replace(/[^0-9.]/g, ''))
  return isNaN(parsed) ? 0 : parsed * 100 // Convert decimal to percentage
}

function detectPlanType(response: EligibilityResponse): ParsedEligibility['planType'] {
  const planName = response.planInformation?.planNumber?.toUpperCase() || ''
  const groupName = response.planInformation?.groupName?.toUpperCase() || ''
  const combined = planName + ' ' + groupName

  if (combined.includes('HDHP') || combined.includes('HSA')) return 'HDHP'
  if (combined.includes('HMO')) return 'HMO'
  if (combined.includes('PPO')) return 'PPO'
  if (combined.includes('EPO')) return 'EPO'
  if (combined.includes('POS')) return 'POS'

  return 'OTHER'
}

// =============================================================================
// Convenience Function for Dermis
// =============================================================================

/**
 * Quick eligibility check for a patient - simplified interface for dermis
 */
export async function checkPatientEligibility(params: {
  // Patient info
  patientFirstName: string
  patientLastName: string
  patientDOB: string // YYYY-MM-DD format
  patientGender?: 'M' | 'F'

  // Insurance info
  memberId: string
  payerId: string // Stedi trading partner ID

  // Provider info
  providerName: string
  providerNPI: string

  // Optional
  dateOfService?: string // YYYY-MM-DD, defaults to today
}): Promise<{
  success: boolean
  eligibility?: ParsedEligibility
  error?: string
}> {
  // Generate control number
  const controlNumber = `DMR${Date.now()}`

  // Format dates to YYYYMMDD
  const formatDate = (date: string) => date.replace(/-/g, '')
  const dob = formatDate(params.patientDOB)
  const serviceDate = formatDate(params.dateOfService || new Date().toISOString().split('T')[0])

  const request: EligibilityRequest = {
    controlNumber,
    tradingPartnerServiceId: params.payerId,
    provider: {
      organizationName: params.providerName,
      npi: params.providerNPI,
    },
    subscriber: {
      memberId: params.memberId,
      firstName: params.patientFirstName,
      lastName: params.patientLastName,
      dateOfBirth: dob,
      gender: params.patientGender,
    },
    encounter: {
      dateOfService: serviceDate,
      serviceTypeCodes: [
        SERVICE_TYPE_CODES.HEALTH_BENEFIT_PLAN,
        SERVICE_TYPE_CODES.PHYSICIAN_VISIT_OFFICE,
        SERVICE_TYPE_CODES.SPECIALIST,
        SERVICE_TYPE_CODES.SURGICAL,
        SERVICE_TYPE_CODES.DIAGNOSTIC_LAB,
      ],
    },
  }

  const response = await checkEligibility(request)

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error?.message || 'Failed to check eligibility',
    }
  }

  const parsed = parseEligibilityResponse(response.data)

  return {
    success: true,
    eligibility: parsed,
  }
}
