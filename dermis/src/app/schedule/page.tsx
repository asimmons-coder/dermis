'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Loader2,
  Plus,
  CheckCircle,
  DoorOpen,
  PlayCircle,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  X,
  DollarSign
} from 'lucide-react'
import AppointmentModal from '@/components/AppointmentModal'
import AppHeader from '@/components/AppHeader'
import { useRouter } from 'next/navigation'

interface ScheduleEncounter {
  id: string
  type: string
  chiefComplaint: string
  status: string
  scheduledAt: string
  completedAt?: string
  copay?: number
  patient: {
    id: string
    name: string
    mrn: string
    dateOfBirth: string
  } | null
  provider: {
    id: string
    name: string
    fullName: string
    firstName: string
    lastName: string
  } | null
}

interface Provider {
  id: string
  name: string
  fullName: string
  firstName: string
  lastName: string
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
  { key: 'completed', label: 'Completed', icon: FileText, color: 'green' },
]

type ViewMode = 'today' | 'week' | 'month' | 'tracker' | 'check-in'
type CalendarView = 'today' | 'week' | 'month'

export default function SchedulePage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('today')
  const [calendarView, setCalendarView] = useState<CalendarView>('today')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [encounters, setEncounters] = useState<ScheduleEncounter[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string; providerId?: string } | null>(null)
  const [selectedEncounter, setSelectedEncounter] = useState<ScheduleEncounter | null>(null)
  const [showEncounterActions, setShowEncounterActions] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    loadProviders()
    loadSchedule('all')
  }, [currentDate])

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

  const loadSchedule = async (providerId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const practiceId = '00000000-0000-0000-0000-000000000001'

      // Format current date for API
      const dateParam = currentDate.toISOString().split('T')[0] // YYYY-MM-DD format

      const url = providerId === 'all'
        ? `/api/schedule?practiceId=${practiceId}&date=${dateParam}`
        : `/api/schedule?practiceId=${practiceId}&providerId=${providerId}&date=${dateParam}`

      console.log('[SCHEDULE PAGE] Fetching appointments for date:', dateParam)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setEncounters(data.encounters || [])
      } else {
        setError('Failed to load schedule')
      }
    } catch (err) {
      setError('Failed to load schedule')
      console.error('Failed to load schedule:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId)
    loadSchedule(providerId)
  }

  const handleAppointmentCreated = () => {
    loadSchedule(selectedProvider)
  }

  const handleEncounterClick = (encounter: ScheduleEncounter) => {
    setSelectedEncounter(encounter)
    setShowEncounterActions(true)
  }

  const handleEncounterAction = (action: 'check-in' | 'room' | 'start' | 'view') => {
    if (!selectedEncounter) return

    if (action === 'check-in') {
      updateEncounterStatus(selectedEncounter.id, 'checked_in')
      setShowEncounterActions(false)
    } else if (action === 'room') {
      updateEncounterStatus(selectedEncounter.id, 'roomed')
      setShowEncounterActions(false)
    } else if (action === 'start') {
      updateEncounterStatus(selectedEncounter.id, 'in_progress')
      setShowEncounterActions(false)
      router.push(`/encounters/${selectedEncounter.id}`)
    } else if (action === 'view') {
      router.push(`/encounters/${selectedEncounter.id}`)
      setShowEncounterActions(false)
    }
  }

  const updateEncounterStatus = async (encounterId: string, newStatus: string) => {
    setUpdatingStatus(encounterId)
    try {
      const response = await fetch(`/api/encounters/${encounterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        loadSchedule(selectedProvider)
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const nextDay = () => {
    const newDate = new Date(currentDate)
    if (calendarView === 'today') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const previousDay = () => {
    const newDate = new Date(currentDate)
    if (calendarView === 'today') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const getWeekDays = (date: Date) => {
    const days: Date[] = []
    const curr = new Date(date)
    const first = curr.getDate() - curr.getDay() // First day of week (Sunday)

    for (let i = 0; i < 7; i++) {
      const day = new Date(curr)
      day.setDate(first + i)
      days.push(day)
    }

    return days
  }

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay()) // Start from Sunday

    const days: Date[] = []
    let current = new Date(startDate)

    // Get 6 weeks to fill calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const getEncountersForDate = (date: Date) => {
    return encounters.filter(e => {
      const encounterDate = new Date(e.scheduledAt)
      return isSameDay(encounterDate, date)
    })
  }

  const formatDate = (date: Date) => {
    if (calendarView === 'month') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    } else if (calendarView === 'week') {
      const weekDays = getWeekDays(date)
      const start = weekDays[0]
      const end = weekDays[6]
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-clinical-100 text-clinical-700 border-clinical-300',
      checked_in: 'bg-blue-100 text-blue-700 border-blue-300',
      roomed: 'bg-purple-100 text-purple-700 border-purple-300',
      in_progress: 'bg-amber-100 text-amber-700 border-amber-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
    }
    return colors[status] || colors.scheduled
  }

  const getProviderColor = (firstName: string) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      gray: 'bg-clinical-100 text-clinical-700 border-clinical-300',
    }
    const color = PROVIDER_COLORS[firstName as keyof typeof PROVIDER_COLORS] || 'gray'
    return colorClasses[color as keyof typeof colorClasses]
  }

  // Filter encounters by provider for Today view
  const getEncountersByProvider = () => {
    const grouped: Record<string, ScheduleEncounter[]> = {}

    providers.forEach(p => {
      grouped[p.id] = encounters.filter(e => e.provider?.id === p.id)
    })

    return grouped
  }

  // Group encounters by status for Tracker view
  const getEncountersByStatus = () => {
    const grouped: Record<string, ScheduleEncounter[]> = {}

    STATUS_COLUMNS.forEach(col => {
      grouped[col.key] = encounters.filter(e => e.status === col.key)
    })

    return grouped
  }

  // Render Today View (3-column provider layout)
  const renderTodayView = () => {
    const encountersByProvider = getEncountersByProvider()

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(provider => (
          <div key={provider.id} className="flex flex-col">
            {/* Provider Header */}
            <div className={`p-4 rounded-t-lg border-2 ${getProviderColor(provider.firstName)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{provider.fullName}</h3>
                  <p className="text-xs opacity-75">
                    {encountersByProvider[provider.id]?.length || 0} {encountersByProvider[provider.id]?.length === 1 ? 'appointment' : 'appointments'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSlot({
                      date: currentDate.toISOString().split('T')[0],
                      time: '09:00',
                      providerId: provider.id
                    })
                    setShowAppointmentModal(true)
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Appointments List */}
            <div className="border-x border-b border-clinical-200 rounded-b-lg bg-white min-h-[400px]">
              {encountersByProvider[provider.id]?.length === 0 ? (
                <div className="p-8 text-center text-clinical-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No appointments</p>
                </div>
              ) : (
                <div className="divide-y divide-clinical-100">
                  {encountersByProvider[provider.id]?.map(encounter => (
                    <div
                      key={encounter.id}
                      onClick={() => handleEncounterClick(encounter)}
                      className="p-3 hover:bg-clinical-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-sm">{encounter.patient?.name}</div>
                        <div className="text-xs text-clinical-600">{formatTime(encounter.scheduledAt)}</div>
                      </div>
                      <div className="text-xs text-clinical-600 mb-2">{encounter.chiefComplaint}</div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(encounter.status)}`}>
                        {encounter.status.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Render Tracker View (Kanban)
  const renderTrackerView = () => {
    const encountersByStatus = getEncountersByStatus()

    return (
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="grid grid-cols-5 gap-3 sm:gap-4 min-w-[900px] sm:min-w-0">
        {STATUS_COLUMNS.map(column => {
          const Icon = column.icon
          const columnEncounters = encountersByStatus[column.key] || []

          return (
            <div key={column.key} className="flex flex-col">
              <div className="p-3 bg-clinical-100 rounded-t-lg border-b-2 border-clinical-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-clinical-600" />
                    <span className="font-semibold text-sm text-clinical-900">{column.label}</span>
                  </div>
                  <span className="text-xs font-bold text-clinical-600 bg-white px-2 py-1 rounded">
                    {columnEncounters.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-clinical-50 p-2 rounded-b-lg border-x border-b border-clinical-200 min-h-[500px] space-y-2">
                {columnEncounters.map(encounter => (
                  <div
                    key={encounter.id}
                    onClick={() => handleEncounterClick(encounter)}
                    className="p-3 bg-white rounded-lg border border-clinical-200 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="font-medium text-sm mb-1">{encounter.patient?.name}</div>
                    <div className="text-xs text-clinical-600 mb-2">{encounter.chiefComplaint}</div>
                    <div className={`inline-block px-2 py-1 rounded text-xs ${getProviderColor(encounter.provider?.firstName || '')}`}>
                      Dr. {encounter.provider?.firstName}
                    </div>
                    <div className="text-xs text-clinical-500 mt-2">
                      {formatTime(encounter.scheduledAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    )
  }

  // Render Check-In View
  const renderCheckInView = () => {
    const checkedInEncounters = encounters.filter(e => e.status === 'scheduled')

    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-clinical-900 mb-4">Today's Appointments - Ready for Check-In</h3>

          {checkedInEncounters.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-clinical-300 mx-auto mb-4" />
              <p className="text-clinical-600">No appointments waiting for check-in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkedInEncounters.map(encounter => (
                <div key={encounter.id} className="flex items-center justify-between p-4 border border-clinical-200 rounded-lg hover:bg-clinical-50 transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-clinical-900">{encounter.patient?.name}</div>
                    <div className="text-sm text-clinical-600">{formatTime(encounter.scheduledAt)} - {encounter.chiefComplaint}</div>
                    <div className="text-xs text-clinical-500 mt-1">Dr. {encounter.provider?.firstName}</div>
                  </div>
                  <button
                    onClick={() => updateEncounterStatus(encounter.id, 'checked_in')}
                    disabled={updatingStatus === encounter.id}
                    className="btn-primary text-sm"
                  >
                    {updatingStatus === encounter.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Check In
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render Week View
  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate)

    return (
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[700px] sm:min-w-0">
          {/* Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <div key={day} className="text-center font-semibold text-sm text-clinical-700 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Provider Rows */}
          <div className="space-y-4">
            {providers.map(provider => (
              <div key={provider.id} className="card">
                {/* Provider Header */}
                <div className={`p-3 border-b-2 ${getProviderColor(provider.firstName)}`}>
                  <h3 className="font-semibold text-sm">{provider.fullName}</h3>
                </div>

                {/* Week Days Grid */}
                <div className="grid grid-cols-7 gap-px bg-clinical-200">
                {weekDays.map((day, idx) => {
                  const dayEncounters = getEncountersForDate(day).filter(
                    e => e.provider?.id === provider.id
                  )

                  return (
                    <div
                      key={idx}
                      className={`min-h-[120px] bg-white p-2 ${
                        isToday(day) ? 'bg-dermis-50' : ''
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-2 ${
                        isToday(day) ? 'text-dermis-600' : 'text-clinical-600'
                      }`}>
                        {day.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayEncounters.map(encounter => (
                          <div
                            key={encounter.id}
                            onClick={() => handleEncounterClick(encounter)}
                            className="text-xs p-1.5 bg-clinical-100 hover:bg-clinical-200 rounded cursor-pointer"
                          >
                            <div className="font-medium truncate">{formatTime(encounter.scheduledAt)}</div>
                            <div className="truncate text-clinical-600">{encounter.patient?.name}</div>
                          </div>
                        ))}
                      </div>

                      {dayEncounters.length === 0 && (
                        <button
                          onClick={() => {
                            setSelectedSlot({
                              date: day.toISOString().split('T')[0],
                              time: '09:00',
                              providerId: provider.id
                            })
                            setShowAppointmentModal(true)
                          }}
                          className="w-full py-1 text-xs text-clinical-400 hover:text-clinical-600 transition-colors"
                        >
                          +
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    )
  }

  // Render Month View
  const renderMonthView = () => {
    const monthDays = getMonthDays(currentDate)
    const currentMonth = currentDate.getMonth()

    return (
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[600px] sm:min-w-0">
          <div className="card">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-px bg-clinical-200 border-b-2 border-clinical-300">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-clinical-100 text-center font-semibold text-xs sm:text-sm text-clinical-700 py-2 sm:py-3">
                  {day}
                </div>
              ))}
            </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-clinical-200">
          {monthDays.map((day, idx) => {
            const dayEncounters = getEncountersForDate(day)
            const isCurrentMonth = day.getMonth() === currentMonth

            return (
              <div
                key={idx}
                className={`min-h-[100px] bg-white p-2 ${
                  !isCurrentMonth ? 'bg-clinical-50/50 text-clinical-400' : ''
                } ${isToday(day) ? 'bg-dermis-50' : ''}`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isToday(day) ? 'text-dermis-600' : ''
                }`}>
                  {day.getDate()}
                </div>

                <div className="space-y-1">
                  {dayEncounters.slice(0, 3).map(encounter => (
                    <div
                      key={encounter.id}
                      onClick={() => handleEncounterClick(encounter)}
                      className={`text-xs p-1 rounded cursor-pointer ${getProviderColor(encounter.provider?.firstName || '')} hover:opacity-80`}
                    >
                      <div className="font-medium truncate">{formatTime(encounter.scheduledAt)}</div>
                      <div className="truncate">{encounter.patient?.name}</div>
                    </div>
                  ))}

                  {dayEncounters.length > 3 && (
                    <div className="text-xs text-clinical-500 font-medium">
                      +{dayEncounters.length - 3} more
                    </div>
                  )}
                </div>

                {dayEncounters.length === 0 && isCurrentMonth && (
                  <button
                    onClick={() => {
                      setSelectedSlot({
                        date: day.toISOString().split('T')[0],
                        time: '09:00'
                      })
                      setShowAppointmentModal(true)
                    }}
                    className="w-full py-1 text-xs text-clinical-400 hover:text-clinical-600 transition-colors"
                  >
                    +
                  </button>
                )}
              </div>
            )
          })}
          </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Header with View Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-clinical-900">Schedule</h1>
              <p className="text-clinical-600 mt-1 text-sm sm:text-base">{formatDate(currentDate)}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={goToToday}
                className="btn-secondary text-sm"
              >
                Today
              </button>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={previousDay}
                  className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextDay}
                  className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => loadSchedule(selectedProvider)}
                className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedSlot({
                    date: currentDate.toISOString().split('T')[0],
                    time: '09:00'
                  })
                  setShowAppointmentModal(true)
                }}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">New Appointment</span>
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center justify-between border-b border-clinical-200 overflow-x-auto scrollbar-thin">
            <div className="flex items-center gap-2 min-w-max">
              {/* Calendar View Selector (when in calendar mode) */}
              {(viewMode === 'today' || viewMode === 'week' || viewMode === 'month') && (
                <div className="flex items-center gap-1 mr-4 bg-clinical-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setViewMode('today')
                      setCalendarView('today')
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      calendarView === 'today'
                        ? 'bg-white text-dermis-600 shadow-sm'
                        : 'text-clinical-600 hover:text-clinical-800'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('week')
                      setCalendarView('week')
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      calendarView === 'week'
                        ? 'bg-white text-dermis-600 shadow-sm'
                        : 'text-clinical-600 hover:text-clinical-800'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('month')
                      setCalendarView('month')
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      calendarView === 'month'
                        ? 'bg-white text-dermis-600 shadow-sm'
                        : 'text-clinical-600 hover:text-clinical-800'
                    }`}
                  >
                    Month
                  </button>
                </div>
              )}

              {/* Main View Tabs */}
              <button
                onClick={() => {
                  setViewMode('today')
                  setCalendarView('today')
                }}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  (viewMode === 'today' || viewMode === 'week' || viewMode === 'month')
                    ? 'border-dermis-500 text-dermis-600'
                    : 'border-transparent text-clinical-600 hover:text-clinical-800'
                }`}
              >
                <CalendarIcon className="w-4 h-4 inline mr-2" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('tracker')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  viewMode === 'tracker'
                    ? 'border-dermis-500 text-dermis-600'
                    : 'border-transparent text-clinical-600 hover:text-clinical-800'
                }`}
              >
                <ClipboardList className="w-4 h-4 inline mr-2" />
                Tracker
              </button>
              <button
                onClick={() => setViewMode('check-in')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  viewMode === 'check-in'
                    ? 'border-dermis-500 text-dermis-600'
                    : 'border-transparent text-clinical-600 hover:text-clinical-800'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Check-In
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-dermis-600" />
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-clinical-600">{error}</p>
          </div>
        ) : (
          <>
            {viewMode === 'today' && renderTodayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'tracker' && renderTrackerView()}
            {viewMode === 'check-in' && renderCheckInView()}
          </>
        )}
      </main>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false)
            setSelectedSlot(null)
          }}
          onSuccess={handleAppointmentCreated}
          defaultDate={selectedSlot?.date}
          defaultTime={selectedSlot?.time}
          defaultProvider={selectedSlot?.providerId}
        />
      )}

      {/* Encounter Actions Modal */}
      {showEncounterActions && selectedEncounter && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowEncounterActions(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-clinical-900 mb-1">
                    {selectedEncounter.patient?.name}
                  </h3>
                  <p className="text-sm text-clinical-600">
                    {formatTime(selectedEncounter.scheduledAt)} • {selectedEncounter.chiefComplaint}
                  </p>
                  <p className="text-xs text-clinical-500 mt-1">
                    Dr. {selectedEncounter.provider?.firstName}
                  </p>
                </div>
                <button
                  onClick={() => setShowEncounterActions(false)}
                  className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {selectedEncounter.status === 'scheduled' && (
                  <button
                    onClick={() => handleEncounterAction('check-in')}
                    disabled={updatingStatus === selectedEncounter.id}
                    className="w-full btn-primary text-sm justify-center"
                  >
                    {updatingStatus === selectedEncounter.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Check In Patient
                      </>
                    )}
                  </button>
                )}

                {selectedEncounter.status === 'checked_in' && (
                  <button
                    onClick={() => handleEncounterAction('room')}
                    disabled={updatingStatus === selectedEncounter.id}
                    className="w-full btn-primary text-sm justify-center"
                  >
                    {updatingStatus === selectedEncounter.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rooming...
                      </>
                    ) : (
                      <>
                        <DoorOpen className="w-4 h-4" />
                        Room Patient
                      </>
                    )}
                  </button>
                )}

                {selectedEncounter.status === 'roomed' && (
                  <button
                    onClick={() => handleEncounterAction('start')}
                    disabled={updatingStatus === selectedEncounter.id}
                    className="w-full btn-primary text-sm justify-center"
                  >
                    {updatingStatus === selectedEncounter.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Start Visit
                      </>
                    )}
                  </button>
                )}

                {selectedEncounter.status === 'completed' && (
                  <>
                    <button
                      onClick={() => handleEncounterAction('view')}
                      className="w-full btn-primary text-sm justify-center"
                    >
                      <FileText className="w-4 h-4" />
                      View Chart
                    </button>
                    <button
                      onClick={() => router.push(`/checkout/${selectedEncounter.id}`)}
                      className="w-full btn-primary text-sm justify-center bg-dermis-600 hover:bg-dermis-700"
                    >
                      <DollarSign className="w-4 h-4" />
                      Checkout
                    </button>
                  </>
                )}

                {selectedEncounter.status === 'in_progress' && (
                  <button
                    onClick={() => handleEncounterAction('view')}
                    className="w-full btn-primary text-sm justify-center"
                  >
                    <FileText className="w-4 h-4" />
                    Continue Visit
                  </button>
                )}

                <button
                  onClick={() => setShowEncounterActions(false)}
                  className="w-full btn-secondary text-sm justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
