// Dummy data generators for development and demo purposes

export interface LeaderboardEntry {
  brand: string
  brandId: string
  isYourBrand: boolean
  mentions: number
  totalResponses: number
  sov: number
  trend: '↑' | '↓' | '→'
  trendValue: number
  rank: number
}

export interface TrendDataPoint {
  date: string
  label: string
  [brand: string]: string | number
}

export interface KeywordSOV {
  keyword: string
  keywordId: string
  yourSOV: number
  leader: string
  leaderSOV: number
  totalResponses: number
}

// Generate realistic SOV leaderboard data
export function generateLeaderboard(
  yourBrands: { id: string; name: string }[],
  competitors: { id: string; name: string }[]
): LeaderboardEntry[] {
  const allBrands = [
    ...yourBrands.map(b => ({ ...b, isYourBrand: true })),
    ...competitors.map(b => ({ ...b, isYourBrand: false })),
  ]

  const totalResponses = 80
  let remainingMentions = totalResponses

  // Sort randomly first, then by mentions
  const shuffled = allBrands.sort(() => Math.random() - 0.5)

  const entries = shuffled.map((brand, index) => {
    const isLast = index === shuffled.length - 1
    const mentions = isLast
      ? remainingMentions
      : Math.floor(Math.random() * (remainingMentions / (shuffled.length - index))) + 3
    
    remainingMentions -= mentions

    const trendOptions: ('↑' | '↓' | '→')[] = ['↑', '↓', '→']
    const trend = trendOptions[Math.floor(Math.random() * 3)]
    const trendValue = trend === '→' ? 0 : Math.floor(Math.random() * 8) + 1

    return {
      brand: brand.name,
      brandId: brand.id,
      isYourBrand: brand.isYourBrand,
      mentions,
      totalResponses,
      sov: Math.round((mentions / totalResponses) * 100),
      trend,
      trendValue: trend === '↓' ? -trendValue : trendValue,
      rank: 0,
    }
  })

  // Sort by SOV and assign ranks
  return entries
    .sort((a, b) => b.sov - a.sov)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

// Generate time-series SOV data for trends chart
export function generateTrendData(
  brands: { id: string; name: string; isYourBrand: boolean }[],
  weeks: number = 8
): TrendDataPoint[] {
  const data: TrendDataPoint[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (weeks * 7))

  for (let i = 0; i < weeks; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + (i * 7))

    let remaining = 100
    const point: TrendDataPoint = {
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }

    // Generate SOV for each brand that roughly sums to ~100%
    const shuffled = [...brands].sort(() => Math.random() - 0.5)
    
    shuffled.forEach((brand, index) => {
      if (index === shuffled.length - 1) {
        point[brand.name] = Math.max(remaining, 5)
      } else {
        // Add some trend continuity - your brand should generally trend up
        const baseShare = brand.isYourBrand 
          ? 25 + (i * 2) + Math.floor(Math.random() * 10) 
          : Math.floor(Math.random() * (remaining / (shuffled.length - index))) + 5
        
        const share = Math.min(baseShare, remaining - 5)
        point[brand.name] = share
        remaining -= share
      }
    })

    data.push(point)
  }

  return data
}

// Generate per-keyword SOV breakdown
export function generateKeywordSOV(
  keywords: { id: string; keyword: string }[],
  yourBrand: string,
  competitors: string[]
): KeywordSOV[] {
  const allBrands = [yourBrand, ...competitors]

  return keywords.map(kw => {
    // Randomly pick a leader
    const shuffled = [...allBrands].sort(() => Math.random() - 0.5)
    const leader = shuffled[0]
    const leaderSOV = 25 + Math.floor(Math.random() * 50)
    
    // Your SOV - sometimes you're the leader
    const yourSOV = leader === yourBrand 
      ? leaderSOV 
      : Math.floor(Math.random() * (100 - leaderSOV))

    return {
      keyword: kw.keyword,
      keywordId: kw.id,
      yourSOV,
      leader: leader === yourBrand ? 'You! 🎉' : leader,
      leaderSOV: leader === yourBrand ? yourSOV : leaderSOV,
      totalResponses: 4, // 4 LLM providers
    }
  })
}

// Sample keywords for different industries
export const suggestedKeywords: Record<string, string[]> = {
  'travel-rewards': [
    "What's the best credit card for travel rewards?",
    "Best hotel points credit card 2024",
    "How to earn airline miles fast",
    "Chase Sapphire vs Amex Gold comparison",
    "Best credit card for international travel",
    "Which card has the best airport lounge access?",
    "Best business credit card for travel",
    "How to maximize credit card points",
  ],
  'crm': [
    "What's the best CRM for small businesses?",
    "Salesforce vs HubSpot comparison",
    "Best free CRM software",
    "CRM for startups recommendation",
    "Which CRM is easiest to use?",
    "Best CRM for sales teams",
    "CRM with best email integration",
    "Best CRM for real estate agents",
  ],
  'marketing': [
    "Best marketing automation tools",
    "What email marketing platform do you recommend?",
    "Best social media management tool",
    "Mailchimp alternatives",
    "Best SEO tools for agencies",
    "Marketing analytics software comparison",
    "Best content marketing platforms",
    "How to choose a marketing automation tool",
  ],
  'default': [
    "What's the best tool in this category?",
    "Top recommendations for this industry",
    "Comparison of leading solutions",
    "Best option for small businesses",
    "Enterprise vs SMB solutions",
  ],
}

// Sample competitors for different industries
export const suggestedCompetitors: Record<string, string[]> = {
  'travel-rewards': [
    'The Points Guy',
    'NerdWallet',
    'Million Mile Secrets',
    'One Mile at a Time',
    'Doctor of Credit',
    'Frequent Miler',
  ],
  'crm': [
    'Salesforce',
    'HubSpot',
    'Pipedrive',
    'Zoho CRM',
    'Monday.com',
    'Freshsales',
  ],
  'marketing': [
    'HubSpot',
    'Mailchimp',
    'ActiveCampaign',
    'Klaviyo',
    'Marketo',
    'Pardot',
  ],
  'default': [
    'Competitor A',
    'Competitor B',
    'Competitor C',
    'Competitor D',
  ],
}

// Detect industry from brand name/website
export function detectIndustry(brandName: string, websiteUrl?: string): string {
  const text = `${brandName} ${websiteUrl || ''}`.toLowerCase()
  
  if (text.includes('point') || text.includes('mile') || text.includes('travel') || text.includes('card')) {
    return 'travel-rewards'
  }
  if (text.includes('crm') || text.includes('sales') || text.includes('customer')) {
    return 'crm'
  }
  if (text.includes('market') || text.includes('email') || text.includes('social')) {
    return 'marketing'
  }
  
  return 'default'
}
