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
  Sparkles,
  Stethoscope,
  Syringe,
  CreditCard,
  BarChart3,
  PieChart,
  Target,
  Wallet
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

// Practice Intelligence alerts/signals
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

// Practice Analytics interface
interface PracticeAnalytics {
  revenue: {
    mtd: number
    lastMonth: number
    ytd: number
    target: number
    breakdown: {
      medical: number
      cosmetic: number
    }
  }
  patients: {
    total: number
    activeThisMonth: number
    newThisMonth: number
    retention: number
  }
  procedures: {
    mtd: number
    avgPerDay: string | number
    topProcedures: Array<{ name: string; code?: string; count: number; revenue: number }>
  }
  collections: {
    rate: number
    outstanding: number
    avgDaysToCollect: number
  }
  providers: Array<{ name: string; patients: number; revenue: number; procedures: number }>
}

// Default analytics for when there's no data
const DEFAULT_ANALYTICS: PracticeAnalytics = {
  revenue: { mtd: 0, lastMonth: 0, ytd: 0, target: 200000, breakdown: { medical: 0, cosmetic: 0 } },
  patients: { total: 0, activeThisMonth: 0, newThisMonth: 0, retention: 0 },
  procedures: { mtd: 0, avgPerDay: 0, topProcedures: [] },
  collections: { rate: 0, outstanding: 0, avgDaysToCollect: 0 },
  providers: []
}

// Demo mode data for impressive presentations
const DEMO_ANALYTICS: PracticeAnalytics = {
  revenue: {
    mtd: 187450,
    lastMonth: 173200,
    ytd: 2145000,
    target: 2400000,
    breakdown: {
      medical: 142300,
      cosmetic: 45150
    }
  },
  patients: {
    total: 4823,
    activeThisMonth: 312,
    newThisMonth: 47,
    retention: 94.2
  },
  procedures: {
    mtd: 186,
    avgPerDay: 8.2,
    topProcedures: [
      { name: 'Skin Biopsy', count: 48, revenue: 14400 },
      { name: 'Cryotherapy', count: 62, revenue: 8060 },
      { name: 'Excision', count: 23, revenue: 18400 },
      { name: 'Mohs Surgery', count: 8, revenue: 32000 },
      { name: 'Botox', count: 34, revenue: 17000 },
      { name: 'Filler', count: 11, revenue: 8800 }
    ]
  },
  collections: {
    rate: 96.8,
    outstanding: 24350,
    avgDaysToCollect: 18
  },
  providers: [
    { name: 'Dr. Sarah Chen', patients: 156, revenue: 94200, procedures: 98 },
    { name: 'Dr. Michael Park', patients: 132, revenue: 72400, procedures: 72 },
    { name: 'NP Emily Rodriguez', patients: 24, revenue: 20850, procedures: 16 }
  ]
}

const DEMO_ALERTS: PracticeAlert[] = [
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
  const [analytics, setAnalytics] = useState<PracticeAnalytics>(DEFAULT_ANALYTICS)
  const [practiceAlerts, setPracticeAlerts] = useState<PracticeAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(true) // Default to demo mode for presentations

  useEffect(() => {
    loadDashboard()
  }, [selectedProvider, demoMode])

  const loadDashboard = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const practiceId = '00000000-0000-0000-0000-000000000001'
      const baseUrl = selectedProvider
        ? `practiceId=${practiceId}&providerId=${selectedProvider.id}`
        : `practiceId=${practiceId}`

      // Fetch real dashboard data (appointments, notes, etc.)
      const dashboardRes = await fetch(`/api/dashboard?${baseUrl}`)

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        setData(dashboardData)
      } else {
        setError('Failed to load dashboard data')
      }

      // Use demo data or fetch real analytics based on mode
      if (demoMode) {
        setAnalytics(DEMO_ANALYTICS)
        setPracticeAlerts(DEMO_ALERTS)
      } else {
        const analyticsRes = await fetch(`/api/analytics?${baseUrl}`)
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json()
          setAnalytics(analyticsData.analytics || DEFAULT_ANALYTICS)
          setPracticeAlerts(analyticsData.practiceAlerts || [])
        }
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold text-clinical-900">Dashboard</h1>
                {/* Demo Mode Toggle */}
                <button
                  onClick={() => setDemoMode(!demoMode)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                    demoMode
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                  }`}
                >
                  {demoMode ? 'Demo Mode' : 'Live Data'}
                </button>
              </div>
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
            {/* Practice Analytics Section */}
            <div className="mb-8">
              {/* Revenue & Key Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* MTD Revenue */}
                <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">MTD Revenue</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">
                        ${analytics.revenue.mtd.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        {analytics.revenue.lastMonth > 0 ? (
                          <>
                            {analytics.revenue.mtd >= analytics.revenue.lastMonth ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                            )}
                            <span className={`text-xs font-medium ${analytics.revenue.mtd >= analytics.revenue.lastMonth ? 'text-emerald-600' : 'text-red-500'}`}>
                              {analytics.revenue.mtd >= analytics.revenue.lastMonth ? '+' : ''}{(((analytics.revenue.mtd - analytics.revenue.lastMonth) / analytics.revenue.lastMonth) * 100).toFixed(1)}% vs last month
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-emerald-600">First month of data</span>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* Total Patients */}
                <div className="card p-5 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Patients</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        {analytics.patients.total.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-blue-600">
                          <span className="font-medium">+{analytics.patients.newThisMonth}</span> new this month
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Procedures MTD */}
                <div className="card p-5 bg-gradient-to-br from-purple-50 to-white border-purple-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Procedures MTD</p>
                      <p className="text-2xl font-bold text-purple-700 mt-1">
                        {analytics.procedures.mtd}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-purple-600">
                          Avg <span className="font-medium">{analytics.procedures.avgPerDay}</span>/day
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Syringe className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Collection Rate */}
                <div className="card p-5 bg-gradient-to-br from-amber-50 to-white border-amber-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Collection Rate</p>
                      <p className="text-2xl font-bold text-amber-700 mt-1">
                        {analytics.collections.rate}%
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-amber-600">
                          ${analytics.collections.outstanding.toLocaleString()} outstanding
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown & Top Procedures */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Breakdown */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-clinical-800 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-dermis-600" />
                      Revenue Breakdown
                    </h3>
                    <span className="text-xs text-clinical-500">MTD</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-4 rounded-full overflow-hidden bg-clinical-100 mb-4">
                    <div className="h-full flex">
                      <div
                        className="bg-dermis-500 transition-all"
                        style={{ width: `${analytics.revenue.mtd > 0 ? (analytics.revenue.breakdown.medical / analytics.revenue.mtd) * 100 : 0}%` }}
                      />
                      <div
                        className="bg-pink-400 transition-all"
                        style={{ width: `${analytics.revenue.mtd > 0 ? (analytics.revenue.breakdown.cosmetic / analytics.revenue.mtd) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-dermis-500" />
                        <span className="text-sm text-clinical-700">Medical</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-clinical-800">${analytics.revenue.breakdown.medical.toLocaleString()}</span>
                        <span className="text-xs text-clinical-500 ml-2">
                          ({analytics.revenue.mtd > 0 ? ((analytics.revenue.breakdown.medical / analytics.revenue.mtd) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-400" />
                        <span className="text-sm text-clinical-700">Cosmetic</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-clinical-800">${analytics.revenue.breakdown.cosmetic.toLocaleString()}</span>
                        <span className="text-xs text-clinical-500 ml-2">
                          ({analytics.revenue.mtd > 0 ? ((analytics.revenue.breakdown.cosmetic / analytics.revenue.mtd) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* YTD Progress */}
                  <div className="mt-4 pt-4 border-t border-clinical-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-clinical-600">YTD Progress</span>
                      <span className="font-medium text-clinical-800">
                        ${(analytics.revenue.ytd / 1000).toFixed(0)}K / ${(analytics.revenue.target / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-clinical-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-dermis-400 to-dermis-600 transition-all"
                        style={{ width: `${analytics.revenue.target > 0 ? Math.min((analytics.revenue.ytd / analytics.revenue.target) * 100, 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-clinical-500 mt-1">
                      {analytics.revenue.target > 0 ? ((analytics.revenue.ytd / analytics.revenue.target) * 100).toFixed(0) : 0}% of annual target
                    </p>
                  </div>
                </div>

                {/* Top Procedures */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-clinical-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-dermis-600" />
                      Top Procedures
                    </h3>
                    <span className="text-xs text-clinical-500">MTD</span>
                  </div>
                  <div className="space-y-3">
                    {analytics.procedures.topProcedures.length === 0 ? (
                      <div className="text-center py-4 text-clinical-500 text-sm">
                        No procedures recorded yet
                      </div>
                    ) : analytics.procedures.topProcedures.slice(0, 5).map((proc, i) => {
                      const maxCount = Math.max(...analytics.procedures.topProcedures.map(p => p.count), 1)
                      return (
                        <div key={proc.name} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-clinical-400 w-4">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-clinical-700">{proc.name}</span>
                              <span className="text-sm font-medium text-clinical-800">{proc.count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-clinical-100 overflow-hidden">
                              <div
                                className="h-full bg-dermis-400 transition-all"
                                style={{ width: `${(proc.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-clinical-500 w-16 text-right">
                            ${(proc.revenue / 1000).toFixed(1)}K
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Provider Performance */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-clinical-800 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-dermis-600" />
                      Provider Performance
                    </h3>
                    <span className="text-xs text-clinical-500">MTD</span>
                  </div>
                  <div className="space-y-4">
                    {analytics.providers.length === 0 ? (
                      <div className="text-center py-4 text-clinical-500 text-sm">
                        No provider data yet
                      </div>
                    ) : analytics.providers.map((provider) => (
                      <div key={provider.name} className="p-3 rounded-lg bg-clinical-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-clinical-800 text-sm">{provider.name}</span>
                          <span className="text-sm font-semibold text-emerald-600">
                            ${(provider.revenue / 1000).toFixed(1)}K
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-clinical-600">
                            <Users className="w-3 h-3" />
                            {provider.patients} patients
                          </div>
                          <div className="flex items-center gap-1 text-clinical-600">
                            <Syringe className="w-3 h-3" />
                            {provider.procedures} procedures
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-clinical-900">{data.stats.todayAppointments}</p>
                    <p className="text-xs text-clinical-500">Today's Appts</p>
                  </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Edit className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-clinical-900">{data.stats.unsignedCount}</p>
                    <p className="text-xs text-clinical-500">Unsigned Notes</p>
                  </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-clinical-900">{analytics.patients.retention}%</p>
                    <p className="text-xs text-clinical-500">Retention Rate</p>
                  </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-clinical-900">{analytics.collections.avgDaysToCollect}d</p>
                    <p className="text-xs text-clinical-500">Avg Collection</p>
                  </div>
                </div>
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
                    {practiceAlerts.filter(a => a.priority === 'high').length} urgent
                  </span>
                </div>
              </div>

              <div className="divide-y divide-clinical-100">
                {practiceAlerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="font-medium text-clinical-800 mb-1">All Caught Up!</h3>
                    <p className="text-sm text-clinical-500">No urgent items requiring your attention</p>
                  </div>
                ) : practiceAlerts.map((alert) => {
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
