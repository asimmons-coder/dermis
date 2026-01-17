/**
 * Stedi Claims Service
 *
 * Professional claim submission (837P) via Stedi clearinghouse.
 * Handles claim creation, submission, and status tracking.
 *
 * NOTE: Requires production API key - test keys only support eligibility.
 *
 * @see https://www.stedi.com/docs/healthcare/submit-professional-claims
 */

import { stediRequest, getStediMode, type StediResponse } from './client'

// =============================================================================
// Types
// =============================================================================

export interface ClaimSubmitter {
  organizationName: string
  contactInformation: {
    name: string
    phoneNumber: string
    email?: string
  }
}

export interface ClaimReceiver {
  organizationName: string
}

export interface ClaimProvider {
  providerType: 'BillingProvider' | 'RenderingProvider' | 'ReferringProvider'
  npi: string
  employerId?: string // EIN/Tax ID
  organizationName?: string
  lastName?: string
  firstName?: string
  address: {
    address1: string
    city: string
    state: string
    postalCode: string
  }
  contactInformation?: {
    phoneNumber: string
  }
}

export interface ClaimSubscriber {
  memberId: string
  paymentResponsibilityLevelCode: 'P' | 'S' | 'T' // Primary, Secondary, Tertiary
  firstName: string
  lastName: string
  gender: 'M' | 'F' | 'U'
  dateOfBirth: string // YYYYMMDD
  policyNumber?: string
  address?: {
    address1: string
    city: string
    state: string
    postalCode: string
  }
}

export interface ClaimDependent {
  firstName: string
  lastName: string
  gender: 'M' | 'F' | 'U'
  dateOfBirth: string
  relationshipToSubscriberCode: string // '01' = Spouse, '19' = Child, etc.
}

export interface ClaimServiceLine {
  serviceDate: string // YYYYMMDD
  professionalService: {
    procedureCode: string // CPT code
    procedureModifiers?: string[] // Up to 4 modifiers
    lineItemChargeAmount: string // Amount as string e.g., "150.00"
    measurementUnit: 'UN' // Units
    serviceUnitCount: string // Number of units as string
    placeOfServiceCode: string // '11' = Office, '22' = Outpatient, etc.
    diagnosisCodePointers: string[] // References to diagnosis codes ['1', '2']
  }
  // Unique ID for correlating with ERA
  lineItemControlNumber?: string
}

export interface ClaimInformation {
  claimFilingCode: string // '12' = PPO, '13' = POS, 'MB' = Medicare B, etc.
  patientControlNumber: string // Your internal claim ID
  claimChargeAmount: string // Total charge as string
  placeOfServiceCode: string // '11' = Office
  claimFrequencyCode: '1' | '7' | '8' // 1 = Original, 7 = Replacement, 8 = Void
  signatureIndicator: 'Y' | 'N'
  releaseInformationCode: 'Y' | 'I' // Y = Yes, I = Informed Consent
  planParticipationCode: 'A' | 'B' | 'C' // A = Assigned, B = Not Assigned
  benefitsAssignmentCertificationIndicator: 'Y' | 'N'
  healthCareCodeInformation: Array<{
    diagnosisTypeCode: 'ABK' | 'ABF' // ABK = ICD-10, ABF = ICD-10 Admitting
    diagnosisCode: string // ICD-10 code without decimal
  }>
  serviceLines: ClaimServiceLine[]
}

export interface ProfessionalClaimRequest {
  controlNumber: string
  tradingPartnerServiceId: string // Payer ID
  submitter: ClaimSubmitter
  receiver: ClaimReceiver
  subscriber: ClaimSubscriber
  dependent?: ClaimDependent
  providers: ClaimProvider[]
  claimInformation: ClaimInformation
}

export interface ClaimSubmissionResponse {
  status: 'SUCCESS' | 'ERROR' | 'PENDING'
  claimId?: string
  controlNumber: string
  pdfUrl?: string // Link to 1500 form
  errors?: Array<{
    field: string
    message: string
    code?: string
  }>
  warnings?: Array<{
    field: string
    message: string
  }>
  meta?: {
    traceId: string
    submittedAt: string
  }
}

// =============================================================================
// Place of Service Codes (Common for dermatology)
// =============================================================================

export const PLACE_OF_SERVICE = {
  OFFICE: '11',
  HOME: '12',
  OUTPATIENT_HOSPITAL: '22',
  AMBULATORY_SURGICAL_CENTER: '24',
  URGENT_CARE: '20',
  TELEHEALTH: '02',
} as const

// =============================================================================
// Claim Filing Codes
// =============================================================================

export const CLAIM_FILING_CODES = {
  MEDICARE_PART_B: 'MB',
  MEDICAID: 'MC',
  COMMERCIAL_PPO: '12',
  COMMERCIAL_POS: '13',
  COMMERCIAL_HMO: '14',
  COMMERCIAL_EPO: '16',
  BCBS: 'BL',
  CHAMPUS: 'CH',
  WORKERS_COMP: 'WC',
  SELF_PAY: '09',
} as const

// =============================================================================
// Submit Claim
// =============================================================================

/**
 * Submit a professional claim (837P) to a payer via Stedi
 *
 * NOTE: Requires production API key. Will return error in test mode.
 */
export async function submitProfessionalClaim(
  claim: ProfessionalClaimRequest
): Promise<StediResponse<ClaimSubmissionResponse>> {
  // Check if we're in test mode
  if (getStediMode() === 'test') {
    return {
      success: false,
      error: {
        code: 'TEST_MODE',
        message: 'Claims submission requires a production API key. Test keys only support eligibility checks.',
      },
    }
  }

  return stediRequest<ClaimSubmissionResponse>({
    endpoint: '/change/medicalnetwork/professionalclaims/v3/submission',
    method: 'POST',
    body: claim,
    headers: {
      'Stedi-Validation': 'snip', // Enable enhanced validation
    },
  })
}

// =============================================================================
// Build Claim from Dermis Data
// =============================================================================

export interface DermisCheckoutData {
  // Practice/Provider info
  practice: {
    name: string
    npi: string
    taxId: string
    address: {
      street: string
      city: string
      state: string
      zip: string
    }
    phone: string
  }
  provider: {
    npi: string
    firstName: string
    lastName: string
  }

  // Patient/Insurance info
  patient: {
    firstName: string
    lastName: string
    dob: string // YYYY-MM-DD
    gender: 'M' | 'F'
    address?: {
      street: string
      city: string
      state: string
      zip: string
    }
  }
  insurance: {
    payerId: string
    payerName: string
    memberId: string
    groupNumber?: string
    subscriberIsPatient: boolean
    subscriber?: {
      firstName: string
      lastName: string
      dob: string
      gender: 'M' | 'F'
    }
    relationshipCode?: string // If patient is dependent
  }

  // Encounter/Charges
  encounter: {
    id: string
    dateOfService: string // YYYY-MM-DD
    placeOfService: string
  }
  diagnoses: Array<{
    code: string // ICD-10 without decimal
    isPrimary: boolean
  }>
  charges: Array<{
    cptCode: string
    modifiers?: string[]
    units: number
    fee: number
    diagnosisPointers: number[] // 1-based index into diagnoses array
  }>
}

/**
 * Build a Stedi claim request from dermis checkout data
 */
export function buildClaimFromCheckout(
  data: DermisCheckoutData,
  claimNumber: string
): ProfessionalClaimRequest {
  const controlNumber = `DMR${Date.now().toString().slice(-9)}`
  const formatDate = (date: string) => date.replace(/-/g, '')

  // Calculate total charge
  const totalCharge = data.charges.reduce((sum, c) => sum + c.fee * c.units, 0)

  // Build service lines
  const serviceLines: ClaimServiceLine[] = data.charges.map((charge, idx) => ({
    serviceDate: formatDate(data.encounter.dateOfService),
    professionalService: {
      procedureCode: charge.cptCode,
      procedureModifiers: charge.modifiers,
      lineItemChargeAmount: (charge.fee * charge.units).toFixed(2),
      measurementUnit: 'UN',
      serviceUnitCount: charge.units.toString(),
      placeOfServiceCode: data.encounter.placeOfService,
      diagnosisCodePointers: charge.diagnosisPointers.map(p => p.toString()),
    },
    lineItemControlNumber: `${claimNumber}-${idx + 1}`,
  }))

  // Determine subscriber vs dependent
  const isSubscriber = data.insurance.subscriberIsPatient
  const subscriber: ClaimSubscriber = isSubscriber
    ? {
        memberId: data.insurance.memberId,
        paymentResponsibilityLevelCode: 'P',
        firstName: data.patient.firstName,
        lastName: data.patient.lastName,
        gender: data.patient.gender,
        dateOfBirth: formatDate(data.patient.dob),
        address: data.patient.address
          ? {
              address1: data.patient.address.street,
              city: data.patient.address.city,
              state: data.patient.address.state,
              postalCode: data.patient.address.zip,
            }
          : undefined,
      }
    : {
        memberId: data.insurance.memberId,
        paymentResponsibilityLevelCode: 'P',
        firstName: data.insurance.subscriber!.firstName,
        lastName: data.insurance.subscriber!.lastName,
        gender: data.insurance.subscriber!.gender,
        dateOfBirth: formatDate(data.insurance.subscriber!.dob),
      }

  const dependent: ClaimDependent | undefined = !isSubscriber
    ? {
        firstName: data.patient.firstName,
        lastName: data.patient.lastName,
        gender: data.patient.gender,
        dateOfBirth: formatDate(data.patient.dob),
        relationshipToSubscriberCode: data.insurance.relationshipCode || '19', // Default to child
      }
    : undefined

  return {
    controlNumber,
    tradingPartnerServiceId: data.insurance.payerId,
    submitter: {
      organizationName: data.practice.name,
      contactInformation: {
        name: data.practice.name,
        phoneNumber: data.practice.phone.replace(/\D/g, ''),
      },
    },
    receiver: {
      organizationName: data.insurance.payerName,
    },
    subscriber,
    dependent,
    providers: [
      {
        providerType: 'BillingProvider',
        npi: data.practice.npi,
        employerId: data.practice.taxId,
        organizationName: data.practice.name,
        address: {
          address1: data.practice.address.street,
          city: data.practice.address.city,
          state: data.practice.address.state,
          postalCode: data.practice.address.zip,
        },
        contactInformation: {
          phoneNumber: data.practice.phone.replace(/\D/g, ''),
        },
      },
      {
        providerType: 'RenderingProvider',
        npi: data.provider.npi,
        firstName: data.provider.firstName,
        lastName: data.provider.lastName,
        address: {
          address1: data.practice.address.street,
          city: data.practice.address.city,
          state: data.practice.address.state,
          postalCode: data.practice.address.zip,
        },
      },
    ],
    claimInformation: {
      claimFilingCode: CLAIM_FILING_CODES.COMMERCIAL_PPO, // Would be determined from payer
      patientControlNumber: claimNumber,
      claimChargeAmount: totalCharge.toFixed(2),
      placeOfServiceCode: data.encounter.placeOfService,
      claimFrequencyCode: '1', // Original claim
      signatureIndicator: 'Y',
      releaseInformationCode: 'Y',
      planParticipationCode: 'A', // Assigned
      benefitsAssignmentCertificationIndicator: 'Y',
      healthCareCodeInformation: data.diagnoses.map(dx => ({
        diagnosisTypeCode: 'ABK' as const, // ICD-10
        diagnosisCode: dx.code.replace('.', ''), // Remove decimal
      })),
      serviceLines,
    },
  }
}

// =============================================================================
// Claim Status
// =============================================================================

export interface ClaimStatusRequest {
  tradingPartnerServiceId: string
  providers: Array<{
    organizationName: string
    npi: string
  }>
  subscriber: {
    memberId: string
    firstName: string
    lastName: string
    dateOfBirth: string
  }
  claimStatusInquiry: {
    patientControlNumber?: string
    claimServiceDate?: string
  }
}

export interface ClaimStatusResponse {
  status: string
  statusCode: string
  effectiveDate?: string
  claimServiceDate?: string
  trackingNumber?: string
  checkNumber?: string
  paidAmount?: string
  claimStatusCodes?: Array<{
    statusCategoryCode: string
    statusCategoryCodeValue: string
    statusCode: string
    statusCodeValue: string
  }>
}

/**
 * Check the status of a submitted claim (276/277)
 *
 * NOTE: Requires production API key.
 */
export async function checkClaimStatus(
  request: ClaimStatusRequest
): Promise<StediResponse<ClaimStatusResponse>> {
  if (getStediMode() === 'test') {
    return {
      success: false,
      error: {
        code: 'TEST_MODE',
        message: 'Claim status checks require a production API key.',
      },
    }
  }

  return stediRequest<ClaimStatusResponse>({
    endpoint: '/change/medicalnetwork/claimstatus/v2',
    method: 'POST',
    body: request,
  })
}
