'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Brand {
  id: string
  name: string
  is_competitor: boolean
}

interface Query {
  id: string
  query_text: string
  category: string | null
  tags: string[] | null
}

interface Result {
  id: string
  query_id: string
  llm_provider: string
  response_text: string
  brands_mentioned: string[] | null
  brands_recommended: string[] | null
  run_at: string
}

export default function AnalyticsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [queries, setQueries] = useState<Query[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const [brandsRes, queriesRes, resultsRes] = await Promise.all([
      supabase.from('brands').select('*').eq('user_id', user.id),
      supabase.from('queries').select('*').eq('user_id', user.id),
      supabase.from('results').select('*').order('run_at', { ascending: false }),
    ])

    if (brandsRes.data) setBrands(brandsRes.data)
    if (queriesRes.data) setQueries(queriesRes.data)
    
    // Filter results to only user's queries
    const userQueryIds = queriesRes.data?.map(q => q.id) || []
    if (resultsRes.data) {
      setResults(resultsRes.data.filter(r => userQueryIds.includes(r.query_id)))
    }
    
    setLoading(false)
  }

  // Get all unique tags from queries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    queries.forEach(q => q.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [queries])

  // Filter queries based on selected tags
  const filteredQueries = useMemo(() => {
    if (selectedTags.length === 0) return queries
    return queries.filter(q => 
      selectedTags.some(tag => q.tags?.includes(tag))
    )
  }, [queries, selectedTags])

  // Filter results based on filtered queries and provider
  const filteredResults = useMemo(() => {
    const queryIds = new Set(filteredQueries.map(q => q.id))
    return results.filter(r => {
      if (!queryIds.has(r.query_id)) return false
      if (selectedProvider !== 'all' && r.llm_provider !== selectedProvider) return false
      return true
    })
  }, [results, filteredQueries, selectedProvider])

  // Calculate SOV data
  const sovData = useMemo(() => {
    const brandMentions: Record<string, { mentioned: number; recommended: number }> = {}
    
    // Initialize all brands
    brands.forEach(b => {
      brandMentions[b.id] = { mentioned: 0, recommended: 0 }
    })

    // Count mentions
    filteredResults.forEach(r => {
      r.brands_mentioned?.forEach(brandId => {
        if (brandMentions[brandId]) {
          brandMentions[brandId].mentioned++
        }
      })
      r.brands_recommended?.forEach(brandId => {
        if (brandMentions[brandId]) {
          brandMentions[brandId].recommended++
        }
      })
    })

    // Calculate SOV percentages
    const totalMentions = Object.values(brandMentions).reduce((sum, b) => sum + b.mentioned, 0)
    const totalRecommendations = Object.values(brandMentions).reduce((sum, b) => sum + b.recommended, 0)

    return brands
      .map(brand => ({
        ...brand,
        mentions: brandMentions[brand.id]?.mentioned || 0,
        recommendations: brandMentions[brand.id]?.recommended || 0,
        mentionSOV: totalMentions > 0 ? (brandMentions[brand.id]?.mentioned || 0) / totalMentions * 100 : 0,
        recommendSOV: totalRecommendations > 0 ? (brandMentions[brand.id]?.recommended || 0) / totalRecommendations * 100 : 0,
      }))
      .sort((a, b) => b.mentions - a.mentions)
  }, [brands, filteredResults])

  // Split into my brands and competitors
  const myBrands = sovData.filter(b => !b.is_competitor)
  const competitors = sovData.filter(b => b.is_competitor)

  // Per-query breakdown
  const queryBreakdown = useMemo(() => {
    return filteredQueries.map(query => {
      const queryResults = filteredResults.filter(r => r.query_id === query.id)
      const brandData: Record<string, { mentioned: number; recommended: number; providers: string[] }> = {}
      
      brands.forEach(b => {
        brandData[b.id] = { mentioned: 0, recommended: 0, providers: [] }
      })

      queryResults.forEach(r => {
        r.brands_mentioned?.forEach(brandId => {
          if (brandData[brandId]) {
            brandData[brandId].mentioned++
            if (!brandData[brandId].providers.includes(r.llm_provider)) {
              brandData[brandId].providers.push(r.llm_provider)
            }
          }
        })
        r.brands_recommended?.forEach(brandId => {
          if (brandData[brandId]) {
            brandData[brandId].recommended++
          }
        })
      })

      return {
        query,
        resultCount: queryResults.length,
        brandData,
      }
    })
  }, [filteredQueries, filteredResults, brands])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const providers = ['openai', 'anthropic', 'google', 'perplexity']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Share of Voice Analytics</h1>
          <p className="text-slate-400">
            See how your brands compare to competitors across AI systems.
          </p>
        </div>
        <Link
          href="/queries/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Query
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-6">
          {/* Provider filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">AI Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all" className="bg-[#1a1625]">All Providers</option>
              {providers.map(p => (
                <option key={p} value={p} className="bg-[#1a1625] capitalize">{p}</option>
              ))}
            </select>
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-2">Filter by Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-300 text-sm"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SOV Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Brands SOV */}
        <div className="bg-gradient-to-br from-violet-600/10 to-violet-800/10 border border-violet-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-violet-500 rounded-full"></span>
            Your Brands
          </h2>
          
          {myBrands.length === 0 ? (
            <p className="text-slate-400 text-sm">No brands added yet. <Link href="/brands/new" className="text-violet-400 hover:underline">Add your first brand</Link></p>
          ) : (
            <div className="space-y-4">
              {myBrands.map(brand => (
                <div key={brand.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-50 font-medium">{brand.name}</span>
                    <span className="text-violet-400 font-bold">{Math.round(brand.mentionSOV)}% SOV</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(brand.mentionSOV, 2)}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>{brand.mentions} mentions</span>
                    <span>{brand.recommendations} recommendations</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competitors SOV */}
        <div className="bg-gradient-to-br from-orange-600/10 to-orange-800/10 border border-orange-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            Competitors
          </h2>
          
          {competitors.length === 0 ? (
            <p className="text-slate-400 text-sm">No competitors added yet. <Link href="/brands/new?competitor=true" className="text-orange-400 hover:underline">Add competitors</Link></p>
          ) : (
            <div className="space-y-4">
              {competitors.map(brand => (
                <div key={brand.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-50 font-medium">{brand.name}</span>
                    <span className="text-orange-400 font-bold">{Math.round(brand.mentionSOV)}% SOV</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(brand.mentionSOV, 2)}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>{brand.mentions} mentions</span>
                    <span>{brand.recommendations} recommendations</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-slate-50">{filteredQueries.length}</p>
          <p className="text-sm text-slate-400">Queries Tracked</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-slate-50">{filteredResults.length}</p>
          <p className="text-sm text-slate-400">AI Responses</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-violet-400">
            {Math.round(myBrands.reduce((sum, b) => sum + b.mentionSOV, 0))}%
          </p>
          <p className="text-sm text-slate-400">Your Total SOV</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-400">
            {Math.round(competitors.reduce((sum, b) => sum + b.mentionSOV, 0))}%
          </p>
          <p className="text-sm text-slate-400">Competitor SOV</p>
        </div>
      </div>

      {/* Per-Query Breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-slate-50">Per-Query Breakdown</h2>
          <p className="text-sm text-slate-400">See which brands are mentioned for each query</p>
        </div>
        
        {queryBreakdown.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">No queries yet. <Link href="/queries/new" className="text-violet-400 hover:underline">Create your first query</Link></p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {queryBreakdown.map(({ query, resultCount, brandData }) => (
              <div key={query.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-slate-50 font-medium">{query.query_text}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {query.category && (
                        <span className="text-xs px-2 py-0.5 bg-violet-600/20 text-violet-400 rounded">
                          {query.category}
                        </span>
                      )}
                      {query.tags?.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-white/5 text-slate-400 rounded">
                          #{tag}
                        </span>
                      ))}
                      <span className="text-xs text-slate-500">{resultCount} responses</span>
                    </div>
                  </div>
                  <Link
                    href={`/queries`}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    Run again →
                  </Link>
                </div>

                {/* Brand grid for this query */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...myBrands, ...competitors]
                    .filter(b => brandData[b.id]?.mentioned > 0)
                    .map(brand => (
                      <div 
                        key={brand.id}
                        className={`p-3 rounded-lg ${
                          brand.is_competitor 
                            ? 'bg-orange-500/10 border border-orange-500/20' 
                            : 'bg-violet-500/10 border border-violet-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-50">{brand.name}</span>
                          {brandData[brand.id]?.recommended > 0 && (
                            <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {brandData[brand.id]?.mentioned} / {resultCount} responses
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {brandData[brand.id]?.providers.join(', ')}
                        </div>
                      </div>
                    ))}
                  {[...myBrands, ...competitors].filter(b => brandData[b.id]?.mentioned > 0).length === 0 && (
                    <p className="text-sm text-slate-500 col-span-full">No brands mentioned in responses yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
