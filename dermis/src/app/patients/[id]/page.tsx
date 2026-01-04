'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Stethoscope,
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  Pill,
  Heart,
  Sun,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  Tag,
  Camera,
  Sparkles,
  CheckCircle,
  Edit,
  Printer,
  CreditCard,
  Building2,
  Microscope,
  X,
  Shield,
  MessageSquare,
  DollarSign
} from 'lucide-react'
import InsuranceVerificationModal, { InsuranceVerificationData } from '@/components/InsuranceVerificationModal'

interface Encounter {
  id: string
  date: string
  type: string
  chiefComplaint: string
  status: string
  providerId?: string
  provider: {
    id: string
    name: string
    firstName: string
    fullName: string
  } | null
  icd10Codes: Array<{ code: string; description: string }>
  cptCodes: Array<{ code: string; description: string }>
  notes: Array<{
    id: string
    type: string
    subjective: string
    objective: string
    assessment: string
    plan: string
    quickInput: string
    isDraft: boolean
    signedAt: string | null
    createdAt: string
  }>
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  mrn: string
  dateOfBirth: string
  sex: string
  age: number
  email: string
  phone: string
  allergies: Array<{ allergen: string; reaction?: string; severity?: string }>
  medications: Array<{ name: string; dose?: string; frequency?: string }>
  medicalHistory: Array<{ condition: string; onset_date?: string; status?: string }>
  skinType: string
  skinCancerHistory: boolean
  encounters: Encounter[]
  insurancePrimary: {
    carrier: string
    memberId?: string
    plan?: string
  } | null
  preferredProvider: {
    id: string
    name: string
  } | null
  preferredPharmacy?: {
    name: string
    phone?: string
    address?: string
  }
}

export default function PatientChartPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedEncounters, setExpandedEncounters] = useState<Set<string>>(new Set())
  const [signingNotes, setSigningNotes] = useState<Set<string>>(new Set())
  const [overdueFollowUps, setOverdueFollowUps] = useState(0)

  // Path order modal state
  const [showPathOrderModal, setShowPathOrderModal] = useState(false)
  const [selectedEncounterForPath, setSelectedEncounterForPath] = useState<Encounter | null>(null)
  const [pathOrderForm, setPathOrderForm] = useState({
    specimenType: '',
    bodySite: '',
    clinicalDescription: '',
    labName: ''
  })
  const [creatingPathOrder, setCreatingPathOrder] = useState(false)

  // Insurance verification modal state
  const [showInsuranceModal, setShowInsuranceModal] = useState(false)
  const [insuranceVerificationData, setInsuranceVerificationData] = useState<InsuranceVerificationData | null>(null)
  const [isVerifyingInsurance, setIsVerifyingInsurance] = useState(false)

  useEffect(() => {
    loadPatient()
    loadOverdueFollowUps()
  }, [patientId])

  const loadPatient = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data.patient)
      } else {
        setError('Patient not found')
      }
    } catch (err) {
      console.error('Failed to load patient:', err)
      setError('Failed to load patient')
    } finally {
      setIsLoading(false)
    }
  }

  const loadOverdueFollowUps = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/communications`)
      if (response.ok) {
        const data = await response.json()
        const today = new Date().toISOString().split('T')[0]
        const overdue = data.communications?.filter((c: any) =>
          c.follow_up_needed &&
          !c.follow_up_completed &&
          c.follow_up_due_date &&
          c.follow_up_due_date < today
        ).length || 0
        setOverdueFollowUps(overdue)
      }
    } catch (err) {
      console.error('Failed to load communications:', err)
    }
  }

  const handleSignNote = async (encounterId: string, noteId: string) => {
    try {
      setSigningNotes(prev => new Set(prev).add(noteId))

      const response = await fetch(
        `/api/patients/${patientId}/encounters/${encounterId}/notes/${noteId}/sign`,
        { method: 'POST' }
      )

      if (!response.ok) {
        throw new Error('Failed to sign note')
      }

      // Reload patient data to reflect the signed note
      await loadPatient()
    } catch (error) {
      console.error('Error signing note:', error)
      alert('Failed to sign note. Please try again.')
    } finally {
      setSigningNotes(prev => {
        const next = new Set(prev)
        next.delete(noteId)
        return next
      })
    }
  }

  const handlePrintNote = (encounter: any, note: any) => {
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinical Note - ${patient?.firstName} ${patient?.lastName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              color: #1f2937;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #0ea5e9;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .practice-name {
              font-size: 20px;
              font-weight: 600;
              color: #0ea5e9;
              margin-bottom: 5px;
            }
            .patient-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin: 20px 0;
              padding: 15px;
              background: #f3f4f6;
              border-radius: 8px;
            }
            .info-item {
              font-size: 14px;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
            }
            .section {
              margin: 25px 0;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #0ea5e9;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .section-content {
              font-size: 14px;
              white-space: pre-wrap;
              color: #374151;
            }
            .codes {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 10px;
            }
            .code {
              font-size: 12px;
              padding: 4px 8px;
              background: #e0f2fe;
              border: 1px solid #0ea5e9;
              border-radius: 4px;
              font-family: monospace;
            }
            .signature {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="practice-name">Novice Group Dermatology</div>
            <div style="font-size: 14px; color: #6b7280;">Bloomfield, MI</div>
          </div>

          <div class="patient-info">
            <div class="info-item">
              <div class="info-label">Patient:</div>
              <div>${patient?.firstName} ${patient?.lastName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">MRN:</div>
              <div>${patient?.mrn}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date of Birth:</div>
              <div>${new Date(patient?.dateOfBirth || '').toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date of Service:</div>
              <div>${new Date(encounter?.date || '').toLocaleDateString()}</div>
            </div>
            ${encounter?.provider ? `
            <div class="info-item">
              <div class="info-label">Provider:</div>
              <div>${encounter.provider.name}</div>
            </div>
            ` : ''}
          </div>

          <div style="margin: 20px 0; font-weight: 600; font-size: 16px;">
            Chief Complaint: ${encounter?.chiefComplaint || 'N/A'}
          </div>

          <div class="section">
            <div class="section-title">Subjective</div>
            <div class="section-content">${note.subjective || 'N/A'}</div>
          </div>

          <div class="section">
            <div class="section-title">Objective</div>
            <div class="section-content">${note.objective || 'N/A'}</div>
          </div>

          <div class="section">
            <div class="section-title">Assessment</div>
            <div class="section-content">${note.assessment || 'N/A'}</div>
          </div>

          <div class="section">
            <div class="section-title">Plan</div>
            <div class="section-content">${note.plan || 'N/A'}</div>
          </div>

          ${encounter?.icd10Codes?.length > 0 ? `
          <div class="section">
            <div class="section-title">ICD-10 Codes</div>
            <div class="codes">
              ${encounter.icd10Codes.map((code: any) => `<span class="code">${code.code} - ${code.description}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          ${encounter?.cptCodes?.length > 0 ? `
          <div class="section">
            <div class="section-title">CPT Codes</div>
            <div class="codes">
              ${encounter.cptCodes.map((code: any) => `<span class="code">${code.code} - ${code.description}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          <div class="signature">
            ${note.signedAt ? `Electronically signed on ${new Date(note.signedAt).toLocaleString()}` : 'Draft - Not yet signed'}
            <br/>
            Generated by Dermis EMR
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    // Open print window
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  const openPathOrderModal = (encounter: Encounter) => {
    setSelectedEncounterForPath(encounter)
    setPathOrderForm({
      specimenType: '',
      bodySite: '',
      clinicalDescription: '',
      labName: 'DermPath Diagnostics'
    })
    setShowPathOrderModal(true)
  }

  const handleCreatePathOrder = async () => {
    if (!patient || !selectedEncounterForPath) return

    setCreatingPathOrder(true)
    try {
      const response = await fetch('/api/pathology-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: patient.id,
          encounterId: selectedEncounterForPath.id,
          providerId: selectedEncounterForPath.providerId,
          specimenType: pathOrderForm.specimenType,
          bodySite: pathOrderForm.bodySite,
          clinicalDescription: pathOrderForm.clinicalDescription,
          labName: pathOrderForm.labName,
          dateSent: new Date().toISOString()
        })
      })

      if (response.ok) {
        alert('Pathology order created successfully!')
        setShowPathOrderModal(false)
        setPathOrderForm({
          specimenType: '',
          bodySite: '',
          clinicalDescription: '',
          labName: ''
        })
      } else {
        alert('Failed to create pathology order')
      }
    } catch (error) {
      console.error('Error creating path order:', error)
      alert('Failed to create pathology order')
    } finally {
      setCreatingPathOrder(false)
    }
  }

  const handleVerifyInsurance = async () => {
    if (!patient) return

    setIsVerifyingInsurance(true)
    setShowInsuranceModal(true)

    try {
      const response = await fetch(`/api/insurance/verify/${patient.id}`)
      if (response.ok) {
        const data = await response.json()
        setInsuranceVerificationData(data.verificationData)
      } else {
        console.error('Failed to verify insurance')
        setInsuranceVerificationData(null)
      }
    } catch (error) {
      console.error('Error verifying insurance:', error)
      setInsuranceVerificationData(null)
    } finally {
      setIsVerifyingInsurance(false)
    }
  }

  const toggleEncounter = (encounterId: string) => {
    const newExpanded = new Set(expandedEncounters)
    if (newExpanded.has(encounterId)) {
      newExpanded.delete(encounterId)
    } else {
      newExpanded.add(encounterId)
    }
    setExpandedEncounters(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatEncounterType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-dermis-500 animate-spin" />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-clinical-600">{error || 'Patient not found'}</p>
          <Link href="/patients" className="text-dermis-600 text-sm mt-2 inline-block">
            Back to Patients
          </Link>
        </div>
      </div>
    )
  }

  const hasAllergies = patient.allergies && patient.allergies.length > 0
  const hasMedications = patient.medications && patient.medications.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/patients" className="text-clinical-400 hover:text-clinical-600 transition-colors">
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
                  <p className="text-xs text-clinical-500">{patient.mrn}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyInsurance}
                className="btn-secondary text-sm"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Verify Eligibility
              </button>
              <Link
                href={`/patients/${patient.id}/edit`}
                className="btn-secondary text-sm"
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Edit
              </Link>
              <Link
                href={`/demo?patientId=${patient.id}`}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Encounter
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-clinical-200 -mb-px">
            <Link
              href={`/patients/${patient.id}`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-dermis-500 text-dermis-600 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Chart
            </Link>
            <Link
              href={`/patients/${patient.id}/photos`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Photos
            </Link>
            <Link
              href={`/patients/${patient.id}/cosmetic`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Cosmetic
            </Link>
            <Link
              href={`/patients/${patient.id}/prescriptions`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <Pill className="w-4 h-4" />
              Prescriptions
            </Link>
            <Link
              href={`/patients/${patient.id}/products`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Products
            </Link>
            <Link
              href={`/patients/${patient.id}/messages`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 relative"
            >
              <MessageSquare className="w-4 h-4" />
              Messages
              {overdueFollowUps > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {overdueFollowUps}
                </span>
              )}
            </Link>
            <Link
              href={`/patients/${patient.id}/billing`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Billing
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Patient Header - Key Info */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wide mb-1">
                Demographics
              </div>
              <div className="text-sm text-clinical-700">
                <div className="font-medium">{patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : 'Other'}</div>
                <div>DOB: {formatDate(patient.dateOfBirth)}</div>
                <div>Age: {patient.age}</div>
              </div>
              <div className="mt-2 text-xs text-clinical-500">
                {patient.phone}
              </div>
              {patient.email && (
                <div className="text-xs text-clinical-500">{patient.email}</div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Insurance
              </div>
              {patient.insurancePrimary && patient.insurancePrimary.carrier ? (
                <div className="text-sm text-clinical-700">
                  <div className="font-medium">{patient.insurancePrimary.carrier}</div>
                  {patient.insurancePrimary.memberId && (
                    <div className="text-xs text-clinical-600">
                      ID: {patient.insurancePrimary.memberId}
                    </div>
                  )}
                  {patient.insurancePrimary.plan && (
                    <div className="text-xs text-clinical-500">{patient.insurancePrimary.plan}</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-clinical-500">No insurance on file</div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Allergies
              </div>
              {hasAllergies ? (
                <div className="space-y-1">
                  {patient.allergies.map((allergy, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-red-700">{allergy.allergen}</span>
                      {allergy.reaction && (
                        <span className="text-clinical-600 text-xs ml-1">({allergy.reaction})</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-clinical-500">NKDA</div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" />
                Dermatology
              </div>
              <div className="text-sm text-clinical-700">
                {patient.skinType ? `Type ${patient.skinType}` : 'Not specified'}
              </div>
              <div className="text-xs text-clinical-500 mt-1">
                {patient.skinCancerHistory ? (
                  <span className="text-amber-600 font-medium">Hx of skin cancer</span>
                ) : (
                  'No skin cancer history'
                )}
              </div>
            </div>
          </div>

          {/* Additional Info Row */}
          <div className="mt-6 pt-6 border-t border-clinical-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Preferred Provider
              </div>
              {patient.preferredProvider ? (
                <div className="text-sm text-clinical-700">
                  {patient.preferredProvider.name}
                </div>
              ) : (
                <div className="text-sm text-clinical-500">No preference</div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Preferred Pharmacy
              </div>
              {patient.preferredPharmacy && patient.preferredPharmacy.name ? (
                <div className="text-sm text-clinical-700">
                  <span className="font-medium">{patient.preferredPharmacy.name}</span>
                  {patient.preferredPharmacy.phone && (
                    <span className="text-xs text-clinical-600 ml-2">
                      {patient.preferredPharmacy.phone}
                    </span>
                  )}
                  {patient.preferredPharmacy.address && (
                    <div className="text-xs text-clinical-500 mt-0.5">
                      {patient.preferredPharmacy.address}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-clinical-500">No preferred pharmacy</div>
              )}
            </div>
          </div>
        </div>

        {/* Visit History & Clinical Notes */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-clinical-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-dermis-600" />
              <h2 className="font-display font-semibold text-clinical-800">Visit History</h2>
            </div>
            <div className="text-sm text-clinical-500">
              {patient.encounters.length} encounter{patient.encounters.length !== 1 ? 's' : ''}
            </div>
          </div>

          {patient.encounters.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
              <p className="text-clinical-500">No encounters yet</p>
            </div>
          ) : (
            <div className="divide-y divide-clinical-100">
              {patient.encounters.map((encounter) => {
                const isExpanded = expandedEncounters.has(encounter.id)
                const hasNotes = encounter.notes && encounter.notes.length > 0
                const note = hasNotes ? encounter.notes[0] : null

                return (
                  <div key={encounter.id} className="p-6 hover:bg-clinical-50/50 transition-colors">
                    {/* Encounter Header */}
                    <Link href={`/encounters/${encounter.id}`} className="block mb-2 group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-medium text-clinical-800 group-hover:text-dermis-600 transition-colors">
                              {encounter.chiefComplaint || 'No chief complaint'}
                            </h3>
                          <span className="px-2 py-0.5 text-xs bg-dermis-100 text-dermis-700 rounded">
                            {formatEncounterType(encounter.type)}
                          </span>
                          {note?.isDraft ? (
                            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                              <Edit className="w-3 h-3" />
                              Draft
                            </span>
                          ) : note?.signedAt ? (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Signed
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm text-clinical-500">
                          {formatDateTime(encounter.date)}
                          {encounter.provider && (
                            <span className="ml-2">
                              • {encounter.provider.name}
                            </span>
                          )}
                          {note?.signedAt && (
                            <span className="ml-2 text-xs">
                              • Signed {formatDateTime(note.signedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    </Link>

                    <div className="flex items-center justify-end gap-2 mb-2">
                      {note?.isDraft && (
                        <button
                          onClick={() => handleSignNote(encounter.id, note.id)}
                          disabled={signingNotes.has(note.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {signingNotes.has(note.id) ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Signing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Sign Note
                            </>
                          )}
                        </button>
                      )}
                      {hasNotes && (
                        <button
                          onClick={() => handlePrintNote(encounter, note)}
                          className="px-3 py-1.5 text-xs font-medium bg-clinical-100 text-clinical-700 rounded hover:bg-clinical-200 transition-colors flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </button>
                      )}
                      <button
                        onClick={() => openPathOrderModal(encounter)}
                        className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center gap-1"
                      >
                        <Microscope className="w-3 h-3" />
                        Path Order
                      </button>
                      {hasNotes && (
                        <button
                          onClick={() => toggleEncounter(encounter.id)}
                          className="p-1 hover:bg-clinical-100 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-clinical-600" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-clinical-600" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Billing Codes Preview */}
                    {(encounter.icd10Codes.length > 0 || encounter.cptCodes.length > 0) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {encounter.icd10Codes.slice(0, 2).map((code, i) => (
                          <code key={i} className="text-xs px-2 py-0.5 bg-dermis-100 text-dermis-700 rounded">
                            {code.code}
                          </code>
                        ))}
                        {encounter.cptCodes.slice(0, 2).map((code, i) => (
                          <code key={i} className="text-xs px-2 py-0.5 bg-accent-sky/10 text-accent-sky rounded">
                            {code.code}
                          </code>
                        ))}
                        {(encounter.icd10Codes.length + encounter.cptCodes.length > 4) && (
                          <span className="text-xs text-clinical-500">+{encounter.icd10Codes.length + encounter.cptCodes.length - 4} more</span>
                        )}
                      </div>
                    )}

                    {/* Expandable SOAP Note */}
                    {isExpanded && note && (
                      <div className="mt-4 pt-4 border-t border-clinical-100 space-y-4">
                        {note.quickInput && (
                          <div className="p-3 bg-clinical-50 rounded-lg border border-clinical-200">
                            <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wide mb-1">
                              Quick Input
                            </div>
                            <p className="text-sm text-clinical-700 italic">{note.quickInput}</p>
                          </div>
                        )}

                        {[
                          { key: 'subjective', label: 'Subjective', content: note.subjective },
                          { key: 'objective', label: 'Objective', content: note.objective },
                          { key: 'assessment', label: 'Assessment', content: note.assessment },
                          { key: 'plan', label: 'Plan', content: note.plan },
                        ].map((section) => (
                          section.content && (
                            <div key={section.key}>
                              <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wide mb-1">
                                {section.label}
                              </div>
                              <p className="text-sm text-clinical-700 whitespace-pre-wrap leading-relaxed">
                                {section.content}
                              </p>
                            </div>
                          )
                        ))}

                        {/* Full Billing Codes */}
                        {(encounter.icd10Codes.length > 0 || encounter.cptCodes.length > 0) && (
                          <div className="pt-4 border-t border-clinical-100">
                            <div className="flex items-center gap-2 mb-3">
                              <Tag className="w-4 h-4 text-clinical-500" />
                              <h4 className="text-xs font-semibold text-clinical-500 uppercase tracking-wide">
                                Billing Codes
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {encounter.icd10Codes.length > 0 && (
                                <div>
                                  <div className="text-xs text-clinical-500 mb-1">ICD-10</div>
                                  <div className="space-y-1">
                                    {encounter.icd10Codes.map((code, i) => (
                                      <div key={i} className="flex items-start gap-2 text-sm">
                                        <code className="px-2 py-0.5 bg-dermis-100 text-dermis-700 rounded font-mono text-xs">
                                          {code.code}
                                        </code>
                                        <span className="text-clinical-600">{code.description}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {encounter.cptCodes.length > 0 && (
                                <div>
                                  <div className="text-xs text-clinical-500 mb-1">CPT</div>
                                  <div className="space-y-1">
                                    {encounter.cptCodes.map((code, i) => (
                                      <div key={i} className="flex items-start gap-2 text-sm">
                                        <code className="px-2 py-0.5 bg-accent-sky/10 text-accent-sky rounded font-mono text-xs">
                                          {code.code}
                                        </code>
                                        <span className="text-clinical-600">{code.description}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Path Order Modal */}
      {showPathOrderModal && selectedEncounterForPath && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPathOrderModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-clinical-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Microscope className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-clinical-900">
                    Create Pathology Order
                  </h2>
                  <p className="text-sm text-clinical-600 mt-0.5">
                    {patient?.firstName} {patient?.lastName} • {new Date(selectedEncounterForPath.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPathOrderModal(false)}
                className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-clinical-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Specimen Type */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Specimen Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="input w-full"
                  value={pathOrderForm.specimenType}
                  onChange={(e) => setPathOrderForm({ ...pathOrderForm, specimenType: e.target.value })}
                >
                  <option value="">Select specimen type</option>
                  <option value="Shave biopsy">Shave biopsy</option>
                  <option value="Punch biopsy">Punch biopsy</option>
                  <option value="Excision">Excision</option>
                  <option value="Incisional biopsy">Incisional biopsy</option>
                  <option value="Curret tings">Curettings</option>
                </select>
              </div>

              {/* Body Site */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Body Site <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., Left forearm, Right cheek, Back upper"
                  value={pathOrderForm.bodySite}
                  onChange={(e) => setPathOrderForm({ ...pathOrderForm, bodySite: e.target.value })}
                />
              </div>

              {/* Clinical Description */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Clinical Description
                </label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Clinical impression, rule out..."
                  value={pathOrderForm.clinicalDescription}
                  onChange={(e) => setPathOrderForm({ ...pathOrderForm, clinicalDescription: e.target.value })}
                />
              </div>

              {/* Lab Name */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Lab Name
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., DermPath Diagnostics, Quest"
                  value={pathOrderForm.labName}
                  onChange={(e) => setPathOrderForm({ ...pathOrderForm, labName: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPathOrderModal(false)}
                  className="btn-secondary flex-1"
                  disabled={creatingPathOrder}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePathOrder}
                  disabled={creatingPathOrder || !pathOrderForm.specimenType || !pathOrderForm.bodySite}
                  className="btn-primary flex-1"
                >
                  {creatingPathOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Microscope className="w-4 h-4 mr-2" />
                      Create Order
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-clinical-500 pt-2 border-t border-clinical-100">
                <strong>Note:</strong> The pathology order will be sent to {pathOrderForm.labName || 'the selected lab'} and will appear in the Pathology Inbox for tracking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Verification Modal */}
      <InsuranceVerificationModal
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        patientName={`${patient?.firstName} ${patient?.lastName}`}
        verificationData={insuranceVerificationData}
        isLoading={isVerifyingInsurance}
      />
    </div>
  )
}
