'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Provider {
  id: string
  name: string
  fullName: string
  firstName: string
  lastName: string
}

interface ProviderContextType {
  selectedProvider: Provider | null
  setSelectedProvider: (provider: Provider | null) => void
  providers: Provider[]
  setProviders: (providers: Provider[]) => void
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined)

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [selectedProvider, setSelectedProviderState] = useState<Provider | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])

  // Load selected provider from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('selectedProvider')
    if (stored) {
      try {
        setSelectedProviderState(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored provider:', e)
      }
    }
  }, [])

  // Save selected provider to localStorage when it changes
  const setSelectedProvider = (provider: Provider | null) => {
    setSelectedProviderState(provider)
    if (provider) {
      localStorage.setItem('selectedProvider', JSON.stringify(provider))
    } else {
      localStorage.removeItem('selectedProvider')
    }
  }

  return (
    <ProviderContext.Provider
      value={{
        selectedProvider,
        setSelectedProvider,
        providers,
        setProviders,
      }}
    >
      {children}
    </ProviderContext.Provider>
  )
}

export function useProvider() {
  const context = useContext(ProviderContext)
  if (context === undefined) {
    throw new Error('useProvider must be used within a ProviderProvider')
  }
  return context
}
