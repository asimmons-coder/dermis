'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Stethoscope, Loader2 } from 'lucide-react'
import PatientIntakeForm from '@/components/PatientIntakeForm'

export default function EditPatientPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPatient()
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

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update patient')
      }

      // Redirect back to the patient's chart
      router.push(`/patients/${patientId}`)
    } catch (error) {
      console.error('Error updating patient:', error)
      alert(error instanceof Error ? error.message : 'Failed to update patient. Please try again.')
    }
  }

  const handleCancel = () => {
    router.push(`/patients/${patientId}`)
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
          <p className="text-clinical-600 mb-4">{error || 'Patient not found'}</p>
          <Link href="/patients" className="text-dermis-600 text-sm">
            Back to Patients
          </Link>
        </div>
      </div>
    )
  }

  // Convert patient data from API format to form format
  const initialData = {
    firstName: patient.firstName || '',
    lastName: patient.lastName || '',
    middleName: patient.middleName || '',
    dateOfBirth: patient.dateOfBirth || '',
    sex: patient.sex || 'M',
    genderIdentity: patient.genderIdentity || '',
    pronouns: patient.pronouns || '',
    email: patient.email || '',
    phonePrimary: patient.phone || '',
    phoneSecondary: patient.phoneSecondary || '',
    addressLine1: patient.address?.line1 || '',
    addressLine2: patient.address?.line2 || '',
    city: patient.address?.city || '',
    state: patient.address?.state || 'MI',
    zip: patient.address?.zip || '',
    preferredContact: patient.preferredContact || 'phone',
    insurancePrimary: patient.insurancePrimary || {
      carrier: '',
      plan: '',
      memberId: '',
      groupId: '',
      subscriber: '',
      relationship: 'self'
    },
    insuranceSecondary: patient.insuranceSecondary || {
      carrier: '',
      plan: '',
      memberId: '',
      groupId: '',
      subscriber: '',
      relationship: 'self'
    },
    emergencyContact: patient.emergencyContact || {
      name: '',
      relationship: '',
      phone: ''
    },
    allergies: patient.allergies || [],
    medications: patient.medications || [],
    medicalHistory: patient.medicalHistory || [],
    surgicalHistory: patient.surgicalHistory || [],
    familyHistory: patient.familyHistory || [],
    skinType: patient.skinType || '',
    skinCancerHistory: patient.skinCancerHistory || false,
    sunExposure: patient.sunExposure || '',
    tanningHistory: patient.tanningHistory || '',
    cosmeticInterests: patient.cosmeticInterests || [],
    preferredProviderId: patient.preferredProviderId || '',
    preferredPharmacy: patient.preferredPharmacy || {
      name: '',
      address: '',
      phone: ''
    },
    isActive: patient.isActive !== undefined ? patient.isActive : true,
    notes: patient.notes || ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href={`/patients/${patientId}`} className="text-clinical-400 hover:text-clinical-600 transition-colors">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-display font-bold text-clinical-800">
                  Edit Patient: {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-xs text-clinical-500">{patient.mrn}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PatientIntakeForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={true}
        />
      </div>
    </div>
  )
}
