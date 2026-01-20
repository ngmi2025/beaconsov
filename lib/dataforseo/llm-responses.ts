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

    return response.tasks?.map((task) => ({
      provider: task.data?.ai_platform as string || 'unknown',
      model: task.data?.model as string || 'unknown',
      response: task.result?.[0]?.response_text || '',
      status: task.status_message,
    })) || []
  } catch (error) {
    console.error('getLLMResponses error:', error)
    throw error
  }
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
