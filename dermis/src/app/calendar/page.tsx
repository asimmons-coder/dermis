'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Search,
  Command,
  RefreshCw,
  X,
  Edit,
  XCircle,
  FileText,
  CheckCircle
} from 'lucide-react'
import AppointmentModal from '@/components/AppointmentModal'

interface CalendarAppointment {
  id: string
  patientId: string
  patientName: string
  providerId: string
  providerName: string
  providerFirstName: string
  encounterType: string
  chiefComplaint: string
  scheduledAt: string
  status: string
  duration: number
}

interface TimeSlot {
  time: string
  hour: number
  minute: number
}

interface Provider {
  id: string
  name: string
  firstName: string
  lastName: string
}

const VISIT_TYPE_COLORS = {
  'office_visit': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', label: 'Office Visit' },
  'cosmetic_consult': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', label: 'Cosmetic' },
  'procedure': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', label: 'Procedure' },
  'follow_up': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', label: 'Follow-up' },
  'skin_check': { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-700', label: 'Skin Check' },
}

type ViewMode = 'day' | 'week'

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string; providerId?: string } | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  const [showAppointmentPopover, setShowAppointmentPopover] = useState(false)

  const triggerGlobalSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }

  useEffect(() => {
    loadProviders()
    loadAppointments()
  }, [currentDate, viewMode, selectedProvider])

  const loadProviders = async () => {
    try {
      const practiceId = '00000000-0000-0000-0000-000000000001'
      const response = await fetch(`/api/providers?practiceId=${practiceId}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (err) {
      console.error('Failed to load providers:', err)
    }
  }

  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      const practiceId = '00000000-0000-0000-0000-000000000001'

      let startDate: Date, endDate: Date

      if (viewMode === 'day') {
        startDate = new Date(currentDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(currentDate)
        endDate.setHours(23, 59, 59, 999)
      } else {
        // Week view
        startDate = getWeekStart(currentDate)
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 7)
      }

      const url = selectedProvider === 'all'
        ? `/api/schedule?practiceId=${practiceId}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        : `/api/schedule?practiceId=${practiceId}&providerId=${selectedProvider}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const mapped = data.encounters?.map((e: any) => ({
          id: e.id,
          patientId: e.patient?.id,
          patientName: e.patient?.name || 'No patient',
          providerId: e.provider?.id,
          providerName: e.provider?.name,
          providerFirstName: e.provider?.firstName || '',
          encounterType: e.type,
          chiefComplaint: e.chiefComplaint,
          scheduledAt: e.scheduledAt,
          status: e.status,
          duration: 30 // default 30 minutes
        })) || []
        setAppointments(mapped)
      }
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour.toString().padStart(2, '0')
        const m = minute.toString().padStart(2, '0')
        slots.push({ time: `${h}:${m}`, hour, minute })
      }
    }
    return slots
  }

  const getAppointmentsForSlot = (providerId: string, timeSlot: TimeSlot, date: Date = currentDate): CalendarAppointment[] => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledAt)
      return (
        apt.providerId === providerId &&
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate() &&
        aptDate.getHours() === timeSlot.hour &&
        aptDate.getMinutes() === timeSlot.minute
      )
    })
  }

  const isSlotInPast = (timeSlot: TimeSlot, date: Date = currentDate): boolean => {
    const now = new Date()
    const slotDate = new Date(date)
    slotDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0)
    return slotDate < now
  }

  const handleSlotClick = (date: Date, timeSlot: TimeSlot, providerId?: string) => {
    const slotDateTime = new Date(date)
    slotDateTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0)

    setSelectedSlot({
      date: slotDateTime.toISOString().split('T')[0],
      time: timeSlot.time,
      providerId
    })
    setShowAppointmentModal(true)
  }

  const handleAppointmentClick = (apt: CalendarAppointment, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedAppointment(apt)
    setShowAppointmentPopover(true)
  }

  const handleAppointmentCreated = () => {
    loadAppointments()
  }

  const handleCheckIn = async () => {
    if (!selectedAppointment) return

    try {
      const response = await fetch(`/api/encounters/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'checked_in'
        })
      })

      if (response.ok) {
        setShowAppointmentPopover(false)
        setSelectedAppointment(null)
        loadAppointments()
      }
    } catch (err) {
      console.error('Failed to check in patient:', err)
    }
  }

  const handleEditAppointment = () => {
    if (!selectedAppointment) return

    const aptDate = new Date(selectedAppointment.scheduledAt)
    setSelectedSlot({
      date: aptDate.toISOString().split('T')[0],
      time: `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`,
      providerId: selectedAppointment.providerId
    })
    setShowAppointmentPopover(false)
    setShowAppointmentModal(true)
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return

    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return
    }

    try {
      const response = await fetch(`/api/encounters/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      })

      if (response.ok) {
        setShowAppointmentPopover(false)
        setSelectedAppointment(null)
        loadAppointments()
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err)
    }
  }

  const previousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const nextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const previousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatWeekRange = (date: Date) => {
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const getVisitTypeStyle = (type: string) => {
    return VISIT_TYPE_COLORS[type as keyof typeof VISIT_TYPE_COLORS] || VISIT_TYPE_COLORS.office_visit
  }

  const getAppointmentHeight = (duration: number): string => {
    // 15 min slot = 20px height (h-20)
    // 30 min = 40px, 60 min = 80px
    const slots = duration / 15
    return `${slots * 20}px`
  }

  const timeSlots = getTimeSlots()

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
            <Link href="/calendar" className="text-dermis-600 font-medium text-sm border-b-2 border-dermis-500">
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
        {/* Page Header & Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-6 h-6 text-dermis-600" />
            <h1 className="text-3xl font-display font-bold text-clinical-900">
              {viewMode === 'day' ? 'Daily Schedule' : 'Weekly Calendar'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-clinical-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'day'
                    ? 'bg-white text-dermis-600 shadow-sm'
                    : 'text-clinical-600 hover:text-clinical-800'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-dermis-600 shadow-sm'
                    : 'text-clinical-600 hover:text-clinical-800'
                }`}
              >
                Week
              </button>
            </div>

            <button onClick={goToToday} className="btn-secondary text-sm">
              Today
            </button>

            <button
              onClick={viewMode === 'day' ? previousDay : previousWeek}
              className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-clinical-600" />
            </button>

            <div className="min-w-[280px] text-center font-medium text-clinical-800">
              {viewMode === 'day' ? formatDate(currentDate) : formatWeekRange(currentDate)}
            </div>

            <button
              onClick={viewMode === 'day' ? nextDay : nextWeek}
              className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-clinical-600" />
            </button>

            <button
              onClick={loadAppointments}
              className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-clinical-600" />
            </button>
          </div>
        </div>

        {/* Provider Filter for Week View */}
        {viewMode === 'week' && (
          <div className="mb-6 border-b border-clinical-200">
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedProvider('all')}
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
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedProvider === provider.id
                      ? 'border-dermis-500 text-dermis-600'
                      : 'border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300'
                  }`}
                >
                  Dr. {provider.firstName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day View - Provider Columns */}
        {viewMode === 'day' && (
          <div className="bg-white rounded-lg border border-clinical-200 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Provider Headers */}
                <div className="grid grid-cols-4 border-b border-clinical-200">
                  <div className="p-4 bg-clinical-50 border-r border-clinical-200">
                    <span className="text-sm font-semibold text-clinical-500 uppercase">Time</span>
                  </div>
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="p-4 text-center bg-dermis-50 border-r border-clinical-200 last:border-r-0"
                    >
                      <div className="text-sm font-semibold text-dermis-700">
                        Dr. {provider.firstName} {provider.lastName}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="divide-y divide-clinical-100">
                  {timeSlots.map((slot, slotIdx) => {
                    const isPast = isSlotInPast(slot)

                    return (
                      <div key={slotIdx} className="grid grid-cols-4 h-20">
                        {/* Time Label */}
                        <div className="p-2 bg-clinical-50 border-r border-clinical-200 flex items-start justify-end">
                          <span className="text-xs text-clinical-600 font-medium">
                            {slot.time}
                          </span>
                        </div>

                        {/* Provider Columns */}
                        {providers.map((provider) => {
                          const slotAppointments = getAppointmentsForSlot(provider.id, slot)

                          return (
                            <div
                              key={provider.id}
                              onClick={() => !isPast && handleSlotClick(currentDate, slot, provider.id)}
                              className={`border-r border-clinical-200 last:border-r-0 p-1 transition-colors ${
                                isPast
                                  ? 'bg-clinical-50/50 cursor-not-allowed'
                                  : 'cursor-pointer hover:bg-dermis-50/30'
                              }`}
                            >
                              <div className="h-full flex flex-col gap-1">
                                {slotAppointments.map((apt) => {
                                  const typeStyle = getVisitTypeStyle(apt.encounterType)

                                  return (
                                    <div
                                      key={apt.id}
                                      onClick={(e) => handleAppointmentClick(apt, e)}
                                      className={`text-xs p-2 rounded border-l-3 ${typeStyle.bg} ${typeStyle.border} hover:shadow-md transition-shadow overflow-hidden cursor-pointer`}
                                      style={{ height: getAppointmentHeight(apt.duration) }}
                                    >
                                      <div className={`font-medium truncate ${typeStyle.text}`}>
                                        {apt.patientName}
                                      </div>
                                      <div className="text-clinical-600 text-[10px] truncate mt-0.5">
                                        {typeStyle.label}
                                      </div>
                                      <div className="text-clinical-500 text-[10px] mt-0.5">
                                        {apt.duration} min
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Week View - 7-Day Grid */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-lg border border-clinical-200 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Day Headers */}
                <div className="grid grid-cols-8 border-b border-clinical-200">
                  <div className="p-4 bg-clinical-50 border-r border-clinical-200">
                    <span className="text-sm font-semibold text-clinical-500 uppercase">Time</span>
                  </div>
                  {Array.from({ length: 7 }).map((_, dayOffset) => {
                    const weekStart = getWeekStart(currentDate)
                    const dayDate = new Date(weekStart)
                    dayDate.setDate(dayDate.getDate() + dayOffset)
                    const isToday = dayDate.toDateString() === new Date().toDateString()

                    return (
                      <div
                        key={dayOffset}
                        className={`p-4 text-center border-r border-clinical-200 last:border-r-0 ${
                          isToday ? 'bg-dermis-50' : 'bg-clinical-50'
                        }`}
                      >
                        <div className="text-xs text-clinical-500 uppercase">
                          {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm font-semibold mt-1 ${
                          isToday ? 'text-dermis-700' : 'text-clinical-800'
                        }`}>
                          {dayDate.getDate()}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Time Slots */}
                <div className="divide-y divide-clinical-100">
                  {timeSlots.filter((_, idx) => idx % 2 === 0).map((slot, slotIdx) => {
                    // Show every 30 minutes in week view for better visibility
                    return (
                      <div key={slotIdx} className="grid grid-cols-8 h-16">
                        {/* Time Label */}
                        <div className="p-2 bg-clinical-50 border-r border-clinical-200 flex items-start justify-end">
                          <span className="text-xs text-clinical-600 font-medium">
                            {slot.time}
                          </span>
                        </div>

                        {/* Day Columns */}
                        {Array.from({ length: 7 }).map((_, dayOffset) => {
                          const weekStart = getWeekStart(currentDate)
                          const dayDate = new Date(weekStart)
                          dayDate.setDate(dayDate.getDate() + dayOffset)

                          // Get appointments for this day and time slot
                          const dayAppointments = appointments.filter(apt => {
                            const aptDate = new Date(apt.scheduledAt)
                            // Match date and hour/minute
                            return (
                              aptDate.toDateString() === dayDate.toDateString() &&
                              aptDate.getHours() === slot.hour &&
                              aptDate.getMinutes() === slot.minute
                            )
                          })

                          const isPast = isSlotInPast(slot, dayDate)

                          return (
                            <div
                              key={dayOffset}
                              onClick={() => !isPast && handleSlotClick(dayDate, slot)}
                              className={`border-r border-clinical-200 last:border-r-0 p-1 transition-colors ${
                                isPast
                                  ? 'bg-clinical-50/50 cursor-not-allowed'
                                  : 'cursor-pointer hover:bg-dermis-50/30'
                              }`}
                            >
                              <div className="h-full flex flex-col gap-1">
                                {dayAppointments.map((apt) => {
                                  const typeStyle = getVisitTypeStyle(apt.encounterType)

                                  return (
                                    <div
                                      key={apt.id}
                                      onClick={(e) => handleAppointmentClick(apt, e)}
                                      className={`text-xs p-1.5 rounded border-l-2 ${typeStyle.bg} ${typeStyle.border} hover:shadow-md transition-shadow overflow-hidden cursor-pointer`}
                                    >
                                      <div className={`font-medium truncate ${typeStyle.text} text-[10px]`}>
                                        {apt.patientName}
                                      </div>
                                      <div className="text-clinical-600 text-[9px] truncate">
                                        {apt.providerFirstName}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Appointment Modal */}
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

      {/* Appointment Details Popover */}
      {showAppointmentPopover && selectedAppointment && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          onClick={() => setShowAppointmentPopover(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-clinical-900">
                  {selectedAppointment.patientName}
                </h3>
                <p className="text-sm text-clinical-600 mt-1">
                  {new Date(selectedAppointment.scheduledAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })} • {selectedAppointment.duration} minutes
                </p>
              </div>
              <button
                onClick={() => setShowAppointmentPopover(false)}
                className="p-1 hover:bg-clinical-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-clinical-600" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <span className="text-xs font-semibold text-clinical-500 uppercase">Provider</span>
                <p className="text-sm text-clinical-800 mt-1">{selectedAppointment.providerName}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-clinical-500 uppercase">Visit Type</span>
                <p className="text-sm text-clinical-800 mt-1">
                  {getVisitTypeStyle(selectedAppointment.encounterType).label}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-clinical-500 uppercase">Chief Complaint</span>
                <p className="text-sm text-clinical-800 mt-1">{selectedAppointment.chiefComplaint}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/patients/${selectedAppointment.patientId}`}
                className="btn-secondary text-sm justify-center"
                onClick={() => setShowAppointmentPopover(false)}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Patient Chart
              </Link>

              {selectedAppointment.status === 'scheduled' && (
                <button onClick={handleCheckIn} className="btn-primary text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check In
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleEditAppointment} className="btn-secondary text-sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button onClick={handleCancelAppointment} className="btn-secondary text-sm text-red-600 hover:bg-red-50">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
