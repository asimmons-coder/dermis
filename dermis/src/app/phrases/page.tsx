'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Sparkles
} from 'lucide-react'
import { useQuickPhrases, QuickPhrase } from '@/hooks/useQuickPhrases'

export default function ManagePhrasesPage() {
  const { defaultPhrases, customPhrases, addCustomPhrase, removeCustomPhrase, updateCustomPhrase } = useQuickPhrases()

  const [isAdding, setIsAdding] = useState(false)
  const [editingTrigger, setEditingTrigger] = useState<string | null>(null)
  const [formData, setFormData] = useState<QuickPhrase>({
    trigger: '',
    expansion: '',
    description: '',
    category: 'Custom'
  })

  const handleStartAdd = () => {
    setFormData({
      trigger: '',
      expansion: '',
      description: '',
      category: 'Custom'
    })
    setIsAdding(true)
    setEditingTrigger(null)
  }

  const handleStartEdit = (phrase: QuickPhrase) => {
    setFormData(phrase)
    setEditingTrigger(phrase.trigger)
    setIsAdding(false)
  }

  const handleSave = () => {
    if (!formData.trigger || !formData.expansion) return

    // Ensure trigger starts with a dot
    const trigger = formData.trigger.startsWith('.') ? formData.trigger : `.${formData.trigger}`

    const phraseToSave = {
      ...formData,
      trigger
    }

    if (editingTrigger) {
      updateCustomPhrase(editingTrigger, phraseToSave)
    } else {
      addCustomPhrase(phraseToSave)
    }

    handleCancel()
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingTrigger(null)
    setFormData({
      trigger: '',
      expansion: '',
      description: '',
      category: 'Custom'
    })
  }

  const handleDelete = (trigger: string) => {
    if (confirm(`Delete phrase "${trigger}"?`)) {
      removeCustomPhrase(trigger)
    }
  }

  const groupedPhrases = {
    default: defaultPhrases.reduce((acc, phrase) => {
      const cat = phrase.category || 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(phrase)
      return acc
    }, {} as Record<string, QuickPhrase[]>),
    custom: customPhrases
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-clinical-400 hover:text-clinical-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-clinical-800">Quick Phrases</h1>
                <p className="text-xs text-clinical-500">Manage your text expansion templates</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Custom Phrases */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-clinical-900">Your Custom Phrases</h2>
              <p className="text-clinical-600 text-sm mt-1">Create your own quick text expansions</p>
            </div>
            {!isAdding && !editingTrigger && (
              <button onClick={handleStartAdd} className="btn-primary">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Phrase
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {(isAdding || editingTrigger) && (
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-clinical-800 mb-4">
                {editingTrigger ? 'Edit Phrase' : 'New Phrase'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="label">Trigger</label>
                  <input
                    type="text"
                    className="input"
                    placeholder=".myabbrev"
                    value={formData.trigger}
                    onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  />
                  <p className="text-xs text-clinical-500 mt-1">
                    Start with a dot (e.g., .skincheck). Type this to trigger the expansion.
                  </p>
                </div>

                <div>
                  <label className="label">Expansion Text</label>
                  <textarea
                    className="input min-h-[120px]"
                    placeholder="The full text that will replace the trigger..."
                    value={formData.expansion}
                    onChange={(e) => setFormData({ ...formData, expansion: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Description (optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Brief description of what this phrase is for"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!formData.trigger || !formData.expansion}
                    className="btn-primary disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    {editingTrigger ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleCancel} className="btn-secondary">
                    <X className="w-4 h-4 mr-1.5" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Phrases List */}
          <div className="space-y-3">
            {customPhrases.length === 0 ? (
              <div className="card p-8 text-center">
                <Sparkles className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
                <p className="text-clinical-600">No custom phrases yet</p>
                <p className="text-sm text-clinical-500 mt-1">
                  Create your own quick text expansions to save time
                </p>
              </div>
            ) : (
              customPhrases.map((phrase) => (
                <div key={phrase.trigger} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="px-2 py-1 bg-dermis-100 text-dermis-700 rounded font-mono text-sm font-medium">
                          {phrase.trigger}
                        </code>
                        {phrase.description && (
                          <span className="text-sm text-clinical-600">— {phrase.description}</span>
                        )}
                      </div>
                      <p className="text-clinical-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {phrase.expansion}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(phrase)}
                        className="p-2 text-clinical-400 hover:text-clinical-600 hover:bg-clinical-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(phrase.trigger)}
                        className="p-2 text-clinical-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Default Phrases */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-display font-bold text-clinical-900">Built-in Phrases</h2>
            <p className="text-clinical-600 text-sm mt-1">Standard templates available to all providers</p>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedPhrases.default).map(([category, phrases]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-clinical-500 uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <div className="space-y-3">
                  {phrases.map((phrase) => (
                    <div key={phrase.trigger} className="card p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="px-2 py-1 bg-clinical-100 text-clinical-700 rounded font-mono text-sm font-medium">
                              {phrase.trigger}
                            </code>
                            {phrase.description && (
                              <span className="text-sm text-clinical-600">— {phrase.description}</span>
                            )}
                          </div>
                          <p className="text-clinical-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {phrase.expansion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
