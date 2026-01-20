const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3'
// Use sandbox for testing: 'https://sandbox.dataforseo.com/v3'

function getAuthHeader(): string {
  const credentials = `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  const encoded = Buffer.from(credentials).toString('base64')
  return `Basic ${encoded}`
}

export interface DataForSEOResponse<T = unknown> {
  version: string
  status_code: number
  status_message: string
  time: string
  cost: number
  tasks_count: number
  tasks_error: number
  tasks: Array<{
    id: string
    status_code: number
    status_message: string
    time: string
    cost: number
    result_count: number
    path: string[]
    data: Record<string, unknown>
    result: T[]
  }>
}

export async function dataForSEORequest<T = unknown>(
  endpoint: string,
  data: unknown[]
): Promise<DataForSEOResponse<T>> {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.')
  }

  const response = await fetch(`${DATAFORSEO_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DataForSEO API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

// Test the connection
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${DATAFORSEO_API_URL}/appendix/user_data`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
      },
    })
    return response.ok
  } catch {
    return false
  }
}
