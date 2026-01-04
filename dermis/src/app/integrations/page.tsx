'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Settings,
  ExternalLink,
  Zap,
  Building2,
  Pill,
  FlaskConical,
  CreditCard,
  FileText,
  Shield,
  Activity,
  ArrowRight,
  ChevronRight,
  Send,
  Download,
  Upload
} from 'lucide-react'
import AppHeader from '@/components/AppHeader'

interface Integration {
  id: string
  name: string
  category: 'lab' | 'pharmacy' | 'clearinghouse' | 'imaging' | 'other'
  description: string
  status: 'connected' | 'pending' | 'error'
  lastSync?: string
  logo?: string
  features: string[]
}

interface RecentActivity {
  id: string
  type: 'lab_order' | 'lab_result' | 'rx_sent' | 'claim_submitted' | 'claim_paid'
  description: string
  timestamp: string
  status: 'success' | 'pending' | 'error'
  integration: string
}

const INTEGRATIONS: Integration[] = [
  // Labs
  {
    id: 'quest',
    name: 'Quest Diagnostics',
    category: 'lab',
    description: 'Full lab order and result integration',
    status: 'connected',
    lastSync: '2 minutes ago',
    features: ['Electronic ordering', 'Auto result import', 'Abnormal flagging']
  },
  {
    id: 'labcorp',
    name: 'LabCorp',
    category: 'lab',
    description: 'Laboratory services integration',
    status: 'connected',
    lastSync: '5 minutes ago',
    features: ['Electronic ordering', 'Auto result import', 'Patient notifications']
  },
  {
    id: 'dermpathlab',
    name: 'DermPath Diagnostics',
    category: 'lab',
    description: 'Specialized dermatopathology',
    status: 'connected',
    lastSync: '1 minute ago',
    features: ['Pathology orders', 'Digital slides', 'AI-assisted review']
  },
  // Pharmacies
  {
    id: 'surescripts',
    name: 'Surescripts',
    category: 'pharmacy',
    description: 'E-prescribing network',
    status: 'connected',
    lastSync: '30 seconds ago',
    features: ['eRx EPCS', 'Medication history', 'Formulary check', 'Real-time benefits']
  },
  {
    id: 'cvs',
    name: 'CVS Caremark',
    category: 'pharmacy',
    description: 'Pharmacy benefits and fulfillment',
    status: 'connected',
    lastSync: '1 minute ago',
    features: ['Prior auth', 'Mail order', 'Specialty pharmacy']
  },
  {
    id: 'walgreens',
    name: 'Walgreens',
    category: 'pharmacy',
    description: 'Retail pharmacy network',
    status: 'connected',
    lastSync: '3 minutes ago',
    features: ['eRx delivery', 'Patient pickup alerts']
  },
  // Clearinghouses
  {
    id: 'availity',
    name: 'Availity',
    category: 'clearinghouse',
    description: 'Claims and eligibility',
    status: 'connected',
    lastSync: '10 minutes ago',
    features: ['Claims submission', 'ERA/EOB', 'Eligibility verification', 'Prior auth']
  },
  {
    id: 'trizetto',
    name: 'TriZetto (Cognizant)',
    category: 'clearinghouse',
    description: 'Revenue cycle management',
    status: 'connected',
    lastSync: '15 minutes ago',
    features: ['Claims processing', 'Denial management', 'Analytics']
  },
  {
    id: 'change',
    name: 'Change Healthcare',
    category: 'clearinghouse',
    description: 'Healthcare network solutions',
    status: 'connected',
    lastSync: '8 minutes ago',
    features: ['Real-time claims', 'Payment posting', 'Patient estimates']
  },
  // Imaging
  {
    id: 'canfield',
    name: 'Canfield Scientific',
    category: 'imaging',
    description: 'Dermatology imaging systems',
    status: 'connected',
    lastSync: '1 hour ago',
    features: ['VECTRA imaging', 'IntelliStudio', 'Total body photography']
  },
  // Other
  {
    id: 'commonwell',
    name: 'CommonWell Health Alliance',
    category: 'other',
    description: 'Health information exchange',
    status: 'connected',
    lastSync: '30 minutes ago',
    features: ['Patient matching', 'Document query', 'Care summary exchange']
  },
  {
    id: 'carequality',
    name: 'Carequality',
    category: 'other',
    description: 'Interoperability framework',
    status: 'connected',
    lastSync: '25 minutes ago',
    features: ['Cross-network queries', 'C-CDA exchange']
  }
]

const RECENT_ACTIVITY: RecentActivity[] = [
  {
    id: '1',
    type: 'lab_result',
    description: 'Pathology result received for Maria Santos',
    timestamp: '2 minutes ago',
    status: 'success',
    integration: 'DermPath Diagnostics'
  },
  {
    id: '2',
    type: 'rx_sent',
    description: 'Prescription sent: Tretinoin 0.025% for Tyler Johnson',
    timestamp: '5 minutes ago',
    status: 'success',
    integration: 'Surescripts'
  },
  {
    id: '3',
    type: 'claim_submitted',
    description: 'Claim submitted for encounter #4521',
    timestamp: '12 minutes ago',
    status: 'success',
    integration: 'Availity'
  },
  {
    id: '4',
    type: 'lab_order',
    description: 'Biopsy specimen sent to pathology',
    timestamp: '25 minutes ago',
    status: 'success',
    integration: 'DermPath Diagnostics'
  },
  {
    id: '5',
    type: 'claim_paid',
    description: 'Payment posted: $245.00 from BCBS',
    timestamp: '1 hour ago',
    status: 'success',
    integration: 'Change Healthcare'
  },
  {
    id: '6',
    type: 'rx_sent',
    description: 'Prescription sent: Doxycycline 100mg for Rebecca Chen',
    timestamp: '2 hours ago',
    status: 'success',
    integration: 'Surescripts'
  }
]

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const categories = [
    { key: 'all', label: 'All Integrations', icon: Zap },
    { key: 'lab', label: 'Labs', icon: FlaskConical },
    { key: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { key: 'clearinghouse', label: 'Billing', icon: CreditCard },
    { key: 'imaging', label: 'Imaging', icon: FileText },
    { key: 'other', label: 'HIE', icon: Building2 }
  ]

  const filteredIntegrations = selectedCategory === 'all'
    ? INTEGRATIONS
    : INTEGRATIONS.filter(i => i.category === selectedCategory)

  const connectedCount = INTEGRATIONS.filter(i => i.status === 'connected').length

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lab_order': return <Upload className="w-4 h-4 text-blue-600" />
      case 'lab_result': return <Download className="w-4 h-4 text-green-600" />
      case 'rx_sent': return <Send className="w-4 h-4 text-purple-600" />
      case 'claim_submitted': return <FileText className="w-4 h-4 text-orange-600" />
      case 'claim_paid': return <CreditCard className="w-4 h-4 text-green-600" />
      default: return <Activity className="w-4 h-4 text-clinical-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lab': return <FlaskConical className="w-5 h-5" />
      case 'pharmacy': return <Pill className="w-5 h-5" />
      case 'clearinghouse': return <CreditCard className="w-5 h-5" />
      case 'imaging': return <FileText className="w-5 h-5" />
      default: return <Building2 className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold text-clinical-900">
                  Integrations
                </h1>
              </div>
              <p className="text-clinical-600">
                Connected to the same systems your practice already uses
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync All'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-clinical-900">{connectedCount}</p>
                  <p className="text-sm text-clinical-600">Connected</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-clinical-900">3</p>
                  <p className="text-sm text-clinical-600">Lab Partners</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-clinical-900">70K+</p>
                  <p className="text-sm text-clinical-600">Pharmacies</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-clinical-900">2000+</p>
                  <p className="text-sm text-clinical-600">Payers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Migration Banner */}
          <div className="card p-6 bg-gradient-to-r from-dermis-50 to-blue-50 border-dermis-200 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-dermis-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-lg text-clinical-900 mb-1">
                  Seamless Migration from ModMed
                </h3>
                <p className="text-clinical-600 mb-3">
                  All your existing integrations work with Dermis. We connect to the same clearinghouses,
                  labs, and pharmacy networks - no need to re-establish connections or retrain staff.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-clinical-700 border border-clinical-200">
                    Same lab interfaces
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-clinical-700 border border-clinical-200">
                    Same clearinghouses
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-clinical-700 border border-clinical-200">
                    Same pharmacy network
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm text-clinical-700 border border-clinical-200">
                    Zero downtime switch
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.key
                        ? 'bg-dermis-500 text-white'
                        : 'bg-white text-clinical-600 hover:bg-clinical-50 border border-clinical-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* Integration List */}
            <div className="space-y-4">
              {filteredIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        integration.category === 'lab' ? 'bg-blue-100 text-blue-600' :
                        integration.category === 'pharmacy' ? 'bg-purple-100 text-purple-600' :
                        integration.category === 'clearinghouse' ? 'bg-orange-100 text-orange-600' :
                        integration.category === 'imaging' ? 'bg-pink-100 text-pink-600' :
                        'bg-clinical-100 text-clinical-600'
                      }`}>
                        {getCategoryIcon(integration.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-clinical-900">
                            {integration.name}
                          </h3>
                          {integration.status === 'connected' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Connected
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-clinical-600 mb-3">
                          {integration.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {integration.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-clinical-50 text-clinical-600 text-xs rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {integration.lastSync && (
                        <div className="flex items-center gap-1 text-xs text-clinical-500">
                          <Clock className="w-3 h-3" />
                          {integration.lastSync}
                        </div>
                      )}
                      <button className="mt-2 text-dermis-600 hover:text-dermis-700 text-sm flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="card">
              <div className="px-5 py-4 border-b border-clinical-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-clinical-900">
                    Recent Activity
                  </h3>
                  <Activity className="w-4 h-4 text-clinical-400" />
                </div>
              </div>
              <div className="divide-y divide-clinical-100">
                {RECENT_ACTIVITY.map((activity) => (
                  <div key={activity.id} className="px-5 py-3 hover:bg-clinical-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-clinical-800 line-clamp-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-clinical-500">
                            {activity.timestamp}
                          </span>
                          <span className="text-xs text-clinical-400">•</span>
                          <span className="text-xs text-clinical-500">
                            {activity.integration}
                          </span>
                        </div>
                      </div>
                      {activity.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-clinical-100">
                <button className="text-sm text-dermis-600 hover:text-dermis-700 flex items-center gap-1">
                  View all activity
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-5">
              <h3 className="font-display font-semibold text-clinical-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/inbox/pathology"
                  className="flex items-center justify-between p-3 bg-clinical-50 rounded-lg hover:bg-clinical-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FlaskConical className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-clinical-800">Pathology Inbox</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-clinical-400" />
                </Link>
                <button className="w-full flex items-center justify-between p-3 bg-clinical-50 rounded-lg hover:bg-clinical-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-clinical-800">New Prescription</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-clinical-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-clinical-50 rounded-lg hover:bg-clinical-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-clinical-800">Check Eligibility</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-clinical-400" />
                </button>
              </div>
            </div>

            {/* HIPAA Compliance */}
            <div className="card p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-clinical-900">HIPAA Compliant</h3>
                  <p className="text-xs text-clinical-600">All integrations encrypted</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-clinical-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  256-bit encryption in transit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  SOC 2 Type II certified
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  BAA available
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Full audit logging
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
