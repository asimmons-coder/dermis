'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Stethoscope,
  Sparkles,
  ArrowLeft,
  Brain,
  FileText,
  Copy,
  Check,
  AlertCircle,
  Tag,
  Mic,
  Save,
  Edit3,
  X,
  Plus,
  User,
  Calendar,
  Pill,
  CheckSquare
} from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import CodeSelection from '@/components/CodeSelection'
import ProcedureTemplates from '@/components/ProcedureTemplates'

interface Patient {
  id: string
  name: string
  dateOfBirth: string
  age: number
  sex: string
  allergies: Array<{ allergen: string; reaction: string; severity: string }>
}

interface ClinicalNote {
  id: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  quick_input: string
  ai_suggestions?: {
    icd10: Array<{ code: string; description: string }>
    cpt: Array<{ code: string; description: string; units?: number }>
    differentials?: string[]
  }
  is_draft: boolean
  signed_at?: string
}

interface Encounter {
  id: string
  chiefComplaint: string
  encounterType: string
  status: string
  scheduledAt: string
  startedAt?: string
  patient: Patient
  provider: {
    id: string
    name: string
    fullName: string
  } | null
  clinicalNotes?: ClinicalNote[]
  icd10Codes?: Array<{ code: string; description: string }>
  cptCodes?: Array<{ code: string; description: string; units?: number }>
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

export default function EncounterDocumentationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const encounterId = params.id

  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quickInput, setQuickInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedNote, setGeneratedNote] = useState<GeneratedNote | null>(null)
  const [editableNote, setEditableNote] = useState<GeneratedNote | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Code selection state
  const [selectedIcd10Codes, setSelectedIcd10Codes] = useState<Array<{ code: string; description: string }>>([])
  const [selectedCptCodes, setSelectedCptCodes] = useState<Array<{ code: string; description: string; units?: number }>>([])

  // Procedure documentation state
  const [procedureNotes, setProcedureNotes] = useState<string[]>([])

  // Voice input hook
  const quickInputVoice = useVoiceInput((text) => {
    setQuickInput((prev) => (prev ? `${prev} ${text}` : text))
  })

  // Load encounter data
  useEffect(() => {
    loadEncounter()
  }, [encounterId])

  const loadEncounter = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/encounters/${encounterId}`)
      if (!response.ok) {
        throw new Error('Failed to load encounter')
      }

      const data = await response.json()
      setEncounter(data.encounter)

      // Load existing notes if available
      if (data.encounter.clinicalNotes && data.encounter.clinicalNotes.length > 0) {
        const existingNote = data.encounter.clinicalNotes[0] // Get most recent note
        const noteData: GeneratedNote = {
          subjective: existingNote.subjective || '',
          objective: existingNote.objective || '',
          assessment: existingNote.assessment || '',
          plan: existingNote.plan || '',
          fullNote: `Subjective:\n${existingNote.subjective || ''}\n\nObjective:\n${existingNote.objective || ''}\n\nAssessment:\n${existingNote.assessment || ''}\n\nPlan:\n${existingNote.plan || ''}`,
          suggestions: existingNote.ai_suggestions || { icd10: [], cpt: [] }
        }
        setGeneratedNote(noteData)
        setEditableNote(noteData)
        if (existingNote.quick_input) {
          setQuickInput(existingNote.quick_input)
        }
      }

      // Load existing codes if available
      if (data.encounter.icd10Codes && data.encounter.icd10Codes.length > 0) {
        setSelectedIcd10Codes(data.encounter.icd10Codes)
      }
      if (data.encounter.cptCodes && data.encounter.cptCodes.length > 0) {
        setSelectedCptCodes(data.encounter.cptCodes)
      }
    } catch (err) {
      console.error('Error loading encounter:', err)
      setError('Failed to load encounter. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!quickInput.trim()) {
      setError('Please enter your clinical observations')
      return
    }

    if (!encounter) {
      setError('Encounter not loaded')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const patientContext = {
        age: encounter.patient.age,
        sex: encounter.patient.sex,
        allergies: encounter.patient.allergies.map(a => a.allergen),
        medications: [],
        relevantHistory: [],
        skinType: '',
        skinCancerHistory: false,
      }

      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickInput,
          chiefComplaint: encounter.chiefComplaint,
          patientContext,
          encounterType: encounter.encounterType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate note')
      }

      const result = await response.json()
      setGeneratedNote(result)
      setEditableNote(result)
    } catch (err) {
      setError('Failed to generate note. Please check your API key configuration.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveNote = async () => {
    if (!editableNote || !encounter) {
      setError('No note to save')
      return
    }

    if (!encounter.provider) {
      setError('No provider assigned to this encounter')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/save-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterId: encounter.id,
          patientId: encounter.patient.id,
          providerId: encounter.provider.id,
          chiefComplaint: encounter.chiefComplaint,
          quickInput,
          encounterType: encounter.encounterType,
          note: editableNote,
          selectedIcd10Codes,
          selectedCptCodes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
        // Navigate back to schedule or patient chart
        router.push(`/patients/${encounter.patient.id}`)
      }, 2000)
    } catch (err) {
      setError('Failed to save note. Please try again.')
    } finally {
      setIsSaving(false)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Procedure documentation handlers
  const handleProcedureAdd = (procedure: any) => {
    console.log('Procedure added:', procedure)
  }

  const handleProcedureCptAdd = (code: { code: string; description: string }) => {
    // Add CPT code if not already selected
    if (!selectedCptCodes.find(c => c.code === code.code)) {
      setSelectedCptCodes(prev => [...prev, code])
    }
  }

  const handleProcedureNoteAppend = (text: string) => {
    // Append procedure note to the list
    setProcedureNotes(prev => [...prev, text])

    // Also append to quick input so it's included in AI generation
    setQuickInput(prev => prev ? `${prev}\n\n${text}` : text)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dermis-200 border-t-dermis-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-clinical-600">Loading encounter...</p>
        </div>
      </div>
    )
  }

  if (!encounter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-clinical-600">{error || 'Encounter not found'}</p>
          <Link href="/schedule" className="btn-secondary mt-4">
            Back to Schedule
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/schedule" className="text-clinical-400 hover:text-clinical-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-clinical-800">Encounter Documentation</h1>
                <p className="text-xs text-clinical-500">In Progress</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-clinical-500">
            <Brain className="w-4 h-4" />
            AI-Powered
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Patient Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-dermis-100 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-dermis-600" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-clinical-900">{encounter.patient.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-clinical-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    DOB: {formatDate(encounter.patient.dateOfBirth)} (Age {encounter.patient.age})
                  </div>
                </div>
                {encounter.patient.allergies.length > 0 && (
                  <div className="flex items-start gap-1.5 mt-2">
                    <Pill className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-red-600">Allergies:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {encounter.patient.allergies.map((allergy, i) => (
                          <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs border border-red-200">
                            {allergy.allergen} ({allergy.reaction})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Link
              href={`/patients/${encounter.patient.id}`}
              className="btn-secondary text-sm"
            >
              View Full Chart
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Chief Complaint */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-clinical-800 mb-3">Chief Complaint</h3>
              <p className="text-clinical-700 bg-clinical-50 p-3 rounded-lg">
                {encounter.chiefComplaint}
              </p>
            </div>

            {/* Procedure Documentation */}
            <ProcedureTemplates
              onProcedureAdd={handleProcedureAdd}
              onCptCodeAdd={handleProcedureCptAdd}
              onNoteAppend={handleProcedureNoteAppend}
            />

            {/* Quick Notes Input */}
            <div className="card p-6 space-y-5">
              {/* Voice Input Support Notice */}
              {!quickInputVoice.isSupported && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Voice input not available</p>
                    <p className="text-amber-600">Speech recognition is not supported in this browser. For voice input, please use Chrome or Safari.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="label">
                  Your Quick Notes
                  <span className="text-clinical-400 font-normal ml-1">(what you'd say to a scribe)</span>
                </label>
                <div className="relative">
                  <textarea
                    className="input min-h-[200px] resize-none pr-12"
                    placeholder="Type your clinical observations in natural language...

Example: 6mm dark brown irregularly bordered lesion on right forearm, slightly raised, asymmetric..."
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
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
                {quickInputVoice.isListening && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    Listening...
                  </p>
                )}
                {quickInputVoice.error && !quickInputVoice.isListening && (
                  <p className="text-xs text-red-600 mt-1">{quickInputVoice.error}</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !quickInput.trim()}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Code Selection */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-clinical-600">
                      <CheckSquare className="w-5 h-5" />
                      <h3 className="text-lg font-display font-semibold">Select Billing Codes</h3>
                    </div>

                    <CodeSelection
                      title="ICD-10 Diagnosis Codes"
                      codeType="icd10"
                      suggestedCodes={generatedNote.suggestions.icd10}
                      selectedCodes={selectedIcd10Codes}
                      onSelectionChange={setSelectedIcd10Codes}
                    />

                    <CodeSelection
                      title="CPT Procedure Codes"
                      codeType="cpt"
                      suggestedCodes={generatedNote.suggestions.cpt}
                      selectedCodes={selectedCptCodes}
                      onSelectionChange={setSelectedCptCodes}
                    />

                    {generatedNote.suggestions.differentials && generatedNote.suggestions.differentials.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-clinical-700 uppercase tracking-wide mb-2">
                          Differential Diagnoses (For Reference)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedNote.suggestions.differentials.map((diff, i) => (
                            <span key={i} className="px-2 py-1 bg-clinical-100 text-clinical-600 rounded text-sm">
                              {diff}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="card p-6">
                  {saveSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">Note saved successfully! Returning to patient chart...</span>
                    </div>
                  )}

                  <button
                    onClick={handleSaveNote}
                    disabled={isSaving || saveSuccess}
                    className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Saving Note...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save & Complete Visit
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-clinical-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-clinical-400" />
                </div>
                <h3 className="text-lg font-display font-semibold text-clinical-700 mb-2">
                  Ready to document
                </h3>
                <p className="text-clinical-500 text-sm max-w-xs mx-auto">
                  Enter your clinical observations and generate an AI-powered SOAP note
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
