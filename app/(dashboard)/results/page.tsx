import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const providerColors: Record<string, { bg: string; text: string; name: string; icon: string }> = {
  openai: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', name: 'OpenAI', icon: '🟢' },
  anthropic: { bg: 'bg-orange-500/20', text: 'text-orange-400', name: 'Anthropic', icon: '🟠' },
  google: { bg: 'bg-blue-500/20', text: 'text-blue-400', name: 'Google', icon: '🔵' },
  perplexity: { bg: 'bg-violet-500/20', text: 'text-violet-400', name: 'Perplexity', icon: '🟣' },
}

export default async function ResultsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user's queries first
  const { data: queries } = await supabase
    .from('queries')
    .select('*')
    .eq('user_id', user.id)

  const queryIds = queries?.map(q => q.id) || []

  // Get results for those queries
  const { data: results } = queryIds.length > 0 
    ? await supabase
        .from('results')
        .select('*')
        .in('query_id', queryIds)
        .order('run_at', { ascending: false })
        .limit(100)
    : { data: [] }

  // Get brands for lookup
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, is_competitor')
    .eq('user_id', user.id)

  const brandLookup = new Map(brands?.map(b => [b.id, b]) || [])
  const queryLookup = new Map(queries?.map(q => [q.id, q]) || [])

  // Calculate SOV
  const sovData = calculateSOV(results || [], brandLookup)
  
  // Group results by query
  const resultsByQuery = groupResultsByQuery(results || [], queryLookup)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Results</h1>
          <p className="text-slate-400">
            See how AI systems talk about your brands.
          </p>
        </div>
        <Link
          href="/queries"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Run New Query
        </Link>
      </div>

      {/* SOV Overview */}
      {sovData.length > 0 && (
        <div className="bg-gradient-to-br from-violet-600/10 to-violet-800/10 border border-violet-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-50">Share of Voice Overview</h2>
            <span className="text-xs text-slate-500">
              Based on {results?.length || 0} AI responses
            </span>
          </div>
          
          {/* SOV Bar Chart */}
          <div className="space-y-3 mb-6">
            {sovData.slice(0, 8).map((item) => (
              <div key={item.brandId} className="flex items-center gap-4">
                <div className="w-32 truncate">
                  <span className={`text-sm font-medium ${item.isCompetitor ? 'text-orange-400' : 'text-slate-50'}`}>
                    {item.brandName}
                  </span>
                </div>
                <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
                  <div 
                    className={`h-full rounded-lg flex items-center px-3 transition-all ${
                      item.isCompetitor ? 'bg-orange-500/30' : 'bg-violet-500/30'
                    }`}
                    style={{ width: `${Math.max(item.sovPercent, 5)}%` }}
                  >
                    <span className="text-xs font-semibold text-white whitespace-nowrap">
                      {Math.round(item.sovPercent)}%
                    </span>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-xs text-slate-500">
                    {item.mentions} mention{item.mentions !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-50">{sovData.filter(s => !s.isCompetitor).length}</p>
              <p className="text-xs text-slate-400">Your brands mentioned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-50">{sovData.filter(s => s.isCompetitor).length}</p>
              <p className="text-xs text-slate-400">Competitors mentioned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-lime-400">
                {Math.round(sovData.filter(s => !s.isCompetitor).reduce((a, b) => a + b.sovPercent, 0))}%
              </p>
              <p className="text-xs text-slate-400">Your total SOV</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-50">{Object.keys(resultsByQuery).length}</p>
              <p className="text-xs text-slate-400">Queries analyzed</p>
            </div>
          </div>
        </div>
      )}

      {/* Results list */}
      {!results || results.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-50 mb-2">No results yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Run some queries to see how AI systems mention your brands.
          </p>
          <Link
            href="/queries"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
          >
            Go to Queries
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(resultsByQuery).map(([queryId, data]) => {
            const { query, results: queryResults } = data
            if (!query) return null

            return (
              <div key={queryId} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Query header */}
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-slate-50 font-medium mb-1">{query.query_text}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {query.category && (
                          <span className="px-2 py-0.5 bg-violet-600/20 text-violet-400 rounded">
                            {query.category}
                          </span>
                        )}
                        <span>{queryResults.length} responses</span>
                        <span>
                          Last run: {new Date(queryResults[0].run_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provider responses */}
                <div className="divide-y divide-white/5">
                  {queryResults.map((result) => {
                    const provider = providerColors[result.llm_provider] || providerColors.openai
                    const mentionedBrands = (result.brands_mentioned || [])
                      .map(id => brandLookup.get(id))
                      .filter(Boolean)
                    const recommendedBrands = (result.brands_recommended || [])
                      .map(id => brandLookup.get(id))
                      .filter(Boolean)

                    return (
                      <div key={result.id} className="px-5 py-4">
                        {/* Provider badge and brands */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 ${provider.bg} ${provider.text} rounded-lg text-xs font-medium`}>
                              {provider.icon} {provider.name}
                            </span>
                            <span className="text-xs text-slate-500">{result.llm_model}</span>
                          </div>
                        </div>

                        {/* Brand mentions */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {mentionedBrands.length > 0 ? (
                            mentionedBrands.map((brand) => (
                              <span
                                key={brand!.id}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                                  recommendedBrands.some(b => b!.id === brand!.id)
                                    ? 'bg-lime-500/20 text-lime-400'
                                    : 'bg-white/10 text-slate-300'
                                } ${brand!.is_competitor ? 'ring-1 ring-orange-500/30' : ''}`}
                              >
                                {brand!.name}
                                {recommendedBrands.some(b => b!.id === brand!.id) && (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">No tracked brands mentioned</span>
                          )}
                        </div>

                        {/* Response preview */}
                        <details className="group">
                          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 list-none flex items-center gap-2">
                            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            View full response
                          </summary>
                          <div className="mt-3 p-4 bg-white/5 rounded-xl text-sm text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {result.response_text}
                          </div>
                        </details>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ResultRow {
  id: string
  query_id: string
  run_at: string
  llm_provider: string
  llm_model: string
  response_text: string
  brands_mentioned: string[] | null
  brands_recommended: string[] | null
}

interface QueryRow {
  id: string
  query_text: string
  category: string | null
  user_id: string
}

function calculateSOV(
  results: ResultRow[],
  brandLookup: Map<string, { id: string; name: string; is_competitor: boolean }>
) {
  const mentionCounts = new Map<string, number>()
  const recommendCounts = new Map<string, number>()
  let totalMentions = 0

  for (const result of results) {
    for (const brandId of result.brands_mentioned || []) {
      mentionCounts.set(brandId, (mentionCounts.get(brandId) || 0) + 1)
      totalMentions++
    }
    for (const brandId of result.brands_recommended || []) {
      recommendCounts.set(brandId, (recommendCounts.get(brandId) || 0) + 1)
    }
  }

  const sovData = Array.from(mentionCounts.entries())
    .map(([brandId, mentions]) => {
      const brand = brandLookup.get(brandId)
      return {
        brandId,
        brandName: brand?.name || 'Unknown',
        isCompetitor: brand?.is_competitor || false,
        mentions,
        recommendations: recommendCounts.get(brandId) || 0,
        sovPercent: totalMentions > 0 ? (mentions / totalMentions) * 100 : 0,
      }
    })
    .sort((a, b) => b.mentions - a.mentions)

  return sovData
}

function groupResultsByQuery(
  results: ResultRow[], 
  queryLookup: Map<string, QueryRow>
): Record<string, { query: QueryRow | undefined; results: ResultRow[] }> {
  return results.reduce((acc, result) => {
    const queryId = result.query_id
    if (!acc[queryId]) {
      acc[queryId] = {
        query: queryLookup.get(queryId),
        results: []
      }
    }
    acc[queryId].results.push(result)
    return acc
  }, {} as Record<string, { query: QueryRow | undefined; results: ResultRow[] }>)
}
