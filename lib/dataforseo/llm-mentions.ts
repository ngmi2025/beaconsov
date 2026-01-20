import { dataForSEORequest } from './client'

interface MentionResult {
  keyword: string
  ai_search_volume: number
  impressions: number
  mentions: Array<{
    brand: string
    mention_count: number
    sentiment: string
    context: string
  }>
  brand_mentions: string[]
  mention_counts: Record<string, number>
}

interface BrandMentionData {
  keyword: string
  aiSearchVolume: number
  impressions: number
  mentions: Array<{
    brand: string
    mentionCount: number
    sentiment: string
    context: string
  }>
  brandData: Array<{
    brand: string
    mentioned: boolean
    mentionCount: number
    sentiment: string
  }>
}

// Get brand/keyword mentions data from LLMs
export async function getBrandMentions(
  keyword: string,
  brands: string[]
): Promise<BrandMentionData> {
  const tasks = [{
    keyword: keyword,
    target_brands: brands,
    location_code: 2840, // USA
    language_code: 'en',
  }]

  try {
    const response = await dataForSEORequest<MentionResult>(
      '/content_analysis/ai_mentions/live',
      tasks
    )

    const result = response.tasks?.[0]?.result?.[0]

    if (!result) {
      return {
        keyword,
        aiSearchVolume: 0,
        impressions: 0,
        mentions: [],
        brandData: brands.map(brand => ({
          brand,
          mentioned: false,
          mentionCount: 0,
          sentiment: 'neutral',
        })),
      }
    }

    return {
      keyword,
      aiSearchVolume: result.ai_search_volume || 0,
      impressions: result.impressions || 0,
      mentions: (result.mentions || []).map(m => ({
        brand: m.brand,
        mentionCount: m.mention_count,
        sentiment: m.sentiment,
        context: m.context,
      })),
      brandData: brands.map(brand => {
        const mention = result.mentions?.find(m => 
          m.brand.toLowerCase() === brand.toLowerCase()
        )
        return {
          brand,
          mentioned: result.brand_mentions?.includes(brand) || !!mention,
          mentionCount: result.mention_counts?.[brand] || mention?.mention_count || 0,
          sentiment: mention?.sentiment || 'neutral',
        }
      }),
    }
  } catch (error) {
    console.error('getBrandMentions error:', error)
    // Return empty data on error
    return {
      keyword,
      aiSearchVolume: 0,
      impressions: 0,
      mentions: [],
      brandData: brands.map(brand => ({
        brand,
        mentioned: false,
        mentionCount: 0,
        sentiment: 'neutral',
      })),
    }
  }
}

// Detect brands mentioned in a text response using simple matching
// (Fallback if AI detection isn't available)
export function detectBrandsInText(
  text: string,
  brands: Array<{ id: string; name: string; aliases: string[] | null }>
): { mentioned: string[]; recommended: string[] } {
  const textLower = text.toLowerCase()
  const mentioned: string[] = []
  const recommended: string[] = []

  // Positive recommendation indicators
  const positiveIndicators = [
    'recommend',
    'suggest',
    'best',
    'top choice',
    'excellent',
    'great option',
    'highly rated',
    'popular choice',
    'widely used',
    'industry leader',
  ]

  for (const brand of brands) {
    const namesToCheck = [brand.name, ...(brand.aliases || [])]
    
    for (const name of namesToCheck) {
      if (textLower.includes(name.toLowerCase())) {
        if (!mentioned.includes(brand.id)) {
          mentioned.push(brand.id)
        }
        
        // Check if the brand is recommended (appears near positive words)
        const brandIndex = textLower.indexOf(name.toLowerCase())
        const contextStart = Math.max(0, brandIndex - 100)
        const contextEnd = Math.min(textLower.length, brandIndex + name.length + 100)
        const context = textLower.slice(contextStart, contextEnd)
        
        const isRecommended = positiveIndicators.some(indicator => 
          context.includes(indicator)
        )
        
        if (isRecommended && !recommended.includes(brand.id)) {
          recommended.push(brand.id)
        }
        
        break // Found this brand, move to next
      }
    }
  }

  return { mentioned, recommended }
}
