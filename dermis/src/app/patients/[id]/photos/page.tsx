'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  Upload,
  Loader2,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  FileText,
  Sparkles,
  User,
  Pill,
  CreditCard
} from 'lucide-react'

interface PatientPhoto {
  id: string
  storage_path: string
  photo_type: string
  body_location: string
  body_location_detail: string | null
  description: string | null
  ai_analysis: any
  taken_at: string
  url: string | null
}

interface Encounter {
  id: string
  date: string
  chiefComplaint: string
  type: string
}

const BODY_LOCATIONS = [
  'Face',
  'Scalp',
  'Neck',
  'Chest',
  'Back',
  'Left Arm',
  'Right Arm',
  'Left Leg',
  'Right Leg',
  'Hands',
  'Feet',
]

export default function PatientPhotosPage() {
  const params = useParams()
  const patientId = params.id as string

  const [photos, setPhotos] = useState<PatientPhoto[]>([])
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [bodyLocation, setBodyLocation] = useState('')
  const [selectedEncounter, setSelectedEncounter] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Gallery state
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Load photos
      const photosRes = await fetch(`/api/patients/${patientId}/photos`)
      if (photosRes.ok) {
        const data = await photosRes.json()
        setPhotos(data.photos || [])
      }

      // Load encounters for dropdown
      const patientRes = await fetch(`/api/patients/${patientId}`)
      if (patientRes.ok) {
        const data = await patientRes.json()
        setEncounters(data.patient?.encounters || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setUploadError(null)
    setUploadSuccess(false)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !bodyLocation) {
      setUploadError('Please select a photo and body location')
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)

      // Convert image to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
      })
      reader.readAsDataURL(selectedFile)
      const base64Image = await base64Promise

      // Analyze with Claude Vision
      setIsAnalyzing(true)
      const analysisRes = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          mimeType: selectedFile.type,
        }),
      })

      let aiAnalysis = null
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json()
        aiAnalysis = analysisData.analysis
      } else {
        console.error('AI analysis failed, continuing without it')
      }
      setIsAnalyzing(false)

      // Upload photo
      const uploadRes = await fetch(`/api/patients/${patientId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          bodyLocation,
          encounterId: selectedEncounter || null,
          aiAnalysis,
          filename: selectedFile.name,
        }),
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload photo')
      }

      // Success!
      setUploadSuccess(true)
      setSelectedFile(null)
      setPreviewUrl(null)
      setBodyLocation('')
      setSelectedEncounter('')

      // Reload photos
      await loadData()

      // Reset success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload photo. Please try again.')
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    try {
      const res = await fetch(`/api/patients/${patientId}/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete photo')
      }

      // Reload photos
      await loadData()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete photo')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Group photos by body location
  const photosByLocation = photos.reduce((acc, photo) => {
    const location = photo.body_location || 'Unspecified'
    if (!acc[location]) {
      acc[location] = []
    }
    acc[location].push(photo)
    return acc
  }, {} as Record<string, PatientPhoto[]>)

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
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent-sky to-accent-sky/80 flex items-center justify-center">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-display font-bold text-clinical-800">
                    Patient Photos
                  </h1>
                  <p className="text-xs text-clinical-500">Clinical Image Management</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-clinical-200 -mb-px overflow-x-auto">
            <Link
              href={`/patients/${patientId}`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Chart
            </Link>
            <Link
              href={`/patients/${patientId}/photos`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-accent-sky text-accent-sky flex items-center gap-2 whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              Photos
            </Link>
            <Link
              href={`/patients/${patientId}/cosmetic`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Cosmetic
            </Link>
            <Link
              href={`/patients/${patientId}/prescriptions`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Pill className="w-4 h-4" />
              Prescriptions
            </Link>
            <Link
              href={`/patients/${patientId}/products`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              Products
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Upload Section */}
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-clinical-800 mb-4">
            Upload New Photo
          </h2>

          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-dermis-500 bg-dermis-50'
                : 'border-clinical-200 hover:border-clinical-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-xs mx-auto rounded-lg shadow-sm"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="text-sm text-clinical-600 hover:text-clinical-800"
                >
                  Change photo
                </button>
              </div>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-clinical-300 mx-auto mb-4" />
                <p className="text-clinical-600 mb-4">
                  Drag and drop an image here, or
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="btn-secondary text-sm"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </button>
                </div>
                <p className="text-xs text-clinical-500 mt-3">
                  JPEG, PNG, or HEIC up to 10MB
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>

          {selectedFile && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Body Location *</label>
                  <select
                    value={bodyLocation}
                    onChange={(e) => setBodyLocation(e.target.value)}
                    className="input"
                  >
                    <option value="">Select location...</option>
                    {BODY_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    Link to Encounter <span className="text-clinical-400">(optional)</span>
                  </label>
                  <select
                    value={selectedEncounter}
                    onChange={(e) => setSelectedEncounter(e.target.value)}
                    className="input"
                  >
                    <option value="">None</option>
                    {encounters.map((enc) => (
                      <option key={enc.id} value={enc.id}>
                        {formatDate(enc.date)} - {enc.chiefComplaint || enc.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  Photo uploaded successfully!
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing image with AI... (this may take a few seconds)
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={isUploading || !bodyLocation}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Photo Gallery */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-clinical-100">
            <h2 className="font-display font-semibold text-clinical-800">Photo Gallery</h2>
            <p className="text-sm text-clinical-500 mt-1">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} • Grouped by body location
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-dermis-500 animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
              <p className="text-clinical-500">No photos yet</p>
              <p className="text-sm text-clinical-400 mt-1">
                Upload a photo to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-clinical-100">
              {Object.entries(photosByLocation).map(([location, locationPhotos]) => (
                <div key={location} className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-accent-sky" />
                    <h3 className="font-medium text-clinical-800">{location}</h3>
                    <span className="text-sm text-clinical-500">
                      ({locationPhotos.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {locationPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="border border-clinical-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={`${photo.body_location} photo`}
                            className="w-full h-48 object-cover cursor-pointer"
                            onClick={() =>
                              setExpandedPhoto(
                                expandedPhoto === photo.id ? null : photo.id
                              )
                            }
                          />
                        ) : (
                          <div className="w-full h-48 bg-clinical-100 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-clinical-400" />
                          </div>
                        )}

                        <div className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-clinical-500">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(photo.taken_at)}
                            </div>
                            <button
                              onClick={() => handleDelete(photo.id)}
                              className="text-clinical-400 hover:text-red-600 transition-colors"
                              title="Delete photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {photo.ai_analysis && (
                            <button
                              onClick={() =>
                                setExpandedPhoto(
                                  expandedPhoto === photo.id ? null : photo.id
                                )
                              }
                              className="flex items-center gap-1 text-xs text-dermis-600 hover:text-dermis-700"
                            >
                              {expandedPhoto === photo.id ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                              View AI Analysis
                            </button>
                          )}

                          {expandedPhoto === photo.id && photo.ai_analysis && (
                            <div className="mt-3 pt-3 border-t border-clinical-100 space-y-2 text-xs">
                              <div>
                                <div className="font-medium text-clinical-700">Description</div>
                                <div className="text-clinical-600 mt-1">
                                  {photo.ai_analysis.description}
                                </div>
                              </div>

                              {photo.ai_analysis.abcde && (
                                <div>
                                  <div className="font-medium text-clinical-700">ABCDE Assessment</div>
                                  <div className="text-clinical-600 mt-1 space-y-0.5">
                                    <div><strong>A:</strong> {photo.ai_analysis.abcde.asymmetry}</div>
                                    <div><strong>B:</strong> {photo.ai_analysis.abcde.border}</div>
                                    <div><strong>C:</strong> {photo.ai_analysis.abcde.color}</div>
                                    <div><strong>D:</strong> {photo.ai_analysis.abcde.diameter}</div>
                                  </div>
                                </div>
                              )}

                              {photo.ai_analysis.follow_up_recommendation && (
                                <div>
                                  <div className="font-medium text-clinical-700">Recommendation</div>
                                  <div className="text-clinical-600 mt-1">
                                    {photo.ai_analysis.follow_up_recommendation}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
