'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sun,
  Moon,
  Sparkles,
  User,
  CheckCircle,
  Loader2,
  ArrowRight,
  Package,
  DollarSign
} from 'lucide-react'
import AppHeader from '@/components/AppHeader'

interface Product {
  id: string
  name: string
  brand: string | null
  type: string | null
  usage_instructions: string | null
  price: number | null
  step?: number
  timeOfDay?: string
  category_step?: string
  recommendation_reason?: string
}

interface Patient {
  id: string
  name: string
  mrn: string
}

export default function RecommendationsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [skinType, setSkinType] = useState<string>('Normal')
  const [concerns, setConcerns] = useState<string[]>([])
  const [amRoutine, setAmRoutine] = useState<Product[]>([])
  const [pmRoutine, setPmRoutine] = useState<Product[]>([])
  const [targetedProducts, setTargetedProducts] = useState<Product[]>([])
  const [aiReasoning, setAiReasoning] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive']
  const commonConcerns = ['Acne', 'Anti-aging', 'Hyperpigmentation', 'Rosacea', 'Sensitive skin', 'Dryness']

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients/list')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (err) {
      console.error('Failed to load patients:', err)
    }
  }

  const toggleConcern = (concern: string) => {
    setConcerns(prev =>
      prev.includes(concern)
        ? prev.filter(c => c !== concern)
        : [...prev, concern]
    )
  }

  const generateRecommendations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient || undefined,
          skinType,
          concerns
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAmRoutine(data.amRoutine || [])
        setPmRoutine(data.pmRoutine || [])
        setTargetedProducts(data.targetedProducts || [])
        setAiReasoning(data.aiReasoning || null)
        setHasGenerated(true)
      }
    } catch (err) {
      console.error('Failed to generate recommendations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalCost = (routine: Product[]) => {
    return routine.reduce((sum, p) => sum + (p.price || 0), 0)
  }

  const renderRoutine = (routine: Product[], timeLabel: string, icon: React.ReactNode) => (
    <div className="card">
      <div className="p-6 border-b border-clinical-100">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h3 className="font-display font-semibold text-lg text-clinical-900">
              {timeLabel} Routine
            </h3>
            <p className="text-sm text-clinical-600">
              {routine.length} steps • ${getTotalCost(routine).toFixed(2)} total
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-clinical-100">
        {routine.length === 0 ? (
          <div className="p-8 text-center text-clinical-500">
            <Package className="w-12 h-12 text-clinical-300 mx-auto mb-2" />
            <p>No products recommended for this routine</p>
          </div>
        ) : (
          routine.map((product, idx) => (
            <div key={product.id} className="p-4 hover:bg-clinical-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dermis-100 flex items-center justify-center font-semibold text-dermis-700">
                  {product.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div>
                      <div className="text-xs font-semibold text-dermis-600 uppercase mb-1">
                        {product.category_step}
                      </div>
                      {product.brand && (
                        <div className="text-xs text-clinical-500 mb-0.5">{product.brand}</div>
                      )}
                      <h4 className="font-semibold text-clinical-900">{product.name}</h4>
                    </div>
                    {product.price && (
                      <div className="flex items-center gap-1 text-lg font-bold text-clinical-900 flex-shrink-0">
                        <DollarSign className="w-4 h-4" />
                        {product.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {product.recommendation_reason && (
                    <div className="mt-2 p-2 bg-dermis-50 rounded-lg border border-dermis-100">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-dermis-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-dermis-700">{product.recommendation_reason}</p>
                      </div>
                    </div>
                  )}
                  {product.usage_instructions && (
                    <p className="text-sm text-clinical-600 mt-2">{product.usage_instructions}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-dermis-600" />
            <h1 className="text-3xl font-display font-bold text-clinical-900">
              Skincare Recommendations
            </h1>
          </div>
          <p className="text-clinical-600">
            Generate personalized AM/PM routines based on skin type and concerns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="font-display font-semibold text-lg text-clinical-900 mb-4">
                Build Routine
              </h3>

              {/* Patient Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Patient (Optional)
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select a patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Skin Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Skin Type
                </label>
                <select
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="input w-full"
                >
                  {skinTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Concerns */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-clinical-700 mb-3">
                  Concerns & Goals
                </label>
                <div className="space-y-2">
                  {commonConcerns.map(concern => (
                    <label key={concern} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={concerns.includes(concern)}
                        onChange={() => toggleConcern(concern)}
                        className="rounded border-clinical-300 text-dermis-600 focus:ring-dermis-500"
                      />
                      <span className="text-sm text-clinical-700">{concern}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateRecommendations}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Routine
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {!hasGenerated ? (
              <div className="card p-12 text-center">
                <Sparkles className="w-16 h-16 text-clinical-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-clinical-900 mb-2">
                  Ready to Build a Routine
                </h3>
                <p className="text-clinical-600">
                  Select skin type and concerns, then click "Generate Routine" to get personalized product recommendations
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* AI Summary */}
                <div className="card p-6 bg-gradient-to-br from-dermis-50 to-white border-dermis-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-dermis-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg text-clinical-900">
                          AI-Personalized Routine
                        </h3>
                        <p className="text-sm text-clinical-600">
                          {skinType} skin • {concerns.length} concern{concerns.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-dermis-600" />
                  </div>

                  {aiReasoning && (
                    <div className="p-4 bg-white rounded-lg border border-dermis-200 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-dermis-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3 h-3 text-dermis-600" />
                        </div>
                        <p className="text-clinical-700 leading-relaxed">{aiReasoning}</p>
                      </div>
                    </div>
                  )}

                  {concerns.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {concerns.map(concern => (
                        <span key={concern} className="px-2 py-1 bg-dermis-100 text-dermis-700 text-xs font-medium rounded">
                          {concern}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AM Routine */}
                {renderRoutine(amRoutine, 'Morning', <Sun className="w-6 h-6 text-amber-500" />)}

                {/* PM Routine */}
                {renderRoutine(pmRoutine, 'Evening', <Moon className="w-6 h-6 text-indigo-500" />)}

                {/* Targeted Products */}
                {targetedProducts.length > 0 && (
                  <div className="card">
                    <div className="p-6 border-b border-clinical-100">
                      <h3 className="font-display font-semibold text-lg text-clinical-900">
                        Additional Targeted Products
                      </h3>
                      <p className="text-sm text-clinical-600 mt-1">
                        Products for specific concerns
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                      {targetedProducts.map(product => (
                        <div key={product.id} className="p-4 bg-clinical-50 rounded-lg">
                          {product.brand && (
                            <div className="text-xs font-semibold text-dermis-600 uppercase mb-1">
                              {product.brand}
                            </div>
                          )}
                          <h4 className="font-semibold text-clinical-900 mb-1">{product.name}</h4>
                          {product.price && (
                            <div className="text-sm font-bold text-clinical-700">
                              ${product.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Cost */}
                <div className="card p-6 bg-gradient-to-br from-clinical-800 to-clinical-900 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-1">
                        Complete Routine Cost
                      </h3>
                      <p className="text-clinical-300 text-sm">
                        {amRoutine.length + pmRoutine.length} products
                      </p>
                    </div>
                    <div className="text-3xl font-bold">
                      ${(getTotalCost(amRoutine) + getTotalCost(pmRoutine)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
