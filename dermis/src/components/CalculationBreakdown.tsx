'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Calculator,
  ArrowRight,
  Shield,
  DollarSign,
  Info,
  Wallet,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import type {
  CalculationResult,
  DeductibleAllocation,
  CalculatedCharge,
} from '@/lib/billing/calculator'
import { formatCurrency, getCategoryLabel } from '@/lib/billing/calculator'

interface CalculationBreakdownProps {
  result: CalculationResult
  insuranceCarrier?: string
  isHDHP?: boolean
}

export default function CalculationBreakdown({
  result,
  insuranceCarrier,
  isHDHP = false,
}: CalculationBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>('waterfall')

  const hasDeductibleApplied = result.totalDeductibleApplied > 0
  const hasCoinsurance = result.totalCoinsurance > 0
  const hasCopay = result.totalCopay > 0

  return (
    <div className="border border-clinical-200 rounded-xl overflow-hidden bg-white">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-clinical-50 hover:from-blue-100 hover:to-clinical-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-clinical-900">Calculation Breakdown</h3>
            <p className="text-sm text-clinical-600">
              See how patient responsibility was calculated
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-clinical-500 uppercase tracking-wide">Patient Owes</div>
            <div className="text-lg font-bold text-dermis-600">
              {formatCurrency(result.totalPatientResponsibility)}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-clinical-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-clinical-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-clinical-200">
          {/* Quick Summary Pills */}
          <div className="px-5 py-4 bg-clinical-50 flex flex-wrap gap-2">
            {hasDeductibleApplied && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                <Wallet className="w-4 h-4" />
                {formatCurrency(result.totalDeductibleApplied)} to deductible
              </span>
            )}
            {hasCoinsurance && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <DollarSign className="w-4 h-4" />
                {formatCurrency(result.totalCoinsurance)} coinsurance
              </span>
            )}
            {hasCopay && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                <Shield className="w-4 h-4" />
                {formatCurrency(result.totalCopay)} copay
              </span>
            )}
            {isHDHP && result.totalHsaEligible > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                {formatCurrency(result.totalHsaEligible)} HSA eligible
              </span>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="px-5 border-b border-clinical-200">
            <div className="flex gap-1">
              <TabButton
                active={activeSection === 'waterfall'}
                onClick={() => setActiveSection('waterfall')}
              >
                Deductible Flow
              </TabButton>
              <TabButton
                active={activeSection === 'charges'}
                onClick={() => setActiveSection('charges')}
              >
                Charge Details
              </TabButton>
              <TabButton
                active={activeSection === 'copay'}
                onClick={() => setActiveSection('copay')}
              >
                Copay Rules
              </TabButton>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {activeSection === 'waterfall' && (
              <DeductibleWaterfallSection
                waterfall={result.deductibleWaterfall}
                totalDeductibleApplied={result.totalDeductibleApplied}
              />
            )}
            {activeSection === 'charges' && (
              <ChargeDetailsSection charges={result.charges} />
            )}
            {activeSection === 'copay' && (
              <CopayRulesSection
                copayDetails={result.copayDetails}
                insuranceCarrier={insuranceCarrier}
              />
            )}
          </div>

          {/* Summary Notes */}
          {result.summary.length > 0 && (
            <div className="px-5 py-4 bg-blue-50 border-t border-blue-100">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {result.summary.map((note, idx) => (
                    <p key={idx} className="text-sm text-blue-800">{note}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-dermis-600 text-dermis-700'
          : 'border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300'
      }`}
    >
      {children}
    </button>
  )
}

function DeductibleWaterfallSection({
  waterfall,
  totalDeductibleApplied,
}: {
  waterfall: DeductibleAllocation[]
  totalDeductibleApplied: number
}) {
  if (waterfall.length === 0 || totalDeductibleApplied === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-clinical-700 font-medium">Deductible Already Met</p>
        <p className="text-sm text-clinical-500 mt-1">
          No charges applied to deductible - patient pays copay and coinsurance only
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-clinical-600 mb-4">
        Deductible is applied in order across service categories until exhausted:
      </div>

      {/* Visual Waterfall */}
      <div className="space-y-3">
        {waterfall.map((allocation, idx) => (
          <div key={allocation.category} className="relative">
            {idx > 0 && (
              <div className="absolute -top-2 left-6 w-0.5 h-2 bg-clinical-300" />
            )}
            <div className={`flex items-center gap-4 p-4 rounded-lg border ${
              allocation.deductibleApplied > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-clinical-50 border-clinical-200'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                allocation.deductibleApplied > 0
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-clinical-200 text-clinical-600'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-clinical-800">{allocation.categoryLabel}</div>
                <div className="text-sm text-clinical-600">
                  Charges: {formatCurrency(allocation.chargesInCategory)}
                </div>
              </div>
              <div className="text-right">
                {allocation.deductibleApplied > 0 ? (
                  <>
                    <div className="font-semibold text-amber-700">
                      {formatCurrency(allocation.deductibleApplied)}
                    </div>
                    <div className="text-xs text-amber-600">applied to deductible</div>
                  </>
                ) : (
                  <div className="text-sm text-clinical-500">No deductible applied</div>
                )}
              </div>
              {idx < waterfall.length - 1 && allocation.deductibleApplied > 0 && (
                <ArrowRight className="w-5 h-5 text-clinical-400" />
              )}
            </div>
            {allocation.deductibleApplied > 0 && (
              <div className="ml-12 mt-1 text-xs text-clinical-500">
                Remaining deductible after: {formatCurrency(allocation.remainingAfter)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-clinical-200 flex justify-between items-center">
        <span className="font-medium text-clinical-800">Total Applied to Deductible:</span>
        <span className="text-lg font-bold text-amber-700">
          {formatCurrency(totalDeductibleApplied)}
        </span>
      </div>
    </div>
  )
}

function ChargeDetailsSection({ charges }: { charges: CalculatedCharge[] }) {
  if (charges.length === 0) {
    return (
      <div className="text-center py-8 text-clinical-500">
        No charges to display
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {charges.map((charge, idx) => (
        <div
          key={`${charge.code}-${idx}`}
          className="p-4 rounded-lg border border-clinical-200 bg-clinical-50"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-medium text-clinical-900">
                {charge.code} - {charge.description}
              </div>
              <div className="text-xs text-clinical-500 mt-0.5">
                {getCategoryLabel(charge.category)}
                {charge.units > 1 && ` | ${charge.units} units`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-dermis-600">
                {formatCurrency(charge.patientResponsibility)}
              </div>
              <div className="text-xs text-clinical-500">patient owes</div>
            </div>
          </div>

          {/* Breakdown Steps */}
          <div className="space-y-1.5 text-sm">
            {charge.breakdown.map((step, stepIdx) => (
              <div key={stepIdx} className="flex items-center gap-2 text-clinical-700">
                <div className="w-1.5 h-1.5 rounded-full bg-clinical-400" />
                {step}
              </div>
            ))}
          </div>

          {/* Flags */}
          <div className="mt-3 flex flex-wrap gap-2">
            {charge.appliedToDeductible && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs">
                <Wallet className="w-3 h-3" />
                Applied to deductible
              </span>
            )}
            {charge.isHsaEligible && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs">
                <CheckCircle className="w-3 h-3" />
                HSA eligible
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function CopayRulesSection({
  copayDetails,
  insuranceCarrier,
}: {
  copayDetails: CalculationResult['copayDetails']
  insuranceCarrier?: string
}) {
  return (
    <div className="space-y-4">
      {/* Current Copay Status */}
      <div className={`p-4 rounded-lg border ${
        copayDetails.waived
          ? 'bg-amber-50 border-amber-200'
          : copayDetails.amount > 0
          ? 'bg-green-50 border-green-200'
          : 'bg-clinical-50 border-clinical-200'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {copayDetails.waived ? (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          ) : copayDetails.amount > 0 ? (
            <Shield className="w-5 h-5 text-green-600" />
          ) : (
            <Info className="w-5 h-5 text-clinical-500" />
          )}
          <div className="font-medium text-clinical-900">
            {copayDetails.waived
              ? 'Copay Waived'
              : copayDetails.amount > 0
              ? `${copayDetails.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Copay`
              : 'No Copay Applicable'}
          </div>
        </div>
        <div className="text-sm text-clinical-700">
          {copayDetails.waived && copayDetails.waivedReason ? (
            copayDetails.waivedReason
          ) : copayDetails.amount > 0 ? (
            <>Copay amount: <strong>{formatCurrency(copayDetails.amount)}</strong></>
          ) : (
            'No copay required for this visit'
          )}
        </div>
      </div>

      {/* Copay Rules Explanation */}
      <div className="space-y-3">
        <h4 className="font-medium text-clinical-800">Copay Gatekeeping Rules</h4>
        <div className="space-y-2 text-sm text-clinical-700">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
            <div>
              <strong>Deductible not met:</strong> When deductible isn't satisfied, copay is typically waived and all charges apply to deductible first.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
            <div>
              <strong>Office visit present:</strong> When E&M code is billed, specialist copay applies. This is the most common scenario for dermatology visits.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
            <div>
              <strong>Procedures only:</strong> If only procedures are billed (no E&M), the procedure copay applies if the plan has one, otherwise no copay.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
            <div>
              <strong>Mutual exclusion:</strong> Only ONE copay is collected per visit, regardless of how many services are rendered.
            </div>
          </div>
        </div>
      </div>

      {insuranceCarrier && (
        <div className="pt-3 border-t border-clinical-200 text-xs text-clinical-500">
          Rules applied based on {insuranceCarrier} plan benefits. Actual coverage may vary.
        </div>
      )}
    </div>
  )
}
