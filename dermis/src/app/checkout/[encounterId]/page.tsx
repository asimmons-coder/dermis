'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import CalculationBreakdown from '@/components/CalculationBreakdown'
import {
  DollarSign,
  Plus,
  X,
  CreditCard,
  Printer,
  ArrowLeft,
  AlertCircle,
  Shield,
  Clock,
  Check,
  Calculator,
} from 'lucide-react'
import {
  calculateInsuredCharges,
  calculateSelfPayCharges,
  type InsuranceBenefits,
  type CPTCode,
  type CalculationResult,
} from '@/lib/billing/calculator'

interface CheckoutPageProps {
  params: { encounterId: string }
}

// Default fee schedule (fallback)
const DEFAULT_FEES: { [key: string]: number } = {
  '99213': 150,
  '99214': 200,
  '99215': 275,
  '99203': 175,
  '99204': 250,
  '99205': 350,
  '11102': 250,
  '11104': 200,
  '11300': 175,
  '11301': 200,
  '11302': 225,
  '11303': 250,
  '17000': 150,
  '17110': 175,
  '17111': 225,
}

const SELF_PAY_DISCOUNT_PERCENT = 15 // 15% discount for self-pay patients

interface InsuranceDetails {
  carrier: string
  plan: string
  memberId: string
  copay: number
  deductibleTotal: number
  deductibleMet: number
  deductibleRemaining: number
  coinsurancePercent: number
  isDeductibleMet: boolean
  isHDHP?: boolean
  hsaEligible?: boolean
  procedureCopay?: number
}

interface OutstandingCharge {
  date: string
  description: string
  amount: number
  type: string
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter()
  const { encounterId } = params

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Data from API
  const [encounter, setEncounter] = useState<any>(null)
  const [cosmeticTreatments, setCosmeticTreatments] = useState<any[]>([])
  const [patientAccount, setPatientAccount] = useState<any>({ balance: 0, outstandingCharges: [] })
  const [insuranceDetails, setInsuranceDetails] = useState<InsuranceDetails | null>(null)
  const [hasInsurance, setHasInsurance] = useState(false)
  const [feeSchedule, setFeeSchedule] = useState<any[]>([])

  // Medical charges - now using sophisticated calculator
  const [medicalCharges, setMedicalCharges] = useState<any[]>([])
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const [showCalculationBreakdown, setShowCalculationBreakdown] = useState(false)

  // Cosmetic charges
  const [cosmeticCharges, setCosmeticCharges] = useState<any[]>([])
  const [alleDiscount, setAlleDiscount] = useState(0)
  const [aspireDiscount, setAspireDiscount] = useState(0)
  const [customDiscount, setCustomDiscount] = useState(0)

  // Products
  const [productCharges, setProductCharges] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [availableProducts, setAvailableProducts] = useState<any[]>([])

  // Self-pay discount toggle
  const [applySelfPayDiscount, setApplySelfPayDiscount] = useState(true)

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'check' | 'split'>('card')
  const [amountPaying, setAmountPaying] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  // Load data
  useEffect(() => {
    loadCheckoutData()
    loadProducts()
  }, [encounterId])

  const loadCheckoutData = async () => {
    try {
      const res = await fetch(`/api/checkout/${encounterId}`)
      const data = await res.json()

      setEncounter(data.encounter)
      setCosmeticTreatments(data.cosmeticTreatments)
      setPatientAccount(data.patientAccount || { balance: 0, outstandingCharges: [] })
      setInsuranceDetails(data.insuranceDetails)
      setHasInsurance(data.hasInsurance)
      setFeeSchedule(data.feeSchedule)

      // Initialize medical charges from CPT codes with sophisticated insurance logic
      if (data.encounter?.cpt_codes) {
        // Build fee schedule map
        const feeScheduleMap: Record<string, number> = {}
        data.feeSchedule?.forEach((f: any) => {
          feeScheduleMap[f.cpt_code] = f.standard_fee
        })
        // Merge with defaults
        Object.keys(DEFAULT_FEES).forEach(code => {
          if (!feeScheduleMap[code]) feeScheduleMap[code] = DEFAULT_FEES[code]
        })

        // Convert CPT codes to the format expected by calculator
        const cptCodes: CPTCode[] = data.encounter.cpt_codes.map((cpt: any) => ({
          code: cpt.code,
          description: cpt.description,
          units: cpt.units || 1,
          modifiers: cpt.modifiers,
        }))

        if (data.hasInsurance && data.insuranceDetails) {
          // Use sophisticated calculator for insured patients
          const insuranceBenefits: InsuranceBenefits = {
            carrier: data.insuranceDetails.carrier,
            plan: data.insuranceDetails.plan,
            memberId: data.insuranceDetails.memberId,
            officeVisitCopay: data.insuranceDetails.copay,
            specialistCopay: data.insuranceDetails.copay,
            procedureCopay: data.insuranceDetails.procedureCopay,
            deductibleTotal: data.insuranceDetails.deductibleTotal,
            deductibleMet: data.insuranceDetails.deductibleMet,
            deductibleRemaining: data.insuranceDetails.deductibleRemaining,
            isDeductibleMet: data.insuranceDetails.isDeductibleMet,
            coinsurancePercent: data.insuranceDetails.coinsurancePercent,
            isHDHP: data.insuranceDetails.isHDHP,
            hsaEligible: data.insuranceDetails.hsaEligible,
          }

          const result = calculateInsuredCharges(cptCodes, feeScheduleMap, insuranceBenefits)
          setCalculationResult(result)

          // Convert to the format the existing UI expects
          const charges = result.charges.map(c => ({
            code: c.code,
            description: c.description,
            fee: c.totalFee,
            isSelfPay: false,
            copay: c.copayApplied,
            deductibleApplied: c.deductibleApplied,
            coinsurance: c.coinsuranceAmount,
            patientResponsibility: c.patientResponsibility,
            breakdown: c.breakdown.join(' | '),
            deductibleNote: c.appliedToDeductible ? 'Applied to deductible' : (data.insuranceDetails.isDeductibleMet ? 'Deductible met ✓' : ''),
            category: c.category,
            isHsaEligible: c.isHsaEligible,
          }))
          setMedicalCharges(charges)
        } else {
          // Self-pay calculation
          const selfPayResult = calculateSelfPayCharges(cptCodes, feeScheduleMap, applySelfPayDiscount ? SELF_PAY_DISCOUNT_PERCENT : 0)
          const charges = selfPayResult.charges.map(c => ({
            code: c.code,
            description: c.description,
            fee: c.totalFee,
            isSelfPay: true,
            selfPayDiscount: c.discount,
            patientResponsibility: c.patientResponsibility,
            breakdown: `Full fee: $${c.totalFee.toFixed(2)}${c.discount > 0 ? ` - ${SELF_PAY_DISCOUNT_PERCENT}% self-pay discount` : ''}`,
          }))
          setMedicalCharges(charges)
          setCalculationResult(null)
        }
      }

      // Initialize cosmetic charges from treatments
      if (data.cosmeticTreatments?.length > 0) {
        const charges = data.cosmeticTreatments.map((tx: any) => {
          const unitPrice = getDefaultCosmeticPrice(tx.treatment_type)
          const units = tx.total_units || tx.total_volume_ml || 1
          return {
            id: tx.id,
            treatment: tx.treatment_type,
            product: tx.product_name,
            units,
            unitPrice,
            subtotal: units * unitPrice,
          }
        })
        setCosmeticCharges(charges)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading checkout data:', error)
      setLoading(false)
    }
  }

  const calculateMedicalCharge = (
    cpt: any,
    fee: number,
    insured: boolean,
    insurance: InsuranceDetails | null
  ) => {
    if (!insured || !insurance) {
      // Self-pay patient
      return {
        code: cpt.code,
        description: cpt.description,
        fee,
        isSelfPay: true,
        selfPayDiscount: applySelfPayDiscount ? fee * (SELF_PAY_DISCOUNT_PERCENT / 100) : 0,
        patientResponsibility: applySelfPayDiscount ? fee * (1 - SELF_PAY_DISCOUNT_PERCENT / 100) : fee,
        breakdown: `Full fee: $${fee.toFixed(2)}${applySelfPayDiscount ? ` - ${SELF_PAY_DISCOUNT_PERCENT}% self-pay discount` : ''}`,
      }
    }

    // Patient has insurance
    const { copay, deductibleRemaining, coinsurancePercent, isDeductibleMet } = insurance

    if (!isDeductibleMet && deductibleRemaining > 0) {
      // Deductible NOT met - patient pays fee up to remaining deductible
      const patientOwes = Math.min(fee, deductibleRemaining)
      return {
        code: cpt.code,
        description: cpt.description,
        fee,
        isSelfPay: false,
        copay: 0,
        deductibleApplied: patientOwes,
        coinsurance: 0,
        patientResponsibility: patientOwes,
        breakdown: `Fee: $${fee.toFixed(2)} | Deductible remaining: $${deductibleRemaining.toFixed(2)} | You owe: $${patientOwes.toFixed(2)}`,
        deductibleNote: 'Applied to deductible',
      }
    } else {
      // Deductible MET - patient pays copay + coinsurance
      const coinsuranceAmount = coinsurancePercent > 0 ? (fee - copay) * (coinsurancePercent / 100) : 0
      const patientOwes = copay + coinsuranceAmount
      return {
        code: cpt.code,
        description: cpt.description,
        fee,
        isSelfPay: false,
        copay,
        coinsurance: coinsuranceAmount,
        patientResponsibility: patientOwes,
        breakdown: coinsurancePercent > 0
          ? `Copay: $${copay.toFixed(2)} + ${coinsurancePercent}% coinsurance: $${coinsuranceAmount.toFixed(2)}`
          : `Copay: $${copay.toFixed(2)}`,
        deductibleNote: 'Deductible met ✓',
      }
    }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setAvailableProducts(data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const getDefaultCosmeticPrice = (treatmentType: string): number => {
    const prices: { [key: string]: number } = {
      botox: 12,
      dysport: 4,
      filler: 600,
      laser: 350,
      chemical_peel: 200,
      microneedling: 400,
    }
    return prices[treatmentType.toLowerCase()] || 0
  }

  // Recalculate medical charges when self-pay discount changes
  useEffect(() => {
    if (!hasInsurance && encounter?.cpt_codes) {
      // Build fee schedule map
      const feeScheduleMap: Record<string, number> = {}
      feeSchedule?.forEach((f: any) => {
        feeScheduleMap[f.cpt_code] = f.standard_fee
      })
      Object.keys(DEFAULT_FEES).forEach(code => {
        if (!feeScheduleMap[code]) feeScheduleMap[code] = DEFAULT_FEES[code]
      })

      const cptCodes: CPTCode[] = encounter.cpt_codes.map((cpt: any) => ({
        code: cpt.code,
        description: cpt.description,
        units: cpt.units || 1,
      }))

      const selfPayResult = calculateSelfPayCharges(
        cptCodes,
        feeScheduleMap,
        applySelfPayDiscount ? SELF_PAY_DISCOUNT_PERCENT : 0
      )

      const charges = selfPayResult.charges.map(c => ({
        code: c.code,
        description: c.description,
        fee: c.totalFee,
        isSelfPay: true,
        selfPayDiscount: c.discount,
        patientResponsibility: c.patientResponsibility,
        breakdown: `Full fee: $${c.totalFee.toFixed(2)}${c.discount > 0 ? ` - ${SELF_PAY_DISCOUNT_PERCENT}% self-pay discount` : ''}`,
      }))
      setMedicalCharges(charges)
    }
  }, [applySelfPayDiscount, hasInsurance, encounter, feeSchedule])

  // Calculations
  // For insured patients, use the sophisticated calculation result which includes copay
  const medicalTotal = calculationResult
    ? calculationResult.totalPatientResponsibility
    : medicalCharges.reduce((sum, c) => sum + c.patientResponsibility, 0)

  const cosmeticSubtotal = cosmeticCharges.reduce((sum, c) => sum + c.subtotal, 0)
  const totalDiscounts = alleDiscount + aspireDiscount + customDiscount
  const cosmeticTotal = Math.max(0, cosmeticSubtotal - totalDiscounts)

  const productsTotal = productCharges.reduce((sum, p) => sum + p.subtotal, 0)

  const previousBalance = patientAccount?.balance || 0
  const outstandingCharges = patientAccount?.outstandingCharges || []

  const grandTotal = medicalTotal + cosmeticTotal + productsTotal + previousBalance

  // Handle product addition
  const addProduct = (product: any) => {
    const existing = productCharges.find((p) => p.productId === product.id)
    if (existing) {
      setProductCharges(
        productCharges.map((p) =>
          p.productId === product.id
            ? { ...p, quantity: p.quantity + 1, subtotal: (p.quantity + 1) * p.unitPrice }
            : p
        )
      )
    } else {
      setProductCharges([
        ...productCharges,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ])
    }
    setProductSearch('')
  }

  const removeProduct = (productId: string) => {
    setProductCharges(productCharges.filter((p) => p.productId !== productId))
  }

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId)
      return
    }
    setProductCharges(
      productCharges.map((p) =>
        p.productId === productId ? { ...p, quantity, subtotal: quantity * p.unitPrice } : p
      )
    )
  }

  // Process checkout
  const handleCheckout = async () => {
    setSaving(true)
    try {
      const payAmount = typeof amountPaying === 'number' ? amountPaying : grandTotal

      const discounts = []
      if (alleDiscount > 0) discounts.push({ type: 'alle', amount: alleDiscount, description: 'Allē Rewards' })
      if (aspireDiscount > 0) discounts.push({ type: 'aspire', amount: aspireDiscount, description: 'Aspire Rewards' })
      if (customDiscount > 0) discounts.push({ type: 'custom', amount: customDiscount, description: 'Custom Discount' })

      const payload = {
        encounterId,
        patientId: encounter.patient_id,
        providerId: encounter.provider_id,
        practiceId: encounter.practice_id,
        medicalCharges,
        medicalTotal,
        cosmeticCharges,
        cosmeticSubtotal,
        discountsApplied: discounts,
        totalDiscounts,
        cosmeticTotal,
        productCharges,
        productsTotal,
        previousBalance,
        totalAmount: grandTotal,
        amountPaid: payAmount,
        amountRemaining: grandTotal - payAmount,
        paymentMethod,
        paymentStatus: payAmount >= grandTotal ? 'paid' : 'partial',
        notes,
        // Payment allocation
        allocation: {
          toPreviousBalance: Math.min(payAmount, previousBalance),
          toTodayCharges: Math.max(0, payAmount - previousBalance),
        },
      }

      const res = await fetch('/api/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to process checkout')

      alert('Payment processed successfully!')
      router.push(`/schedule`)
    } catch (error) {
      console.error('Error processing checkout:', error)
      alert('Failed to process payment')
    } finally {
      setSaving(false)
    }
  }

  const printReceipt = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-clinical-50">
        <AppHeader />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-clinical-600">Loading checkout data...</div>
        </div>
      </div>
    )
  }

  const patient = encounter?.patient
  const provider = encounter?.provider

  return (
    <div className="min-h-screen bg-clinical-50">
      <AppHeader />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-clinical-600 hover:text-clinical-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold text-clinical-800">Checkout</div>
            <div className="text-sm text-clinical-600">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="card p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-clinical-600">Patient</div>
              <div className="font-medium text-clinical-800">
                {patient?.first_name} {patient?.middle_name} {patient?.last_name}
              </div>
            </div>
            <div>
              <div className="text-sm text-clinical-600">Date of Birth</div>
              <div className="font-medium text-clinical-800">
                {patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-clinical-600">Provider</div>
              <div className="font-medium text-clinical-800">
                {provider?.first_name} {provider?.last_name}, {provider?.credentials}
              </div>
            </div>
            <div>
              <div className="text-sm text-clinical-600">Insurance</div>
              <div className="font-medium text-clinical-800">
                {hasInsurance && insuranceDetails ? (
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    {insuranceDetails.carrier} - {insuranceDetails.plan}
                  </span>
                ) : (
                  <span className="text-amber-600">Self-Pay</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 0: Outstanding Balance */}
        {previousBalance > 0 && (
          <div className="card p-6 border-l-4 border-amber-500 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-display font-semibold text-amber-800 mb-2">
                  Outstanding Balance
                </h3>
                <div className="space-y-2">
                  {outstandingCharges.map((charge: OutstandingCharge, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-amber-700">{charge.description}</span>
                        <span className="text-amber-600 ml-2">
                          ({new Date(charge.date).toLocaleDateString()})
                        </span>
                      </div>
                      <span className="font-semibold text-amber-800">${charge.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-amber-200">
                  <span className="font-semibold text-amber-800">Previous Balance Due:</span>
                  <span className="text-xl font-bold text-amber-700">${previousBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insurance Details Card (if insured) */}
        {hasInsurance && insuranceDetails && (
          <div className="card p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-display font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Insurance Benefits
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Specialist Copay</div>
                <div className="text-lg font-bold text-blue-800">${insuranceDetails.copay}</div>
              </div>
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Deductible</div>
                <div className="text-lg font-bold text-blue-800">
                  ${insuranceDetails.deductibleMet} / ${insuranceDetails.deductibleTotal}
                </div>
              </div>
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Deductible Remaining</div>
                <div className="text-lg font-bold text-blue-800">${insuranceDetails.deductibleRemaining}</div>
              </div>
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Status</div>
                <div className={`text-lg font-bold ${insuranceDetails.isDeductibleMet ? 'text-green-600' : 'text-amber-600'}`}>
                  {insuranceDetails.isDeductibleMet ? (
                    <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Deductible Met</span>
                  ) : (
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Accumulating</span>
                  )}
                </div>
              </div>
            </div>
            {insuranceDetails.isHDHP && (
              <div className="mt-4 pt-4 border-t border-blue-200 flex items-center gap-2 text-sm text-purple-700">
                <Calculator className="w-4 h-4" />
                <span className="font-medium">HDHP - HSA Eligible Plan</span>
              </div>
            )}
          </div>
        )}

        {/* Calculation Breakdown - For insured patients */}
        {hasInsurance && calculationResult && medicalCharges.length > 0 && (
          <CalculationBreakdown
            result={calculationResult}
            insuranceCarrier={insuranceDetails?.carrier}
            isHDHP={insuranceDetails?.isHDHP}
          />
        )}

        {/* Section 1: Medical Charges */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-clinical-800">
              Today's Medical Charges
            </h3>
            {!hasInsurance && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={applySelfPayDiscount}
                  onChange={(e) => setApplySelfPayDiscount(e.target.checked)}
                  className="rounded border-clinical-300"
                />
                <span className="text-clinical-700">Apply {SELF_PAY_DISCOUNT_PERCENT}% self-pay discount</span>
              </label>
            )}
          </div>

          {medicalCharges.length === 0 ? (
            <div className="text-clinical-500 text-sm">No medical charges</div>
          ) : (
            <div className="space-y-3">
              {medicalCharges.map((charge, idx) => (
                <div key={idx} className="py-3 border-b border-clinical-100">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <div className="font-medium text-clinical-800">
                        {charge.code} - {charge.description}
                      </div>
                      {charge.category && (
                        <div className="text-xs text-clinical-500 mt-0.5 capitalize">
                          {charge.category.replace(/_/g, ' ')}
                        </div>
                      )}
                      <div className="text-sm text-clinical-600 mt-1">{charge.breakdown}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {charge.deductibleNote && (
                          <span className={`text-xs ${charge.deductibleNote.includes('✓') ? 'text-green-600' : 'text-amber-600'}`}>
                            {charge.deductibleNote}
                          </span>
                        )}
                        {charge.isHsaEligible && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                            HSA eligible
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-clinical-800">${charge.patientResponsibility.toFixed(2)}</div>
                      <div className="text-xs text-clinical-500">Patient owes</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show copay separately if applicable */}
              {calculationResult && calculationResult.totalCopay > 0 && (
                <div className="py-3 border-b border-clinical-100 bg-green-50 -mx-6 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        {calculationResult.copayDetails.type === 'specialist' ? 'Specialist' : 'Office'} Copay
                      </span>
                    </div>
                    <div className="font-semibold text-green-700">
                      ${calculationResult.totalCopay.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 font-semibold">
                <div className="text-clinical-800">Medical Total:</div>
                <div className="text-dermis-600 text-lg">${medicalTotal.toFixed(2)}</div>
              </div>

              {/* HSA summary for HDHP patients */}
              {calculationResult && calculationResult.totalHsaEligible > 0 && (
                <div className="flex justify-between items-center text-sm text-purple-700 bg-purple-50 -mx-6 px-6 py-2">
                  <div className="flex items-center gap-1">
                    <Calculator className="w-4 h-4" />
                    <span>HSA-Eligible Amount:</span>
                  </div>
                  <span className="font-medium">${calculationResult.totalHsaEligible.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Cosmetic Charges (always self-pay) */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-semibold text-clinical-800 mb-2">
            Today's Cosmetic Charges
          </h3>
          <p className="text-xs text-amber-600 mb-4 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Cosmetic services are not covered by insurance
          </p>

          {cosmeticCharges.length === 0 ? (
            <div className="text-clinical-500 text-sm">No cosmetic treatments</div>
          ) : (
            <div className="space-y-4">
              {cosmeticCharges.map((charge, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-clinical-100">
                  <div className="flex-1">
                    <div className="font-medium text-clinical-800">
                      {charge.treatment}
                      {charge.product && ` (${charge.product})`}
                    </div>
                    <div className="text-sm text-clinical-600">
                      {charge.units} units × ${charge.unitPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold text-clinical-800">${charge.subtotal.toFixed(2)}</div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2">
                <div className="text-clinical-700">Subtotal:</div>
                <div className="text-clinical-800">${cosmeticSubtotal.toFixed(2)}</div>
              </div>

              {/* Discounts */}
              <div className="border-t border-clinical-200 pt-4 space-y-3">
                <div className="font-medium text-clinical-700 mb-2">Coupons & Discounts</div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-clinical-600 w-32">Allē Rewards:</label>
                  <input
                    type="number"
                    value={alleDiscount}
                    onChange={(e) => setAlleDiscount(Number(e.target.value) || 0)}
                    className="input text-sm w-32"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-clinical-600 w-32">Aspire Rewards:</label>
                  <input
                    type="number"
                    value={aspireDiscount}
                    onChange={(e) => setAspireDiscount(Number(e.target.value) || 0)}
                    className="input text-sm w-32"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-clinical-600 w-32">Custom Discount:</label>
                  <input
                    type="number"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(Number(e.target.value) || 0)}
                    className="input text-sm w-32"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 font-semibold border-t border-clinical-200">
                <div className="text-clinical-800">Cosmetic Total:</div>
                <div className="text-dermis-600 text-lg">${cosmeticTotal.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Products */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-semibold text-clinical-800 mb-4">Products</h3>

          <div className="mb-4">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="input text-sm"
            />
            {productSearch && (
              <div className="mt-2 border border-clinical-200 rounded-lg max-h-40 overflow-y-auto">
                {availableProducts
                  .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="w-full text-left px-3 py-2 hover:bg-clinical-50 text-sm"
                    >
                      {product.name} - ${product.price?.toFixed(2) || '0.00'}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {productCharges.length === 0 ? (
            <div className="text-clinical-500 text-sm">No products added</div>
          ) : (
            <div className="space-y-3">
              {productCharges.map((product) => (
                <div key={product.productId} className="flex items-center gap-4 py-2 border-b border-clinical-100">
                  <div className="flex-1">
                    <div className="font-medium text-clinical-800">{product.productName}</div>
                    <div className="text-sm text-clinical-600">${product.unitPrice.toFixed(2)} each</div>
                  </div>
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => updateProductQuantity(product.productId, Number(e.target.value))}
                    className="w-16 input text-sm text-center"
                    min="1"
                  />
                  <div className="w-24 text-right font-semibold text-clinical-800">
                    ${product.subtotal.toFixed(2)}
                  </div>
                  <button onClick={() => removeProduct(product.productId)} className="text-clinical-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 font-semibold">
                <div className="text-clinical-800">Products Total:</div>
                <div className="text-dermis-600 text-lg">${productsTotal.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Payment Summary */}
        <div className="card p-6 bg-dermis-50 border-dermis-200">
          <h3 className="text-xl font-display font-semibold text-clinical-800 mb-4">Payment Summary</h3>

          <div className="space-y-3 mb-6">
            {previousBalance > 0 && (
              <div className="flex justify-between text-amber-700">
                <div>Previous Balance:</div>
                <div className="font-medium">${previousBalance.toFixed(2)}</div>
              </div>
            )}
            <div className="flex justify-between">
              <div className="text-clinical-700">Today's Medical:</div>
              <div className="text-clinical-800">${medicalTotal.toFixed(2)}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-clinical-700">Today's Cosmetic:</div>
              <div className="text-clinical-800">${cosmeticTotal.toFixed(2)}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-clinical-700">Products:</div>
              <div className="text-clinical-800">${productsTotal.toFixed(2)}</div>
            </div>
            <div className="border-t border-clinical-300 pt-3 flex justify-between items-center">
              <div className="text-xl font-display font-bold text-clinical-900">TOTAL DUE:</div>
              <div className="text-2xl font-bold text-dermis-600">${grandTotal.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4 mb-6">
            <div className="label">Payment Method</div>
            <div className="flex gap-3">
              {(['cash', 'card', 'check', 'split'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    paymentMethod === method
                      ? 'bg-dermis-600 text-white'
                      : 'bg-white text-clinical-700 border border-clinical-200'
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Partial Payment Option */}
          <div className="mb-6">
            <label className="label">Amount Paying (leave blank for full payment)</label>
            <input
              type="number"
              value={amountPaying}
              onChange={(e) => setAmountPaying(e.target.value ? Number(e.target.value) : '')}
              className="input text-sm w-48"
              placeholder={grandTotal.toFixed(2)}
              step="0.01"
            />
            {typeof amountPaying === 'number' && amountPaying < grandTotal && (
              <p className="text-sm text-amber-600 mt-2">
                Remaining balance after payment: ${(grandTotal - amountPaying).toFixed(2)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input text-sm"
              rows={2}
              placeholder="Add any notes about this payment..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCheckout}
              disabled={saving || grandTotal <= 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              {saving ? 'Processing...' : typeof amountPaying === 'number' && amountPaying < grandTotal ? 'Record Partial Payment' : 'Mark as Paid'}
            </button>
            <button onClick={printReceipt} className="btn-secondary flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
