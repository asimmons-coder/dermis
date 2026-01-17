/**
 * Stedi Healthcare API Client
 *
 * Base client for interacting with Stedi's healthcare clearinghouse APIs.
 * Supports eligibility checks (270/271), claims submission (837P), and ERA retrieval (835).
 *
 * @see https://www.stedi.com/docs/healthcare
 */

// =============================================================================
// Configuration
// =============================================================================

const STEDI_BASE_URL = 'https://healthcare.us.stedi.com/2024-04-01'

// API key should be stored in environment variables
const getApiKey = (): string => {
  const apiKey = process.env.STEDI_API_KEY
  if (!apiKey) {
    throw new Error('STEDI_API_KEY environment variable is not set')
  }
  return apiKey
}

// =============================================================================
// Types
// =============================================================================

export interface StediRequestOptions {
  endpoint: string
  method: 'GET' | 'POST'
  body?: object
  headers?: Record<string, string>
}

export interface StediResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  rawResponse?: any
}

export interface StediErrorResponse {
  message: string
  code?: string
  errors?: Array<{
    field: string
    message: string
  }>
}

// =============================================================================
// Client
// =============================================================================

/**
 * Make a request to the Stedi Healthcare API
 */
export async function stediRequest<T>(
  options: StediRequestOptions
): Promise<StediResponse<T>> {
  const { endpoint, method, body, headers = {} } = options

  const url = `${STEDI_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Key ${getApiKey()}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const responseData = await response.json()

    if (!response.ok) {
      const errorData = responseData as StediErrorResponse
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.message || `Request failed with status ${response.status}`,
          details: errorData.errors,
        },
        rawResponse: responseData,
      }
    }

    return {
      success: true,
      data: responseData as T,
      rawResponse: responseData,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: errorMessage,
      },
    }
  }
}

/**
 * Check if Stedi is properly configured
 */
export function isStediConfigured(): boolean {
  try {
    getApiKey()
    return true
  } catch {
    return false
  }
}

/**
 * Get the Stedi environment mode based on API key
 */
export function getStediMode(): 'test' | 'production' {
  const apiKey = process.env.STEDI_API_KEY || ''
  return apiKey.startsWith('test_') ? 'test' : 'production'
}
