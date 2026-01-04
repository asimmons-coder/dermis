'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  DollarSign,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface TreatmentZone {
  zone: string
  product: string
  amount: number
  price: number
}

interface CosmeticPhoto {
  id: string
  photo_type: 'cosmetic_before' | 'cosmetic_after'
  body_location_detail: string
  taken_at: string
  url: string
}

const FACE_ZONES = [
  'Glabella',
  'Forehead',
  'Crow\'s Feet (L)',
  'Crow\'s Feet (R)',
  'Lips',
  'Nasolabial Folds (L)',
  'Nasolabial Folds (R)',
  'Cheeks (L)',
  'Cheeks (R)',
  'Jawline',
  'Chin',
]

const PRODUCTS = [
  { name: 'Botox', unit: 'units', pricePerUnit: 12 },
  { name: 'Dysport', unit: 'units', pricePerUnit: 4 },
  { name: 'Juvederm', unit: 'mL', pricePerUnit: 600 },
  { name: 'Restylane', unit: 'mL', pricePerUnit: 600 },
  { name: 'Sculptra', unit: 'vials', pricePerUnit: 900 },
]

const BEFORE_PHOTO_ANGLES = [
  { key: 'front', label: 'Front View' },
  { key: 'left45', label: '45° Left' },
  { key: 'right45', label: '45° Right' },
  { key: 'profile', label: 'Profile' },
]

export default function CosmeticPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<any>(null)
  const [treatments, setTreatments] = useState<TreatmentZone[]>([])
  const [beforePhotos, setBeforePhotos] = useState<CosmeticPhoto[]>([])
  const [afterPhotos, setAfterPhotos] = useState<CosmeticPhoto[]>([])
  const [patientGoals, setPatientGoals] = useState('')
  const [treatmentNotes, setTreatmentNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showConsentForm, setShowConsentForm] = useState(false)
  const [consentProcedureType, setConsentProcedureType] = useState<'botox' | 'filler'>('botox')

  // Photo upload states
  const [uploadingAngle, setUploadingAngle] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Before/After Comparison states
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonAngle, setComparisonAngle] = useState<string>('front')
  const [sliderPosition, setSliderPosition] = useState(50)
  const comparisonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Load patient data and cosmetic data in parallel
      const [patientRes, cosmeticRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch(`/api/patients/${patientId}/cosmetic`)
      ])

      if (patientRes.ok) {
        const patientData = await patientRes.json()
        setPatient(patientData.patient)
      }

      if (cosmeticRes.ok) {
        const data = await cosmeticRes.json()

        // Group photos by type
        const before = data.photos.filter((p: CosmeticPhoto) => p.photo_type === 'cosmetic_before')
        const after = data.photos.filter((p: CosmeticPhoto) => p.photo_type === 'cosmetic_after')

        setBeforePhotos(before)
        setAfterPhotos(after)

        // Load most recent consult if exists
        if (data.consults.length > 0) {
          const latest = data.consults[0]
          setPatientGoals(latest.patient_goals || '')
          setTreatmentNotes(latest.treatment_plan_notes || '')
          if (latest.recommended_treatments) {
            setTreatments(latest.recommended_treatments)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTreatment = () => {
    setTreatments([
      ...treatments,
      {
        zone: '',
        product: 'Botox',
        amount: 0,
        price: 0,
      },
    ])
  }

  const updateTreatment = (index: number, field: keyof TreatmentZone, value: string | number) => {
    const updated = [...treatments]
    if (field === 'zone' || field === 'product') {
      updated[index][field] = value as string
    } else {
      updated[index][field] = value as number
    }

    // Recalculate price when product or amount changes
    if (field === 'product' || field === 'amount') {
      const product = PRODUCTS.find(p => p.name === updated[index].product)
      if (product) {
        updated[index].price = updated[index].amount * product.pricePerUnit
      }
    }

    setTreatments(updated)
  }

  const removeTreatment = (index: number) => {
    setTreatments(treatments.filter((_, i) => i !== index))
  }

  const totalCost = treatments.reduce((sum, t) => sum + t.price, 0)

  const handlePhotoUpload = async (angle: string, file: File, photoType: 'cosmetic_before' | 'cosmetic_after') => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    try {
      setIsUploadingPhoto(true)
      setUploadingAngle(angle)

      // Convert to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
      })
      reader.readAsDataURL(file)
      const base64Image = await base64Promise

      // Upload photo
      const uploadRes = await fetch(`/api/patients/${patientId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          bodyLocation: 'Face',
          aiAnalysis: null,
          filename: file.name,
        }),
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload photo')
      }

      const result = await uploadRes.json()

      // Update photo type
      await fetch(`/api/patients/${patientId}/photos/${result.photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_type: photoType,
          body_location_detail: angle,
        }),
      })

      // Reload photos
      await loadData()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
      setUploadingAngle(null)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)

      const response = await fetch(`/api/patients/${patientId}/cosmetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientGoals,
          treatmentPlan: treatments,
          treatmentPlanNotes: treatmentNotes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save treatment plan')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Save error:', error)
      setSaveError('Failed to save treatment plan')
    } finally {
      setIsSaving(false)
    }
  }

  const getPhotoForAngle = (angle: string, photos: CosmeticPhoto[]) => {
    return photos.find(p => p.body_location_detail === angle)
  }

  const handleComparisonSlider = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!comparisonRef.current) return

    const rect = comparisonRef.current.getBoundingClientRect()
    let clientX: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
    } else {
      clientX = e.clientX
    }

    const x = clientX - rect.left
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPosition(percentage)
  }

  const hasComparisonPhotos = (angle: string) => {
    return getPhotoForAngle(angle, beforePhotos) && getPhotoForAngle(angle, afterPhotos)
  }

  const getAvailableComparisonAngles = () => {
    return BEFORE_PHOTO_ANGLES.filter(angle => hasComparisonPhotos(angle.key))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href={`/patients/${patientId}`}
                className="text-clinical-400 hover:text-clinical-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent-violet to-accent-violet/80 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-display font-bold text-clinical-800">
                    Cosmetic Consult
                  </h1>
                  <p className="text-xs text-clinical-500">Treatment Planning</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-clinical-200 -mb-px">
            <Link
              href={`/patients/${patientId}`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Chart
            </Link>
            <Link
              href={`/patients/${patientId}/photos`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Photos
            </Link>
            <Link
              href={`/patients/${patientId}/cosmetic`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-accent-violet text-accent-violet flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Cosmetic
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-accent-violet animate-spin" />
          </div>
        ) : (
          <>
            {/* Patient Goals */}
            <div className="card p-6">
              <h2 className="text-lg font-display font-semibold text-clinical-800 mb-4">
                Patient Goals
              </h2>
              <textarea
                value={patientGoals}
                onChange={(e) => setPatientGoals(e.target.value)}
                className="input min-h-[100px] resize-none"
                placeholder="What are the patient's aesthetic goals?"
              />
            </div>

            {/* Before Photos */}
            <div className="card p-6">
              <h2 className="text-lg font-display font-semibold text-clinical-800 mb-4">
                Before Photos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {BEFORE_PHOTO_ANGLES.map((angle) => {
                  const photo = getPhotoForAngle(angle.key, beforePhotos)
                  return (
                    <div key={angle.key} className="border-2 border-dashed border-clinical-200 rounded-lg overflow-hidden">
                      {photo ? (
                        <div className="relative">
                          <img
                            src={photo.url}
                            alt={angle.label}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
                            {angle.label}
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 flex flex-col items-center justify-center p-4">
                          <Camera className="w-8 h-8 text-clinical-300 mb-2" />
                          <p className="text-xs text-clinical-500 text-center mb-2">
                            {angle.label}
                          </p>
                          <button
                            onClick={() => fileInputRefs.current[`before-${angle.key}`]?.click()}
                            disabled={isUploadingPhoto}
                            className="text-xs text-accent-violet hover:text-accent-violet/80 disabled:opacity-50"
                          >
                            {uploadingAngle === angle.key ? 'Uploading...' : 'Upload'}
                          </button>
                          <input
                            ref={(el) => { fileInputRefs.current[`before-${angle.key}`] = el }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handlePhotoUpload(angle.key, e.target.files[0], 'cosmetic_before')
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Treatment Planner */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-clinical-800">
                  Treatment Plan
                </h2>
                <button
                  onClick={addTreatment}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Treatment
                </button>
              </div>

              {/* Face Diagram */}
              <div className="mb-6 p-6 bg-clinical-50 rounded-lg">
                <p className="text-sm text-clinical-600 text-center mb-4">
                  Click a zone below to add treatment
                </p>
                <div className="max-w-xs mx-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {FACE_ZONES.map((zone) => (
                      <button
                        key={zone}
                        onClick={() => {
                          addTreatment()
                          setTimeout(() => {
                            const updated = [...treatments]
                            updated[updated.length - 1].zone = zone
                            setTreatments(updated)
                          }, 0)
                        }}
                        className="p-3 bg-white border border-clinical-200 rounded-lg hover:border-accent-violet hover:bg-accent-violet/5 transition-colors text-xs text-center"
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Treatment List */}
              {treatments.length === 0 ? (
                <div className="text-center py-8 text-clinical-500">
                  No treatments added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {treatments.map((treatment, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-clinical-50 rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="label text-xs">Zone</label>
                          <select
                            value={treatment.zone}
                            onChange={(e) => updateTreatment(index, 'zone', e.target.value)}
                            className="input text-sm"
                          >
                            <option value="">Select zone...</option>
                            {FACE_ZONES.map((zone) => (
                              <option key={zone} value={zone}>
                                {zone}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="label text-xs">Product</label>
                          <select
                            value={treatment.product}
                            onChange={(e) => updateTreatment(index, 'product', e.target.value)}
                            className="input text-sm"
                          >
                            {PRODUCTS.map((product) => (
                              <option key={product.name} value={product.name}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="label text-xs">
                            Amount ({PRODUCTS.find(p => p.name === treatment.product)?.unit})
                          </label>
                          <input
                            type="number"
                            value={treatment.amount}
                            onChange={(e) => updateTreatment(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="input text-sm"
                            min="0"
                            step="0.1"
                          />
                        </div>

                        <div>
                          <label className="label text-xs">Price</label>
                          <div className="input text-sm bg-white flex items-center">
                            <DollarSign className="w-4 h-4 text-clinical-400 mr-1" />
                            {treatment.price.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeTreatment(index)}
                        className="mt-6 text-clinical-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex items-center justify-between p-4 bg-accent-violet/10 rounded-lg border border-accent-violet/20">
                    <span className="font-medium text-clinical-800">Total Estimated Cost</span>
                    <span className="text-xl font-bold text-accent-violet">
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Treatment Notes */}
            <div className="card p-6">
              <h2 className="text-lg font-display font-semibold text-clinical-800 mb-4">
                Treatment Notes
              </h2>
              <textarea
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
                className="input min-h-[100px] resize-none"
                placeholder="Additional notes about the treatment plan..."
              />
            </div>

            {/* After Photos */}
            <div className="card p-6">
              <h2 className="text-lg font-display font-semibold text-clinical-800 mb-4">
                After Photos
                <span className="text-sm font-normal text-clinical-500 ml-2">
                  (Post-treatment)
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {BEFORE_PHOTO_ANGLES.map((angle) => {
                  const photo = getPhotoForAngle(angle.key, afterPhotos)
                  return (
                    <div key={angle.key} className="border-2 border-dashed border-clinical-200 rounded-lg overflow-hidden">
                      {photo ? (
                        <div className="relative">
                          <img
                            src={photo.url}
                            alt={angle.label}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
                            {angle.label}
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 flex flex-col items-center justify-center p-4">
                          <Camera className="w-8 h-8 text-clinical-300 mb-2" />
                          <p className="text-xs text-clinical-500 text-center mb-2">
                            {angle.label}
                          </p>
                          <button
                            onClick={() => fileInputRefs.current[`after-${angle.key}`]?.click()}
                            disabled={isUploadingPhoto}
                            className="text-xs text-accent-violet hover:text-accent-violet/80 disabled:opacity-50"
                          >
                            {uploadingAngle === angle.key ? 'Uploading...' : 'Upload'}
                          </button>
                          <input
                            ref={(el) => { fileInputRefs.current[`after-${angle.key}`] = el }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handlePhotoUpload(angle.key, e.target.files[0], 'cosmetic_after')
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Before/After Comparison */}
            {getAvailableComparisonAngles().length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-violet to-purple-600 flex items-center justify-center">
                      <SlidersHorizontal className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-semibold text-clinical-800">
                        Before / After Comparison
                      </h2>
                      <p className="text-sm text-clinical-500">
                        Drag the slider to compare results
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className={`btn-${showComparison ? 'primary' : 'secondary'} text-sm`}
                  >
                    {showComparison ? 'Hide Comparison' : 'Show Comparison'}
                  </button>
                </div>

                {showComparison && (
                  <div className="space-y-4">
                    {/* Angle Selector */}
                    <div className="flex items-center gap-2 justify-center">
                      {getAvailableComparisonAngles().map((angle) => (
                        <button
                          key={angle.key}
                          onClick={() => setComparisonAngle(angle.key)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            comparisonAngle === angle.key
                              ? 'bg-accent-violet text-white'
                              : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                          }`}
                        >
                          {angle.label}
                        </button>
                      ))}
                    </div>

                    {/* Comparison Slider */}
                    <div
                      ref={comparisonRef}
                      className="relative w-full max-w-2xl mx-auto aspect-[4/3] rounded-xl overflow-hidden cursor-col-resize select-none shadow-lg"
                      onMouseDown={(e) => {
                        handleComparisonSlider(e)
                        const handleMove = (moveEvent: MouseEvent) => {
                          handleComparisonSlider(moveEvent as unknown as React.MouseEvent<HTMLDivElement>)
                        }
                        const handleUp = () => {
                          document.removeEventListener('mousemove', handleMove)
                          document.removeEventListener('mouseup', handleUp)
                        }
                        document.addEventListener('mousemove', handleMove)
                        document.addEventListener('mouseup', handleUp)
                      }}
                      onTouchStart={handleComparisonSlider}
                      onTouchMove={handleComparisonSlider}
                    >
                      {/* After Image (Background) */}
                      <div className="absolute inset-0">
                        <img
                          src={getPhotoForAngle(comparisonAngle, afterPhotos)?.url}
                          alt="After"
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full shadow">
                          After
                        </div>
                      </div>

                      {/* Before Image (Clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={getPhotoForAngle(comparisonAngle, beforePhotos)?.url}
                          alt="Before"
                          className="w-full h-full object-cover"
                          style={{ width: comparisonRef.current ? `${comparisonRef.current.offsetWidth}px` : '100%' }}
                          draggable={false}
                        />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-clinical-700 text-white text-sm font-medium rounded-full shadow">
                          Before
                        </div>
                      </div>

                      {/* Slider Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
                        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <div className="flex items-center gap-0.5">
                            <ChevronLeft className="w-4 h-4 text-clinical-600" />
                            <ChevronRight className="w-4 h-4 text-clinical-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <p className="text-center text-sm text-clinical-500">
                      Drag the slider left and right to compare before and after photos
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="card p-6">
              {saveError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-4">
                  <CheckCircle className="w-4 h-4" />
                  Treatment plan saved successfully!
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Treatment Plan
                    </>
                  )}
                </button>

                {treatments.length > 0 && (
                  <button
                    onClick={() => {
                      // Determine procedure type from treatments
                      const hasBotox = treatments.some(t => t.product === 'Botox' || t.product === 'Dysport')
                      const hasFiller = treatments.some(t => t.product.includes('Juvederm') || t.product.includes('Restylane') || t.product.includes('Sculptra'))
                      setConsentProcedureType(hasBotox ? 'botox' : 'filler')
                      setShowConsentForm(true)
                    }}
                    className="btn-secondary w-full py-3"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Consent Form
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Consent Form Modal */}
      {showConsentForm && patient && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="px-8 py-6 border-b border-clinical-100 flex items-center justify-between print:hidden">
              <h3 className="text-xl font-display font-semibold text-clinical-800">
                {consentProcedureType === 'botox' ? 'Botulinum Toxin' : 'Dermal Filler'} Consent Form
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowConsentForm(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 print:p-12">
              {/* Letterhead */}
              <div className="text-center border-b pb-6">
                <h1 className="text-2xl font-display font-bold text-clinical-800 mb-2">
                  Novice Dermatology
                </h1>
                <p className="text-sm text-clinical-600">
                  123 Medical Plaza, Suite 456 • Springfield, IL 62701 • (217) 555-DERM
                </p>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-xl font-display font-bold text-clinical-800">
                  INFORMED CONSENT FOR {consentProcedureType === 'botox' ? 'BOTULINUM TOXIN (BOTOX/DYSPORT)' : 'DERMAL FILLER'} INJECTION
                </h2>
              </div>

              {/* Patient Information */}
              <div className="grid grid-cols-2 gap-4 border border-clinical-200 p-4 rounded-lg bg-clinical-50">
                <div>
                  <p className="text-sm text-clinical-600">Patient Name</p>
                  <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-clinical-600">Date of Birth</p>
                  <p className="font-semibold">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-clinical-600">Date</p>
                  <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-clinical-600">MRN</p>
                  <p className="font-semibold">{patient.mrn}</p>
                </div>
              </div>

              {/* Procedure */}
              <div>
                <h3 className="font-semibold text-clinical-800 mb-2">Procedure:</h3>
                <p className="text-sm leading-relaxed">
                  {consentProcedureType === 'botox'
                    ? 'Injection of Botulinum Toxin Type A (Botox®, Dysport®, or similar) for cosmetic enhancement of facial lines and wrinkles.'
                    : 'Injection of Dermal Filler (Hyaluronic Acid or similar) for cosmetic enhancement and volumization of facial features.'
                  }
                </p>
              </div>

              {/* Treatment Areas */}
              {treatments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-clinical-800 mb-2">Proposed Treatment Areas:</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {treatments.map((t, i) => (
                      <li key={i}>
                        {t.zone} - {t.amount} {t.product === 'Botox' || t.product === 'Dysport' ? 'units' : t.product.includes('Sculptra') ? 'vials' : 'mL'} of {t.product}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              <div>
                <h3 className="font-semibold text-clinical-800 mb-2">Potential Benefits:</h3>
                <ul className="list-disc list-inside text-sm space-y-1 leading-relaxed">
                  <li>Reduction of facial lines and wrinkles</li>
                  <li>Enhanced facial contours and volume</li>
                  <li>Improved aesthetic appearance</li>
                  <li>Minimal downtime with immediate results</li>
                </ul>
              </div>

              {/* Risks */}
              <div>
                <h3 className="font-semibold text-clinical-800 mb-2">Potential Risks and Complications:</h3>
                <ul className="list-disc list-inside text-sm space-y-1 leading-relaxed">
                  <li>Bruising, swelling, redness, or tenderness at injection sites</li>
                  <li>Temporary asymmetry or unevenness</li>
                  <li>Headache or flu-like symptoms</li>
                  {consentProcedureType === 'botox' ? (
                    <>
                      <li>Temporary eyelid or eyebrow drooping</li>
                      <li>Dry eyes or excessive tearing</li>
                      <li>Difficulty swallowing or speaking (rare)</li>
                    </>
                  ) : (
                    <>
                      <li>Lumps or nodules under the skin</li>
                      <li>Vascular occlusion (very rare but serious)</li>
                      <li>Allergic reaction or hypersensitivity</li>
                      <li>Delayed-onset reactions or granulomas</li>
                    </>
                  )}
                  <li>Infection at injection site</li>
                  <li>Unsatisfactory cosmetic result requiring additional treatment</li>
                </ul>
              </div>

              {/* Alternatives */}
              <div>
                <h3 className="font-semibold text-clinical-800 mb-2">Alternatives:</h3>
                <p className="text-sm leading-relaxed">
                  Alternatives include but are not limited to: topical creams, laser treatments, chemical peels,
                  surgical procedures, or choosing not to pursue treatment.
                </p>
              </div>

              {/* Consent Statement */}
              <div className="border-t-2 pt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  I have read and understand the above information. I have had the opportunity to ask questions
                  and have received satisfactory answers. I understand that results may vary and that no guarantees
                  have been made regarding the outcome of this procedure.
                </p>
                <p>
                  I understand that this is a cosmetic procedure and is not covered by insurance. I agree to pay
                  for all services rendered.
                </p>
                <p className="font-semibold">
                  I consent to the procedure described above and authorize the provider to perform this treatment.
                </p>
              </div>

              {/* Signature Lines */}
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="space-y-6">
                  <div>
                    <div className="border-b-2 border-clinical-800 mb-1 h-12"></div>
                    <p className="text-sm text-clinical-600">Patient Signature</p>
                  </div>
                  <div>
                    <div className="border-b-2 border-clinical-800 mb-1 h-12"></div>
                    <p className="text-sm text-clinical-600">Date</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="border-b-2 border-clinical-800 mb-1 h-12"></div>
                    <p className="text-sm text-clinical-600">Witness/Provider Signature</p>
                  </div>
                  <div>
                    <div className="border-b-2 border-clinical-800 mb-1 h-12"></div>
                    <p className="text-sm text-clinical-600">Date</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-clinical-500 pt-6 border-t">
                <p>This consent form will be kept as part of your medical record.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
