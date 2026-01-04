'use client'

import { useState } from 'react'
import { Plus, X, Search, Check } from 'lucide-react'

interface Code {
  code: string
  description: string
  units?: number
}

interface CodeSelectionProps {
  title: string
  codeType: 'icd10' | 'cpt'
  suggestedCodes: Code[]
  selectedCodes: Code[]
  onSelectionChange: (codes: Code[]) => void
}

export default function CodeSelection({
  title,
  codeType,
  suggestedCodes,
  selectedCodes,
  onSelectionChange,
}: CodeSelectionProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Code[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const isSelected = (code: string) => {
    return selectedCodes.some((c) => c.code === code)
  }

  const toggleCode = (code: Code) => {
    if (isSelected(code.code)) {
      onSelectionChange(selectedCodes.filter((c) => c.code !== code.code))
    } else {
      onSelectionChange([...selectedCodes, code])
    }
  }

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/codes/search?type=${codeType}&query=${encodeURIComponent(searchTerm)}`
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Error searching codes:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const addCustomCode = (code: Code) => {
    if (!isSelected(code.code)) {
      onSelectionChange([...selectedCodes, code])
    }
    setSearchTerm('')
    setSearchResults([])
    setShowSearch(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-clinical-700 uppercase tracking-wide">
          {title}
        </h4>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="text-xs text-dermis-600 hover:text-dermis-700 font-medium flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Custom Code
        </button>
      </div>

      {/* Search Interface */}
      {showSearch && (
        <div className="bg-clinical-50 border border-clinical-200 rounded-lg p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Search ${codeType.toUpperCase()} codes...`}
                className="w-full pl-10 pr-3 py-2 border border-clinical-300 rounded-lg text-sm focus:ring-2 focus:ring-dermis-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || searchTerm.length < 2}
              className="px-4 py-2 bg-dermis-600 text-white rounded-lg text-sm font-medium hover:bg-dermis-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => {
                setShowSearch(false)
                setSearchTerm('')
                setSearchResults([])
              }}
              className="p-2 text-clinical-500 hover:text-clinical-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((code) => (
                <button
                  key={code.code}
                  onClick={() => addCustomCode(code)}
                  className="w-full flex items-start gap-3 p-3 bg-white border border-clinical-200 rounded-lg hover:border-dermis-300 hover:bg-dermis-50 text-left transition-colors"
                >
                  <code className="px-2 py-0.5 bg-clinical-100 text-clinical-700 rounded font-mono text-xs font-medium flex-shrink-0 mt-0.5">
                    {code.code}
                  </code>
                  <div className="flex-1 text-sm text-clinical-700">
                    {code.description}
                  </div>
                  {!isSelected(code.code) && (
                    <Plus className="w-4 h-4 text-dermis-600 flex-shrink-0 mt-0.5" />
                  )}
                  {isSelected(code.code) && (
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="text-sm text-clinical-500 text-center py-4">
              No codes found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* Suggested Codes with Checkboxes */}
      {suggestedCodes.length > 0 && (
        <div>
          <div className="text-xs text-clinical-500 mb-2">AI Suggested (select all that apply):</div>
          <div className="space-y-2">
            {suggestedCodes.map((code) => (
              <label
                key={code.code}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected(code.code)
                    ? 'border-dermis-300 bg-dermis-50'
                    : 'border-clinical-200 bg-white hover:border-clinical-300 hover:bg-clinical-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected(code.code)}
                  onChange={() => toggleCode(code)}
                  className="mt-1 w-4 h-4 text-dermis-600 border-clinical-300 rounded focus:ring-dermis-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <code
                      className={`px-2 py-0.5 rounded font-mono text-xs font-medium flex-shrink-0 ${
                        codeType === 'icd10'
                          ? 'bg-dermis-100 text-dermis-700'
                          : 'bg-accent-sky/10 text-accent-sky'
                      }`}
                    >
                      {code.code}
                    </code>
                    <span className="text-sm text-clinical-700">{code.description}</span>
                    {code.units && code.units > 1 && (
                      <span className="text-xs text-clinical-500">×{code.units}</span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Selected Codes Summary */}
      {selectedCodes.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-green-700 mb-2">
            Selected ({selectedCodes.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCodes.map((code) => (
              <div
                key={code.code}
                className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-green-300 rounded-full text-sm"
              >
                <code className="font-mono font-medium text-green-700">{code.code}</code>
                <button
                  onClick={() => toggleCode(code)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCodes.length === 0 && suggestedCodes.length === 0 && (
        <div className="text-sm text-clinical-500 text-center py-4 border border-dashed border-clinical-200 rounded-lg">
          No codes {suggestedCodes.length === 0 ? 'suggested' : 'selected'}. Click "+ Add Custom Code" to search.
        </div>
      )}
    </div>
  )
}
