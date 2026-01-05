'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  User,
  FlaskConical,
  Plus,
  Loader2,
  Camera,
  FileText,
  X,
  Search,
  Check,
  Send,
  Clock,
  Building2,
  AlertCircle,
  Sparkles,
  CreditCard,
  CheckCircle2,
  XCircle,
  Pill,
  Beaker,
  AlertTriangle,
  Coffee
} from 'lucide-react'

interface LabTest {
  code: string
  name: string
  description: string
  category: string
  components: string[]
  turnaround: string
  fasting: boolean
}

interface Lab {
  id: string
  name: string
  address: string
}

interface LabOrder {
  id: string
  patient_id: string
  tests: LabTest[]
  lab_name: string
  order_number: string
  priority: string
  fasting_required: boolean
  clinical_notes?: string
  status: 'pending' | 'sent' | 'collected' | 'resulted' | 'cancelled'
  sent_at?: string
  confirmation_number?: string
  estimated_results?: string
  created_at: string
  provider?: {
    first_name: string
    last_name: string
    credentials?: string
  }
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  mrn: string
}

export default function PatientLabsPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [labOrders, setLabOrders] = useState<LabOrder[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewOrder, setShowNewOrder] = useState(false)

  // New order form state
  const [testSearch, setTestSearch] = useState('')
  const [searchResults, setSearchResults] = useState<LabTest[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([])
  const [selectedLab, setSelectedLab] = useState<string>('quest')
  const [priority, setPriority] = useState<string>('routine')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSending, setIsSending] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [patientId])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (testSearch.length >= 2) {
        searchTests()
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [testSearch])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([loadPatient(), loadLabOrders(), loadLabs()])
    } finally {
      setIsLoading(false)
    }
  }

  const loadPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data.patient)
      }
    } catch (err) {
      console.error('Failed to load patient:', err)
    }
  }

  const loadLabOrders = async () => {
    try {
      const response = await fetch(`/api/lab-orders?patientId=${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setLabOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Failed to load lab orders:', err)
    }
  }

  const loadLabs = async () => {
    try {
      const response = await fetch('/api/lab-orders?labs=true')
      if (response.ok) {
        const data = await response.json()
        setLabs(data.labs || [])
      }
    } catch (err) {
      console.error('Failed to load labs:', err)
    }
  }

  const searchTests = async () => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/lab-orders?search=${encodeURIComponent(testSearch)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.tests || [])
      }
    } catch (err) {
      console.error('Failed to search tests:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const addTest = (test: LabTest) => {
    if (!selectedTests.find(t => t.code === test.code)) {
      setSelectedTests([...selectedTests, test])
    }
    setTestSearch('')
    setSearchResults([])
  }

  const removeTest = (code: string) => {
    setSelectedTests(selectedTests.filter(t => t.code !== code))
  }

  const handleCreateOrder = async () => {
    if (selectedTests.length === 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          tests: selectedTests,
          labId: selectedLab,
          priority,
          clinicalNotes
        })
      })

      if (response.ok) {
        await loadLabOrders()
        resetForm()
      }
    } catch (err) {
      console.error('Failed to create lab order:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendOrder = async (orderId: string) => {
    setIsSending(orderId)
    setSendSuccess(null)

    try {
      const response = await fetch(`/api/lab-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' })
      })

      if (response.ok) {
        setSendSuccess(orderId)
        await loadLabOrders()
        setTimeout(() => setSendSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Failed to send order:', err)
    } finally {
      setIsSending(null)
    }
  }

  const resetForm = () => {
    setShowNewOrder(false)
    setSelectedTests([])
    setTestSearch('')
    setSelectedLab('quest')
    setPriority('routine')
    setClinicalNotes('')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
            <Send className="w-3 h-3" />
            Sent to Lab
          </span>
        )
      case 'collected':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
            <Beaker className="w-3 h-3" />
            Collected
          </span>
        )
      case 'resulted':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Results Ready
          </span>
        )
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  const requiresFasting = selectedTests.some(t => t.fasting)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-dermis-500 animate-spin" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <p className="text-clinical-600">Patient not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href={`/patients/${patient.id}`} className="text-clinical-400 hover:text-clinical-600 transition-colors">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-display font-bold text-clinical-800">
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <p className="text-xs text-clinical-500">Lab Orders</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewOrder(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Order Labs
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-clinical-200 -mb-px overflow-x-auto">
            <Link
              href={`/patients/${patient.id}`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Chart
            </Link>
            <Link
              href={`/patients/${patient.id}/photos`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              Photos
            </Link>
            <Link
              href={`/patients/${patient.id}/cosmetic`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Cosmetic
            </Link>
            <Link
              href={`/patients/${patient.id}/prescriptions`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Pill className="w-4 h-4" />
              Prescriptions
            </Link>
            <Link
              href={`/patients/${patient.id}/labs`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-dermis-500 text-dermis-600 flex items-center gap-2 whitespace-nowrap"
            >
              <FlaskConical className="w-4 h-4" />
              Labs
            </Link>
            <Link
              href={`/patients/${patient.id}/products`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              Products
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Lab Integration Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-clinical-800">Quest Diagnostics</h3>
                <p className="text-xs text-clinical-600">Electronic ordering • Auto result import</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-medium text-green-700">Connected</span>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-clinical-800">LabCorp</h3>
                <p className="text-xs text-clinical-600">Electronic ordering • Patient notifications</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-medium text-green-700">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Orders List */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-clinical-100">
            <h2 className="font-display font-semibold text-clinical-800">Lab Order History</h2>
          </div>

          {labOrders.length === 0 ? (
            <div className="p-12 text-center">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-clinical-300" />
              <h3 className="font-medium text-clinical-800 mb-2">No Lab Orders Yet</h3>
              <p className="text-clinical-600 mb-4">
                Click "Order Labs" to create and send a lab order
              </p>
              <button
                onClick={() => setShowNewOrder(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Order First Labs
              </button>
            </div>
          ) : (
            <div className="divide-y divide-clinical-100">
              {labOrders.map(order => (
                <div key={order.id} className="p-4 sm:p-6 hover:bg-clinical-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-clinical-900">
                          {order.tests.length} Test{order.tests.length > 1 ? 's' : ''} - {order.lab_name}
                        </h3>
                        {getStatusBadge(order.status)}
                        {sendSuccess === order.id && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Sent to lab!
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          {order.tests.map((test, idx) => (
                            <span key={idx} className="px-2 py-1 bg-clinical-100 text-clinical-700 text-xs rounded">
                              {test.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-clinical-500">
                          Order #: {order.order_number}
                          {order.confirmation_number && (
                            <> • Confirmation: {order.confirmation_number}</>
                          )}
                        </p>
                        {order.fasting_required && (
                          <p className="text-sm text-amber-600 flex items-center gap-1">
                            <Coffee className="w-3 h-3" />
                            Fasting required
                          </p>
                        )}
                        {order.estimated_results && (
                          <p className="text-sm text-clinical-600">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Est. results: {order.estimated_results}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-clinical-500 mb-2">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleSendOrder(order.id)}
                          disabled={isSending === order.id}
                          className="btn-primary text-sm py-1.5"
                        >
                          {isSending === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Send to Lab
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Lab Order Modal */}
      {showNewOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-clinical-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-display font-semibold text-clinical-800 text-lg">Order Labs</h3>
              <button
                onClick={resetForm}
                className="text-clinical-400 hover:text-clinical-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Test Search */}
              <div>
                <label className="label">Search Lab Tests</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search CBC, lipid panel, thyroid..."
                    className="input pl-10 w-full"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-clinical-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((test, idx) => (
                      <button
                        key={idx}
                        onClick={() => addTest(test)}
                        disabled={selectedTests.some(t => t.code === test.code)}
                        className="w-full px-4 py-3 text-left hover:bg-clinical-50 border-b border-clinical-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-clinical-800">{test.name}</div>
                            <div className="text-xs text-clinical-500">
                              {test.category} • {test.code} • {test.turnaround}
                              {test.fasting && <span className="text-amber-600 ml-2">• Fasting</span>}
                            </div>
                          </div>
                          {selectedTests.some(t => t.code === test.code) ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Plus className="w-5 h-5 text-clinical-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Tests */}
              {selectedTests.length > 0 && (
                <div>
                  <label className="label">Selected Tests ({selectedTests.length})</label>
                  <div className="space-y-2">
                    {selectedTests.map(test => (
                      <div
                        key={test.code}
                        className="flex items-center justify-between p-3 bg-dermis-50 rounded-lg border border-dermis-200"
                      >
                        <div>
                          <div className="font-medium text-clinical-800">{test.name}</div>
                          <div className="text-xs text-clinical-500">
                            {test.category} • {test.turnaround}
                            {test.fasting && <span className="text-amber-600 ml-2">• Fasting required</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => removeTest(test.code)}
                          className="text-clinical-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {requiresFasting && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <Coffee className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Fasting Required</p>
                        <p className="text-xs text-amber-700">
                          Patient should fast for 8-12 hours before specimen collection
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lab Selection */}
              <div>
                <label className="label">Send to Lab</label>
                <div className="grid grid-cols-2 gap-3">
                  {labs.map(lab => (
                    <button
                      key={lab.id}
                      onClick={() => setSelectedLab(lab.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedLab === lab.id
                          ? 'border-dermis-500 bg-dermis-50'
                          : 'border-clinical-200 hover:border-clinical-300'
                      }`}
                    >
                      <div className="font-medium text-clinical-800">{lab.name}</div>
                      <div className="text-xs text-clinical-500 truncate">{lab.address}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="label">Priority</label>
                <div className="flex gap-3">
                  {[
                    { value: 'routine', label: 'Routine', desc: '2-3 days' },
                    { value: 'urgent', label: 'Urgent', desc: '24 hours' },
                    { value: 'stat', label: 'STAT', desc: 'Same day' }
                  ].map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                        priority === p.value
                          ? p.value === 'stat'
                            ? 'border-red-500 bg-red-50'
                            : p.value === 'urgent'
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-dermis-500 bg-dermis-50'
                          : 'border-clinical-200 hover:border-clinical-300'
                      }`}
                    >
                      <div className="font-medium text-clinical-800">{p.label}</div>
                      <div className="text-xs text-clinical-500">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="label">Clinical Notes / Diagnosis (Optional)</label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="ICD-10 codes, clinical indication..."
                  className="input w-full min-h-[80px] resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-clinical-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={resetForm}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={selectedTests.length === 0 || isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Create Order ({selectedTests.length} tests)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
