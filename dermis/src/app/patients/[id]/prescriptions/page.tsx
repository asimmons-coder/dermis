'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Pill,
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
  Phone,
  AlertCircle,
  Sparkles,
  CreditCard,
  CheckCircle2,
  XCircle,
  FlaskConical
} from 'lucide-react'

interface Medication {
  name: string
  strengths: string[]
  forms: string[]
  category: string
}

interface Prescription {
  id: string
  patient_id: string
  medication_name: string
  medication_strength?: string
  medication_form?: string
  sig: string
  quantity: number
  refills: number
  pharmacy_name?: string
  pharmacy_phone?: string
  status: 'draft' | 'pending' | 'sent' | 'filled' | 'cancelled'
  sent_at?: string
  erx_reference_id?: string
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
  preferred_pharmacy?: {
    name?: string
    phone?: string
    address?: string
  }
}

export default function PatientPrescriptionsPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewRx, setShowNewRx] = useState(false)

  // New prescription form state
  const [medicationSearch, setMedicationSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Medication[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [rxForm, setRxForm] = useState({
    strength: '',
    form: '',
    sig: '',
    quantity: 30,
    daysSupply: 30,
    refills: 0,
    daw: false,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSending, setIsSending] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [patientId])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (medicationSearch.length >= 2) {
        searchMedications()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [medicationSearch])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([loadPatient(), loadPrescriptions()])
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

  const loadPrescriptions = async () => {
    try {
      const response = await fetch(`/api/prescriptions?patientId=${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPrescriptions(data.prescriptions || [])
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err)
    }
  }

  const searchMedications = async () => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/prescriptions?search=${encodeURIComponent(medicationSearch)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.medications || [])
      }
    } catch (err) {
      console.error('Failed to search medications:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const selectMedication = (med: Medication) => {
    setSelectedMedication(med)
    setMedicationSearch(med.name)
    setSearchResults([])
    setRxForm(prev => ({
      ...prev,
      strength: med.strengths[0] || '',
      form: med.forms[0] || ''
    }))
  }

  const handleCreatePrescription = async () => {
    if (!selectedMedication || !rxForm.sig) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          medicationName: selectedMedication.name,
          strength: rxForm.strength,
          form: rxForm.form,
          sig: rxForm.sig,
          quantity: rxForm.quantity,
          daysSupply: rxForm.daysSupply,
          refills: rxForm.refills,
          daw: rxForm.daw,
          notes: rxForm.notes
        })
      })

      if (response.ok) {
        await loadPrescriptions()
        resetForm()
      }
    } catch (err) {
      console.error('Failed to create prescription:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendPrescription = async (rxId: string) => {
    setIsSending(rxId)
    setSendSuccess(null)

    try {
      const response = await fetch(`/api/prescriptions/${rxId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' })
      })

      if (response.ok) {
        const data = await response.json()
        setSendSuccess(rxId)
        await loadPrescriptions()

        // Clear success after 3 seconds
        setTimeout(() => setSendSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Failed to send prescription:', err)
    } finally {
      setIsSending(null)
    }
  }

  const resetForm = () => {
    setShowNewRx(false)
    setSelectedMedication(null)
    setMedicationSearch('')
    setRxForm({
      strength: '',
      form: '',
      sig: '',
      quantity: 30,
      daysSupply: 30,
      refills: 0,
      daw: false,
      notes: ''
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Sent
          </span>
        )
      case 'filled':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Filled
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

  const commonSigs = [
    'Apply thin layer to affected area once daily at bedtime',
    'Apply thin layer to affected area twice daily',
    'Take 1 tablet by mouth once daily',
    'Take 1 tablet by mouth twice daily',
    'Take 1 capsule by mouth once daily with food',
    'Apply to affected area as needed',
    'Take 1 tablet by mouth every 12 hours'
  ]

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
                  <p className="text-xs text-clinical-500">E-Prescribe</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewRx(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
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
              className="px-4 py-2 text-sm font-medium border-b-2 border-dermis-500 text-dermis-600 flex items-center gap-2 whitespace-nowrap"
            >
              <Pill className="w-4 h-4" />
              Prescriptions
            </Link>
            <Link
              href={`/patients/${patient.id}/labs`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
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
        {/* Surescripts Integration Banner */}
        <div className="card p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-clinical-800">Surescripts E-Prescribe Connected</h3>
              <p className="text-sm text-clinical-600">
                Prescriptions sent electronically to patient's pharmacy in real-time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-green-700">Active</span>
            </div>
          </div>
        </div>

        {/* Patient's Pharmacy */}
        {patient.preferred_pharmacy?.name && (
          <div className="card p-4 mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-clinical-500" />
              <div className="flex-1">
                <div className="text-sm text-clinical-500">Preferred Pharmacy</div>
                <div className="font-medium text-clinical-800">{patient.preferred_pharmacy.name}</div>
                {patient.preferred_pharmacy.phone && (
                  <div className="text-sm text-clinical-600 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {patient.preferred_pharmacy.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prescriptions List */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-clinical-100">
            <h2 className="font-display font-semibold text-clinical-800">Prescription History</h2>
          </div>

          {prescriptions.length === 0 ? (
            <div className="p-12 text-center">
              <Pill className="w-12 h-12 mx-auto mb-4 text-clinical-300" />
              <h3 className="font-medium text-clinical-800 mb-2">No Prescriptions Yet</h3>
              <p className="text-clinical-600 mb-4">
                Click "New Prescription" to write and send a prescription
              </p>
              <button
                onClick={() => setShowNewRx(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Write First Prescription
              </button>
            </div>
          ) : (
            <div className="divide-y divide-clinical-100">
              {prescriptions.map(rx => (
                <div key={rx.id} className="p-4 sm:p-6 hover:bg-clinical-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-clinical-900">
                          {rx.medication_name} {rx.medication_strength}
                        </h3>
                        {getStatusBadge(rx.status)}
                        {sendSuccess === rx.id && (
                          <span className="text-sm text-green-600 flex items-center gap-1 animate-fade-in">
                            <CheckCircle2 className="w-4 h-4" />
                            Sent to pharmacy!
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-clinical-600 space-y-1">
                        <p><span className="font-medium">Sig:</span> {rx.sig}</p>
                        <p>
                          <span className="font-medium">Qty:</span> {rx.quantity} {rx.medication_form} •
                          <span className="font-medium ml-2">Refills:</span> {rx.refills}
                        </p>
                        {rx.pharmacy_name && (
                          <p className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {rx.pharmacy_name}
                          </p>
                        )}
                        {rx.erx_reference_id && (
                          <p className="text-xs text-clinical-500">
                            eRx Ref: {rx.erx_reference_id}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-clinical-500 mb-2">
                        {new Date(rx.created_at).toLocaleDateString()}
                      </div>
                      {rx.status === 'pending' && (
                        <button
                          onClick={() => handleSendPrescription(rx.id)}
                          disabled={isSending === rx.id}
                          className="btn-primary text-sm py-1.5"
                        >
                          {isSending === rx.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Send to Pharmacy
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

      {/* New Prescription Modal */}
      {showNewRx && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-clinical-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-display font-semibold text-clinical-800 text-lg">New Prescription</h3>
              <button
                onClick={resetForm}
                className="text-clinical-400 hover:text-clinical-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Medication Search */}
              <div>
                <label className="label">Medication</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400" />
                  <input
                    type="text"
                    value={medicationSearch}
                    onChange={(e) => {
                      setMedicationSearch(e.target.value)
                      setSelectedMedication(null)
                    }}
                    placeholder="Search medications..."
                    className="input pl-10 w-full"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400 animate-spin" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && !selectedMedication && (
                  <div className="mt-2 bg-white border border-clinical-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((med, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectMedication(med)}
                        className="w-full px-4 py-3 text-left hover:bg-clinical-50 border-b border-clinical-100 last:border-b-0"
                      >
                        <div className="font-medium text-clinical-800">{med.name}</div>
                        <div className="text-sm text-clinical-500">
                          {med.category} • {med.forms.join(', ')} • {med.strengths.join(', ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMedication && (
                  <div className="mt-2 p-3 bg-dermis-50 rounded-lg border border-dermis-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-dermis-800">{selectedMedication.name}</div>
                        <div className="text-sm text-dermis-600">{selectedMedication.category}</div>
                      </div>
                      <Check className="w-5 h-5 text-dermis-600" />
                    </div>
                  </div>
                )}
              </div>

              {selectedMedication && (
                <>
                  {/* Strength and Form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Strength</label>
                      <select
                        value={rxForm.strength}
                        onChange={(e) => setRxForm({ ...rxForm, strength: e.target.value })}
                        className="input w-full"
                      >
                        {selectedMedication.strengths.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Form</label>
                      <select
                        value={rxForm.form}
                        onChange={(e) => setRxForm({ ...rxForm, form: e.target.value })}
                        className="input w-full"
                      >
                        {selectedMedication.forms.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sig (Directions) */}
                  <div>
                    <label className="label">Sig (Directions)</label>
                    <textarea
                      value={rxForm.sig}
                      onChange={(e) => setRxForm({ ...rxForm, sig: e.target.value })}
                      placeholder="Enter directions for use..."
                      className="input w-full min-h-[80px] resize-none"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {commonSigs.slice(0, 4).map((sig, idx) => (
                        <button
                          key={idx}
                          onClick={() => setRxForm({ ...rxForm, sig })}
                          className="text-xs px-2 py-1 bg-clinical-100 text-clinical-600 rounded hover:bg-clinical-200 transition-colors"
                        >
                          {sig.length > 40 ? sig.substring(0, 40) + '...' : sig}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity, Days Supply, Refills */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">Quantity</label>
                      <input
                        type="number"
                        value={rxForm.quantity}
                        onChange={(e) => setRxForm({ ...rxForm, quantity: parseInt(e.target.value) || 0 })}
                        className="input w-full"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="label">Days Supply</label>
                      <input
                        type="number"
                        value={rxForm.daysSupply}
                        onChange={(e) => setRxForm({ ...rxForm, daysSupply: parseInt(e.target.value) || 0 })}
                        className="input w-full"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="label">Refills</label>
                      <select
                        value={rxForm.refills}
                        onChange={(e) => setRxForm({ ...rxForm, refills: parseInt(e.target.value) })}
                        className="input w-full"
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 11].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* DAW Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rxForm.daw}
                      onChange={(e) => setRxForm({ ...rxForm, daw: e.target.checked })}
                      className="w-4 h-4 rounded border-clinical-300 text-dermis-600 focus:ring-dermis-500"
                    />
                    <span className="text-sm text-clinical-700">Dispense as Written (DAW) - No substitution</span>
                  </label>

                  {/* Pharmacy Info */}
                  <div className="p-4 bg-clinical-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-clinical-500" />
                      <span className="font-medium text-clinical-700">Sending to:</span>
                    </div>
                    {patient.preferred_pharmacy?.name ? (
                      <div>
                        <div className="font-medium text-clinical-800">{patient.preferred_pharmacy.name}</div>
                        {patient.preferred_pharmacy.phone && (
                          <div className="text-sm text-clinical-600">{patient.preferred_pharmacy.phone}</div>
                        )}
                        {patient.preferred_pharmacy.address && (
                          <div className="text-sm text-clinical-600">{patient.preferred_pharmacy.address}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        No preferred pharmacy on file
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">Notes (Optional)</label>
                    <input
                      type="text"
                      value={rxForm.notes}
                      onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })}
                      placeholder="Internal notes..."
                      className="input w-full"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-clinical-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={resetForm}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePrescription}
                disabled={!selectedMedication || !rxForm.sig || isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Pill className="w-4 h-4 mr-2" />
                    Create Prescription
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
