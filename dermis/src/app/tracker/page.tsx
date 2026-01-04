'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Stethoscope,
  User,
  Clock,
  RefreshCw,
  CheckCircle,
  DoorOpen,
  PlayCircle,
  FileCheck,
  ChevronDown,
  Search,
  Command
} from 'lucide-react'

interface TrackerEncounter {
  id: string
  type: string
  chiefComplaint: string
  status: string
  scheduledAt: string
  patient: {
    id: string
    name: string
    mrn: string
  } | null
  provider: {
    id: string
    firstName: string
    lastName: string
    color: string
  } | null
}

interface Provider {
  id: string
  name: string
  firstName: string
  color: string
}

const PROVIDER_COLORS = {
  'Karlee': 'blue',
  'Fred': 'green',
  'Taylor': 'purple',
}

const STATUS_COLUMNS = [
  { key: 'scheduled', label: 'Scheduled', icon: Clock, color: 'clinical' },
  { key: 'checked_in', label: 'Checked In', icon: CheckCircle, color: 'blue' },
  { key: 'roomed', label: 'Roomed', icon: DoorOpen, color: 'purple' },
  { key: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'amber' },
  { key: 'completed', label: 'Completed', icon: FileCheck, color: 'green' },
]

export default function TrackerPage() {
  const router = useRouter()
  const [encounters, setEncounters] = useState<TrackerEncounter[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedEncounter, setExpandedEncounter] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const triggerGlobalSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }

  useEffect(() => {
    loadProviders()
    loadSchedule('all')
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSchedule(selectedProvider, true)
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedProvider])

  const loadProviders = async () => {
    try {
      const practiceId = '00000000-0000-0000-0000-000000000001'
      const response = await fetch(`/api/providers?practiceId=${practiceId}`)
      if (response.ok) {
        const data = await response.json()
        const providersWithColors = data.providers?.map((p: any) => ({
          ...p,
          color: PROVIDER_COLORS[p.firstName as keyof typeof PROVIDER_COLORS] || 'gray'
        })) || []
        setProviders(providersWithColors)
      }
    } catch (err) {
      console.error('Failed to load providers:', err)
    }
  }

  const loadSchedule = async (providerId: string, silent = false) => {
    if (!silent) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const practiceId = '00000000-0000-0000-0000-000000000001'
      const url = providerId === 'all'
        ? `/api/schedule?practiceId=${practiceId}`
        : `/api/schedule?practiceId=${practiceId}&providerId=${providerId}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const encountersWithColors = data.encounters?.map((e: any) => ({
          ...e,
          provider: e.provider ? {
            ...e.provider,
            color: PROVIDER_COLORS[e.provider.firstName as keyof typeof PROVIDER_COLORS] || 'gray'
          } : null
        })) || []
        setEncounters(encountersWithColors)
        setLastRefresh(new Date())
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId)
    loadSchedule(providerId)
  }

  const handleRefresh = () => {
    loadSchedule(selectedProvider, true)
  }

  const handleUpdateStatus = async (encounterId: string, newStatus: string) => {
    try {
      setUpdatingStatus(encounterId)

      const response = await fetch(`/api/encounters/${encounterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      setEncounters(encounters.map(e =>
        e.id === encounterId ? { ...e, status: newStatus } : e
      ))

      setExpandedEncounter(null)
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleStartVisit = async (encounterId: string, patientId: string) => {
    try {
      setUpdatingStatus(encounterId)

      const response = await fetch(`/api/encounters/${encounterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start visit')
      }

      router.push(`/encounters/${encounterId}`)
    } catch (err) {
      console.error('Error starting visit:', err)
      alert('Failed to start visit. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const toggleExpanded = (encounterId: string) => {
    setExpandedEncounter(expandedEncounter === encounterId ? null : encounterId)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatEncounterType = (type: string) => {
    const types: Record<string, string> = {
      office_visit: 'Office Visit',
      procedure: 'Procedure',
      cosmetic_consult: 'Cosmetic',
      follow_up: 'Follow-up',
    }
    return types[type] || type
  }

  const getProviderColorClasses = (color: string) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      gray: 'bg-clinical-400',
    }
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
  }

  const getColumnCount = (status: string) => {
    return encounters.filter(e => e.status === status).length
  }

  const getEncountersByStatus = (status: string) => {
    return encounters.filter(e => e.status === status)
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
            <Link href="/tracker" className="text-dermis-600 font-medium text-sm border-b-2 border-dermis-500">
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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-clinical-900">Patient Tracker</h1>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-clinical-400 hover:text-clinical-600 hover:bg-clinical-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-sm text-clinical-500">
              Last updated: {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              <span className="ml-2">• Auto-refreshes every 30s</span>
            </p>
          </div>
        </div>

        {/* Provider Filter */}
        <div className="mb-6 border-b border-clinical-200">
          <div className="flex gap-1">
            <button
              onClick={() => handleProviderChange('all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedProvider === 'all'
                  ? 'border-dermis-500 text-dermis-600'
                  : 'border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300'
              }`}
            >
              All Providers
            </button>
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderChange(provider.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  selectedProvider === provider.id
                    ? `border-${provider.color}-500 text-${provider.color}-600`
                    : 'border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300'
                }`}
              >
                Dr. {provider.firstName}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-dermis-200 border-t-dermis-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4 min-h-[500px]">
            {STATUS_COLUMNS.map((column) => {
              const Icon = column.icon
              const columnEncounters = getEncountersByStatus(column.key)
              const count = columnEncounters.length

              return (
                <div key={column.key} className="flex flex-col">
                  {/* Column Header */}
                  <div className={`bg-${column.color}-50 border border-${column.color}-200 rounded-t-lg px-4 py-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 text-${column.color}-600`} />
                        <h3 className={`text-sm font-semibold text-${column.color}-700`}>
                          {column.label}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium bg-${column.color}-100 text-${column.color}-700 rounded-full`}>
                        {count}
                      </span>
                    </div>
                  </div>

                  {/* Column Body */}
                  <div className="flex-1 bg-clinical-50/30 border-x border-b border-clinical-200 rounded-b-lg p-2 space-y-2 overflow-y-auto">
                    {columnEncounters.length === 0 ? (
                      <div className="text-center py-8 text-clinical-400 text-sm">
                        No patients
                      </div>
                    ) : (
                      columnEncounters.map((encounter) => {
                        const isExpanded = expandedEncounter === encounter.id
                        const isUpdating = updatingStatus === encounter.id

                        return (
                          <div key={encounter.id} className="bg-white rounded-lg shadow-sm border border-clinical-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div
                              onClick={() => toggleExpanded(encounter.id)}
                              className="p-3 cursor-pointer"
                            >
                              {/* Time */}
                              <div className="flex items-center gap-1.5 text-xs text-clinical-500 mb-2">
                                <Clock className="w-3 h-3" />
                                {formatTime(encounter.scheduledAt)}
                              </div>

                              {/* Patient Name */}
                              <div className="font-medium text-clinical-800 mb-1">
                                {encounter.patient?.name || 'No patient'}
                              </div>

                              {/* Visit Type */}
                              <div className="text-xs text-clinical-600 mb-2">
                                {formatEncounterType(encounter.type)}
                              </div>

                              {/* Provider Badge */}
                              {encounter.provider && (
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${getProviderColorClasses(encounter.provider.color)}`} />
                                  <span className="text-xs text-clinical-600">
                                    Dr. {encounter.provider.firstName}
                                  </span>
                                </div>
                              )}

                              {/* Expand Indicator */}
                              <div className="flex justify-center mt-2">
                                <ChevronDown
                                  className={`w-4 h-4 text-clinical-400 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {isExpanded && encounter.patient && (
                              <div className="px-3 pb-3 space-y-2">
                                {/* Check In */}
                                {encounter.status === 'scheduled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(encounter.id, 'checked_in')
                                    }}
                                    disabled={isUpdating}
                                    className="w-full btn-secondary text-xs py-1.5"
                                  >
                                    {isUpdating ? 'Updating...' : 'Check In'}
                                  </button>
                                )}

                                {/* Room Patient */}
                                {encounter.status === 'checked_in' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(encounter.id, 'roomed')
                                    }}
                                    disabled={isUpdating}
                                    className="w-full btn-secondary text-xs py-1.5"
                                  >
                                    {isUpdating ? 'Updating...' : 'Room Patient'}
                                  </button>
                                )}

                                {/* Start Visit */}
                                {(encounter.status === 'roomed' || encounter.status === 'checked_in') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartVisit(encounter.id, encounter.patient!.id)
                                    }}
                                    className="w-full btn-primary text-xs py-1.5"
                                  >
                                    Start Visit
                                  </button>
                                )}

                                {/* View Chart */}
                                <Link
                                  href={`/patients/${encounter.patient.id}`}
                                  className="block w-full text-center btn-secondary text-xs py-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View Chart
                                </Link>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
