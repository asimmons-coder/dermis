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
  Clock
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
}

interface PatientProduct {
  id: string
  product: Product
  frequency: string
  time_of_day?: string // 'AM', 'PM', or 'Both'
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

interface Recommendation {
  product: Product
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export default function PatientProductsPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [patientProducts, setPatientProducts] = useState<PatientProduct[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
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

  useEffect(() => {
    loadData()
  }, [patientId])

  useEffect(() => {
    if (patient && allProducts.length > 0) {
      generateRecommendations()
    }
  }, [patient, allProducts, patientProducts])

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

  const generateRecommendations = () => {
    if (!patient) return

    const recs: Recommendation[] = []
    const alreadyHasIds = new Set(patientProducts.map(pp => pp.product.id))

    // Skin type-based recommendations
    const skinTypeMap: Record<string, string[]> = {
      'I': ['moisturizer', 'sunscreen'],
      'II': ['moisturizer', 'sunscreen'],
      'III': ['sunscreen', 'moisturizer'],
      'IV': ['sunscreen', 'moisturizer'],
      'V': ['sunscreen', 'moisturizer'],
      'VI': ['moisturizer', 'sunscreen']
    }

    const recommendedTypes = skinTypeMap[patient.skinType] || ['moisturizer', 'sunscreen']

    // High priority: Sunscreen for everyone, especially with skin cancer history
    if (patient.skinCancerHistory || patient.skinType.match(/I|II|III/)) {
      const sunscreens = allProducts.filter(p =>
        p.type?.toLowerCase().includes('sunscreen') && !alreadyHasIds.has(p.id)
      )
      sunscreens.slice(0, 2).forEach(product => {
        recs.push({
          product,
          reason: patient.skinCancerHistory
            ? 'Essential sun protection due to skin cancer history'
            : `Recommended for Fitzpatrick Type ${patient.skinType} skin`,
          priority: 'high'
        })
      })
    }

    // Medium priority: Moisturizers for dry skin types
    if (patient.skinType.match(/I|II/)) {
      const moisturizers = allProducts.filter(p =>
        (p.type?.toLowerCase().includes('moisturizer') ||
         p.category?.toLowerCase().includes('moisturizer')) &&
        !alreadyHasIds.has(p.id) &&
        !recs.find(r => r.product.id === p.id)
      )
      moisturizers.slice(0, 2).forEach(product => {
        recs.push({
          product,
          reason: 'Hydration support for your skin type',
          priority: 'medium'
        })
      })
    }

    // Age-based recommendations
    if (patient.age >= 40) {
      const antiAging = allProducts.filter(p =>
        (p.name?.toLowerCase().includes('retinol') ||
         p.name?.toLowerCase().includes('anti-aging') ||
         p.type?.toLowerCase().includes('serum')) &&
        !alreadyHasIds.has(p.id) &&
        !recs.find(r => r.product.id === p.id)
      )
      antiAging.slice(0, 1).forEach(product => {
        recs.push({
          product,
          reason: 'Age-appropriate skincare support',
          priority: 'medium'
        })
      })
    }

    // Cleansers for everyone
    const cleansers = allProducts.filter(p =>
      (p.category?.toLowerCase().includes('cleanser') ||
       p.type?.toLowerCase().includes('cleanser')) &&
      !alreadyHasIds.has(p.id) &&
      !recs.find(r => r.product.id === p.id)
    )
    cleansers.slice(0, 1).forEach(product => {
      recs.push({
        product,
        reason: 'Essential daily cleansing',
        priority: 'medium'
      })
    })

    // Sort by priority
    recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    setRecommendations(recs.slice(0, 6))
  }

  const isProductInRegimen = (productId: string) => {
    return patientProducts.some(pp => pp.product.id === productId)
  }

  const handleAddProduct = (product: Product, reason?: string) => {
    setSelectedProduct(product)
    setAddProductForm({
      frequency: 'Daily',
      time_of_day: 'Both',
      notes: reason || ''
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

  const handlePrintRoutine = () => {
    window.print()
  }

  const calculateTotalCost = () => {
    return patientProducts.reduce((total, pp) => {
      return total + (pp.product.price || 0)
    }, 0)
  }

  const getAMProducts = () => {
    return patientProducts.filter(pp =>
      pp.time_of_day === 'AM' || pp.time_of_day === 'Both'
    )
  }

  const getPMProducts = () => {
    return patientProducts.filter(pp =>
      pp.time_of_day === 'PM' || pp.time_of_day === 'Both'
    )
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
                  <p className="text-xs text-clinical-500">Product Recommendations</p>
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
        {/* Patient Profile Summary */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center">
              <Sun className="w-5 h-5 text-dermis-600" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-clinical-800">Skin Profile</h2>
              <p className="text-sm text-clinical-600">Analysis based on patient's characteristics</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-clinical-50 rounded-lg">
              <div className="text-xs text-clinical-500 mb-1">Skin Type</div>
              <div className="text-sm font-medium text-clinical-800">Fitzpatrick {patient.skinType}</div>
            </div>
            <div className="p-3 bg-clinical-50 rounded-lg">
              <div className="text-xs text-clinical-500 mb-1">Age</div>
              <div className="text-sm font-medium text-clinical-800">{patient.age} years</div>
            </div>
            <div className="p-3 bg-clinical-50 rounded-lg">
              <div className="text-xs text-clinical-500 mb-1">Skin Cancer Hx</div>
              <div className="text-sm font-medium text-clinical-800">
                {patient.skinCancerHistory ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="p-3 bg-clinical-50 rounded-lg">
              <div className="text-xs text-clinical-500 mb-1">Current Products</div>
              <div className="text-sm font-medium text-clinical-800">{patientProducts.length}</div>
            </div>
          </div>
        </div>

        {/* AI-Powered Recommendations */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-clinical-100 bg-gradient-to-r from-dermis-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-dermis-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-clinical-800">Personalized Recommendations</h2>
                  <p className="text-sm text-clinical-600">
                    Based on skin type, age, and medical history
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCatalog(!showCatalog)}
                className="btn-secondary text-sm"
              >
                <Search className="w-4 h-4 mr-2" />
                Browse All Products
              </button>
            </div>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
              <p className="text-clinical-500">No additional recommendations at this time</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => {
                const inRegimen = isProductInRegimen(rec.product.id)
                return (
                  <div
                    key={rec.product.id}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      rec.priority === 'high'
                        ? 'border-red-200 bg-red-50/50'
                        : 'border-clinical-200 bg-white'
                    } ${inRegimen ? 'opacity-50' : 'hover:shadow-md'}`}
                  >
                    {rec.priority === 'high' && (
                      <div className="absolute top-2 right-2">
                        <div className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          HIGH PRIORITY
                        </div>
                      </div>
                    )}

                    {inRegimen && (
                      <div className="absolute top-2 right-2">
                        <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          In Regimen
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-dermis-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-dermis-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-clinical-800 line-clamp-2">
                            {rec.product.name}
                          </h3>
                          {rec.product.brand && (
                            <p className="text-xs text-clinical-500">{rec.product.brand}</p>
                          )}
                        </div>
                      </div>

                      <div className="mb-3 p-3 bg-dermis-50 rounded-lg border border-dermis-100">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-dermis-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-clinical-700 leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-clinical-600 mb-3">
                        <span className="px-2 py-1 bg-clinical-100 rounded text-xs">
                          {rec.product.category}
                        </span>
                        {rec.product.price && (
                          <span className="font-medium text-clinical-800">
                            ${rec.product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {!inRegimen && (
                        <button
                          onClick={() => handleAddProduct(rec.product, rec.reason)}
                          className="w-full btn-primary text-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Regimen
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Current Regimen with AM/PM Breakdown */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-clinical-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-dermis-600" />
                <h2 className="font-display font-semibold text-clinical-800">Current Regimen</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <span className="text-clinical-500">Total Monthly Cost: </span>
                  <span className="font-semibold text-dermis-600 text-lg">
                    ${calculateTotalCost().toFixed(2)}
                  </span>
                </div>
                {patientProducts.length > 0 && (
                  <button
                    onClick={handlePrintRoutine}
                    className="btn-secondary text-sm"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Routine
                  </button>
                )}
              </div>
            </div>
          </div>

          {patientProducts.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
              <p className="text-clinical-500 mb-4">No products in regimen yet</p>
              <button
                onClick={() => setShowCatalog(true)}
                className="btn-primary text-sm"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* AM Routine */}
              <div className="border border-clinical-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-clinical-200">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-600" />
                    <h3 className="font-display font-semibold text-clinical-800">Morning Routine</h3>
                    <span className="ml-auto text-sm text-clinical-600">
                      {getAMProducts().length} product{getAMProducts().length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {getAMProducts().length === 0 ? (
                  <div className="p-6 text-center text-sm text-clinical-500">
                    No morning products added yet
                  </div>
                ) : (
                  <div className="divide-y divide-clinical-100">
                    {getAMProducts().map((pp) => (
                      <div key={pp.id} className="p-4 hover:bg-clinical-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {pp.product.image_url ? (
                              <img
                                src={pp.product.image_url}
                                alt={pp.product.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`w-12 h-12 rounded-lg bg-dermis-100 flex items-center justify-center flex-shrink-0 ${pp.product.image_url ? 'hidden' : ''}`}>
                              <Package className="w-6 h-6 text-dermis-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-clinical-800 mb-1">
                                {pp.product.name}
                              </h3>
                              {pp.product.brand && (
                                <p className="text-sm text-clinical-600 mb-2">{pp.product.brand}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-clinical-100 text-clinical-700 rounded text-xs">
                                  {pp.product.category}
                                </span>
                                {pp.product.price && (
                                  <span className="text-sm font-medium text-clinical-800">
                                    ${pp.product.price.toFixed(2)}/month
                                  </span>
                                )}
                              </div>
                              {pp.notes && (
                                <p className="text-sm text-clinical-600 mt-2 italic">
                                  {pp.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveProduct(pp.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Remove from regimen"
                          >
                            <Trash2 className="w-4 h-4 text-clinical-400 group-hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PM Routine */}
              <div className="border border-clinical-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-clinical-200">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-display font-semibold text-clinical-800">Evening Routine</h3>
                    <span className="ml-auto text-sm text-clinical-600">
                      {getPMProducts().length} product{getPMProducts().length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {getPMProducts().length === 0 ? (
                  <div className="p-6 text-center text-sm text-clinical-500">
                    No evening products added yet
                  </div>
                ) : (
                  <div className="divide-y divide-clinical-100">
                    {getPMProducts().map((pp) => (
                      <div key={pp.id} className="p-4 hover:bg-clinical-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {pp.product.image_url ? (
                              <img
                                src={pp.product.image_url}
                                alt={pp.product.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`w-12 h-12 rounded-lg bg-dermis-100 flex items-center justify-center flex-shrink-0 ${pp.product.image_url ? 'hidden' : ''}`}>
                              <Package className="w-6 h-6 text-dermis-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-clinical-800 mb-1">
                                {pp.product.name}
                              </h3>
                              {pp.product.brand && (
                                <p className="text-sm text-clinical-600 mb-2">{pp.product.brand}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-clinical-100 text-clinical-700 rounded text-xs">
                                  {pp.product.category}
                                </span>
                                {pp.product.price && (
                                  <span className="text-sm font-medium text-clinical-800">
                                    ${pp.product.price.toFixed(2)}/month
                                  </span>
                                )}
                              </div>
                              {pp.notes && (
                                <p className="text-sm text-clinical-600 mt-2 italic">
                                  {pp.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveProduct(pp.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Remove from regimen"
                          >
                            <Trash2 className="w-4 h-4 text-clinical-400 group-hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Full Catalog (Expandable) */}
        {showCatalog && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-clinical-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-dermis-600" />
                  <h2 className="font-display font-semibold text-clinical-800">Browse All Products</h2>
                </div>
                <button
                  onClick={() => setShowCatalog(false)}
                  className="text-clinical-400 hover:text-clinical-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="input pl-10 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="input sm:w-48"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {filteredCatalogProducts.map((product) => {
                const inRegimen = isProductInRegimen(product.id)
                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-lg border transition-all ${
                      inRegimen
                        ? 'border-green-200 bg-green-50/50 ring-2 ring-green-200'
                        : 'border-clinical-200 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-dermis-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-dermis-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-clinical-800 text-sm line-clamp-2">
                            {product.name}
                          </h3>
                          {product.brand && (
                            <p className="text-xs text-clinical-500">{product.brand}</p>
                          )}
                        </div>
                      </div>
                      {inRegimen && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          <Check className="w-3 h-3" />
                          Added
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-clinical-100 rounded text-xs text-clinical-700">
                        {product.category}
                      </span>
                      {product.price && (
                        <span className="text-sm font-medium text-clinical-800">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {!inRegimen && (
                      <button
                        onClick={() => handleAddProduct(product)}
                        className="w-full btn-secondary text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && selectedProduct && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-clinical-100">
              <h3 className="text-lg font-display font-semibold text-clinical-800">
                Add to Regimen
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-dermis-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-dermis-600" />
                  </div>
                  <div>
                    <p className="font-medium text-clinical-800">{selectedProduct.name}</p>
                    {selectedProduct.brand && (
                      <p className="text-sm text-clinical-600">{selectedProduct.brand}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  When to Use
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['AM', 'PM', 'Both'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() =>
                        setAddProductForm({ ...addProductForm, time_of_day: time })
                      }
                      className={`p-3 rounded-lg border-2 transition-all ${
                        addProductForm.time_of_day === time
                          ? 'border-dermis-500 bg-dermis-50 text-dermis-700'
                          : 'border-clinical-200 bg-white text-clinical-600 hover:border-clinical-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {time === 'AM' && <Sun className="w-5 h-5" />}
                        {time === 'PM' && <Moon className="w-5 h-5" />}
                        {time === 'Both' && <Clock className="w-5 h-5" />}
                        <span className="text-sm font-medium">{time}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Frequency
                </label>
                <select
                  className="input w-full"
                  value={addProductForm.frequency}
                  onChange={(e) =>
                    setAddProductForm({ ...addProductForm, frequency: e.target.value })
                  }
                >
                  <option value="Daily">Daily</option>
                  <option value="Twice Daily">Twice Daily</option>
                  <option value="As Needed">As Needed</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Any specific instructions or recommendations..."
                  value={addProductForm.notes}
                  onChange={(e) =>
                    setAddProductForm({ ...addProductForm, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-clinical-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 btn-secondary"
                disabled={isAdding}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 btn-primary"
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
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
