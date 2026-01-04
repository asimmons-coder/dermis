'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Stethoscope,
  Sparkles,
  ArrowLeft,
  Brain,
  FileText,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  Tag,
  Mic,
  Save,
  Edit3,
  X,
  Plus,
  Loader2
} from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useProvider } from '@/contexts/ProviderContext'
import { useQuickPhrases } from '@/hooks/useQuickPhrases'
import { useDiagnosisFavorites } from '@/hooks/useDiagnosisFavorites'

interface PatientContext {
  age: number
  sex: string
  allergies: string[]
  medications: string[]
  relevantHistory: string[]
  skinType: string
  skinCancerHistory: boolean
}

interface GeneratedNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  fullNote: string
  suggestions: {
    icd10: Array<{ code: string; description: string }>
    cpt: Array<{ code: string; description: string; units?: number }>
    differentials?: string[]
  }
}

const EXAMPLE_INPUTS = [
  {
    label: 'Suspicious Lesion',
    chiefComplaint: 'New mole evaluation',
    quickInput: '43F, new lesion R forearm, irregular borders, 6mm, dark brown, noticed 3 months ago, no symptoms, no FHx melanoma',
    context: { age: 43, sex: 'F', skinType: 'II', skinCancerHistory: false }
  },
  {
    label: 'Acne Follow-up',
    chiefComplaint: 'Acne follow-up',
    quickInput: '17M, moderate inflammatory acne, on doxy 100mg x 6 weeks, some improvement but still breaking out chin/jawline, tolerating meds well, wants to discuss isotretinoin',
    context: { age: 17, sex: 'M', medications: ['Doxycycline 100mg daily'] }
  },
  {
    label: 'Eczema Flare',
    chiefComplaint: 'Eczema flare',
    quickInput: '8yo girl, atopic derm since infancy, current flare bilateral antecubital fossae and posterior knees, itchy keeping her up at night, been using triamcinolone but not helping, no new triggers identified',
    context: { age: 8, sex: 'F', allergies: ['Peanuts'], relevantHistory: ['Asthma', 'Atopic dermatitis'] }
  },
  {
    label: 'Botox Consult',
    chiefComplaint: 'Cosmetic consultation - forehead lines',
    quickInput: '52F, interested in botox for glabellar lines and horizontal forehead, never had injectables before, concerned about looking frozen, works in client-facing role',
    context: { age: 52, sex: 'F' }
  }
]

export default function DemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-dermis-500 animate-spin" />
      </div>
    }>
      <DemoPageContent />
    </Suspense>
  )
}

function DemoPageContent() {
  const { selectedProvider: contextProvider, providers: contextProviders } = useProvider()
  const searchParams = useSearchParams()
  const encounterId = searchParams.get('encounterId')
  const patientIdParam = searchParams.get('patientId')

  const [chiefComplaint, setChiefComplaint] = useState('')
  const [quickInput, setQuickInput] = useState('')
  const [patientContext, setPatientContext] = useState<PatientContext>({
    age: 45,
    sex: 'F',
    allergies: [],
    medications: [],
    relevantHistory: [],
    skinType: '',
    skinCancerHistory: false,
  })
  const [encounterType, setEncounterType] = useState<'office_visit' | 'procedure' | 'cosmetic_consult' | 'follow_up'>('office_visit')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedNote, setGeneratedNote] = useState<GeneratedNote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [showContext, setShowContext] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [savedPatientId, setSavedPatientId] = useState<string>('')
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientIdParam || '')
  const [patients, setPatients] = useState<Array<{ id: string; name: string; mrn: string }>>([])
  const [providers, setProviders] = useState<Array<{ id: string; name: string; fullName: string }>>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [isLoadingEncounter, setIsLoadingEncounter] = useState(false)

  // Editable note state
  const [editableNote, setEditableNote] = useState<GeneratedNote | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingCodeType, setEditingCodeType] = useState<'icd10' | 'cpt' | null>(null)
  const [editingDifferentials, setEditingDifferentials] = useState(false)
  const [newCodeInput, setNewCodeInput] = useState({ code: '', description: '', units: 1 })
  const [newDifferential, setNewDifferential] = useState('')

  // Quick phrases hook
  const { expandPhrase, phrases } = useQuickPhrases()
  const [showPhraseHint, setShowPhraseHint] = useState(false)

  // Use context provider as default when available
  useEffect(() => {
    if (contextProvider && !selectedProviderId) {
      setSelectedProviderId(contextProvider.id)
    }
  }, [contextProvider])

  // Update local providers list from context
  useEffect(() => {
    if (contextProviders.length > 0) {
      setProviders(contextProviders)
    }
  }, [contextProviders])

  // Voice input hooks
  const chiefComplaintVoice = useVoiceInput((text) => {
    setChiefComplaint((prev) => (prev ? `${prev} ${text}` : text))
  })

  const quickInputVoice = useVoiceInput((text) => {
    setQuickInput((prev) => (prev ? `${prev} ${text}` : text))
  })

  // Load patients on mount
  useEffect(() => {
    loadPatients()
    loadProviders()
  }, [])

  // Load existing encounter if encounterId is provided
  useEffect(() => {
    if (encounterId) {
      loadExistingEncounter(encounterId)
    }
  }, [encounterId])

  const loadExistingEncounter = async (id: string) => {
    setIsLoadingEncounter(true)
    try {
      const response = await fetch(`/api/encounters/${id}`)
      if (response.ok) {
        const data = await response.json()
        const encounter = data.encounter

        // Populate form with encounter data
        setChiefComplaint(encounter.chiefComplaint || '')
        setEncounterType(encounter.encounterType || 'office_visit')

        // Set selected patient and provider
        if (encounter.patient?.id) {
          setSelectedPatientId(encounter.patient.id)
          // Update patient context with loaded patient data
          setPatientContext({
            age: encounter.patient.age || 45,
            sex: encounter.patient.sex || 'F',
            allergies: encounter.patient.allergies?.map((a: any) => a.allergen) || [],
            medications: [],
            relevantHistory: [],
            skinType: '',
            skinCancerHistory: false
          })
        }

        if (encounter.provider?.id) {
          setSelectedProviderId(encounter.provider.id)
        }

        // If clinical notes exist, populate the note
        if (encounter.clinicalNotes && encounter.clinicalNotes.length > 0) {
          const latestNote = encounter.clinicalNotes[0]

          // Set the quick input if it exists
          if (latestNote.quick_input) {
            setQuickInput(latestNote.quick_input)
          }

          // Create generated note object from existing note
          const existingNote: GeneratedNote = {
            subjective: latestNote.subjective || '',
            objective: latestNote.objective || '',
            assessment: latestNote.assessment || '',
            plan: latestNote.plan || '',
            fullNote: '', // Not needed for display
            suggestions: {
              icd10: encounter.icd10Codes || [],
              cpt: encounter.cptCodes || [],
              differentials: []
            }
          }

          setGeneratedNote(existingNote)
          setEditableNote(existingNote)
        }
      }
    } catch (err) {
      console.error('Failed to load encounter:', err)
      setError('Failed to load existing encounter')
    } finally {
      setIsLoadingEncounter(false)
    }
  }

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

  const loadProviders = async () => {
    try {
      const practiceId = '00000000-0000-0000-0000-000000000001' // Novice Group
      const response = await fetch(`/api/providers?practiceId=${practiceId}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
        // Auto-select first provider if available
        if (data.providers && data.providers.length > 0) {
          setSelectedProviderId(data.providers[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load providers:', err)
    }
  }

  const handleGenerate = async () => {
    if (!quickInput.trim()) {
      setError('Please enter your clinical observations')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickInput,
          chiefComplaint,
          patientContext,
          encounterType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate note')
      }

      const result = await response.json()
      setGeneratedNote(result)
      setEditableNote(result) // Initialize editable version
    } catch (err) {
      setError('Failed to generate note. Please check your API key configuration.')
    } finally {
      setIsGenerating(false)
    }
  }

  const loadExample = (example: typeof EXAMPLE_INPUTS[0]) => {
    setChiefComplaint(example.chiefComplaint)
    setQuickInput(example.quickInput)
    setPatientContext({
      ...patientContext,
      ...example.context,
    })
    setGeneratedNote(null)
    setError(null)
  }

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const updateNoteSection = (section: 'subjective' | 'objective' | 'assessment' | 'plan', value: string) => {
    if (!editableNote) return
    setEditableNote({
      ...editableNote,
      [section]: value,
      fullNote: `Subjective:\n${section === 'subjective' ? value : editableNote.subjective}\n\nObjective:\n${section === 'objective' ? value : editableNote.objective}\n\nAssessment:\n${section === 'assessment' ? value : editableNote.assessment}\n\nPlan:\n${section === 'plan' ? value : editableNote.plan}`
    })
  }

  const addCode = (type: 'icd10' | 'cpt') => {
    if (!editableNote || !newCodeInput.code || !newCodeInput.description) return

    const newCode = type === 'cpt'
      ? { code: newCodeInput.code, description: newCodeInput.description, units: newCodeInput.units }
      : { code: newCodeInput.code, description: newCodeInput.description }

    setEditableNote({
      ...editableNote,
      suggestions: {
        ...editableNote.suggestions,
        [type]: [...editableNote.suggestions[type], newCode]
      }
    })

    setNewCodeInput({ code: '', description: '', units: 1 })
    setEditingCodeType(null)
  }

  const removeCode = (type: 'icd10' | 'cpt', index: number) => {
    if (!editableNote) return

    setEditableNote({
      ...editableNote,
      suggestions: {
        ...editableNote.suggestions,
        [type]: editableNote.suggestions[type].filter((_, i) => i !== index)
      }
    })
  }

  const addDifferential = () => {
    if (!editableNote || !newDifferential.trim()) return

    setEditableNote({
      ...editableNote,
      suggestions: {
        ...editableNote.suggestions,
        differentials: [...(editableNote.suggestions.differentials || []), newDifferential.trim()]
      }
    })

    setNewDifferential('')
    setEditingDifferentials(false)
  }

  const removeDifferential = (index: number) => {
    if (!editableNote) return

    setEditableNote({
      ...editableNote,
      suggestions: {
        ...editableNote.suggestions,
        differentials: editableNote.suggestions.differentials?.filter((_, i) => i !== index)
      }
    })
  }

  const handleSaveNote = async () => {
    if (!selectedPatientId) {
      setError('Please select a patient')
      return
    }

    if (!selectedProviderId) {
      setError('Please select a provider')
      return
    }

    if (!editableNote) {
      setError('No note to save')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/save-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          providerId: selectedProviderId,
          chiefComplaint,
          quickInput,
          encounterType,
          note: editableNote, // Use edited version
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      setSaveSuccess(true)
      setSavedPatientId(selectedPatientId)
      setTimeout(() => {
        setSaveSuccess(false)
        setSavedPatientId('')
      }, 10000)
    } catch (err) {
      setError('Failed to save note. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuickInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ') {
      // Try to expand phrase when space is pressed
      const result = expandPhrase(quickInput)
      if (result.expanded) {
        e.preventDefault()
        setQuickInput(result.newText + ' ')
        setShowPhraseHint(false)
      }
    }
  }

  const handleQuickInputChange = (value: string) => {
    setQuickInput(value)

    // Check if current text matches start of any phrase trigger
    const words = value.split(/\s+/)
    const lastWord = words[words.length - 1]

    if (lastWord.startsWith('.')) {
      const matchingPhrases = phrases.filter(p => p.trigger.startsWith(lastWord))
      setShowPhraseHint(matchingPhrases.length > 0)
    } else {
      setShowPhraseHint(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="text-clinical-400 hover:text-clinical-600 transition-colors">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-display font-bold text-clinical-800">AI Clinical Notes</h1>
                <p className="text-xs text-clinical-500">Demo Mode</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-clinical-500">
            <Brain className="w-4 h-4" />
            Powered by Claude
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Input Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Example Quick Load */}
            <div className="card p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-medium text-clinical-600 mb-2 sm:mb-3">Quick Examples</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_INPUTS.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => loadExample(example)}
                    className="px-2.5 py-1.5 text-xs sm:text-sm bg-clinical-100 text-clinical-700 rounded-lg hover:bg-clinical-200 transition-colors"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Input Form */}
            <div className="card p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Voice Input Support Notice */}
              {(!chiefComplaintVoice.isSupported || !quickInputVoice.isSupported) && (
                <div className="flex items-start gap-2 text-xs sm:text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Voice input not available</p>
                    <p className="text-amber-600">Speech recognition is not supported in this browser. For voice input, please use Chrome or Safari.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Chief Complaint</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input pr-12"
                    placeholder="e.g., New mole evaluation, Acne follow-up"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                  />
                  {chiefComplaintVoice.isSupported ? (
                    <button
                      type="button"
                      onClick={chiefComplaintVoice.toggleListening}
                      disabled={chiefComplaintVoice.isRequestingPermission}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                        chiefComplaintVoice.isListening
                          ? 'bg-red-100 text-red-600'
                          : chiefComplaintVoice.isRequestingPermission
                          ? 'bg-clinical-100 text-clinical-400 cursor-wait'
                          : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                      }`}
                      title={
                        chiefComplaintVoice.isRequestingPermission
                          ? 'Requesting permission...'
                          : chiefComplaintVoice.permissionStatus === 'prompt'
                          ? 'Click to allow microphone access'
                          : chiefComplaintVoice.isListening
                          ? 'Stop recording'
                          : 'Start voice input'
                      }
                    >
                      <Mic className={`w-4 h-4 ${chiefComplaintVoice.isListening ? 'animate-pulse' : ''}`} />
                    </button>
                  ) : (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-clinical-400" title="Voice input not supported">
                      <Mic className="w-4 h-4 opacity-50" />
                    </div>
                  )}
                </div>
                {chiefComplaintVoice.isRequestingPermission && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    Click "Allow" to enable microphone access
                  </p>
                )}
                {chiefComplaintVoice.permissionStatus === 'prompt' && !chiefComplaintVoice.isRequestingPermission && chiefComplaintVoice.isSupported && (
                  <p className="text-xs text-clinical-500 mt-1">
                    Click the microphone to allow access
                  </p>
                )}
                {chiefComplaintVoice.isListening && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    Listening...
                  </p>
                )}
                {chiefComplaintVoice.error && !chiefComplaintVoice.isListening && (
                  <p className="text-xs text-red-600 mt-1">{chiefComplaintVoice.error}</p>
                )}
              </div>

              <div>
                <label className="label">
                  Your Quick Notes
                  <span className="text-clinical-400 font-normal ml-1">(what you'd say to a scribe)</span>
                </label>
                <div className="relative">
                  <textarea
                    className="input min-h-[160px] resize-none pr-12"
                    placeholder="Type your clinical observations in natural language...

Example: 43F, new lesion R forearm, irregular borders, 6mm, dark brown, noticed 3 months ago

Tip: Type phrases like .skincheck, .acne, .biopsy for quick templates"
                    value={quickInput}
                    onChange={(e) => handleQuickInputChange(e.target.value)}
                    onKeyDown={handleQuickInputKeyDown}
                  />
                  {quickInputVoice.isSupported ? (
                    <button
                      type="button"
                      onClick={quickInputVoice.toggleListening}
                      disabled={quickInputVoice.isRequestingPermission}
                      className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${
                        quickInputVoice.isListening
                          ? 'bg-red-100 text-red-600'
                          : quickInputVoice.isRequestingPermission
                          ? 'bg-clinical-100 text-clinical-400 cursor-wait'
                          : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                      }`}
                      title={
                        quickInputVoice.isRequestingPermission
                          ? 'Requesting permission...'
                          : quickInputVoice.permissionStatus === 'prompt'
                          ? 'Click to allow microphone access'
                          : quickInputVoice.isListening
                          ? 'Stop recording'
                          : 'Start voice input'
                      }
                    >
                      <Mic className={`w-4 h-4 ${quickInputVoice.isListening ? 'animate-pulse' : ''}`} />
                    </button>
                  ) : (
                    <div className="absolute right-2 top-2 p-2 text-clinical-400" title="Voice input not supported">
                      <Mic className="w-4 h-4 opacity-50" />
                    </div>
                  )}
                </div>
                {quickInputVoice.isRequestingPermission && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    Click "Allow" to enable microphone access
                  </p>
                )}
                {quickInputVoice.permissionStatus === 'prompt' && !quickInputVoice.isRequestingPermission && quickInputVoice.isSupported && (
                  <p className="text-xs text-clinical-500 mt-1">
                    Click the microphone to allow access
                  </p>
                )}
                {quickInputVoice.isListening && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    Listening...
                  </p>
                )}
                {quickInputVoice.error && !quickInputVoice.isListening && (
                  <p className="text-xs text-red-600 mt-1">{quickInputVoice.error}</p>
                )}
                {showPhraseHint && (
                  <p className="text-xs text-dermis-600 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Press Space to expand quick phrase
                  </p>
                )}
                <Link href="/phrases" className="text-xs text-dermis-600 hover:text-dermis-700 mt-1 inline-flex items-center gap-1">
                  Manage Phrases →
                </Link>
              </div>

              {/* Collapsible Patient Context */}
              <div className="border border-clinical-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowContext(!showContext)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-clinical-700 hover:bg-clinical-50 transition-colors"
                >
                  <span>Patient Context (optional)</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showContext ? 'rotate-180' : ''}`} />
                </button>
                
                {showContext && (
                  <div className="px-4 pb-4 space-y-4 border-t border-clinical-100">
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div>
                        <label className="label">Age</label>
                        <input
                          type="number"
                          className="input"
                          value={patientContext.age}
                          onChange={(e) => setPatientContext({ ...patientContext, age: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="label">Sex</label>
                        <select
                          className="input"
                          value={patientContext.sex}
                          onChange={(e) => setPatientContext({ ...patientContext, sex: e.target.value })}
                        >
                          <option value="F">Female</option>
                          <option value="M">Male</option>
                          <option value="O">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Skin Type</label>
                        <select
                          className="input"
                          value={patientContext.skinType}
                          onChange={(e) => setPatientContext({ ...patientContext, skinType: e.target.value })}
                        >
                          <option value="">Not specified</option>
                          <option value="I">Type I</option>
                          <option value="II">Type II</option>
                          <option value="III">Type III</option>
                          <option value="IV">Type IV</option>
                          <option value="V">Type V</option>
                          <option value="VI">Type VI</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="skinCancerHistory"
                        checked={patientContext.skinCancerHistory}
                        onChange={(e) => setPatientContext({ ...patientContext, skinCancerHistory: e.target.checked })}
                        className="rounded border-clinical-300"
                      />
                      <label htmlFor="skinCancerHistory" className="text-sm text-clinical-600">
                        History of skin cancer
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Encounter Type */}
              <div>
                <label className="label">Encounter Type</label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {[
                    { value: 'office_visit', label: 'Office Visit' },
                    { value: 'follow_up', label: 'Follow-up' },
                    { value: 'procedure', label: 'Procedure' },
                    { value: 'cosmetic_consult', label: 'Cosmetic' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEncounterType(type.value as typeof encounterType)}
                      className={`px-3 py-2.5 sm:py-1.5 text-sm rounded-lg border transition-colors ${
                        encounterType === type.value
                          ? 'border-dermis-500 bg-dermis-50 text-dermis-700'
                          : 'border-clinical-200 text-clinical-600 hover:bg-clinical-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !quickInput.trim()}
                className="btn-primary w-full py-3.5 sm:py-3 text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Generating Note...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Clinical Note
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            {isGenerating ? (
              <div className="card p-6">
                <div className="space-y-4">
                  <div className="h-4 w-24 ai-shimmer rounded" />
                  <div className="space-y-2">
                    <div className="h-3 ai-shimmer rounded w-full" />
                    <div className="h-3 ai-shimmer rounded w-5/6" />
                    <div className="h-3 ai-shimmer rounded w-4/6" />
                  </div>
                  <div className="h-4 w-20 ai-shimmer rounded mt-6" />
                  <div className="space-y-2">
                    <div className="h-3 ai-shimmer rounded w-full" />
                    <div className="h-3 ai-shimmer rounded w-3/4" />
                  </div>
                </div>
              </div>
            ) : generatedNote ? (
              <>
                {/* Save to Patient */}
                <div className="card p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Save className="w-5 h-5 text-dermis-600" />
                    <h2 className="font-display font-semibold text-clinical-800">Save to Patient Chart</h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="label">Select Patient</label>
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="input"
                      >
                        <option value="">Choose a patient...</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name} - {patient.mrn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Provider</label>
                      <select
                        value={selectedProviderId}
                        onChange={(e) => setSelectedProviderId(e.target.value)}
                        className="input"
                      >
                        <option value="">Choose a provider...</option>
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {saveSuccess && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">Note saved successfully!</div>
                          {savedPatientId && (
                            <Link
                              href={`/patients/${savedPatientId}`}
                              className="text-dermis-600 hover:text-dermis-700 underline text-xs mt-0.5 inline-block"
                            >
                              View Patient Chart →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleSaveNote}
                      disabled={isSaving || !selectedPatientId || !selectedProviderId}
                      className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save to Chart
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SOAP Note */}
                <div className="card overflow-hidden">
                  <div className="px-6 py-4 border-b border-clinical-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-dermis-600" />
                      <h2 className="font-display font-semibold text-clinical-800">Generated SOAP Note</h2>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedNote.fullNote, 'full')}
                      className="text-sm text-clinical-500 hover:text-clinical-700 flex items-center gap-1"
                    >
                      {copiedSection === 'full' ? (
                        <>
                          <Check className="w-4 h-4 text-dermis-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy All
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="divide-y divide-clinical-100">
                    {[
                      { key: 'subjective', label: 'Subjective', content: editableNote?.subjective || '' },
                      { key: 'objective', label: 'Objective', content: editableNote?.objective || '' },
                      { key: 'assessment', label: 'Assessment', content: editableNote?.assessment || '' },
                      { key: 'plan', label: 'Plan', content: editableNote?.plan || '' },
                    ].map((section) => (
                      <div key={section.key} className="p-6 group">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-clinical-500 uppercase tracking-wide">
                            {section.label}
                          </h3>
                          <div className="flex items-center gap-2">
                            {editingSection === section.key ? (
                              <button
                                onClick={() => setEditingSection(null)}
                                className="text-dermis-600 hover:text-dermis-700 text-xs font-medium flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Done
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingSection(section.key)}
                                  className="opacity-0 group-hover:opacity-100 text-clinical-400 hover:text-clinical-600 transition-opacity flex items-center gap-1"
                                  title="Edit section"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => copyToClipboard(section.content, section.key)}
                                  className="opacity-0 group-hover:opacity-100 text-clinical-400 hover:text-clinical-600 transition-opacity"
                                >
                                  {copiedSection === section.key ? (
                                    <Check className="w-4 h-4 text-dermis-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {editingSection === section.key ? (
                          <textarea
                            className="input w-full min-h-[120px]"
                            value={section.content}
                            onChange={(e) => updateNoteSection(section.key as 'subjective' | 'objective' | 'assessment' | 'plan', e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <p className="text-clinical-700 whitespace-pre-wrap leading-relaxed">
                            {section.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Codes */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-5 h-5 text-dermis-600" />
                    <h2 className="font-display font-semibold text-clinical-800">Suggested Codes</h2>
                  </div>

                  <div className="space-y-4">
                    {/* ICD-10 Diagnoses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-clinical-500 uppercase tracking-wide">
                          ICD-10 Diagnoses
                        </h4>
                        {editingCodeType !== 'icd10' && (
                          <button
                            onClick={() => setEditingCodeType('icd10')}
                            className="text-xs text-dermis-600 hover:text-dermis-700 font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Code
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {editableNote?.suggestions.icd10.map((code, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm group">
                            <code className="px-2 py-0.5 bg-dermis-100 text-dermis-700 rounded font-mono text-xs">
                              {code.code}
                            </code>
                            <span className="flex-1 text-clinical-600">{code.description}</span>
                            <button
                              onClick={() => removeCode('icd10', i)}
                              className="opacity-0 group-hover:opacity-100 text-clinical-400 hover:text-red-600 transition-opacity"
                              title="Remove code"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {editingCodeType === 'icd10' && (
                          <div className="mt-2 p-3 bg-clinical-50 rounded-lg space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                placeholder="Code (e.g., L70.0)"
                                className="input text-sm"
                                value={newCodeInput.code}
                                onChange={(e) => setNewCodeInput({ ...newCodeInput, code: e.target.value })}
                              />
                              <input
                                type="text"
                                placeholder="Description"
                                className="input text-sm col-span-2"
                                value={newCodeInput.description}
                                onChange={(e) => setNewCodeInput({ ...newCodeInput, description: e.target.value })}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addCode('icd10')}
                                disabled={!newCodeInput.code || !newCodeInput.description}
                                className="btn-primary text-xs py-1 disabled:opacity-50"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCodeType(null)
                                  setNewCodeInput({ code: '', description: '', units: 1 })
                                }}
                                className="btn-secondary text-xs py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CPT Procedures */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-clinical-500 uppercase tracking-wide">
                          CPT Procedures
                        </h4>
                        {editingCodeType !== 'cpt' && (
                          <button
                            onClick={() => setEditingCodeType('cpt')}
                            className="text-xs text-dermis-600 hover:text-dermis-700 font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Code
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {editableNote?.suggestions.cpt.map((code, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm group">
                            <code className="px-2 py-0.5 bg-accent-sky/10 text-accent-sky rounded font-mono text-xs">
                              {code.code}
                            </code>
                            <span className="flex-1 text-clinical-600">{code.description}</span>
                            {code.units && code.units > 1 && (
                              <span className="text-clinical-400">×{code.units}</span>
                            )}
                            <button
                              onClick={() => removeCode('cpt', i)}
                              className="opacity-0 group-hover:opacity-100 text-clinical-400 hover:text-red-600 transition-opacity"
                              title="Remove code"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {editingCodeType === 'cpt' && (
                          <div className="mt-2 p-3 bg-clinical-50 rounded-lg space-y-2">
                            <div className="grid grid-cols-4 gap-2">
                              <input
                                type="text"
                                placeholder="Code (e.g., 99213)"
                                className="input text-sm"
                                value={newCodeInput.code}
                                onChange={(e) => setNewCodeInput({ ...newCodeInput, code: e.target.value })}
                              />
                              <input
                                type="text"
                                placeholder="Description"
                                className="input text-sm col-span-2"
                                value={newCodeInput.description}
                                onChange={(e) => setNewCodeInput({ ...newCodeInput, description: e.target.value })}
                              />
                              <input
                                type="number"
                                placeholder="Units"
                                className="input text-sm"
                                min="1"
                                value={newCodeInput.units}
                                onChange={(e) => setNewCodeInput({ ...newCodeInput, units: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addCode('cpt')}
                                disabled={!newCodeInput.code || !newCodeInput.description}
                                className="btn-primary text-xs py-1 disabled:opacity-50"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCodeType(null)
                                  setNewCodeInput({ code: '', description: '', units: 1 })
                                }}
                                className="btn-secondary text-xs py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Differential Diagnoses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-clinical-500 uppercase tracking-wide">
                          Differential Diagnoses
                        </h4>
                        {!editingDifferentials && (
                          <button
                            onClick={() => setEditingDifferentials(true)}
                            className="text-xs text-dermis-600 hover:text-dermis-700 font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Differential
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {editableNote?.suggestions.differentials?.map((diff, i) => (
                          <span key={i} className="group relative px-2 py-1 bg-clinical-100 text-clinical-600 rounded text-sm pr-6">
                            {diff}
                            <button
                              onClick={() => removeDifferential(i)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-clinical-400 hover:text-red-600 transition-opacity"
                              title="Remove differential"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        {editingDifferentials && (
                          <div className="w-full mt-2 p-3 bg-clinical-50 rounded-lg space-y-2">
                            <input
                              type="text"
                              placeholder="Enter differential diagnosis"
                              className="input text-sm w-full"
                              value={newDifferential}
                              onChange={(e) => setNewDifferential(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newDifferential.trim()) {
                                  addDifferential()
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={addDifferential}
                                disabled={!newDifferential.trim()}
                                className="btn-primary text-xs py-1 disabled:opacity-50"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setEditingDifferentials(false)
                                  setNewDifferential('')
                                }}
                                className="btn-secondary text-xs py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-clinical-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-clinical-400" />
                </div>
                <h3 className="text-lg font-display font-semibold text-clinical-700 mb-2">
                  Your note will appear here
                </h3>
                <p className="text-clinical-500 text-sm max-w-xs mx-auto">
                  Enter your quick clinical observations and click Generate to create a complete SOAP note
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
