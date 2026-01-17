/**
 * BillingCalculator - Sophisticated medical billing calculation engine
 *
 * Features:
 * - Deductible waterfall across charge categories (E&M → Surgical → Path → Other)
 * - Copay gatekeeping rules (mutual exclusion for visit vs procedure copays)
 * - Coinsurance calculation on post-deductible amounts
 * - HSA eligibility tracking for HDHP patients
 * - Detailed calculation breakdown for transparency
 */

// =============================================================================
// Types
// =============================================================================

export type ChargeCategory = 'evaluation_management' | 'surgical' | 'pathology' | 'destructive' | 'other'

export interface CPTCode {
  code: string
  description: string
  units?: number
  modifiers?: string[]
}

export interface InsuranceBenefits {
  carrier: string
  plan: string
  memberId: string
  // Copays
  officeVisitCopay: number
  specialistCopay: number
  procedureCopay?: number // Some plans have separate procedure copay
  // Deductible
  deductibleTotal: number
  deductibleMet: number
  deductibleRemaining: number
  isDeductibleMet: boolean
  // Coinsurance
  coinsurancePercent: number // Patient's responsibility (e.g., 20 means patient pays 20%)
  // Plan type
  isHDHP?: boolean // High Deductible Health Plan (HSA eligible)
  hsaEligible?: boolean
}

export interface ChargeLineItem {
  code: string
  description: string
  category: ChargeCategory
  fee: number
  units: number
  totalFee: number // fee * units
}

export interface CalculatedCharge extends ChargeLineItem {
  // Calculation results
  deductibleApplied: number
  coinsuranceAmount: number
  copayApplied: number
  insurancePays: number
  patientResponsibility: number
  // Flags
  isHsaEligible: boolean
  appliedToDeductible: boolean
  // Breakdown explanation
  breakdown: string[]
}

export interface DeductibleAllocation {
  category: ChargeCategory
  categoryLabel: string
  chargesInCategory: number
  deductibleApplied: number
  remainingAfter: number
}

export interface CalculationResult {
  charges: CalculatedCharge[]
  // Totals
  totalFees: number
  totalDeductibleApplied: number
  totalCoinsurance: number
  totalCopay: number
  totalInsurancePays: number
  totalPatientResponsibility: number
  totalHsaEligible: number
  // Deductible waterfall breakdown
  deductibleWaterfall: DeductibleAllocation[]
  // Copay details
  copayDetails: {
    type: 'office_visit' | 'specialist' | 'procedure' | 'none'
    amount: number
    waived: boolean
    waivedReason?: string
  }
  // Summary
  summary: string[]
}

export interface SelfPayResult {
  charges: Array<{
    code: string
    description: string
    fee: number
    units: number
    totalFee: number
    discount: number
    patientResponsibility: number
  }>
  subtotal: number
  discountPercent: number
  totalDiscount: number
  totalDue: number
}

// =============================================================================
// CPT Category Classification
// =============================================================================

const CPT_CATEGORIES: Record<string, ChargeCategory> = {
  // Evaluation & Management (E&M) - Office Visits
  '99201': 'evaluation_management',
  '99202': 'evaluation_management',
  '99203': 'evaluation_management',
  '99204': 'evaluation_management',
  '99205': 'evaluation_management',
  '99211': 'evaluation_management',
  '99212': 'evaluation_management',
  '99213': 'evaluation_management',
  '99214': 'evaluation_management',
  '99215': 'evaluation_management',
  // New patient telehealth
  '99421': 'evaluation_management',
  '99422': 'evaluation_management',
  '99423': 'evaluation_management',

  // Surgical - Excisions, Repairs
  '11400': 'surgical', '11401': 'surgical', '11402': 'surgical', '11403': 'surgical',
  '11404': 'surgical', '11406': 'surgical',
  '11420': 'surgical', '11421': 'surgical', '11422': 'surgical', '11423': 'surgical',
  '11424': 'surgical', '11426': 'surgical',
  '11440': 'surgical', '11441': 'surgical', '11442': 'surgical', '11443': 'surgical',
  '11444': 'surgical', '11446': 'surgical',
  '11600': 'surgical', '11601': 'surgical', '11602': 'surgical', '11603': 'surgical',
  '11604': 'surgical', '11606': 'surgical',
  '11620': 'surgical', '11621': 'surgical', '11622': 'surgical', '11623': 'surgical',
  '11624': 'surgical', '11626': 'surgical',
  '11640': 'surgical', '11641': 'surgical', '11642': 'surgical', '11643': 'surgical',
  '11644': 'surgical', '11646': 'surgical',
  // Mohs
  '17311': 'surgical', '17312': 'surgical', '17313': 'surgical', '17314': 'surgical',
  '17315': 'surgical',

  // Pathology - Biopsies
  '11102': 'pathology', '11103': 'pathology',
  '11104': 'pathology', '11105': 'pathology',
  '11106': 'pathology', '11107': 'pathology',
  '88305': 'pathology', '88307': 'pathology', // Path interpretation

  // Destructive Procedures - Cryotherapy, Electrosurgery
  '17000': 'destructive', '17003': 'destructive', '17004': 'destructive',
  '17110': 'destructive', '17111': 'destructive',
  '17260': 'destructive', '17261': 'destructive', '17262': 'destructive',
  '17263': 'destructive', '17264': 'destructive',
  '17270': 'destructive', '17271': 'destructive', '17272': 'destructive',
  '17273': 'destructive', '17274': 'destructive',
  '17280': 'destructive', '17281': 'destructive', '17282': 'destructive',
  '17283': 'destructive', '17284': 'destructive',

  // Skin tag removal
  '11300': 'destructive', '11301': 'destructive', '11302': 'destructive', '11303': 'destructive',
}

export function classifyProcedure(cptCode: string): ChargeCategory {
  return CPT_CATEGORIES[cptCode] || 'other'
}

export function getCategoryLabel(category: ChargeCategory): string {
  const labels: Record<ChargeCategory, string> = {
    evaluation_management: 'Office Visit (E&M)',
    surgical: 'Surgical Procedures',
    pathology: 'Pathology/Biopsy',
    destructive: 'Destructive Procedures',
    other: 'Other Services',
  }
  return labels[category]
}

// Category processing order for deductible waterfall
const CATEGORY_ORDER: ChargeCategory[] = [
  'evaluation_management',
  'surgical',
  'pathology',
  'destructive',
  'other',
]

// =============================================================================
// Core Calculation Engine
// =============================================================================

export function calculateInsuredCharges(
  cptCodes: CPTCode[],
  feeSchedule: Record<string, number>,
  insurance: InsuranceBenefits
): CalculationResult {
  const summary: string[] = []

  // Step 1: Build charge line items with categories
  const charges: ChargeLineItem[] = cptCodes.map(cpt => {
    const fee = feeSchedule[cpt.code] || 0
    const units = cpt.units || 1
    return {
      code: cpt.code,
      description: cpt.description,
      category: classifyProcedure(cpt.code),
      fee,
      units,
      totalFee: fee * units,
    }
  })

  // Step 2: Group charges by category
  const chargesByCategory = new Map<ChargeCategory, ChargeLineItem[]>()
  for (const category of CATEGORY_ORDER) {
    chargesByCategory.set(category, charges.filter(c => c.category === category))
  }

  // Step 3: Determine copay type and amount
  const hasEMVisit = chargesByCategory.get('evaluation_management')!.length > 0
  const hasProcedures = (
    chargesByCategory.get('surgical')!.length > 0 ||
    chargesByCategory.get('pathology')!.length > 0 ||
    chargesByCategory.get('destructive')!.length > 0
  )

  let copayType: 'office_visit' | 'specialist' | 'procedure' | 'none' = 'none'
  let copayAmount = 0
  let copayWaived = false
  let copayWaivedReason: string | undefined

  // Copay gatekeeping rules:
  // - If E&M visit present, specialist copay applies
  // - If procedures only (no E&M), procedure copay applies (if plan has one)
  // - Copay is collected ONCE per visit, not per service
  // - If deductible not met, some plans waive copay until deductible is satisfied

  if (!insurance.isDeductibleMet) {
    // Deductible not met - typically no copay collected (patient pays toward deductible)
    copayType = 'none'
    copayAmount = 0
    copayWaived = true
    copayWaivedReason = 'Copay waived - applying charges to deductible'
    summary.push('Deductible not yet met - charges applied to deductible first')
  } else if (hasEMVisit) {
    copayType = 'specialist'
    copayAmount = insurance.specialistCopay
    summary.push(`Specialist copay of $${copayAmount.toFixed(2)} collected for office visit`)
  } else if (hasProcedures && insurance.procedureCopay !== undefined) {
    copayType = 'procedure'
    copayAmount = insurance.procedureCopay
    summary.push(`Procedure copay of $${copayAmount.toFixed(2)} collected`)
  }

  // Step 4: Apply deductible waterfall
  let remainingDeductible = insurance.deductibleRemaining
  const deductibleWaterfall: DeductibleAllocation[] = []
  const calculatedCharges: CalculatedCharge[] = []

  for (const category of CATEGORY_ORDER) {
    const categoryCharges = chargesByCategory.get(category) || []
    if (categoryCharges.length === 0) continue

    const categoryTotal = categoryCharges.reduce((sum, c) => sum + c.totalFee, 0)
    const deductibleForCategory = Math.min(categoryTotal, remainingDeductible)

    deductibleWaterfall.push({
      category,
      categoryLabel: getCategoryLabel(category),
      chargesInCategory: categoryTotal,
      deductibleApplied: deductibleForCategory,
      remainingAfter: remainingDeductible - deductibleForCategory,
    })

    // Distribute deductible across charges in this category proportionally
    let categoryDeductibleRemaining = deductibleForCategory

    for (const charge of categoryCharges) {
      const chargeDeductible = Math.min(charge.totalFee, categoryDeductibleRemaining)
      categoryDeductibleRemaining -= chargeDeductible

      // After deductible, coinsurance applies to remaining amount
      const afterDeductible = charge.totalFee - chargeDeductible
      const coinsuranceAmount = insurance.isDeductibleMet || chargeDeductible < charge.totalFee
        ? afterDeductible * (insurance.coinsurancePercent / 100)
        : 0

      // Insurance pays the rest
      const insurancePays = afterDeductible - coinsuranceAmount

      // Patient responsibility = deductible portion + coinsurance
      // Copay is handled separately at the visit level
      const patientResponsibility = chargeDeductible + coinsuranceAmount

      const breakdown: string[] = []
      breakdown.push(`Fee: $${charge.totalFee.toFixed(2)}`)
      if (chargeDeductible > 0) {
        breakdown.push(`Deductible applied: $${chargeDeductible.toFixed(2)}`)
      }
      if (coinsuranceAmount > 0) {
        breakdown.push(`${insurance.coinsurancePercent}% coinsurance: $${coinsuranceAmount.toFixed(2)}`)
      }
      if (insurancePays > 0) {
        breakdown.push(`Insurance pays: $${insurancePays.toFixed(2)}`)
      }

      calculatedCharges.push({
        ...charge,
        deductibleApplied: chargeDeductible,
        coinsuranceAmount,
        copayApplied: 0, // Copay tracked at visit level
        insurancePays,
        patientResponsibility,
        isHsaEligible: insurance.isHDHP === true,
        appliedToDeductible: chargeDeductible > 0,
        breakdown,
      })
    }

    remainingDeductible -= deductibleForCategory
  }

  // Step 5: Calculate totals
  const totalFees = calculatedCharges.reduce((sum, c) => sum + c.totalFee, 0)
  const totalDeductibleApplied = calculatedCharges.reduce((sum, c) => sum + c.deductibleApplied, 0)
  const totalCoinsurance = calculatedCharges.reduce((sum, c) => sum + c.coinsuranceAmount, 0)
  const totalInsurancePays = calculatedCharges.reduce((sum, c) => sum + c.insurancePays, 0)
  const totalPatientResponsibility = calculatedCharges.reduce((sum, c) => sum + c.patientResponsibility, 0) + copayAmount
  const totalHsaEligible = insurance.isHDHP ? totalPatientResponsibility : 0

  // Add waterfall summary
  if (totalDeductibleApplied > 0) {
    summary.push(`$${totalDeductibleApplied.toFixed(2)} applied to deductible`)
    summary.push(`Deductible remaining after visit: $${remainingDeductible.toFixed(2)}`)
  }
  if (totalCoinsurance > 0) {
    summary.push(`Patient coinsurance (${insurance.coinsurancePercent}%): $${totalCoinsurance.toFixed(2)}`)
  }
  if (insurance.isHDHP) {
    summary.push(`HSA-eligible amount: $${totalHsaEligible.toFixed(2)}`)
  }

  return {
    charges: calculatedCharges,
    totalFees,
    totalDeductibleApplied,
    totalCoinsurance,
    totalCopay: copayAmount,
    totalInsurancePays,
    totalPatientResponsibility,
    totalHsaEligible,
    deductibleWaterfall,
    copayDetails: {
      type: copayType,
      amount: copayAmount,
      waived: copayWaived,
      waivedReason: copayWaivedReason,
    },
    summary,
  }
}

export function calculateSelfPayCharges(
  cptCodes: CPTCode[],
  feeSchedule: Record<string, number>,
  discountPercent: number = 15
): SelfPayResult {
  const charges = cptCodes.map(cpt => {
    const fee = feeSchedule[cpt.code] || 0
    const units = cpt.units || 1
    const totalFee = fee * units
    const discount = totalFee * (discountPercent / 100)

    return {
      code: cpt.code,
      description: cpt.description,
      fee,
      units,
      totalFee,
      discount,
      patientResponsibility: totalFee - discount,
    }
  })

  const subtotal = charges.reduce((sum, c) => sum + c.totalFee, 0)
  const totalDiscount = charges.reduce((sum, c) => sum + c.discount, 0)

  return {
    charges,
    subtotal,
    discountPercent,
    totalDiscount,
    totalDue: subtotal - totalDiscount,
  }
}

// =============================================================================
// Formatting Utilities
// =============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  if (amount === 0) return '$0'
  return formatCurrency(amount)
}
