'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  User,
  MessageSquare,
  Plus,
  Loader2,
  Camera,
  FileText,
  CreditCard,
  Sparkles,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  AlertCircle,
  Check,
  Clock,
  ArrowDown,
  ArrowUp,
  X,
  Calendar,
  UserCircle
} from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  mrn: string
}

interface Communication {
  id: string
  communication_date: string
  communication_type: string
  direction: string
  subject: string
  notes: string
  follow_up_needed: boolean
  follow_up_due_date?: string
  follow_up_completed: boolean
  logged_by_name: string
  created_at: string
  is_automated?: boolean
  status?: string
}

export default function PatientMessagesPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [communications, setCommunications] = useState<Communication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [overdueCount, setOverdueCount] = useState(0)

  const [formData, setFormData] = useState({
    communication_type: 'Phone',
    direction: 'Outbound',
    subject: '',
    notes: '',
    follow_up_needed: false,
    follow_up_due_date: ''
  })

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadPatient(),
        loadCommunications()
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const loadPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data.patient)
      }
    } catch (err) {
      console.error('Failed to load patient:', err)
    }
  }

  const loadCommunications = async () => {
    try {
      // Load both manual communications and automated messages
      const [commResponse, autoResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}/communications`),
        fetch(`/api/automated-messages?patientId=${patientId}`)
      ])

      const allCommunications: Communication[] = []

      // Add manual communications
      if (commResponse.ok) {
        const data = await commResponse.json()
        allCommunications.push(...(data.communications || []).map((c: any) => ({
          ...c,
          is_automated: false
        })))
      }

      // Add automated messages
      if (autoResponse.ok) {
        const data = await autoResponse.json()
        allCommunications.push(...(data.messages || []).map((m: any) => ({
          id: m.id,
          communication_date: m.sent_at || m.scheduled_for || m.created_at,
          communication_type: m.channel === 'sms' ? 'SMS' : 'Email',
          direction: 'Outbound',
          subject: m.message_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          notes: m.message_body,
          follow_up_needed: false,
          follow_up_completed: false,
          logged_by_name: 'System',
          created_at: m.created_at,
          is_automated: true,
          status: m.status
        })))
      }

      // Sort by date (newest first)
      allCommunications.sort((a, b) =>
        new Date(b.communication_date).getTime() - new Date(a.communication_date).getTime()
      )

      setCommunications(allCommunications)

      // Count overdue follow-ups (only from manual communications)
      const today = new Date().toISOString().split('T')[0]
      const overdue = allCommunications.filter((c: Communication) =>
        !c.is_automated &&
        c.follow_up_needed &&
        !c.follow_up_completed &&
        c.follow_up_due_date &&
        c.follow_up_due_date < today
      ).length
      setOverdueCount(overdue)
    } catch (err) {
      console.error('Failed to load communications:', err)
    }
  }

  const handleAddCommunication = async () => {
    if (!formData.subject.trim()) {
      alert('Please enter a subject')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/patients/${patientId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadCommunications()
        setShowAddModal(false)
        setFormData({
          communication_type: 'Phone',
          direction: 'Outbound',
          subject: '',
          notes: '',
          follow_up_needed: false,
          follow_up_due_date: ''
        })
      }
    } catch (err) {
      console.error('Failed to add communication:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkFollowUpComplete = async (commId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/communications/${commId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follow_up_completed: true,
          follow_up_completed_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        await loadCommunications()
      }
    } catch (err) {
      console.error('Failed to mark follow-up complete:', err)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Phone': return <Phone className="w-4 h-4" />
      case 'Email': return <Mail className="w-4 h-4" />
      case 'SMS': return <MessageCircle className="w-4 h-4" />
      case 'Portal': return <Globe className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getDirectionIcon = (direction: string) => {
    return direction === 'Inbound' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const isOverdue = (comm: Communication) => {
    if (!comm.follow_up_needed || comm.follow_up_completed || !comm.follow_up_due_date) {
      return false
    }
    const today = new Date().toISOString().split('T')[0]
    return comm.follow_up_due_date < today
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-dermis-500 animate-spin" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <p className="text-clinical-600">Patient not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href={`/patients/${patient.id}`} className="text-clinical-400 hover:text-clinical-600 transition-colors">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-display font-bold text-clinical-800">
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <p className="text-xs text-clinical-500">Communication Log</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Communication
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-clinical-200 -mb-px overflow-x-auto">
            <Link
              href={`/patients/${patient.id}`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Chart
            </Link>
            <Link
              href={`/patients/${patient.id}/photos`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              Photos
            </Link>
            <Link
              href={`/patients/${patient.id}/cosmetic`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Cosmetic
            </Link>
            <Link
              href={`/patients/${patient.id}/products`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-clinical-600 hover:text-clinical-800 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              Products
            </Link>
            <Link
              href={`/patients/${patient.id}/messages`}
              className="px-4 py-2 text-sm font-medium border-b-2 border-dermis-500 text-dermis-600 flex items-center gap-2 whitespace-nowrap relative"
            >
              <MessageSquare className="w-4 h-4" />
              Messages
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {overdueCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Communication Log */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-clinical-100 bg-gradient-to-r from-dermis-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-dermis-600" />
                <div>
                  <h2 className="font-display font-semibold text-clinical-800">Communication History</h2>
                  <p className="text-sm text-clinical-600">
                    {communications.length} communication{communications.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {communications.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-clinical-300 mx-auto mb-3" />
              <p className="text-clinical-500 mb-4">No communications logged yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Communication
              </button>
            </div>
          ) : (
            <div className="divide-y divide-clinical-100">
              {communications.map((comm) => (
                <div
                  key={comm.id}
                  className={`p-6 hover:bg-clinical-50/50 transition-colors ${
                    isOverdue(comm) ? 'bg-red-50/30 border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          comm.direction === 'Inbound' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <div className={comm.direction === 'Inbound' ? 'text-blue-600' : 'text-green-600'}>
                            {getTypeIcon(comm.communication_type)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-clinical-800">{comm.subject}</h3>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              comm.direction === 'Inbound'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {getDirectionIcon(comm.direction)}
                              {comm.direction}
                            </div>
                            {comm.is_automated && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                <MessageSquare className="w-3 h-3" />
                                Automated
                                {comm.status === 'demo' && ' (Demo)'}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-clinical-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(comm.communication_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              {getTypeIcon(comm.communication_type)}
                              {comm.communication_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserCircle className="w-3.5 h-3.5" />
                              {comm.logged_by_name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {comm.notes && (
                        <div className="ml-13 mb-3">
                          <p className="text-sm text-clinical-700 whitespace-pre-wrap">{comm.notes}</p>
                        </div>
                      )}

                      {/* Follow-up */}
                      {comm.follow_up_needed && (
                        <div className="ml-13">
                          {comm.follow_up_completed ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Check className="w-4 h-4" />
                              Follow-up completed
                            </div>
                          ) : (
                            <div className={`flex items-center gap-3 p-3 rounded-lg ${
                              isOverdue(comm) ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                            }`}>
                              <div className="flex items-center gap-2 flex-1">
                                <AlertCircle className={`w-4 h-4 ${isOverdue(comm) ? 'text-red-600' : 'text-amber-600'}`} />
                                <span className={`text-sm font-medium ${isOverdue(comm) ? 'text-red-700' : 'text-amber-700'}`}>
                                  Follow-up {isOverdue(comm) ? 'overdue' : 'needed'}
                                  {comm.follow_up_due_date && ` by ${new Date(comm.follow_up_due_date).toLocaleDateString()}`}
                                </span>
                              </div>
                              <button
                                onClick={() => handleMarkFollowUpComplete(comm.id)}
                                className="btn-secondary text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Complete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Communication Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-clinical-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-semibold text-clinical-800">
                  Add Communication
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-clinical-400 hover:text-clinical-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-clinical-700 mb-2">
                    Type
                  </label>
                  <select
                    className="input w-full"
                    value={formData.communication_type}
                    onChange={(e) => setFormData({ ...formData, communication_type: e.target.value })}
                  >
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="Portal">Portal</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-clinical-700 mb-2">
                    Direction
                  </label>
                  <select
                    className="input w-full"
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  >
                    <option value="Outbound">Outbound (We contacted patient)</option>
                    <option value="Inbound">Inbound (Patient contacted us)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., Left voicemail about test results"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="input w-full"
                  rows={4}
                  placeholder="Additional details about this communication..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="border-t border-clinical-200 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-clinical-300 text-dermis-600 focus:ring-dermis-500"
                    checked={formData.follow_up_needed}
                    onChange={(e) => setFormData({ ...formData, follow_up_needed: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-clinical-700">Follow-up needed</span>
                </label>

                {formData.follow_up_needed && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-clinical-700 mb-2">
                      Follow-up Due Date
                    </label>
                    <input
                      type="date"
                      className="input w-full"
                      value={formData.follow_up_due_date}
                      onChange={(e) => setFormData({ ...formData, follow_up_due_date: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-clinical-100 flex gap-3 bg-clinical-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCommunication}
                className="flex-1 btn-primary"
                disabled={isSaving || !formData.subject.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Communication
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
