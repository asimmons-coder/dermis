'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Search,
  Calendar,
  Clock,
  User,
  FileText,
  Loader2,
  Plus
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  firstName: string
}

interface Patient {
  id: string
  name: string
  mrn: string
  dateOfBirth: string
}

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultDate?: string
  defaultTime?: string
  defaultProvider?: string
}

const VISIT_TYPES = [
  'New Patient',
  'Follow-Up',
  'Annual Skin Check',
  'Mole Check',
  'Acne Treatment',
  'Rash/Dermatitis',
  'Cosmetic Consult',
  'Procedure',
  'Telehealth'
]

export default function AppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  defaultTime,
  defaultProvider
}: AppointmentModalProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [showSearch, setShowSearch] = useState(false)

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [providerId, setProviderId] = useState(defaultProvider || '')
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(defaultTime || '09:00')
  const [visitType, setVisitType] = useState('Follow-Up')
  const [reason, setReason] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadProviders()
      loadPatients()
      // Reset form with defaults
      setDate(defaultDate || new Date().toISOString().split('T')[0])
      setTime(defaultTime || '09:00')
      setProviderId(defaultProvider || '')
    }
  }, [isOpen, defaultDate, defaultTime, defaultProvider])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const results = patients.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.mrn.toLowerCase().includes(query) ||
        p.dateOfBirth.includes(query)
      )
      setSearchResults(results.slice(0, 10))
      setShowSearch(true)
    } else {
      setSearchResults([])
      setShowSearch(false)
    }
  }, [searchQuery, patients])

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/providers?practiceId=00000000-0000-0000-0000-000000000001')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
        if (!providerId && data.providers.length > 0) {
          setProviderId(data.providers[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load providers:', err)
    }
  }

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (err) {
      console.error('Failed to load patients:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchQuery(patient.name)
    setShowSearch(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedPatient) {
      setError('Please select a patient')
      return
    }

    if (!providerId) {
      setError('Please select a provider')
      return
    }

    try {
      setIsSaving(true)

      const scheduledAt = new Date(`${date}T${time}:00`)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          providerId,
          scheduledAt: scheduledAt.toISOString(),
          encounterType: visitType.toLowerCase().replace(/\s+/g, '_'),
          visitReason: reason,
          status: 'scheduled'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create appointment')
      }

      onSuccess()
      resetForm()
      onClose()
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError(err instanceof Error ? err.message : 'Failed to create appointment')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedPatient(null)
    setSearchQuery('')
    setSearchResults([])
    setProviderId(defaultProvider || (providers.length > 0 ? providers[0].id : ''))
    setDate(defaultDate || new Date().toISOString().split('T')[0])
    setTime('09:00')
    setVisitType('Follow-Up')
    setReason('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Generate time slots (8am - 5pm, 15-min increments)
  const timeSlots = []
  for (let hour = 8; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const h = hour.toString().padStart(2, '0')
      const m = min.toString().padStart(2, '0')
      timeSlots.push(`${h}:${m}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-clinical-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-dermis-600" />
            </div>
            <h2 className="text-xl font-display font-semibold text-clinical-800">
              New Appointment
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-clinical-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-clinical-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Patient Search */}
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-2">
              Patient <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
              <input
                type="text"
                className="input pl-10 w-full"
                placeholder="Search by name, MRN, or DOB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearch(true)}
                required
              />
              {selectedPatient && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-clinical-500">{selectedPatient.mrn}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null)
                      setSearchQuery('')
                    }}
                    className="p-1 hover:bg-clinical-100 rounded"
                  >
                    <X className="w-4 h-4 text-clinical-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-clinical-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => selectPatient(patient)}
                    className="w-full px-4 py-3 text-left hover:bg-clinical-50 transition-colors border-b border-clinical-100 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-clinical-800">{patient.name}</div>
                        <div className="text-xs text-clinical-500">
                          DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                        </div>
                      </div>
                      <code className="text-xs text-clinical-600 bg-clinical-100 px-2 py-1 rounded">
                        {patient.mrn}
                      </code>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="text-sm text-clinical-500 mt-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading patients...
              </div>
            )}
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
              <select
                className="input pl-10 w-full"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                required
              >
                <option value="">Select provider...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-clinical-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
                <input
                  type="date"
                  className="input pl-10 w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-clinical-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
                <select
                  className="input pl-10 w-full"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Visit Type */}
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-2">
              Visit Type <span className="text-red-500">*</span>
            </label>
            <select
              className="input w-full"
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              required
            >
              {VISIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-2">
              Reason for Visit
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-clinical-400" />
              <textarea
                className="input pl-10 w-full"
                rows={3}
                placeholder="e.g., Follow-up for acne treatment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-clinical-100">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving || !selectedPatient}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Appointment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
