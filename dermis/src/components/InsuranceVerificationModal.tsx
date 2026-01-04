import { X, AlertCircle, CheckCircle, AlertTriangle, Shield } from 'lucide-react'

export interface InsuranceVerificationData {
  carrier: string
  memberId: string
  groupNumber?: string
  planName?: string
  status: 'active' | 'inactive' | 'unknown'
  copay?: {
    specialist?: number
    primary?: number
  }
  deductible?: {
    individual: number
    remaining: number
  }
  priorAuthRequired: boolean
  lastVerified: string | null
  effectiveDate?: string
  terminationDate?: string
}

interface InsuranceVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  patientName: string
  verificationData: InsuranceVerificationData | null
  isLoading?: boolean
}

export default function InsuranceVerificationModal({
  isOpen,
  onClose,
  patientName,
  verificationData,
  isLoading = false
}: InsuranceVerificationModalProps) {
  if (!isOpen) return null

  const getStatusIcon = () => {
    if (!verificationData) return null

    switch (verificationData.status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'inactive':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
    }
  }

  const getStatusColor = () => {
    if (!verificationData) return 'bg-gray-100 text-gray-700'

    switch (verificationData.status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-amber-100 text-amber-700'
    }
  }

  const getWarningBanner = () => {
    if (!verificationData) {
      return (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">No Insurance on File</p>
            <p className="text-sm text-red-700 mt-1">
              Patient does not have insurance information recorded. They will be billed as self-pay.
            </p>
          </div>
        </div>
      )
    }

    if (verificationData.status === 'inactive') {
      return (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Insurance Inactive</p>
            <p className="text-sm text-red-700 mt-1">
              This insurance policy is currently inactive. Patient may be responsible for full payment.
            </p>
          </div>
        </div>
      )
    }

    if (!verificationData.lastVerified) {
      return (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Never Verified</p>
            <p className="text-sm text-amber-700 mt-1">
              Insurance eligibility has never been verified. Recommend verifying before services.
            </p>
          </div>
        </div>
      )
    }

    const lastVerifiedDate = new Date(verificationData.lastVerified)
    const daysSinceVerification = Math.floor((Date.now() - lastVerifiedDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceVerification > 30) {
      return (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Verification Outdated</p>
            <p className="text-sm text-amber-700 mt-1">
              Insurance was last verified {daysSinceVerification} days ago. Recommend re-verification.
            </p>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-clinical-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-clinical-900">
                Insurance Verification
              </h2>
              <p className="text-sm text-clinical-600 mt-0.5">
                {patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-clinical-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Banner */}
          {getWarningBanner()}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-dermis-200 border-t-dermis-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-clinical-600">Verifying insurance eligibility...</p>
              </div>
            </div>
          ) : verificationData ? (
            <>
              {/* Insurance Details Card */}
              <div className="bg-clinical-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-clinical-700 uppercase tracking-wide">
                    Insurance Information
                  </h3>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getStatusColor()}`}>
                    {getStatusIcon()}
                    {verificationData.status.charAt(0).toUpperCase() + verificationData.status.slice(1)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-clinical-500 mb-1">Carrier</div>
                    <div className="text-sm font-medium text-clinical-900">{verificationData.carrier}</div>
                  </div>
                  <div>
                    <div className="text-xs text-clinical-500 mb-1">Member ID</div>
                    <div className="text-sm font-mono text-clinical-900">{verificationData.memberId}</div>
                  </div>
                  {verificationData.groupNumber && (
                    <div>
                      <div className="text-xs text-clinical-500 mb-1">Group Number</div>
                      <div className="text-sm font-mono text-clinical-900">{verificationData.groupNumber}</div>
                    </div>
                  )}
                  {verificationData.planName && (
                    <div>
                      <div className="text-xs text-clinical-500 mb-1">Plan Name</div>
                      <div className="text-sm text-clinical-900">{verificationData.planName}</div>
                    </div>
                  )}
                </div>

                {verificationData.effectiveDate && (
                  <div className="pt-3 border-t border-clinical-200">
                    <div className="text-xs text-clinical-500 mb-1">Coverage Period</div>
                    <div className="text-sm text-clinical-900">
                      {new Date(verificationData.effectiveDate).toLocaleDateString()} - {
                        verificationData.terminationDate
                          ? new Date(verificationData.terminationDate).toLocaleDateString()
                          : 'Ongoing'
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Benefits Card */}
              <div className="bg-clinical-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-clinical-700 uppercase tracking-wide">
                  Benefits Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {verificationData.copay && (
                    <>
                      {verificationData.copay.specialist !== undefined && (
                        <div>
                          <div className="text-xs text-clinical-500 mb-1">Specialist Copay</div>
                          <div className="text-lg font-semibold text-clinical-900">
                            ${verificationData.copay.specialist.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {verificationData.copay.primary !== undefined && (
                        <div>
                          <div className="text-xs text-clinical-500 mb-1">Primary Care Copay</div>
                          <div className="text-lg font-semibold text-clinical-900">
                            ${verificationData.copay.primary.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {verificationData.deductible && (
                  <div className="pt-3 border-t border-clinical-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-clinical-500 mb-1">Annual Deductible</div>
                        <div className="text-sm font-semibold text-clinical-900">
                          ${verificationData.deductible.individual.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-clinical-500 mb-1">Deductible Remaining</div>
                        <div className="text-sm font-semibold text-clinical-900">
                          ${verificationData.deductible.remaining.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-clinical-200">
                  <div className="text-xs text-clinical-500 mb-1">Prior Authorization</div>
                  <div className={`text-sm font-medium ${verificationData.priorAuthRequired ? 'text-amber-600' : 'text-green-600'}`}>
                    {verificationData.priorAuthRequired ? 'Required for certain procedures' : 'Not required'}
                  </div>
                </div>
              </div>

              {/* Verification Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900">
                      {verificationData.lastVerified
                        ? `Last verified ${new Date(verificationData.lastVerified).toLocaleDateString()}`
                        : 'Not yet verified'
                      }
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      This information represents the most recent eligibility check. Benefits and coverage may change without notice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-clinical-200">
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    // TODO: Implement real-time verification
                    alert('Real-time verification will be implemented with clearinghouse API integration')
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Now
                </button>
              </div>

              <p className="text-xs text-clinical-500 pt-2">
                <strong>Demo Mode:</strong> This is mock data. In production, this will connect to a clearinghouse API (Availity, Change Healthcare) for real-time eligibility verification.
              </p>
            </>
          ) : (
            <>
              {/* No Insurance */}
              <div className="text-center py-8">
                <Shield className="w-16 h-16 text-clinical-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-clinical-800 mb-2">
                  No Insurance on File
                </h3>
                <p className="text-sm text-clinical-600 mb-6">
                  This patient does not have insurance information recorded.
                </p>
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
