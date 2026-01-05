'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  FileText,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  Edit,
  ArrowRight,
  Activity,
  CheckCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Bell,
  AlertTriangle,
  Microscope,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { useProvider } from '@/contexts/ProviderContext'
import AppHeader from '@/components/AppHeader'

interface DashboardData {
  appointments: Array<{
    id: string
    type: string
    chiefComplaint: string
    status: string
    scheduledAt: string
    patient: { id: string; name: string } | null
    provider: { id: string; name: string; firstName: string } | null
  }>
  unsignedNotes: Array<{
    id: string
    encounterId: string
    createdAt: string
    chiefComplaint: string
    patient: { id: string; name: string } | null
  }>
  recentPatients: Array<{
    id: string
    name: string
    mrn: string
    lastVisit: string
  }>
  stats: {
    todayAppointments: number
    unsignedCount: number
    recentPatientsCount: number
  }
}

// Practice Intelligence alerts/signals (mock data for demo)
interface PracticeAlert {
  id: string
  type: 'pathology' | 'auth' | 'revenue' | 'followup' | 'compliance'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  metric?: string
  trend?: 'up' | 'down' | 'stable'
  actionLabel?: string
  actionHref?: string
}

const PRACTICE_ALERTS: PracticeAlert[] = [
  {
    id: '1',
    type: 'pathology',
    priority: 'high',
    title: '3 Pathology Results Pending Review',
    description: 'Includes 1 melanoma diagnosis requiring urgent patient callback',
    actionLabel: 'Review Now',
    actionHref: '/inbox/pathology'
  },
  {
    id: '2',
    type: 'followup',
    priority: 'high',
    title: '5 Patients Overdue for Biopsy Follow-up',
    description: 'Past 90-day window for post-excision check',
    metric: '5 patients',
    actionLabel: 'View List',
    actionHref: '/patients?filter=overdue-followup'
  },
  {
    id: '3',
    type: 'auth',
    priority: 'medium',
    title: 'Prior Auth Denial Rate: 12%',
    description: 'Up from 8% last month. Top denials: Mohs surgery (4), biologics (3)',
    metric: '12%',
    trend: 'up',
    actionLabel: 'Review Denials',
    actionHref: '/integrations?tab=auth-status'
  },
  {
    id: '4',
    type: 'revenue',
    priority: 'medium',
    title: 'Revenue Trend: +8% MTD',
    description: 'Procedure volume up 12%, cosmetic services strong',
    metric: '+$12,400',
    trend: 'up'
  },
  {
    id: '5',
    type: 'compliance',
    priority: 'low',
    title: '2 Controlled Substance Audits Due',
    description: 'Isotretinoin patient charts require 30-day review',
    actionLabel: 'View Audit',
    actionHref: '/compliance/isotretinoin'
  }
]

export default function DashboardPage() {
  const { selectedProvider } = useProvider()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [selectedProvider])

  const loadDashboard = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const practiceId = '00000000-0000-0000-0000-000000000001'
      const url = selectedProvider
        ? `/api/dashboard?practiceId=${practiceId}&providerId=${selectedProvider.id}`
        : `/api/dashboard?practiceId=${practiceId}`

      const response = await fetch(url)
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Failed to load dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      scheduled: { label: 'Scheduled', color: 'bg-clinical-100 text-clinical-700' },
      checked_in: { label: 'Checked In', color: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
    }
    const config = statusConfig[status] || statusConfig.scheduled
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-clinical-900 mb-2">Dashboard</h1>
              <p className="text-clinical-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {selectedProvider && (
                <p className="text-sm text-dermis-600 mt-1">
                  Viewing as {selectedProvider.fullName}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Link href="/demo" className="btn-secondary">
                <FileText className="w-4 h-4 mr-2" />
                New Note
              </Link>
              <Link href="/schedule" className="btn-primary">
                <Calendar className="w-4 h-4 mr-2" />
                View Schedule
              </Link>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-dermis-500" />
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-clinical-600">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-clinical-900">{data.stats.todayAppointments}</span>
                </div>
                <h3 className="text-sm font-medium text-clinical-600">Today's Appointments</h3>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Edit className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-3xl font-bold text-clinical-900">{data.stats.unsignedCount}</span>
                </div>
                <h3 className="text-sm font-medium text-clinical-600">Unsigned Notes</h3>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-clinical-900">{data.stats.recentPatientsCount}</span>
                </div>
                <h3 className="text-sm font-medium text-clinical-600">Recent Patients (7d)</h3>
              </div>
            </div>

            {/* Practice Intelligence */}
            <div className="card mb-8 overflow-hidden">
              <div className="px-6 py-4 border-b border-clinical-100 bg-gradient-to-r from-dermis-50 via-white to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dermis-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display font-semibold text-clinical-800">Practice Intelligence</h2>
                      <p className="text-xs text-clinical-500">AI-powered insights and action items</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-dermis-100 text-dermis-700 text-xs font-medium rounded-full">
                    {PRACTICE_ALERTS.filter(a => a.priority === 'high').length} urgent
                  </span>
                </div>
              </div>

              <div className="divide-y divide-clinical-100">
                {PRACTICE_ALERTS.map((alert) => {
                  const getAlertIcon = () => {
                    switch (alert.type) {
                      case 'pathology': return <Microscope className="w-5 h-5" />
                      case 'auth': return <ShieldCheck className="w-5 h-5" />
                      case 'revenue': return <DollarSign className="w-5 h-5" />
                      case 'followup': return <Bell className="w-5 h-5" />
                      case 'compliance': return <AlertTriangle className="w-5 h-5" />
                      default: return <Zap className="w-5 h-5" />
                    }
                  }

                  const getAlertColors = () => {
                    switch (alert.priority) {
                      case 'high': return {
                        bg: 'bg-red-50',
                        icon: 'bg-red-100 text-red-600',
                        badge: 'bg-red-100 text-red-700',
                        border: 'border-l-red-500'
                      }
                      case 'medium': return {
                        bg: 'bg-amber-50/50',
                        icon: 'bg-amber-100 text-amber-600',
                        badge: 'bg-amber-100 text-amber-700',
                        border: 'border-l-amber-500'
                      }
                      default: return {
                        bg: 'bg-clinical-50',
                        icon: 'bg-clinical-100 text-clinical-600',
                        badge: 'bg-clinical-100 text-clinical-700',
                        border: 'border-l-clinical-300'
                      }
                    }
                  }

                  const colors = getAlertColors()

                  return (
                    <div
                      key={alert.id}
                      className={`px-6 py-4 border-l-4 ${colors.border} ${colors.bg} hover:bg-opacity-75 transition-colors`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                          {getAlertIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-clinical-800">{alert.title}</h3>
                              <p className="text-sm text-clinical-600 mt-0.5">{alert.description}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {alert.metric && (
                                <div className="flex items-center gap-1">
                                  {alert.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                                  {alert.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                                  <span className={`text-sm font-semibold ${
                                    alert.type === 'revenue' && alert.trend === 'up' ? 'text-green-600' :
                                    alert.type === 'auth' && alert.trend === 'up' ? 'text-red-600' :
                                    'text-clinical-700'
                                  }`}>
                                    {alert.metric}
                                  </span>
                                </div>
                              )}
                              {alert.actionHref && (
                                <Link
                                  href={alert.actionHref}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-clinical-200 text-clinical-700 text-sm font-medium rounded-lg hover:bg-clinical-50 transition-colors"
                                >
                                  {alert.actionLabel}
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-6 py-3 bg-clinical-50 border-t border-clinical-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-clinical-500">
                    Powered by Dermis AI • Updated 5 min ago
                  </span>
                  <button className="text-xs text-dermis-600 hover:text-dermis-700 font-medium">
                    Configure Alerts →
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Appointments */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="p-6 border-b border-clinical-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-dermis-600" />
                        <h2 className="font-display font-semibold text-clinical-800">Today's Schedule</h2>
                      </div>
                      <Link href="/schedule" className="text-sm text-dermis-600 hover:text-dermis-700 font-medium">
                        View All →
                      </Link>
                    </div>
                  </div>
                  <div className="divide-y divide-clinical-100">
                    {data.appointments.length === 0 ? (
                      <div className="p-8 text-center text-clinical-500">
                        <Calendar className="w-12 h-12 text-clinical-300 mx-auto mb-2" />
                        <p>No appointments today</p>
                      </div>
                    ) : (
                      data.appointments.map((apt) => (
                        <div key={apt.id} className="p-4 hover:bg-clinical-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 w-20 flex-shrink-0">
                              <Clock className="w-4 h-4 text-clinical-400" />
                              <span className="text-sm font-medium text-clinical-700">
                                {formatTime(apt.scheduledAt)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              {apt.patient ? (
                                <Link
                                  href={`/patients/${apt.patient.id}`}
                                  className="text-clinical-800 font-medium hover:text-dermis-600"
                                >
                                  {apt.patient.name}
                                </Link>
                              ) : (
                                <span className="text-clinical-500">No patient</span>
                              )}
                              <div className="text-sm text-clinical-500 mt-0.5">{apt.chiefComplaint}</div>
                            </div>
                            <div>{getStatusBadge(apt.status)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Unsigned Notes */}
                <div className="card mt-6">
                  <div className="p-6 border-b border-clinical-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit className="w-5 h-5 text-amber-600" />
                        <h2 className="font-display font-semibold text-clinical-800">Notes Requiring Signature</h2>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-clinical-100">
                    {data.unsignedNotes.length === 0 ? (
                      <div className="p-8 text-center text-clinical-500">
                        <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
                        <p>All notes are signed!</p>
                      </div>
                    ) : (
                      data.unsignedNotes.map((note) => (
                        <div key={note.id} className="p-4 hover:bg-clinical-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {note.patient ? (
                                <Link
                                  href={`/patients/${note.patient.id}`}
                                  className="text-clinical-800 font-medium hover:text-dermis-600"
                                >
                                  {note.patient.name}
                                </Link>
                              ) : (
                                <span className="text-clinical-500">No patient</span>
                              )}
                              <div className="text-sm text-clinical-500 mt-0.5">{note.chiefComplaint}</div>
                              <div className="text-xs text-clinical-400 mt-1">
                                Created {formatDate(note.createdAt)}
                              </div>
                            </div>
                            {note.patient && (
                              <Link
                                href={`/patients/${note.patient.id}`}
                                className="btn-secondary text-sm py-1 px-3"
                              >
                                Sign Note
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Patients Sidebar */}
              <div className="lg:col-span-1">
                <div className="card">
                  <div className="p-6 border-b border-clinical-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-dermis-600" />
                      <h2 className="font-display font-semibold text-clinical-800">Recent Patients</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-clinical-100">
                    {data.recentPatients.length === 0 ? (
                      <div className="p-8 text-center text-clinical-500">
                        <Users className="w-12 h-12 text-clinical-300 mx-auto mb-2" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    ) : (
                      data.recentPatients.map((patient) => (
                        <Link
                          key={patient.id}
                          href={`/patients/${patient.id}`}
                          className="block p-4 hover:bg-clinical-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dermis-100 flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-dermis-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-clinical-800">{patient.name}</div>
                              <div className="text-xs text-clinical-500">{patient.mrn}</div>
                              <div className="text-xs text-clinical-400 mt-0.5">
                                Last visit {formatDate(patient.lastVisit)}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-clinical-400" />
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
