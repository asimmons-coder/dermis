/**
 * Stedi Healthcare Integration
 *
 * Provides real-time insurance eligibility verification and claims submission
 * via Stedi's modern clearinghouse API.
 *
 * Setup:
 * 1. Create a Stedi account at https://www.stedi.com
 * 2. Generate an API key (test or production)
 * 3. Add to environment: STEDI_API_KEY=your_key_here
 *
 * Test Mode:
 * - Test API keys (starting with 'test_') only support eligibility checks
 * - Returns mock data from predefined payers
 *
 * Production Mode:
 * - Full support for eligibility, claims submission, and ERA retrieval
 * - Requires payer enrollment for claims and ERAs
 *
 * @see https://www.stedi.com/docs/healthcare
 */

// Client
export { stediRequest, isStediConfigured, getStediMode } from './client'
export type { StediRequestOptions, StediResponse } from './client'

// Eligibility (270/271)
export {
  checkEligibility,
  checkPatientEligibility,
  parseEligibilityResponse,
  SERVICE_TYPE_CODES,
  PAYER_IDS,
} from './eligibility'
export type {
  EligibilityRequest,
  EligibilityResponse,
  ParsedEligibility,
  BenefitInfo,
} from './eligibility'

// Claims (837P)
export {
  submitProfessionalClaim,
  buildClaimFromCheckout,
  checkClaimStatus,
  PLACE_OF_SERVICE,
  CLAIM_FILING_CODES,
} from './claims'
export type {
  ProfessionalClaimRequest,
  ClaimSubmissionResponse,
  DermisCheckoutData,
  ClaimServiceLine,
  ClaimStatusRequest,
  ClaimStatusResponse,
} from './claims'
