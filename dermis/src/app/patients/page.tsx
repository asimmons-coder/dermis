'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  User,
  Calendar,
  Loader2,
  Plus,
  Filter,
  ChevronDown
} from 'lucide-react'
import AppHeader from '@/components/AppHeader'

interface Patient {
  id: string
  name: string
  mrn: string
  dateOfBirth: string
  lastVisit: string | null
  isActive: boolean
  lastProvider: {
    id: string
    name: string
    firstName: string
  } | null
  nextAppointment: string | null
  nextProvider: {
    id: string
    name: string
    firstName: string
  } | null
}

type SortField = 'name' | 'dob' | 'lastVisit' | 'nextAppointment'
type SortDirection = 'asc' | 'desc'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    // Filter and sort patients
    let filtered = patients.filter(p => {
      // Status filter
      if (statusFilter === 'active' && !p.isActive) return false
      if (statusFilter === 'inactive' && p.isActive) return false

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(query) ||
          p.mrn.toLowerCase().includes(query) ||
          p.dateOfBirth.includes(query)
        )
      }

      return true
    })

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'dob':
          aVal = new Date(a.dateOfBirth).getTime()
          bVal = new Date(b.dateOfBirth).getTime()
          break
        case 'lastVisit':
          aVal = a.lastVisit ? new Date(a.lastVisit).getTime() : 0
          bVal = b.lastVisit ? new Date(b.lastVisit).getTime() : 0
          break
        case 'nextAppointment':
          aVal = a.nextAppointment ? new Date(a.nextAppointment).getTime() : 0
          bVal = b.nextAppointment ? new Date(b.nextAppointment).getTime() : 0
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredPatients(filtered)
  }, [searchQuery, patients, statusFilter, sortField, sortDirection])

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/patients/list')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
        setFilteredPatients(data.patients || [])
      }
    } catch (err) {
      console.error('Failed to load patients:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header with New Patient Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-clinical-900">Patients</h2>
            <p className="text-sm text-clinical-600 mt-1">
              {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
            </p>
          </div>
          <Link href="/patients/new" className="btn-primary text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">New Patient</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="card p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
            <input
              type="text"
              placeholder="Search by name, MRN, or date of birth..."
              className="input pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-clinical-500" />
              <span className="text-sm font-medium text-clinical-700">Status:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-dermis-500 text-white'
                      : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    statusFilter === 'inactive'
                      ? 'bg-dermis-500 text-white'
                      : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                  }`}
                >
                  Inactive
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-dermis-500 text-white'
                      : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-clinical-200" />

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-clinical-700">Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="input text-sm py-1 px-2"
              >
                <option value="name">Name</option>
                <option value="dob">Date of Birth</option>
                <option value="lastVisit">Last Visit</option>
                <option value="nextAppointment">Next Appointment</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="btn-secondary py-1 px-2 text-xs"
              >
                {sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}
              </button>
            </div>

            <div className="ml-auto text-sm text-clinical-600">
              <span className="font-medium">{filteredPatients.length}</span> of{' '}
              <span className="font-medium">{patients.length}</span> patients
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-dermis-500 animate-spin" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
                <p className="text-clinical-500">
                  {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-clinical-50 border-b border-clinical-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-clinical-600 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-clinical-600 uppercase tracking-wider">
                      MRN
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-clinical-600 uppercase tracking-wider">
                      DOB / Age
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-clinical-600 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-clinical-600 uppercase tracking-wider">
                      Next Appt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinical-100">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-clinical-50 cursor-pointer transition-colors"
                      onClick={() => (window.location.href = `/patients/${patient.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-dermis-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-dermis-600" />
                          </div>
                          <div>
                            <div className="font-medium text-clinical-800">{patient.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm text-clinical-600 bg-clinical-100 px-2 py-0.5 rounded">
                          {patient.mrn}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-clinical-700">
                          {formatDate(patient.dateOfBirth)}
                        </div>
                        <div className="text-xs text-clinical-500">
                          Age {calculateAge(patient.dateOfBirth)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-clinical-600">
                          <Calendar className="w-4 h-4 text-clinical-400" />
                          {formatDate(patient.lastVisit)}
                        </div>
                        {patient.lastProvider && (
                          <div className="text-xs text-clinical-500 mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {patient.lastProvider.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-clinical-600">
                          {patient.nextAppointment ? formatDate(patient.nextAppointment) : '—'}
                        </div>
                        {patient.nextProvider && (
                          <div className="text-xs text-clinical-500 mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {patient.nextProvider.name}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
