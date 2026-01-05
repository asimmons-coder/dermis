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
  Zap,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/patients', label: 'Patients', icon: Users },
    { href: '/integrations', label: 'Integrations', icon: Zap },
  ]

  return (
    <header className="border-b border-clinical-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo + Provider Selector */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-dermis-500 to-dermis-600 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-display font-bold text-clinical-800">Dermis</h1>
                <p className="text-xs text-clinical-500">by Novice Group</p>
              </div>
            </Link>

            <div className="hidden lg:block">
              <ProviderSelector />
            </div>
          </div>

          {/* Center: Primary Navigation - Desktop only */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isActive(link.href)
                      ? 'bg-dermis-100 text-dermis-700'
                      : 'text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              )
            })}

            {/* Inbox Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowInboxDropdown(!showInboxDropdown)}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-medium text-sm transition-colors relative ${
                  pathname.startsWith('/inbox')
                    ? 'bg-dermis-100 text-dermis-700'
                    : 'text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden lg:inline">Inbox</span>
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
          </nav>

          {/* Right: Search + Sign In + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
            <button className="hidden sm:flex btn-primary text-sm">Sign In</button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-clinical-600 hover:bg-clinical-50"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-clinical-100 pt-4">
            {/* Mobile Search */}
            <div className="mb-4">
              <GlobalSearch />
            </div>

            {/* Mobile Provider Selector */}
            <div className="mb-4">
              <ProviderSelector />
            </div>

            {/* Mobile Nav Links */}
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-dermis-100 text-dermis-700'
                        : 'text-clinical-600 hover:text-clinical-800 hover:bg-clinical-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                )
              })}

              {/* Mobile Inbox */}
              <div className="border-t border-clinical-100 pt-2 mt-2">
                <p className="px-4 py-2 text-xs font-semibold text-clinical-500 uppercase tracking-wide">
                  Inbox
                </p>
                {inboxItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-3 rounded-lg text-clinical-600 hover:bg-clinical-50 transition-colors"
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.count > 0 && (
                      <span className="px-2 py-1 rounded-full bg-accent-coral text-white text-xs font-bold">
                        {item.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Mobile Sign In */}
            <div className="mt-4 pt-4 border-t border-clinical-100">
              <button className="btn-primary w-full">Sign In</button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
