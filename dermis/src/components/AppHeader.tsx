'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Stethoscope,
  Home,
  Calendar,
  Users,
  Bell,
  Search,
  Command,
  Zap
} from 'lucide-react'
import ProviderSelector from './ProviderSelector'
import GlobalSearch from './GlobalSearch'

interface InboxItem {
  label: string
  count: number
  href: string
}

export default function AppHeader() {
  const pathname = usePathname()
  const [showInboxDropdown, setShowInboxDropdown] = useState(false)
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([
    { label: 'Pathology Results', count: 0, href: '/inbox/pathology' },
    { label: 'Unsigned Notes', count: 0, href: '/inbox/unsigned' }
  ])

  // Calculate total inbox count
  const totalInboxCount = inboxItems.reduce((sum, item) => sum + item.count, 0)

  // Load inbox counts
  useEffect(() => {
    loadInboxCounts()
  }, [])

  const loadInboxCounts = async () => {
    // TODO: Implement API calls to get actual counts
    // For now, using placeholder data
    setInboxItems([
      { label: 'Pathology Results', count: 3, href: '/inbox/pathology' },
      { label: 'Unsigned Notes', count: 2, href: '/inbox/unsigned' }
    ])
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  return (
    <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Logo + Provider Selector */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-clinical-800">Dermis</h1>
                <p className="text-xs text-clinical-500">by Novice Group</p>
              </div>
            </Link>

            <ProviderSelector />
          </div>

          {/* Center: Primary Navigation */}
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isActive('/dashboard')
                  ? 'bg-dermis-100 text-dermis-700'
                  : 'text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/schedule"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isActive('/schedule')
                  ? 'bg-dermis-100 text-dermis-700'
                  : 'text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </Link>
            <Link
              href="/patients"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isActive('/patients')
                  ? 'bg-dermis-100 text-dermis-700'
                  : 'text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Patients
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowInboxDropdown(!showInboxDropdown)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors relative ${
                  pathname.startsWith('/inbox')
                    ? 'bg-dermis-100 text-dermis-700'
                    : 'text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                Inbox
                {totalInboxCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-coral text-white text-xs font-bold flex items-center justify-center">
                    {totalInboxCount}
                  </span>
                )}
              </button>

              {showInboxDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowInboxDropdown(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-clinical-lg border border-clinical-100 py-2 z-50">
                    {inboxItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowInboxDropdown(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-clinical-50 transition-colors"
                      >
                        <span className="text-sm text-clinical-700">{item.label}</span>
                        {item.count > 0 && (
                          <span className="px-2 py-1 rounded-full bg-accent-coral text-white text-xs font-bold">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Link
              href="/integrations"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isActive('/integrations')
                  ? 'bg-dermis-100 text-dermis-700'
                  : 'text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50'
              }`}
            >
              <Zap className="w-4 h-4" />
              Integrations
            </Link>
          </nav>

          {/* Right: Search + Sign In */}
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <button className="btn-primary text-sm">Sign In</button>
          </div>
        </div>
      </div>
    </header>
  )
}
