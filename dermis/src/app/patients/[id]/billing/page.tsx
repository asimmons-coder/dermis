'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CreditCard,
  FileText,
  AlertCircle,
  Check,
  ChevronRight,
  Calendar,
  Shield,
} from 'lucide-react'

interface BillingPageProps {
  params: { id: string }
}

interface Charge {
  id: string
  date: string
  description: string
  amount: number
  type: 'medical' | 'cosmetic' | 'product'
  status: 'pending' | 'paid' | 'partial'
  encounterId?: string
}

interface Payment {
  id: string
  date: string
  amount: number
  method: string
  reference?: string
  allocatedTo: string
}

export default function BillingPage({ params }: BillingPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<any>(null)
  const [billingData, setBillingData] = useState<{
    currentBalance: number
    charges: Charge[]
    payments: Payment[]
    insuranceInfo: any
  } | null>(null)

  useEffect(() => {
    loadBillingData()
  }, [params.id])

  const loadBillingData = async () => {
    try {
      const res = await fetch(`/api/patients/${params.id}/billing`)
      const data = await res.json()
      setPatient(data.patient)
      setBillingData(data.billing)
      setLoading(false)
    } catch (error) {
      console.error('Error loading billing data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-clinical-50">
        <AppHeader />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-clinical-600">Loading billing information...</div>
        </div>
      </div>
    )
  }

  const currentBalance = billingData?.currentBalance || 0
  const charges = billingData?.charges || []
  const payments = billingData?.payments || []
  const insurance = billingData?.insuranceInfo

  return (
    <div className="min-h-screen bg-clinical-50">
      <AppHeader />

      {/* Sub-header with patient name */}
      <header className="bg-white border-b border-clinical-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/patients/${params.id}`)}
                className="text-clinical-600 hover:text-clinical-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chart
              </button>
              <div className="h-6 w-px bg-clinical-200" />
              <h1 className="text-xl font-display font-semibold text-clinical-800">
                {patient?.first_name} {patient?.last_name} - Billing
              </h1>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 mt-4 border-b border-clinical-200 -mb-px">
            <Link
              href={`/patients/${params.id}`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Chart
            </Link>
            <Link
              href={`/patients/${params.id}/billing`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-dermis-500 text-dermis-600 flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Billing
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`card p-6 ${currentBalance > 0 ? 'border-l-4 border-amber-500' : 'border-l-4 border-green-500'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentBalance > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                <DollarSign className={`w-6 h-6 ${currentBalance > 0 ? 'text-amber-600' : 'text-green-600'}`} />
              </div>
              <div>
                <div className="text-sm text-clinical-600">Current Balance</div>
                <div className={`text-2xl font-bold ${currentBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  ${currentBalance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-clinical-600">YTD Payments</div>
                <div className="text-2xl font-bold text-clinical-800">
                  ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-clinical-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-clinical-600" />
              </div>
              <div>
                <div className="text-sm text-clinical-600">YTD Charges</div>
                <div className="text-2xl font-bold text-clinical-800">
                  ${charges.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Info */}
        {insurance && (
          <div className="card p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-display font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Insurance Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Carrier</div>
                <div className="font-medium text-blue-800">{insurance.carrier}</div>
              </div>
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Plan</div>
                <div className="font-medium text-blue-800">{insurance.plan}</div>
              </div>
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Member ID</div>
                <div className="font-medium text-blue-800">{insurance.memberId}</div>
              </div>
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Specialist Copay</div>
                <div className="font-medium text-blue-800">${insurance.copay_specialist || 35}</div>
              </div>
              {insurance.deductible_total && (
                <>
                  <div>
                    <div className="text-xs text-blue-600 uppercase tracking-wide">Deductible</div>
                    <div className="font-medium text-blue-800">
                      ${insurance.deductible_met || 0} / ${insurance.deductible_total}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 uppercase tracking-wide">Remaining</div>
                    <div className="font-medium text-blue-800">
                      ${Math.max(0, (insurance.deductible_total || 0) - (insurance.deductible_met || 0))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Outstanding Charges */}
        {currentBalance > 0 && (
          <div className="card p-6 border-l-4 border-amber-500">
            <h3 className="text-lg font-display font-semibold text-clinical-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Outstanding Charges
            </h3>
            <div className="space-y-3">
              {charges.filter(c => c.status !== 'paid').map((charge) => (
                <div key={charge.id} className="flex items-center justify-between py-3 border-b border-clinical-100 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-clinical-800">{charge.description}</div>
                    <div className="text-sm text-clinical-600 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(charge.date).toLocaleDateString()}
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        charge.type === 'medical' ? 'bg-blue-100 text-blue-700' :
                        charge.type === 'cosmetic' ? 'bg-purple-100 text-purple-700' :
                        'bg-clinical-100 text-clinical-700'
                      }`}>
                        {charge.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-600">${charge.amount.toFixed(2)}</div>
                    <div className="text-xs text-clinical-500">
                      {charge.status === 'partial' ? 'Partial' : 'Outstanding'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-semibold text-clinical-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-clinical-500" />
            Payment History
          </h3>
          {payments.length === 0 ? (
            <div className="text-clinical-500 text-center py-8">No payment history</div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-3 border-b border-clinical-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-clinical-800">
                        Payment - {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                      </div>
                      <div className="text-sm text-clinical-600">
                        {new Date(payment.date).toLocaleDateString()}
                        {payment.reference && ` • Ref: ${payment.reference}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">-${payment.amount.toFixed(2)}</div>
                    <div className="text-xs text-clinical-500">{payment.allocatedTo}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Charge History */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-semibold text-clinical-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-clinical-500" />
            All Charges
          </h3>
          {charges.length === 0 ? (
            <div className="text-clinical-500 text-center py-8">No charge history</div>
          ) : (
            <div className="space-y-3">
              {charges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between py-3 border-b border-clinical-100 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-clinical-800">{charge.description}</span>
                      {charge.status === 'paid' && (
                        <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Paid</span>
                      )}
                    </div>
                    <div className="text-sm text-clinical-600 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(charge.date).toLocaleDateString()}
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        charge.type === 'medical' ? 'bg-blue-100 text-blue-700' :
                        charge.type === 'cosmetic' ? 'bg-purple-100 text-purple-700' :
                        'bg-clinical-100 text-clinical-700'
                      }`}>
                        {charge.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${charge.status === 'paid' ? 'text-clinical-600' : 'text-clinical-800'}`}>
                      ${charge.amount.toFixed(2)}
                    </div>
                    {charge.encounterId && (
                      <Link
                        href={`/encounters/${charge.encounterId}`}
                        className="text-xs text-dermis-600 hover:text-dermis-700 flex items-center gap-1"
                      >
                        View Visit <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
