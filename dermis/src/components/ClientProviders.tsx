'use client'

import { ProviderProvider } from '@/contexts/ProviderContext'
import GlobalSearch from '@/components/GlobalSearch'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ProviderProvider>
      {children}
      <GlobalSearch />
    </ProviderProvider>
  )
}
