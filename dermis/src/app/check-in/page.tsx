'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  Search,
  Command,
  CheckCircle,
  Camera,
  CreditCard,
  FileText,
  User,
  Clock,
  DollarSign,
  Upload,
  X,
  Loader2
} from 'lucide-react'

interface Patient {
  id: string
  name: string
  mrn: string
  dateOfBirth: string
}

interface TodayAppointment {
  id: string
  scheduledAt: string
  type: string
  chiefComplaint: string
  status: string
  provider: {
    name: string
  }
}

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<TodayAppointment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  // Check-in form fields
  const [copay, setCopay] = useState('')
  const [insuranceCardPhoto, setInsuranceCardPhoto] = useState<string | null>(null)
  const [idPhoto, setIdPhoto] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const insuranceInputRef = useRef<HTMLInputElement>(null)
  const idInputRef = useRef<HTMLInputElement>(null)

  const triggerGlobalSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const results = patients.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.mrn.toLowerCase().includes(query) ||
        p.dateOfBirth.includes(query)
      )
      setSearchResults(results.slice(0, 10))
    } else {
      setSearchResults([])
    }
  }, [searchQuery, patients])

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (err) {
      console.error('Failed to load patients:', err)
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchQuery('')
    setSearchResults([])

    // Load today's appointments for this patient
    setIsLoading(true)
    try {
      const response = await fetch(`/api/patients/${patient.id}/appointments?today=true`)
      if (response.ok) {
        const data = await response.json()
        setTodayAppointments(data.appointments || [])

        // Auto-select if only one appointment
        if (data.appointments?.length === 1) {
          setSelectedAppointment(data.appointments[0])
        }
      }
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (file: File, type: 'insurance' | 'id') => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      if (type === 'insurance') {
        setInsuranceCardPhoto(result)
      } else {
        setIdPhoto(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = signatureCanvasRef.current
    if (canvas) {
      setSignature(canvas.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature(null)
  }

  const handleCheckIn = async () => {
    if (!selectedAppointment || !selectedPatient) return

    setIsCheckingIn(true)
    try {
      const response = await fetch(`/api/encounters/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'checked_in',
          copay: copay ? parseFloat(copay) : null,
          insuranceCardPhoto,
          idPhoto,
          signature,
          checkedInAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        // Reset form
        setSelectedPatient(null)
        setSelectedAppointment(null)
        setTodayAppointments([])
        setCopay('')
        setInsuranceCardPhoto(null)
        setIdPhoto(null)
        setSignature(null)
        clearSignature()

        alert('Patient checked in successfully!')
      } else {
        alert('Failed to check in patient')
      }
    } catch (err) {
      console.error('Error checking in:', err)
      alert('Failed to check in patient')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const resetForm = () => {
    setSelectedPatient(null)
    setSelectedAppointment(null)
    setTodayAppointments([])
    setCopay('')
    setInsuranceCardPhoto(null)
    setIdPhoto(null)
    setSignature(null)
    clearSignature()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-clinical-800">Dermis</h1>
              <p className="text-xs text-clinical-500">by Novice Group</p>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <button
              onClick={triggerGlobalSearch}
              className="flex items-center gap-2 px-3 py-2 text-sm text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search patients</span>
              <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-clinical-100 border border-clinical-200 rounded">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
            <Link href="/demo" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Demo
            </Link>
            <Link href="/patients" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Patients
            </Link>
            <Link href="/schedule" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Schedule
            </Link>
            <Link href="/tracker" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Tracker
            </Link>
            <Link href="/calendar" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Calendar
            </Link>
            <Link href="/check-in" className="text-dermis-600 font-medium text-sm border-b-2 border-dermis-500">
              Check In
            </Link>
            <Link href="/inbox/pathology" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Pathology
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-dermis-600" />
            <h1 className="text-3xl font-display font-bold text-clinical-900">Patient Check-In</h1>
          </div>
          <p className="text-clinical-600">
            Search for patient and complete check-in process
          </p>
        </div>

        {/* Patient Search */}
        {!selectedPatient && (
          <div className="card p-6 mb-6">
            <label className="block text-sm font-medium text-clinical-700 mb-3">
              Search Patient
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
              <input
                type="text"
                className="input pl-10 w-full text-lg"
                placeholder="Search by name, MRN, or date of birth..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 border border-clinical-200 rounded-lg divide-y divide-clinical-100 max-h-96 overflow-y-auto">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full px-4 py-3 text-left hover:bg-clinical-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-clinical-800">{patient.name}</div>
                        <div className="text-sm text-clinical-500">
                          DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                        </div>
                      </div>
                      <code className="text-sm text-clinical-600 bg-clinical-100 px-2 py-1 rounded">
                        {patient.mrn}
                      </code>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Patient & Appointments */}
        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-clinical-900">
                    {selectedPatient.name}
                  </h2>
                  <p className="text-sm text-clinical-600 mt-1">
                    MRN: {selectedPatient.mrn} • DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-clinical-600" />
                </button>
              </div>

              {/* Today's Appointments */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-dermis-500" />
                </div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-clinical-600">
                  No appointments scheduled for today
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-clinical-700 mb-3">
                    Today's Appointments
                  </label>
                  <div className="space-y-2">
                    {todayAppointments.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedAppointment?.id === apt.id
                            ? 'border-dermis-500 bg-dermis-50'
                            : 'border-clinical-200 hover:border-dermis-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Clock className="w-5 h-5 text-clinical-400" />
                          <div className="flex-1">
                            <div className="font-medium text-clinical-800">
                              {new Date(apt.scheduledAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-sm text-clinical-600">{apt.chiefComplaint}</div>
                          </div>
                          <div className="text-sm text-clinical-600">
                            {apt.provider.name}
                          </div>
                          {apt.status === 'checked_in' && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                              Already Checked In
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Check-In Form */}
            {selectedAppointment && selectedAppointment.status !== 'checked_in' && (
              <div className="card p-6">
                <h3 className="text-lg font-display font-bold text-clinical-900 mb-4">
                  Check-In Information
                </h3>

                <div className="space-y-6">
                  {/* Copay */}
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-2">
                      Copay Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
                      <input
                        type="number"
                        step="0.01"
                        className="input pl-10 w-full"
                        placeholder="0.00"
                        value={copay}
                        onChange={(e) => setCopay(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Insurance Card Photo */}
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-2">
                      Insurance Card Photo
                    </label>
                    <input
                      ref={insuranceInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'insurance')
                      }}
                    />
                    {insuranceCardPhoto ? (
                      <div className="relative">
                        <img
                          src={insuranceCardPhoto}
                          alt="Insurance card"
                          className="w-full h-48 object-cover rounded-lg border border-clinical-200"
                        />
                        <button
                          onClick={() => setInsuranceCardPhoto(null)}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-clinical-50"
                        >
                          <X className="w-4 h-4 text-clinical-600" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => insuranceInputRef.current?.click()}
                        className="w-full p-6 border-2 border-dashed border-clinical-300 rounded-lg hover:border-dermis-400 hover:bg-dermis-50/30 transition-colors"
                      >
                        <Camera className="w-8 h-8 text-clinical-400 mx-auto mb-2" />
                        <p className="text-sm text-clinical-600">Click to upload insurance card</p>
                      </button>
                    )}
                  </div>

                  {/* ID Photo */}
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-2">
                      Photo ID
                    </label>
                    <input
                      ref={idInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'id')
                      }}
                    />
                    {idPhoto ? (
                      <div className="relative">
                        <img
                          src={idPhoto}
                          alt="ID"
                          className="w-full h-48 object-cover rounded-lg border border-clinical-200"
                        />
                        <button
                          onClick={() => setIdPhoto(null)}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-clinical-50"
                        >
                          <X className="w-4 h-4 text-clinical-600" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => idInputRef.current?.click()}
                        className="w-full p-6 border-2 border-dashed border-clinical-300 rounded-lg hover:border-dermis-400 hover:bg-dermis-50/30 transition-colors"
                      >
                        <CreditCard className="w-8 h-8 text-clinical-400 mx-auto mb-2" />
                        <p className="text-sm text-clinical-600">Click to upload photo ID</p>
                      </button>
                    )}
                  </div>

                  {/* Digital Signature */}
                  <div>
                    <label className="block text-sm font-medium text-clinical-700 mb-2">
                      Patient Signature
                    </label>
                    <div className="border-2 border-clinical-300 rounded-lg overflow-hidden">
                      <canvas
                        ref={signatureCanvasRef}
                        width={600}
                        height={200}
                        className="w-full cursor-crosshair bg-white"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>
                    <button
                      onClick={clearSignature}
                      className="mt-2 text-sm text-clinical-600 hover:text-clinical-800"
                    >
                      Clear signature
                    </button>
                  </div>

                  {/* Check In Button */}
                  <button
                    onClick={handleCheckIn}
                    disabled={isCheckingIn || !signature}
                    className="btn-primary w-full"
                  >
                    {isCheckingIn ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete Check-In
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
