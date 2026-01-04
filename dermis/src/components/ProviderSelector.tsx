'use client'

import { useEffect } from 'react'
import { User, ChevronDown } from 'lucide-react'
import { useProvider } from '@/contexts/ProviderContext'

export default function ProviderSelector() {
  const { selectedProvider, setSelectedProvider, providers, setProviders } = useProvider()

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      const practiceId = '00000000-0000-0000-0000-000000000001'
      const response = await fetch(`/api/providers?practiceId=${practiceId}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])

        // Auto-select first provider if no provider is selected
        if (!selectedProvider && data.providers && data.providers.length > 0) {
          setSelectedProvider(data.providers[0])
        }
      }
    } catch (err) {
      console.error('Failed to load providers:', err)
    }
  }

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const providerId = e.target.value
    const provider = providers.find(p => p.id === providerId)
    setSelectedProvider(provider || null)
  }

  if (providers.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-clinical-50 rounded-lg border border-clinical-200">
        <User className="w-4 h-4 text-clinical-500" />
        <select
          value={selectedProvider?.id || ''}
          onChange={handleProviderChange}
          className="text-sm font-medium text-clinical-700 bg-transparent border-none outline-none cursor-pointer pr-6 appearance-none"
          style={{ backgroundImage: 'none' }}
        >
          <option value="">Select Provider</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.fullName}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-clinical-400 absolute right-3 pointer-events-none" />
      </div>
    </div>
  )
}
