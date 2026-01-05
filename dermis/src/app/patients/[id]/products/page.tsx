'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  User,
  ShoppingBag,
  Plus,
  Sparkles,
  Loader2,
  Camera,
  FileText,
  X,
  Package,
  Search,
  Filter,
  DollarSign,
  Check,
  Trash2,
  CreditCard,
  ChevronRight,
  Sun,
  Droplet,
  Shield,
  Printer,
  Save,
  Moon,
  Clock,
  RefreshCw,
  Pill,
  FlaskConical
} from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string | null
  category: string
  type: string | null
  usage_instructions: string | null
  price: number | null
  image_url: string | null
  step?: number
  timeOfDay?: string
  category_step?: string
  recommendation_reason?: string
}

interface PatientProduct {
  id: string
  product: Product
  frequency: string
  time_of_day?: string
  notes: string | null
  recommended_at: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  mrn: string
  age: number
  skinType: string
  skinCancerHistory: boolean
  allergies: any[]
  medicalHistory: any[]
}

export default function PatientProductsPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [patientProducts, setPatientProducts] = useState<PatientProduct[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCatalog, setShowCatalog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addProductForm, setAddProductForm] = useState({
    frequency: 'Daily',
    time_of_day: 'Both',
    notes: ''
  })
  const [isAdding, setIsAdding] = useState(false)

  // AI Routine states
  const [amRoutine, setAmRoutine] = useState<Product[]>([])
  const [pmRoutine, setPmRoutine] = useState<Product[]>([])
  const [aiReasoning, setAiReasoning] = useState<string | null>(null)
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false)
  const [hasGeneratedRoutine, setHasGeneratedRoutine] = useState(false)
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([])
  const [providerNotes, setProviderNotes] = useState('')
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set())

  const commonConcerns = ['Acne', 'Anti-aging', 'Hyperpigmentation', 'Rosacea', 'Sensitive skin', 'Dryness']

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        loadPatient(),
        loadPatientProducts(),
        loadAllProducts()
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const loadPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data.patient)
      }
    } catch (err) {
      console.error('Failed to load patient:', err)
    }
  }

  const loadPatientProducts = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/products`)
      if (response.ok) {
        const data = await response.json()
        setPatientProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to load patient products:', err)
    }
  }

  const loadAllProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setAllProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const generateAIRoutine = async () => {
    if (!patient) return

    setIsGeneratingRoutine(true)
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          skinType: getSkinTypeDescription(patient.skinType),
          concerns: selectedConcerns,
          age: patient.age,
          providerNotes: providerNotes
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAmRoutine(data.amRoutine || [])
        setPmRoutine(data.pmRoutine || [])
        setAiReasoning(data.aiReasoning || null)
        setHasGeneratedRoutine(true)
      }
    } catch (err) {
      console.error('Failed to generate AI routine:', err)
    } finally {
      setIsGeneratingRoutine(false)
    }
  }

  const getSkinTypeDescription = (fitzpatrick: string): string => {
    const descriptions: Record<string, string> = {
      'I': 'Very fair, always burns',
      'II': 'Fair, usually burns',
      'III': 'Medium, sometimes burns',
      'IV': 'Olive, rarely burns',
      'V': 'Brown, very rarely burns',
      'VI': 'Dark brown/black, never burns'
    }
    return descriptions[fitzpatrick] || fitzpatrick
  }

  const toggleConcern = (concern: string) => {
    setSelectedConcerns(prev =>
      prev.includes(concern)
        ? prev.filter(c => c !== concern)
        : [...prev, concern]
    )
  }

  const isProductInRegimen = (productId: string) => {
    return patientProducts.some(pp => pp.product.id === productId)
  }

  const handleAddProduct = (product: Product, reason?: string) => {
    setSelectedProduct(product)
    setAddProductForm({
      frequency: 'Daily',
      time_of_day: product.timeOfDay === 'AM' ? 'AM' : product.timeOfDay === 'PM' ? 'PM' : 'Both',
      notes: reason || product.recommendation_reason || ''
    })
    setShowAddModal(true)
  }

  const handleSaveProduct = async () => {
    if (!selectedProduct) return

    setIsAdding(true)
    try {
      const response = await fetch(`/api/patients/${patientId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          frequency: addProductForm.frequency,
          time_of_day: addProductForm.time_of_day,
          notes: addProductForm.notes
        })
      })

      if (response.ok) {
        await loadPatientProducts()
        setShowAddModal(false)
        setSelectedProduct(null)
        setAddProductForm({ frequency: 'Daily', time_of_day: 'Both', notes: '' })
      }
    } catch (err) {
      console.error('Failed to add product:', err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveProduct = async (patientProductId: string) => {
    if (!confirm('Remove this product from the regimen?')) return

    try {
      const response = await fetch(
        `/api/patients/${patientId}/products/${patientProductId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        await loadPatientProducts()
      }
    } catch (err) {
      console.error('Failed to remove product:', err)
    }
  }

  // Add all products to regimen
  const handleAddAllToRegimen = async () => {
    const uniqueProducts = new Map<string, Product>()
    amRoutine.forEach(p => uniqueProducts.set(p.id, p))
    pmRoutine.forEach(p => uniqueProducts.set(p.id, p))

    // Filter out products already in regimen
    const productsToAdd = Array.from(uniqueProducts.values()).filter(
      p => !isProductInRegimen(p.id)
    )

    if (productsToAdd.length === 0) {
      alert('All products are already in the regimen!')
      return
    }

    setIsAddingAll(true)
    const newlyAdded = new Set<string>()

    try {
      for (const product of productsToAdd) {
        const response = await fetch(`/api/patients/${patientId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: product.id,
            frequency: 'Daily',
            time_of_day: product.timeOfDay === 'AM' ? 'AM' : product.timeOfDay === 'PM' ? 'PM' : 'Both',
            notes: product.recommendation_reason || ''
          })
        })

        if (response.ok) {
          newlyAdded.add(product.id)
        }
      }

      await loadPatientProducts()
      setRecentlyAdded(newlyAdded)

      // Clear the "recently added" highlight after 3 seconds
      setTimeout(() => setRecentlyAdded(new Set()), 3000)
    } catch (err) {
      console.error('Failed to add products:', err)
    } finally {
      setIsAddingAll(false)
    }
  }

  // Calculate unique products cost (not double counting AM/PM)
  const calculateRoutineCost = () => {
    const uniqueProducts = new Map<string, Product>()

    amRoutine.forEach(p => uniqueProducts.set(p.id, p))
    pmRoutine.forEach(p => uniqueProducts.set(p.id, p))

    let total = 0
    uniqueProducts.forEach(p => {
      total += p.price || 0
    })
    return total
  }

  const filteredCatalogProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(allProducts.map(p => p.category)))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-dermis-500 animate-spin" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <p className="text-clinical-600">Patient not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href={`/patients/${patient.id}`} className="text-clinical-400 hover:text-clinical-600 transition-colors">
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
                  <p className="text-xs text-clinical-500">Skincare Recommendations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-clinical-200 -mb-px">
            <Link
              href={`/patients/${patient.id}`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
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
              href={`/patients/${patient.id}/labs`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2"
            >
              <FlaskConical className="w-4 h-4" />
              Labs
            </Link>
            <Link
              href={`/patients/${patient.id}/products`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-dermis-500 text-dermis-600 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Products
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Patient Profile & Concerns Selection */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-dermis-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-clinical-800">AI-Personalized Skincare</h2>
              <p className="text-sm text-clinical-600">Customized routine for {patient.firstName}</p>
            </div>
          </div>

          {/* Patient Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-clinical-50 rounded-lg">
              <div className="text-xs text-clinical-500 mb-1">Skin Type</div>
              <div className="text-sm font-medium text-clinical-800">
                Fitzpatrick {patient.skinType}
              </div>
              <div className="text-xs text-clinical-500">{getSkinTypeDescription(patient.skinType)}</div>
            </div>
            <div className="p-3 bg-clinical-50 rounded-lg">
              <div className="text-xs text-clinical-500 mb-1">Age</div>
              <div className="text-sm font-medium text-clinical-800">{patient.age} years</div>
            </div>
            <div className={`p-3 rounded-lg ${patient.skinCancerHistory ? 'bg-red-50' : 'bg-clinical-50'}`}>
              <div className="text-xs text-clinical-500 mb-1">Skin Cancer History</div>
              <div className={`text-sm font-medium ${patient.skinCancerHistory ? 'text-red-700' : 'text-clinical-800'}`}>
                {patient.skinCancerHistory ? 'Yes - High Priority SPF' : 'No'}
              </div>
            </div>
            <div className="p-3 bg-clinical-50 rounded-lg">
              <div className="text-xs text-clinical-500 mb-1">Allergies</div>
              <div className="text-sm font-medium text-clinical-800">
                {patient.allergies?.length > 0 ? patient.allergies.length : 'None known'}
              </div>
            </div>
          </div>

          {/* Concerns Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-clinical-700 mb-3">
              Select Concerns & Goals
            </label>
            <div className="flex flex-wrap gap-2">
              {commonConcerns.map(concern => (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedConcerns.includes(concern)
                      ? 'bg-dermis-500 text-white'
                      : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                  }`}
                >
                  {concern}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-clinical-700 mb-2">
              Provider Notes (Optional)
            </label>
            <textarea
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              placeholder="Add any additional context for the AI... (e.g., 'Patient prefers fragrance-free products', 'Currently on isotretinoin', 'Budget conscious')"
              className="input w-full min-h-[80px] resize-none text-sm"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateAIRoutine}
            disabled={isGeneratingRoutine}
            className="btn-primary w-full py-3"
          >
            {isGeneratingRoutine ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating Personalized Routine...
              </>
            ) : hasGeneratedRoutine ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Routine
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Routine for {patient.firstName}
              </>
            )}
          </button>
        </div>

        {/* AI Generated Routine */}
        {hasGeneratedRoutine && (
          <>
            {/* AI Reasoning */}
            {aiReasoning && (
              <div className="card p-6 bg-gradient-to-br from-dermis-50 to-purple-50 border-dermis-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-dermis-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-dermis-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-clinical-800 mb-1">AI Recommendation Summary</h3>
                    <p className="text-clinical-700 leading-relaxed">{aiReasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AM/PM Routines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AM Routine */}
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-clinical-100 bg-amber-50">
                  <div className="flex items-center gap-3">
                    <Sun className="w-6 h-6 text-amber-500" />
                    <div>
                      <h3 className="font-display font-semibold text-clinical-800">Morning Routine</h3>
                      <p className="text-sm text-clinical-600">{amRoutine.length} steps</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-clinical-100">
                  {amRoutine.length === 0 ? (
                    <div className="p-8 text-center text-clinical-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-clinical-300" />
                      No products in AM routine
                    </div>
                  ) : (
                    amRoutine.map((product, idx) => (
                      <div key={`am-${product.id}`} className="p-4 hover:bg-clinical-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-semibold text-amber-700">
                            {product.step || idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-dermis-600 uppercase mb-1">
                              {product.category_step || product.type}
                            </div>
                            {product.brand && (
                              <div className="text-xs text-clinical-500">{product.brand}</div>
                            )}
                            <h4 className="font-semibold text-clinical-900">{product.name}</h4>
                            {product.recommendation_reason && (
                              <div className="mt-2 p-2 bg-dermis-50 rounded border border-dermis-100">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-3 h-3 text-dermis-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-dermis-700">{product.recommendation_reason}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {product.price && (
                              <div className="font-bold text-clinical-900">${product.price.toFixed(2)}</div>
                            )}
                            {!isProductInRegimen(product.id) ? (
                              <button
                                onClick={() => handleAddProduct(product)}
                                className="mt-2 text-xs text-dermis-600 hover:text-dermis-700 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            ) : (
                              <span className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Added
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PM Routine */}
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-clinical-100 bg-indigo-50">
                  <div className="flex items-center gap-3">
                    <Moon className="w-6 h-6 text-indigo-500" />
                    <div>
                      <h3 className="font-display font-semibold text-clinical-800">Evening Routine</h3>
                      <p className="text-sm text-clinical-600">{pmRoutine.length} steps</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-clinical-100">
                  {pmRoutine.length === 0 ? (
                    <div className="p-8 text-center text-clinical-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-clinical-300" />
                      No products in PM routine
                    </div>
                  ) : (
                    pmRoutine.map((product, idx) => (
                      <div key={`pm-${product.id}`} className="p-4 hover:bg-clinical-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700">
                            {product.step || idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-dermis-600 uppercase mb-1">
                              {product.category_step || product.type}
                            </div>
                            {product.brand && (
                              <div className="text-xs text-clinical-500">{product.brand}</div>
                            )}
                            <h4 className="font-semibold text-clinical-900">{product.name}</h4>
                            {product.recommendation_reason && (
                              <div className="mt-2 p-2 bg-dermis-50 rounded border border-dermis-100">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-3 h-3 text-dermis-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-dermis-700">{product.recommendation_reason}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {product.price && (
                              <div className="font-bold text-clinical-900">${product.price.toFixed(2)}</div>
                            )}
                            {!isProductInRegimen(product.id) ? (
                              <button
                                onClick={() => handleAddProduct(product)}
                                className="mt-2 text-xs text-dermis-600 hover:text-dermis-700 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            ) : (
                              <span className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Added
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Total Cost and Actions */}
            <div className="card overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-clinical-800 to-clinical-900 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-1">Complete Routine Cost</h3>
                    <p className="text-clinical-300 text-sm">
                      {new Set([...amRoutine.map(p => p.id), ...pmRoutine.map(p => p.id)]).size} unique products
                    </p>
                  </div>
                  <div className="text-3xl font-bold">
                    ${calculateRoutineCost().toFixed(2)}
                  </div>
                </div>

                {/* Add All Button */}
                <button
                  onClick={handleAddAllToRegimen}
                  disabled={isAddingAll || [...amRoutine, ...pmRoutine].every(p => isProductInRegimen(p.id))}
                  className="w-full py-3 bg-white text-clinical-800 rounded-lg font-semibold hover:bg-clinical-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAddingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding Products...
                    </>
                  ) : [...amRoutine, ...pmRoutine].every(p => isProductInRegimen(p.id)) ? (
                    <>
                      <Check className="w-4 h-4" />
                      All Products in Regimen
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add All Products to {patient.firstName}'s Regimen
                    </>
                  )}
                </button>
              </div>

              {/* Where products go info */}
              <div className="px-6 py-4 bg-clinical-50 border-t border-clinical-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-dermis-100 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-dermis-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-clinical-700">
                      Products are saved to <strong>{patient.firstName}'s regimen</strong> and will appear on their checkout summary.
                    </p>
                  </div>
                  {patientProducts.length > 0 && (
                    <span className="px-3 py-1 bg-dermis-100 text-dermis-700 text-sm font-medium rounded-full">
                      {patientProducts.length} in regimen
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Browse Products Button */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-clinical-800">Product Catalog</h3>
              <p className="text-sm text-clinical-600">Browse and add products manually</p>
            </div>
            <button
              onClick={() => setShowCatalog(!showCatalog)}
              className="btn-secondary"
            >
              <Search className="w-4 h-4 mr-2" />
              {showCatalog ? 'Hide Catalog' : 'Browse All Products'}
            </button>
          </div>

          {/* Product Catalog */}
          {showCatalog && (
            <div className="mt-6 border-t border-clinical-100 pt-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalogProducts.slice(0, 12).map(product => (
                  <div
                    key={product.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isProductInRegimen(product.id)
                        ? 'border-green-200 bg-green-50'
                        : 'border-clinical-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {product.brand && (
                          <div className="text-xs text-clinical-500">{product.brand}</div>
                        )}
                        <h4 className="font-semibold text-clinical-800">{product.name}</h4>
                      </div>
                      {isProductInRegimen(product.id) && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Added
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-clinical-500 mb-3">{product.category}</div>
                    <div className="flex items-center justify-between">
                      {product.price && (
                        <span className="font-bold text-clinical-900">${product.price.toFixed(2)}</span>
                      )}
                      {!isProductInRegimen(product.id) && (
                        <button
                          onClick={() => handleAddProduct(product)}
                          className="text-sm text-dermis-600 hover:text-dermis-700 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Regimen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-clinical-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-clinical-800">Add to Regimen</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-clinical-400 hover:text-clinical-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-clinical-50 rounded-lg">
                {selectedProduct.brand && (
                  <div className="text-xs text-clinical-500">{selectedProduct.brand}</div>
                )}
                <h4 className="font-semibold text-clinical-800">{selectedProduct.name}</h4>
                {selectedProduct.price && (
                  <div className="text-sm text-dermis-600 mt-1">${selectedProduct.price.toFixed(2)}</div>
                )}
              </div>

              <div>
                <label className="label">Frequency</label>
                <select
                  value={addProductForm.frequency}
                  onChange={(e) => setAddProductForm({ ...addProductForm, frequency: e.target.value })}
                  className="input w-full"
                >
                  <option value="Daily">Daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Every other day">Every other day</option>
                  <option value="Weekly">Weekly</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>

              <div>
                <label className="label">Time of Day</label>
                <select
                  value={addProductForm.time_of_day}
                  onChange={(e) => setAddProductForm({ ...addProductForm, time_of_day: e.target.value })}
                  className="input w-full"
                >
                  <option value="AM">Morning only</option>
                  <option value="PM">Evening only</option>
                  <option value="Both">Both AM &amp; PM</option>
                </select>
              </div>

              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={addProductForm.notes}
                  onChange={(e) => setAddProductForm({ ...addProductForm, notes: e.target.value })}
                  className="input w-full min-h-[80px] resize-none"
                  placeholder="Why this product was recommended..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-clinical-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isAdding}
                className="btn-primary flex-1"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Regimen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
