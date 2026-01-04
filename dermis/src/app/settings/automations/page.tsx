'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Settings,
  MessageSquare,
  Clock,
  Check,
  Mail,
  Phone,
  Loader2,
  Save,
  AlertCircle,
  Edit3
} from 'lucide-react'

interface AutomationSettings {
  id: string
  practice_id: string
  reminder_48hr_enabled: boolean
  reminder_48hr_channel: string
  reminder_24hr_enabled: boolean
  reminder_24hr_channel: string
  confirmation_enabled: boolean
  confirmation_channel: string
  post_visit_enabled: boolean
  post_visit_channel: string
  post_visit_delay_hours: number
  demo_mode: boolean
}

interface MessageTemplate {
  id: string
  name: string
  template_key: string
  channel: string
  subject: string | null
  body: string
  is_active: boolean
}

const PRACTICE_ID = '00000000-0000-0000-0000-000000000001' // TODO: Get from auth

export default function AutomationsPage() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([loadSettings(), loadTemplates()])
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/automation-settings?practiceId=${PRACTICE_ID}`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (err) {
      console.error('Failed to load automation settings:', err)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/message-templates?practiceId=${PRACTICE_ID}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/automation-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceId: PRACTICE_ID,
          ...settings
        })
      })

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/message-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editBody })
      })

      if (response.ok) {
        await loadTemplates()
        setEditingTemplate(null)
        setEditBody('')
      }
    } catch (err) {
      console.error('Failed to update template:', err)
      alert('Failed to update template')
    }
  }

  const getChannelDisplay = (channel: string) => {
    switch (channel) {
      case 'sms': return 'SMS'
      case 'email': return 'Email'
      case 'both': return 'Both'
      case 'off': return 'Off'
      default: return channel
    }
  }

  const getChannelIcon = (channel: string) => {
    if (channel.includes('sms')) return <Phone className="w-4 h-4" />
    if (channel.includes('email')) return <Mail className="w-4 h-4" />
    return <MessageSquare className="w-4 h-4" />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-dermis-500 animate-spin" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30 flex items-center justify-center">
        <p className="text-clinical-600">Settings not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="text-clinical-400 hover:text-clinical-600 transition-colors">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-display font-bold text-clinical-800">
                    Automated Patient Messaging
                  </h1>
                  <p className="text-xs text-clinical-500">Appointment reminders and notifications</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="btn-primary text-sm"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Settings saved successfully!</p>
          </div>
        )}

        {/* Demo Mode Alert */}
        {settings.demo_mode && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium mb-1">Demo Mode Active</p>
              <p className="text-sm text-blue-700">
                Messages will be logged but not actually sent. Disable demo mode to send real SMS/email notifications.
              </p>
              <button
                onClick={() => {
                  setSettings({ ...settings, demo_mode: false })
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Disable Demo Mode
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Appointment Confirmation */}
          <div className="card">
            <div className="px-6 py-4 border-b border-clinical-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <h2 className="font-display font-semibold text-clinical-800">Appointment Confirmation</h2>
                  <p className="text-sm text-clinical-600">Sent when appointment is booked</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.confirmation_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, confirmation_enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-dermis-600 rounded focus:ring-dermis-500"
                  />
                  <span className="text-sm font-medium text-clinical-700">Enable Confirmation</span>
                </label>
              </div>
              {settings.confirmation_enabled && (
                <div>
                  <label className="text-sm font-medium text-clinical-700 mb-2 block">Channel</label>
                  <select
                    value={settings.confirmation_channel}
                    onChange={(e) =>
                      setSettings({ ...settings, confirmation_channel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-clinical-200 rounded-lg focus:ring-2 focus:ring-dermis-500 focus:border-transparent"
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="both">Both</option>
                    <option value="off">Off</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 48 Hour Reminder */}
          <div className="card">
            <div className="px-6 py-4 border-b border-clinical-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="font-display font-semibold text-clinical-800">48 Hour Reminder</h2>
                  <p className="text-sm text-clinical-600">Sent 48 hours before appointment</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reminder_48hr_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, reminder_48hr_enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-dermis-600 rounded focus:ring-dermis-500"
                  />
                  <span className="text-sm font-medium text-clinical-700">Enable 48hr Reminder</span>
                </label>
              </div>
              {settings.reminder_48hr_enabled && (
                <div>
                  <label className="text-sm font-medium text-clinical-700 mb-2 block">Channel</label>
                  <select
                    value={settings.reminder_48hr_channel}
                    onChange={(e) =>
                      setSettings({ ...settings, reminder_48hr_channel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-clinical-200 rounded-lg focus:ring-2 focus:ring-dermis-500 focus:border-transparent"
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="both">Both</option>
                    <option value="off">Off</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 24 Hour Reminder */}
          <div className="card">
            <div className="px-6 py-4 border-b border-clinical-100 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <h2 className="font-display font-semibold text-clinical-800">24 Hour Reminder</h2>
                  <p className="text-sm text-clinical-600">Sent 24 hours before appointment</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reminder_24hr_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, reminder_24hr_enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-dermis-600 rounded focus:ring-dermis-500"
                  />
                  <span className="text-sm font-medium text-clinical-700">Enable 24hr Reminder</span>
                </label>
              </div>
              {settings.reminder_24hr_enabled && (
                <div>
                  <label className="text-sm font-medium text-clinical-700 mb-2 block">Channel</label>
                  <select
                    value={settings.reminder_24hr_channel}
                    onChange={(e) =>
                      setSettings({ ...settings, reminder_24hr_channel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-clinical-200 rounded-lg focus:ring-2 focus:ring-dermis-500 focus:border-transparent"
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="both">Both</option>
                    <option value="off">Off</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Post-Visit Follow-up */}
          <div className="card">
            <div className="px-6 py-4 border-b border-clinical-100 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-orange-600" />
                <div>
                  <h2 className="font-display font-semibold text-clinical-800">Post-Visit Follow-up</h2>
                  <p className="text-sm text-clinical-600">Thank you message + survey</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.post_visit_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, post_visit_enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-dermis-600 rounded focus:ring-dermis-500"
                  />
                  <span className="text-sm font-medium text-clinical-700">Enable Post-Visit</span>
                </label>
              </div>
              {settings.post_visit_enabled && (
                <>
                  <div>
                    <label className="text-sm font-medium text-clinical-700 mb-2 block">Channel</label>
                    <select
                      value={settings.post_visit_channel}
                      onChange={(e) =>
                        setSettings({ ...settings, post_visit_channel: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-clinical-200 rounded-lg focus:ring-2 focus:ring-dermis-500 focus:border-transparent"
                    >
                      <option value="email">Email</option>
                      <option value="off">Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-clinical-700 mb-2 block">
                      Delay (hours after visit)
                    </label>
                    <input
                      type="number"
                      value={settings.post_visit_delay_hours}
                      onChange={(e) =>
                        setSettings({ ...settings, post_visit_delay_hours: parseInt(e.target.value) || 24 })
                      }
                      min="1"
                      max="168"
                      className="w-full px-3 py-2 border border-clinical-200 rounded-lg focus:ring-2 focus:ring-dermis-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Message Templates */}
        <div className="mt-8 card">
          <div className="px-6 py-4 border-b border-clinical-100 bg-gradient-to-r from-dermis-50 to-blue-50">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-dermis-600" />
              <div>
                <h2 className="font-display font-semibold text-clinical-800">Message Templates</h2>
                <p className="text-sm text-clinical-600">
                  Customize your automated messages. Variables: {'{patient_name}'}, {'{provider}'}, {'{date}'}, {'{time}'}
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-clinical-100">
            {templates.map((template) => (
              <div key={template.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getChannelIcon(template.channel)}
                    <div>
                      <h3 className="font-semibold text-clinical-800">{template.name}</h3>
                      <p className="text-sm text-clinical-500">
                        Channel: {getChannelDisplay(template.channel)}
                      </p>
                    </div>
                  </div>
                  {editingTemplate === template.id ? (
                    <button
                      onClick={() => handleUpdateTemplate(template.id)}
                      className="btn-primary text-sm"
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTemplate(template.id)
                        setEditBody(template.body)
                      }}
                      className="btn-secondary text-sm"
                    >
                      <Edit3 className="w-4 h-4 mr-1.5" />
                      Edit
                    </button>
                  )}
                </div>
                {editingTemplate === template.id ? (
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-clinical-200 rounded-lg focus:ring-2 focus:ring-dermis-500 focus:border-transparent font-mono text-sm"
                  />
                ) : (
                  <p className="text-sm text-clinical-700 bg-clinical-50 p-3 rounded-lg font-mono">
                    {template.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
