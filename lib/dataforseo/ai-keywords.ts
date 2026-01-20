import { dataForSEORequest } from './client'

interface AIKeywordResult {
  keyword: string
  ai_search_volume: number
  user_intent: string
  competition: string
  cpc: number
  monthly_searches: Array<{
    year: number
    month: number
    search_volume: number
  }>
}

interface AIKeywordData {
  keyword: string
  aiSearchVolume: number
  userIntent: string
  competition: string
  cpc: number
  trend: 'up' | 'down' | 'stable'
}

// Get AI search volume and intent data for keywords
export async function getAIKeywordData(keywords: string[]): Promise<AIKeywordData[]> {
  if (keywords.length === 0) return []

  const tasks = keywords.map(keyword => ({
    keyword,
    location_code: 2840, // USA
    language_code: 'en',
  }))

  try {
    const response = await dataForSEORequest<AIKeywordResult>(
      '/keywords_data/google_ads/search_volume/live',
      tasks
    )

    return response.tasks?.map((task) => {
      const result = task.result?.[0]
      const searches = result?.monthly_searches || []
      
      // Calculate trend
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (searches.length >= 2) {
        const recent = searches.slice(-3).reduce((a, b) => a + b.search_volume, 0) / 3
        const older = searches.slice(-6, -3).reduce((a, b) => a + b.search_volume, 0) / 3
        if (recent > older * 1.1) trend = 'up'
        else if (recent < older * 0.9) trend = 'down'
      }

      return {
        keyword: task.data?.keyword as string || '',
        aiSearchVolume: result?.ai_search_volume || 0,
        userIntent: result?.user_intent || 'unknown',
        competition: result?.competition || 'unknown',
        cpc: result?.cpc || 0,
        trend,
      }
    }) || []
  } catch (error) {
    console.error('getAIKeywordData error:', error)
    return keywords.map(keyword => ({
      keyword,
      aiSearchVolume: 0,
      userIntent: 'unknown',
      competition: 'unknown',
      cpc: 0,
      trend: 'stable' as const,
    }))
  }
}

// Get search volume for a single keyword
export async function getSingleKeywordData(keyword: string): Promise<AIKeywordData | null> {
  const results = await getAIKeywordData([keyword])
  return results[0] || null
}
