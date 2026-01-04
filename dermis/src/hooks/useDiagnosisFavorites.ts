import { useState, useCallback, useEffect } from 'react'

export interface DiagnosisCode {
  code: string
  description: string
}

interface CodeUsage extends DiagnosisCode {
  count: number
  lastUsed: string
}

export function useDiagnosisFavorites(providerId: string) {
  const [codeUsage, setCodeUsage] = useState<Record<string, CodeUsage>>({})

  // Load usage data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && providerId) {
      const key = `dermis_code_usage_${providerId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          setCodeUsage(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse code usage data:', e)
        }
      }
    }
  }, [providerId])

  // Track usage of a code
  const trackCodeUsage = useCallback((code: DiagnosisCode) => {
    if (!providerId) return

    setCodeUsage((prev) => {
      const existing = prev[code.code]
      const updated = {
        ...prev,
        [code.code]: {
          ...code,
          count: existing ? existing.count + 1 : 1,
          lastUsed: new Date().toISOString()
        }
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        const key = `dermis_code_usage_${providerId}`
        localStorage.setItem(key, JSON.stringify(updated))
      }

      return updated
    })
  }, [providerId])

  // Get frequently used codes (top N by usage count)
  const getFrequentlyUsed = useCallback((limit: number = 10): DiagnosisCode[] => {
    return Object.values(codeUsage)
      .sort((a, b) => {
        // Sort by count (descending), then by lastUsed (most recent first)
        if (b.count !== a.count) {
          return b.count - a.count
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      })
      .slice(0, limit)
      .map(({ code, description }) => ({ code, description }))
  }, [codeUsage])

  // Get recently used codes (by last used date)
  const getRecentlyUsed = useCallback((limit: number = 5): DiagnosisCode[] => {
    return Object.values(codeUsage)
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, limit)
      .map(({ code, description }) => ({ code, description }))
  }, [codeUsage])

  return {
    trackCodeUsage,
    getFrequentlyUsed,
    getRecentlyUsed
  }
}
