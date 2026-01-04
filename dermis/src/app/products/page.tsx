'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  Search,
  Command,
  ShoppingBag,
  Filter,
  DollarSign,
  Package,
  Sparkles,
  Loader2
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
  is_active: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState<string | null>('all')

  const triggerGlobalSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, selectedCategory, selectedType])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.type?.toLowerCase().includes(query)
      )
    }

    setFilteredProducts(filtered)
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]
  const types = ['all', ...Array.from(new Set(products.map(p => p.type).filter(Boolean)))]

  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return products.length
    return products.filter(p => p.category === cat).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-clinical-800">Dermis</h1>
              <p className="text-xs text-clinical-500">by Novice Group</p>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <button
              onClick={triggerGlobalSearch}
              className="flex items-center gap-2 px-3 py-2 text-sm text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search patients</span>
              <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-clinical-100 border border-clinical-200 rounded">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
            <Link href="/demo" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Demo
            </Link>
            <Link href="/patients" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Patients
            </Link>
            <Link href="/schedule" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Schedule
            </Link>
            <Link href="/tracker" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Tracker
            </Link>
            <Link href="/calendar" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Calendar
            </Link>
            <Link href="/check-in" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Check In
            </Link>
            <Link href="/inbox/pathology" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Pathology
            </Link>
            <Link href="/products" className="text-dermis-600 font-medium text-sm border-b-2 border-dermis-500">
              Products
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-6 h-6 text-dermis-600" />
            <h1 className="text-3xl font-display font-bold text-clinical-900">Skincare Products</h1>
          </div>
          <p className="text-clinical-600">
            Professional-grade skincare products recommended by our dermatologists
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
            <input
              type="text"
              className="input pl-10 w-full"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-clinical-600" />
            <span className="text-sm font-medium text-clinical-700 mr-2">Category:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-dermis-600 text-white'
                    : 'bg-clinical-100 text-clinical-700 hover:bg-clinical-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat} ({getCategoryCount(cat)})
              </button>
            ))}
          </div>

          {/* Type Filter */}
          {types.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Package className="w-4 h-4 text-clinical-600" />
              <span className="text-sm font-medium text-clinical-700 mr-2">Type:</span>
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    selectedType === type
                      ? 'bg-dermis-600 text-white'
                      : 'bg-clinical-100 text-clinical-700 hover:bg-clinical-200'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-dermis-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-clinical-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-clinical-900 mb-2">No products found</h3>
            <p className="text-clinical-600">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-clinical-50 relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-clinical-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium text-clinical-700">
                      {product.type}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {product.brand && (
                      <div className="text-xs font-semibold text-dermis-600 uppercase tracking-wide mb-1">
                        {product.brand}
                      </div>
                    )}
                    <h3 className="font-semibold text-clinical-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {product.usage_instructions && (
                      <p className="text-xs text-clinical-600 mb-3 line-clamp-2">
                        {product.usage_instructions}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-clinical-100">
                      {product.price ? (
                        <div className="flex items-center gap-1 text-lg font-bold text-clinical-900">
                          <DollarSign className="w-4 h-4" />
                          {product.price.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-sm text-clinical-500">Price varies</span>
                      )}

                      <span className="text-xs px-2 py-1 bg-clinical-100 text-clinical-700 rounded">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 p-4 bg-dermis-50 rounded-lg border border-dermis-200">
              <div className="flex items-center gap-2 text-sm text-dermis-800">
                <Sparkles className="w-4 h-4" />
                <span>
                  Showing {filteredProducts.length} of {products.length} products
                </span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
