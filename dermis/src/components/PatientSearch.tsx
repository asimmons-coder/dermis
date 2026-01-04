'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  mrn: string
  dateOfBirth: string
}

export default function PatientSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Search patients
  useEffect(() => {
    const searchPatients = async () => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.patients || [])
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchPatients, 300)
    return () => clearTimeout(debounce)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelectPatient(results[selectedIndex])
    }
  }

  const handleSelectPatient = (patient: SearchResult) => {
    router.push(`/patients/${patient.id}`)
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      {/* Search Button/Input */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-clinical-600 bg-clinical-50 rounded-lg hover:bg-clinical-100 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search patients...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-white border border-clinical-200 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Search Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Search Dialog */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl border border-clinical-200 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-clinical-100">
                <Search className="w-5 h-5 text-clinical-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by name, MRN, or date of birth..."
                  className="flex-1 text-sm outline-none"
                  autoFocus
                />
                {isSearching && <Loader2 className="w-4 h-4 animate-spin text-clinical-400" />}
              </div>

              {/* Results */}
              <div ref={dropdownRef} className="max-h-96 overflow-y-auto">
                {query.trim().length < 2 ? (
                  <div className="px-4 py-8 text-center text-sm text-clinical-500">
                    Type at least 2 characters to search
                  </div>
                ) : results.length === 0 && !isSearching ? (
                  <div className="px-4 py-8 text-center text-sm text-clinical-500">
                    No patients found
                  </div>
                ) : (
                  <div className="py-2">
                    {results.map((patient, index) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-clinical-50 transition-colors text-left ${
                          index === selectedIndex ? 'bg-clinical-50' : ''
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-dermis-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-dermis-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-clinical-800">{patient.name}</div>
                          <div className="text-sm text-clinical-500 flex items-center gap-3">
                            <span>MRN: {patient.mrn}</span>
                            <span>•</span>
                            <span>DOB: {formatDate(patient.dateOfBirth)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-clinical-100 bg-clinical-50 text-xs text-clinical-500 flex items-center gap-4">
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
                <span>ESC to close</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
