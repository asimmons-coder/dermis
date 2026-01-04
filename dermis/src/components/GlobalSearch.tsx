'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, X, Loader2, Command } from 'lucide-react'

interface Patient {
  id: string
  name: string
  mrn: string
  dateOfBirth: string
}

export default function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
        setResults([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Search patients
  useEffect(() => {
    const searchPatients = async () => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.patients || [])
          setSelectedIndex(0)
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchPatients, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        selectPatient(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const selectPatient = (patient: Patient) => {
    router.push(`/patients/${patient.id}`)
    setIsOpen(false)
    setSearchQuery('')
    setResults([])
  }

  const handleClose = () => {
    setIsOpen(false)
    setSearchQuery('')
    setResults([])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20 px-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-clinical-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
            <input
              ref={inputRef}
              type="text"
              className="w-full pl-10 pr-10 py-3 text-lg border-0 focus:ring-0 focus:outline-none"
              placeholder="Search patients by name, MRN, or DOB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-clinical-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-clinical-600" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-dermis-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-clinical-100">
              {results.map((patient, index) => (
                <button
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  className={`w-full px-4 py-4 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-dermis-50 border-l-4 border-dermis-500'
                      : 'hover:bg-clinical-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-dermis-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-dermis-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-clinical-800">{patient.name}</div>
                      <div className="text-sm text-clinical-500 mt-0.5">
                        DOB: {formatDate(patient.dateOfBirth)} • Age {calculateAge(patient.dateOfBirth)}
                      </div>
                    </div>
                    <code className="text-xs text-clinical-600 bg-clinical-100 px-2 py-1 rounded flex-shrink-0">
                      {patient.mrn}
                    </code>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="py-12 text-center">
              <User className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
              <p className="text-clinical-600">No patients found</p>
              <p className="text-sm text-clinical-500 mt-1">
                Try searching by name, MRN, or date of birth
              </p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Search className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
              <p className="text-clinical-600">Start typing to search patients</p>
              <p className="text-sm text-clinical-500 mt-1">
                Search by name, MRN, or date of birth
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-clinical-50 border-t border-clinical-100 flex items-center justify-between text-xs text-clinical-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white border border-clinical-200 rounded text-clinical-600">↑</kbd>
              <kbd className="px-2 py-1 bg-white border border-clinical-200 rounded text-clinical-600">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white border border-clinical-200 rounded text-clinical-600">Enter</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white border border-clinical-200 rounded text-clinical-600">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Command className="w-3 h-3" />
            <span>+K to open</span>
          </div>
        </div>
      </div>
    </div>
  )
}
