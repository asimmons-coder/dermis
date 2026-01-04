'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  Search,
  Command,
  Microscope,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Phone,
  User,
  Calendar,
  X,
  Upload,
  Download,
  Mail,
  MessageSquare,
  UserCheck
} from 'lucide-react'

interface PathologyOrder {
  id: string
  patientName: string
  patientId: string
  specimenType: string
  bodySite: string
  dateSent: string
  labName: string
  status: string
  daysPending: number
  diagnosis?: string
  margins?: string
  pathReport?: string
  followUpNotes?: string
  providerName: string
  microscopicDescription?: string
  pathologistName?: string
  recommendations?: string
  pathReportUrl?: string
  patientNotified?: boolean
  notificationDate?: string
  notificationMethod?: string
  followUpAppointmentId?: string
}

export default function PathologyInboxPage() {
  const [orders, setOrders] = useState<PathologyOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<PathologyOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<PathologyOrder | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Enhanced review fields
  const [editedDiagnosis, setEditedDiagnosis] = useState('')
  const [editedMicroscopic, setEditedMicroscopic] = useState('')
  const [editedMargins, setEditedMargins] = useState('')
  const [editedPathologist, setEditedPathologist] = useState('')
  const [editedRecommendations, setEditedRecommendations] = useState('')
  const [patientNotified, setPatientNotified] = useState(false)
  const [notificationMethod, setNotificationMethod] = useState('Phone')
  const [pathReportFile, setPathReportFile] = useState<File | null>(null)
  const [showScheduleFollowUp, setShowScheduleFollowUp] = useState(false)

  const triggerGlobalSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, filterStatus, searchQuery])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/pathology-orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Failed to load pathology orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === filterStatus)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o =>
        o.patientName.toLowerCase().includes(query) ||
        o.bodySite.toLowerCase().includes(query) ||
        o.specimenType.toLowerCase().includes(query)
      )
    }

    setFilteredOrders(filtered)
  }

  const handleReviewOrder = (order: PathologyOrder) => {
    setSelectedOrder(order)
    setActionNotes(order.followUpNotes || '')
    setEditedDiagnosis(order.diagnosis || '')
    setEditedMicroscopic(order.microscopicDescription || '')
    setEditedMargins(order.margins || '')
    setEditedPathologist(order.pathologistName || '')
    setEditedRecommendations(order.recommendations || '')
    setPatientNotified(order.patientNotified || false)
    setNotificationMethod(order.notificationMethod || 'Phone')
    setShowReviewModal(true)
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/pathology-orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          followUpNotes: actionNotes,
          dateReviewed: new Date().toISOString(),
          diagnosis: editedDiagnosis,
          microscopicDescription: editedMicroscopic,
          margins: editedMargins,
          pathologistName: editedPathologist,
          recommendations: editedRecommendations,
          patientNotified,
          notificationDate: patientNotified ? new Date().toISOString() : null,
          notificationMethod: patientNotified ? notificationMethod : null
        })
      })

      if (response.ok) {
        setShowReviewModal(false)
        setSelectedOrder(null)
        setActionNotes('')
        loadOrders()
      }
    } catch (err) {
      console.error('Error updating order:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      received: { label: 'Received', color: 'bg-blue-100 text-blue-700', icon: FileText },
      reviewed: { label: 'Reviewed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      needs_action: { label: 'Needs Action', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    )
  }

  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'received').length
  const needsActionCount = orders.filter(o => o.status === 'needs_action').length
  const overdueCount = orders.filter(o => o.daysPending > 7 && o.status === 'pending').length

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
            <Link href="/calendar" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Calendar
            </Link>
            <Link href="/check-in" className="text-clinical-600 hover:text-clinical-800 font-medium text-sm transition-colors">
              Check In
            </Link>
            <Link href="/inbox/pathology" className="text-dermis-600 font-medium text-sm border-b-2 border-dermis-500 relative">
              Pathology
              {(needsActionCount > 0 || pendingCount > 0) && (
                <span className="absolute -top-1 -right-4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {needsActionCount + pendingCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Microscope className="w-6 h-6 text-dermis-600" />
            <h1 className="text-3xl font-display font-bold text-clinical-900">Pathology Inbox</h1>
          </div>
          <p className="text-clinical-600">
            Track and review biopsy results
          </p>

          {/* Alert for overdue results */}
          {overdueCount > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-900">Attention Required</div>
                <div className="text-sm text-red-700 mt-0.5">
                  You have {overdueCount} pathology result{overdueCount === 1 ? '' : 's'} pending for more than 7 days
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-dermis-600 text-white'
                  : 'bg-clinical-100 text-clinical-700 hover:bg-clinical-200'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-dermis-600 text-white'
                  : 'bg-clinical-100 text-clinical-700 hover:bg-clinical-200'
              }`}
            >
              Pending ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('received')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterStatus === 'received'
                  ? 'bg-dermis-600 text-white'
                  : 'bg-clinical-100 text-clinical-700 hover:bg-clinical-200'
              }`}
            >
              Received ({orders.filter(o => o.status === 'received').length})
            </button>
            <button
              onClick={() => setFilterStatus('needs_action')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterStatus === 'needs_action'
                  ? 'bg-dermis-600 text-white'
                  : 'bg-clinical-100 text-clinical-700 hover:bg-clinical-200'
              }`}
            >
              Needs Action ({needsActionCount})
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400" />
            <input
              type="text"
              className="input pl-10 w-full text-sm"
              placeholder="Search patient, site, or specimen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-dermis-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card p-8 text-center">
            <Microscope className="w-12 h-12 text-clinical-300 mx-auto mb-4" />
            <p className="text-clinical-600">No pathology orders found</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-clinical-50 border-b border-clinical-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-clinical-600 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-clinical-600 uppercase">Specimen</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-clinical-600 uppercase">Body Site</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-clinical-600 uppercase">Lab</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-clinical-600 uppercase">Date Sent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-clinical-600 uppercase">Days Pending</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-clinical-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-clinical-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinical-100">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-clinical-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/patients/${order.patientId}`}
                          className="font-medium text-dermis-600 hover:text-dermis-700"
                        >
                          {order.patientName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-clinical-800">
                        {order.specimenType}
                      </td>
                      <td className="px-4 py-3 text-sm text-clinical-800">
                        {order.bodySite}
                      </td>
                      <td className="px-4 py-3 text-sm text-clinical-600">
                        {order.labName || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-clinical-600">
                        {new Date(order.dateSent).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          order.daysPending > 7 ? 'text-red-600' : 'text-clinical-700'
                        }`}>
                          {order.daysPending} days
                          {order.daysPending > 7 && (
                            <AlertCircle className="w-4 h-4 inline ml-1 text-red-600" />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleReviewOrder(order)}
                          className="btn-secondary text-sm"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-clinical-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-clinical-900">
                  Pathology Result Review
                </h2>
                <p className="text-sm text-clinical-600 mt-1">
                  {selectedOrder.patientName} • {selectedOrder.bodySite}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-clinical-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-clinical-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-clinical-500 uppercase">Specimen Type</span>
                  <p className="text-sm text-clinical-800 mt-1">{selectedOrder.specimenType}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-clinical-500 uppercase">Body Site</span>
                  <p className="text-sm text-clinical-800 mt-1">{selectedOrder.bodySite}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-clinical-500 uppercase">Lab</span>
                  <p className="text-sm text-clinical-800 mt-1">{selectedOrder.labName || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-clinical-500 uppercase">Date Sent</span>
                  <p className="text-sm text-clinical-800 mt-1">
                    {new Date(selectedOrder.dateSent).toLocaleDateString()} ({selectedOrder.daysPending} days ago)
                  </p>
                </div>
              </div>

              {/* Path Report PDF */}
              {selectedOrder.pathReportUrl && (
                <div className="p-4 bg-clinical-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-dermis-600" />
                      <span className="text-sm font-medium text-clinical-800">Pathology Report PDF</span>
                    </div>
                    <a
                      href={selectedOrder.pathReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download
                    </a>
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Diagnosis
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Enter pathological diagnosis..."
                  value={editedDiagnosis}
                  onChange={(e) => setEditedDiagnosis(e.target.value)}
                />
              </div>

              {/* Margins Status */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Margins Status
                </label>
                <select
                  className="input w-full"
                  value={editedMargins}
                  onChange={(e) => setEditedMargins(e.target.value)}
                >
                  <option value="">Select margins status</option>
                  <option value="Clear">Clear</option>
                  <option value="Positive">Positive</option>
                  <option value="Close">Close</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </div>

              {/* Microscopic Description */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Microscopic Description
                </label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Enter detailed microscopic findings..."
                  value={editedMicroscopic}
                  onChange={(e) => setEditedMicroscopic(e.target.value)}
                />
              </div>

              {/* Pathologist Name */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Pathologist Name
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Dr. Name"
                  value={editedPathologist}
                  onChange={(e) => setEditedPathologist(e.target.value)}
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Pathologist Recommendations
                </label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Recommendations from pathologist..."
                  value={editedRecommendations}
                  onChange={(e) => setEditedRecommendations(e.target.value)}
                />
              </div>

              {/* Patient Notification */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Patient Notification</h4>
                      <p className="text-xs text-blue-700">Medico-legal documentation</p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={patientNotified}
                        onChange={(e) => setPatientNotified(e.target.checked)}
                        className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-800 font-medium">Patient has been notified of results</span>
                    </label>

                    {patientNotified && (
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1.5">
                          Notification Method
                        </label>
                        <select
                          className="input w-full text-sm"
                          value={notificationMethod}
                          onChange={(e) => setNotificationMethod(e.target.value)}
                        >
                          <option value="Phone">Phone Call</option>
                          <option value="Portal">Patient Portal</option>
                          <option value="Letter">Letter/Mail</option>
                          <option value="In-Person">In-Person</option>
                        </select>
                      </div>
                    )}

                    {selectedOrder.patientNotified && selectedOrder.notificationDate && (
                      <div className="text-xs text-blue-700">
                        Previously notified on {new Date(selectedOrder.notificationDate).toLocaleDateString()} via {selectedOrder.notificationMethod}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Follow-up Notes */}
              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Follow-up Notes
                </label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Add notes about follow-up actions..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-clinical-200">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/patients/${selectedOrder.patientId}`}
                    className="btn-secondary text-sm justify-center"
                    onClick={() => setShowReviewModal(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    View Patient Chart
                  </Link>

                  <Link
                    href={`/schedule?patientId=${selectedOrder.patientId}`}
                    className="btn-secondary text-sm justify-center"
                    onClick={() => setShowReviewModal(false)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Follow-up
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus('reviewed')}
                    disabled={isUpdating}
                    className="btn-primary text-sm"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Normal
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('needs_action')}
                    disabled={isUpdating}
                    className="btn-secondary text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Follow-up
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('needs_action')}
                    disabled={isUpdating}
                    className="btn-secondary text-sm bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                    Call Patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
