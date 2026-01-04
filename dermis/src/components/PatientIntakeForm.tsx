'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlertCircle,
  Pill,
  Heart,
  Sun,
  Sparkles,
  Building2,
  Save,
  Loader2,
  Plus,
  X
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  firstName: string
}

interface PatientFormData {
  // Demographics
  firstName: string
  lastName: string
  middleName: string
  dateOfBirth: string
  sex: string
  genderIdentity: string
  pronouns: string

  // Contact
  email: string
  phonePrimary: string
  phoneSecondary: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zip: string
  preferredContact: string

  // Insurance
  insurancePrimary: {
    carrier: string
    plan: string
    memberId: string
    groupId: string
    subscriber: string
    relationship: string
  }
  insuranceSecondary: {
    carrier: string
    plan: string
    memberId: string
    groupId: string
    subscriber: string
    relationship: string
  }

  // Emergency Contact
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }

  // Medical History
  allergies: Array<{ allergen: string; reaction: string; severity: string }>
  medications: Array<{ name: string; dose: string; frequency: string; prescriber: string }>
  medicalHistory: Array<{ condition: string; onsetDate: string; status: string }>
  surgicalHistory: Array<{ procedure: string; date: string; notes: string }>
  familyHistory: Array<{ relationship: string; condition: string }>

  // Derm-Specific
  skinType: string
  skinCancerHistory: boolean
  sunExposure: string
  tanningHistory: string

  // Cosmetic
  cosmeticInterests: string[]

  // Preferences
  preferredProviderId: string
  preferredPharmacy: {
    name: string
    address: string
    phone: string
  }

  // Status
  isActive: boolean
  notes: string
}

interface PatientIntakeFormProps {
  initialData?: Partial<PatientFormData>
  onSubmit: (data: PatientFormData) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

export default function PatientIntakeForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}: PatientIntakeFormProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    sex: 'M',
    genderIdentity: '',
    pronouns: '',
    email: '',
    phonePrimary: '',
    phoneSecondary: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'MI',
    zip: '',
    preferredContact: 'phone',
    insurancePrimary: {
      carrier: '',
      plan: '',
      memberId: '',
      groupId: '',
      subscriber: '',
      relationship: 'self'
    },
    insuranceSecondary: {
      carrier: '',
      plan: '',
      memberId: '',
      groupId: '',
      subscriber: '',
      relationship: 'self'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    allergies: [],
    medications: [],
    medicalHistory: [],
    surgicalHistory: [],
    familyHistory: [],
    skinType: '',
    skinCancerHistory: false,
    sunExposure: '',
    tanningHistory: '',
    cosmeticInterests: [],
    preferredProviderId: '',
    preferredPharmacy: {
      name: '',
      address: '',
      phone: ''
    },
    isActive: true,
    notes: '',
    ...initialData
  })

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/providers?practiceId=00000000-0000-0000-0000-000000000001')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (err) {
      console.error('Failed to load providers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const addAllergy = () => {
    setFormData({
      ...formData,
      allergies: [...formData.allergies, { allergen: '', reaction: '', severity: 'moderate' }]
    })
  }

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index)
    })
  }

  const updateAllergy = (index: number, field: string, value: string) => {
    const updated = [...formData.allergies]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, allergies: updated })
  }

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dose: '', frequency: '', prescriber: '' }]
    })
  }

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    })
  }

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...formData.medications]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, medications: updated })
  }

  const addMedicalHistory = () => {
    setFormData({
      ...formData,
      medicalHistory: [...formData.medicalHistory, { condition: '', onsetDate: '', status: 'active' }]
    })
  }

  const removeMedicalHistory = (index: number) => {
    setFormData({
      ...formData,
      medicalHistory: formData.medicalHistory.filter((_, i) => i !== index)
    })
  }

  const updateMedicalHistory = (index: number, field: string, value: string) => {
    const updated = [...formData.medicalHistory]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, medicalHistory: updated })
  }

  const toggleCosmeticInterest = (interest: string) => {
    if (formData.cosmeticInterests.includes(interest)) {
      setFormData({
        ...formData,
        cosmeticInterests: formData.cosmeticInterests.filter(i => i !== interest)
      })
    } else {
      setFormData({
        ...formData,
        cosmeticInterests: [...formData.cosmeticInterests, interest]
      })
    }
  }

  const cosmeticOptions = ['Botox', 'Filler', 'Laser', 'Chemical Peel', 'Microneedling', 'PRP', 'Sclerotherapy']

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
      {/* Demographics */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center">
            <User className="w-5 h-5 text-dermis-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Demographics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input w-full"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              className="input w-full"
              value={formData.middleName}
              onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input w-full"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="input w-full"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Sex <span className="text-red-500">*</span>
            </label>
            <select
              className="input w-full"
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
              required
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Pronouns
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., he/him, she/her, they/them"
              value={formData.pronouns}
              onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-dermis-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Contact Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Primary Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className="input w-full"
              placeholder="(248) 555-0100"
              value={formData.phonePrimary}
              onChange={(e) => setFormData({ ...formData, phonePrimary: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Secondary Phone
            </label>
            <input
              type="tel"
              className="input w-full"
              placeholder="(248) 555-0100"
              value={formData.phoneSecondary}
              onChange={(e) => setFormData({ ...formData, phoneSecondary: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input w-full"
              placeholder="patient@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Preferred Contact Method
            </label>
            <select
              className="input w-full"
              value={formData.preferredContact}
              onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
            >
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="text">Text</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="123 Main St"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="Apt 4B"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-clinical-700 mb-1">
                City
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="Bloomfield"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-clinical-700 mb-1">
                State
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="MI"
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-clinical-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="48302"
                maxLength={10}
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-dermis-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Insurance</h2>
        </div>

        <div className="space-y-6">
          {/* Primary Insurance */}
          <div>
            <h3 className="text-sm font-semibold text-clinical-700 mb-3">Primary Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Carrier
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Blue Cross Blue Shield"
                  value={formData.insurancePrimary.carrier}
                  onChange={(e) => setFormData({
                    ...formData,
                    insurancePrimary: { ...formData.insurancePrimary, carrier: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Plan
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="PPO"
                  value={formData.insurancePrimary.plan}
                  onChange={(e) => setFormData({
                    ...formData,
                    insurancePrimary: { ...formData.insurancePrimary, plan: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Member ID
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="ABC123456789"
                  value={formData.insurancePrimary.memberId}
                  onChange={(e) => setFormData({
                    ...formData,
                    insurancePrimary: { ...formData.insurancePrimary, memberId: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Group #
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="GRP00123"
                  value={formData.insurancePrimary.groupId}
                  onChange={(e) => setFormData({
                    ...formData,
                    insurancePrimary: { ...formData.insurancePrimary, groupId: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Subscriber Name
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="John Doe"
                  value={formData.insurancePrimary.subscriber}
                  onChange={(e) => setFormData({
                    ...formData,
                    insurancePrimary: { ...formData.insurancePrimary, subscriber: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Relationship to Subscriber
                </label>
                <select
                  className="input w-full"
                  value={formData.insurancePrimary.relationship}
                  onChange={(e) => setFormData({
                    ...formData,
                    insurancePrimary: { ...formData.insurancePrimary, relationship: e.target.value }
                  })}
                >
                  <option value="self">Self</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Secondary Insurance */}
          <div>
            <h3 className="text-sm font-semibold text-clinical-700 mb-3">Secondary Insurance (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Carrier
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Aetna"
                  value={formData.insuranceSecondary.carrier}
                  onChange={(e) => setFormData({
                    ...formData,
                    insuranceSecondary: { ...formData.insuranceSecondary, carrier: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Member ID
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="DEF987654321"
                  value={formData.insuranceSecondary.memberId}
                  onChange={(e) => setFormData({
                    ...formData,
                    insuranceSecondary: { ...formData.insuranceSecondary, memberId: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Emergency Contact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Name
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="Jane Doe"
              value={formData.emergencyContact.name}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, name: e.target.value }
              })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Relationship
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="Spouse"
              value={formData.emergencyContact.relationship}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
              })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              className="input w-full"
              placeholder="(248) 555-0200"
              value={formData.emergencyContact.phone}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
              })}
            />
          </div>
        </div>
      </div>

      {/* Medical History - Allergies */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Allergies</h2>
        </div>

        {formData.allergies.length === 0 ? (
          <p className="text-sm text-clinical-500 mb-4">No known drug allergies (NKDA)</p>
        ) : (
          <div className="space-y-3 mb-4">
            {formData.allergies.map((allergy, index) => (
              <div key={index} className="flex gap-3 items-start">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Allergen (e.g., Penicillin)"
                  value={allergy.allergen}
                  onChange={(e) => updateAllergy(index, 'allergen', e.target.value)}
                />
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Reaction (e.g., hives)"
                  value={allergy.reaction}
                  onChange={(e) => updateAllergy(index, 'reaction', e.target.value)}
                />
                <select
                  className="input w-32"
                  value={allergy.severity}
                  onChange={(e) => updateAllergy(index, 'severity', e.target.value)}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeAllergy(index)}
                  className="btn-secondary p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addAllergy}
          className="btn-secondary text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Allergy
        </button>
      </div>

      {/* Current Medications */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center">
            <Pill className="w-5 h-5 text-dermis-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Current Medications</h2>
        </div>

        {formData.medications.length === 0 ? (
          <p className="text-sm text-clinical-500 mb-4">No current medications</p>
        ) : (
          <div className="space-y-3 mb-4">
            {formData.medications.map((med, index) => (
              <div key={index} className="flex gap-3 items-start">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Medication name"
                  value={med.name}
                  onChange={(e) => updateMedication(index, 'name', e.target.value)}
                />
                <input
                  type="text"
                  className="input w-32"
                  placeholder="Dose"
                  value={med.dose}
                  onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                />
                <input
                  type="text"
                  className="input w-32"
                  placeholder="Frequency"
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="btn-secondary p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addMedication}
          className="btn-secondary text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Medication
        </button>
      </div>

      {/* Past Medical History */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center">
            <Heart className="w-5 h-5 text-dermis-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Past Medical History</h2>
        </div>

        {formData.medicalHistory.length === 0 ? (
          <p className="text-sm text-clinical-500 mb-4">No significant past medical history</p>
        ) : (
          <div className="space-y-3 mb-4">
            {formData.medicalHistory.map((condition, index) => (
              <div key={index} className="flex gap-3 items-start">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Condition"
                  value={condition.condition}
                  onChange={(e) => updateMedicalHistory(index, 'condition', e.target.value)}
                />
                <input
                  type="text"
                  className="input w-32"
                  placeholder="Year"
                  value={condition.onsetDate}
                  onChange={(e) => updateMedicalHistory(index, 'onsetDate', e.target.value)}
                />
                <select
                  className="input w-32"
                  value={condition.status}
                  onChange={(e) => updateMedicalHistory(index, 'status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeMedicalHistory(index)}
                  className="btn-secondary p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addMedicalHistory}
          className="btn-secondary text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Condition
        </button>
      </div>

      {/* Dermatology-Specific */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Sun className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Dermatology History</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Skin Type (Fitzpatrick Scale)
            </label>
            <select
              className="input w-full"
              value={formData.skinType}
              onChange={(e) => setFormData({ ...formData, skinType: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="I">Type I (Very fair, always burns)</option>
              <option value="II">Type II (Fair, usually burns)</option>
              <option value="III">Type III (Medium, sometimes burns)</option>
              <option value="IV">Type IV (Olive, rarely burns)</option>
              <option value="V">Type V (Brown, very rarely burns)</option>
              <option value="VI">Type VI (Dark brown, never burns)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Skin Cancer History
            </label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="skinCancerHistory"
                  checked={formData.skinCancerHistory === true}
                  onChange={() => setFormData({ ...formData, skinCancerHistory: true })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-clinical-700">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="skinCancerHistory"
                  checked={formData.skinCancerHistory === false}
                  onChange={() => setFormData({ ...formData, skinCancerHistory: false })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-clinical-700">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Sun Exposure
            </label>
            <select
              className="input w-full"
              value={formData.sunExposure}
              onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="minimal">Minimal (mostly indoors)</option>
              <option value="moderate">Moderate (occasional outdoor activities)</option>
              <option value="high">High (frequent outdoor activities)</option>
              <option value="extreme">Extreme (outdoor occupation)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Tanning History
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., Never, Occasional, Frequent tanning bed use"
              value={formData.tanningHistory}
              onChange={(e) => setFormData({ ...formData, tanningHistory: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Cosmetic Interests */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Cosmetic Interests</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cosmeticOptions.map(option => (
            <label key={option} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.cosmeticInterests.includes(option)}
                onChange={() => toggleCosmeticInterest(option)}
                className="w-4 h-4"
              />
              <span className="text-sm text-clinical-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-dermis-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-clinical-800">Preferences</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1">
              Preferred Provider
            </label>
            <select
              className="input w-full"
              value={formData.preferredProviderId}
              onChange={(e) => setFormData({ ...formData, preferredProviderId: e.target.value })}
            >
              <option value="">No preference</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-clinical-700 mb-3">Preferred Pharmacy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Pharmacy Name
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="CVS Pharmacy"
                  value={formData.preferredPharmacy.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferredPharmacy: { ...formData.preferredPharmacy, name: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="input w-full"
                  placeholder="(248) 555-0300"
                  value={formData.preferredPharmacy.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferredPharmacy: { ...formData.preferredPharmacy, phone: e.target.value }
                  })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-clinical-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="456 Woodward Ave, Bloomfield, MI 48302"
                  value={formData.preferredPharmacy.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferredPharmacy: { ...formData.preferredPharmacy, address: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <div>
          <label className="block text-sm font-medium text-clinical-700 mb-1">
            Additional Notes
          </label>
          <textarea
            className="input w-full"
            rows={4}
            placeholder="Any additional notes about the patient..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              {isEdit ? 'Update Patient' : 'Create Patient'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
