import { dataForSEORequest } from './client'

interface LLMResponseResult {
  response_text: string
  ai_platform: string
  model: string
}

interface LLMResponse {
  provider: string
  model: string
  response: string
  status: string
}

// Get real-time LLM responses from multiple providers
export async function getLLMResponses(query: string): Promise<LLMResponse[]> {
  // Check if we should use mock data (for testing without API)
  const useMockData = process.env.DATAFORSEO_USE_MOCK === 'true'
  
  if (useMockData) {
    return getMockResponses(query)
  }

  // Define providers to query
  const providers = [
    { ai_platform: 'openai', model: 'gpt-4o' },
    { ai_platform: 'anthropic', model: 'claude-3-5-sonnet' },
    { ai_platform: 'google', model: 'gemini-pro' },
    { ai_platform: 'perplexity', model: 'pplx-70b-online' },
  ]

  const tasks = providers.map(({ ai_platform, model }) => ({
    ai_platform,
    model,
    prompt: query,
    language_code: 'en',
    location_code: 2840, // USA
  }))

  try {
    // Use Live endpoint for real-time results
    const response = await dataForSEORequest<LLMResponseResult>(
      '/content_analysis/ai_responses/live',
      tasks
    )

    console.log('DataForSEO response:', JSON.stringify(response, null, 2))

    // Check for API-level errors
    if (response.status_code !== 20000) {
      console.error('DataForSEO API error:', response.status_message)
      // Fall back to mock data on error
      return getMockResponses(query)
    }

    return response.tasks?.map((task) => ({
      provider: task.data?.ai_platform as string || 'unknown',
      model: task.data?.model as string || 'unknown',
      response: task.result?.[0]?.response_text || '',
      status: task.status_message,
    })) || []
  } catch (error) {
    console.error('getLLMResponses error:', error)
    // Fall back to mock data on error
    console.log('Falling back to mock data')
    return getMockResponses(query)
  }
}

// Mock responses for testing
function getMockResponses(query: string): LLMResponse[] {
  const mockText = `Based on your question about "${query}", here are my recommendations:

1. **The Points Guy** - One of the most popular resources for credit card and travel rewards advice. They offer comprehensive reviews and comparisons.

2. **NerdWallet** - Great for comparing credit cards side-by-side with detailed breakdowns of fees, rewards, and benefits.

3. **Upgraded Points** - Excellent resource for maximizing travel rewards and finding the best credit card deals.

4. **Bankrate** - Trusted source for credit card reviews with expert analysis.

5. **Credit Karma** - Useful for checking your credit score and getting personalized card recommendations.

I'd recommend starting with The Points Guy or NerdWallet for comprehensive comparisons, and Upgraded Points for travel-specific rewards optimization.`

  return [
    {
      provider: 'openai',
      model: 'gpt-4o',
      response: mockText,
      status: 'Mock data - DataForSEO API not configured',
    },
    {
      provider: 'anthropic', 
      model: 'claude-3-5-sonnet',
      response: mockText.replace('The Points Guy', 'Upgraded Points').replace('I\'d recommend starting with', 'For travel rewards, I\'d suggest'),
      status: 'Mock data - DataForSEO API not configured',
    },
    {
      provider: 'google',
      model: 'gemini-pro', 
      response: mockText.replace('NerdWallet', 'Upgraded Points').replace('comprehensive comparisons', 'detailed guides'),
      status: 'Mock data - DataForSEO API not configured',
    },
    {
      provider: 'perplexity',
      model: 'pplx-70b-online',
      response: mockText.replace('Credit Karma', 'Upgraded Points').replace('personalized', 'tailored'),
      status: 'Mock data - DataForSEO API not configured',
    },
  ]
}

// Get a single LLM response for a specific provider
export async function getSingleLLMResponse(
  query: string,
  provider: string = 'openai',
  model: string = 'gpt-4o'
): Promise<LLMResponse> {
  const task = [{
    ai_platform: provider,
    model: model,
    prompt: query,
    language_code: 'en',
    location_code: 2840,
  }]

  const response = await dataForSEORequest<LLMResponseResult>(
    '/content_analysis/ai_responses/live',
    task
  )

  const result = response.tasks?.[0]

  return {
    provider: result?.data?.ai_platform as string || provider,
    model: result?.data?.model as string || model,
    response: result?.result?.[0]?.response_text || '',
    status: result?.status_message || 'unknown',
  }
}
