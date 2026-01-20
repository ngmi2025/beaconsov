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

type TimePeriod = 'daily' | 'weekly' | 'monthly'

interface TimeSeriesDataPoint {
  period: string
  label: string
  [brandId: string]: string | number // Allow indexing by brand ID
}

export default function AnalyticsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [queries, setQueries] = useState<Query[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly')
  const [selectedBrandsForChart, setSelectedBrandsForChart] = useState<string[]>([])

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
    
    const userQueryIds = queriesRes.data?.map(q => q.id) || []
    if (resultsRes.data) {
      setResults(resultsRes.data.filter(r => userQueryIds.includes(r.query_id)))
    }
    
    // Auto-select brands for chart: your brands + top 3 competitors
    if (brandsRes.data) {
      const myBrandIds = brandsRes.data.filter(b => !b.is_competitor).map(b => b.id)
      const competitorIds = brandsRes.data.filter(b => b.is_competitor).slice(0, 3).map(b => b.id)
      setSelectedBrandsForChart([...myBrandIds, ...competitorIds])
    }
    
    setLoading(false)
  }

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    queries.forEach(q => q.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [queries])

  // Filter queries based on tags
  const filteredQueries = useMemo(() => {
    if (selectedTags.length === 0) return queries
    return queries.filter(q => 
      selectedTags.some(tag => q.tags?.includes(tag))
    )
  }, [queries, selectedTags])

  // Filter results
  const filteredResults = useMemo(() => {
    const queryIds = new Set(filteredQueries.map(q => q.id))
    return results.filter(r => {
      if (!queryIds.has(r.query_id)) return false
      if (selectedProvider !== 'all' && r.llm_provider !== selectedProvider) return false
      return true
    })
  }, [results, filteredQueries, selectedProvider])

  // Calculate League Table data (SOV rankings)
  const leagueTable = useMemo(() => {
    const brandStats: Record<string, { mentioned: number; recommended: number }> = {}
    
    brands.forEach(b => {
      brandStats[b.id] = { mentioned: 0, recommended: 0 }
    })

    filteredResults.forEach(r => {
      r.brands_mentioned?.forEach(brandId => {
        if (brandStats[brandId]) brandStats[brandId].mentioned++
      })
      r.brands_recommended?.forEach(brandId => {
        if (brandStats[brandId]) brandStats[brandId].recommended++
      })
    })

    const totalMentions = Object.values(brandStats).reduce((sum, b) => sum + b.mentioned, 0)

    return brands
      .map(brand => ({
        ...brand,
        mentions: brandStats[brand.id]?.mentioned || 0,
        recommendations: brandStats[brand.id]?.recommended || 0,
        sov: totalMentions > 0 ? (brandStats[brand.id]?.mentioned || 0) / totalMentions * 100 : 0,
      }))
      .sort((a, b) => b.sov - a.sov)
      .map((brand, index) => ({ ...brand, rank: index + 1 }))
  }, [brands, filteredResults])

  // Time-series data for chart
  const timeSeriesData = useMemo((): TimeSeriesDataPoint[] => {
    if (filteredResults.length === 0) return []

    // Group results by time period
    const groupedByPeriod: Record<string, Result[]> = {}
    
    filteredResults.forEach(r => {
      const date = new Date(r.run_at)
      let periodKey: string
      
      if (timePeriod === 'daily') {
        periodKey = date.toISOString().split('T')[0]
      } else if (timePeriod === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        periodKey = weekStart.toISOString().split('T')[0]
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }
      
      if (!groupedByPeriod[periodKey]) groupedByPeriod[periodKey] = []
      groupedByPeriod[periodKey].push(r)
    })

    // Calculate SOV for each period
    const periods = Object.keys(groupedByPeriod).sort()
    
    return periods.map(period => {
      const periodResults = groupedByPeriod[period]
      const brandMentions: Record<string, number> = {}
      
      brands.forEach(b => brandMentions[b.id] = 0)
      
      periodResults.forEach(r => {
        r.brands_mentioned?.forEach(brandId => {
          if (brandMentions[brandId] !== undefined) brandMentions[brandId]++
        })
      })
      
      const total = Object.values(brandMentions).reduce((sum, n) => sum + n, 0)
      
      const brandSOVs: Record<string, number> = {}
      brands.forEach(b => {
        brandSOVs[b.id] = total > 0 ? (brandMentions[b.id] / total) * 100 : 0
      })
      
      return {
        period,
        label: formatPeriodLabel(period, timePeriod),
        ...brandSOVs,
      }
    })
  }, [filteredResults, brands, timePeriod])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const toggleBrandForChart = (brandId: string) => {
    setSelectedBrandsForChart(prev =>
      prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]
    )
  }

  const providers = ['openai', 'anthropic', 'google', 'perplexity']
  const myBrands = leagueTable.filter(b => !b.is_competitor)
  const competitors = leagueTable.filter(b => b.is_competitor)

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
            Track how your brands rank against competitors across AI systems.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/brands/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-all"
          >
            + Add Brand
          </Link>
          <Link
            href="/queries/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
          >
            + Add Query
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-6">
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
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* League Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">SOV League Table</h2>
            <p className="text-sm text-slate-400">All brands ranked by Share of Voice</p>
          </div>
          <div className="text-sm text-slate-400">
            Based on {filteredResults.length} AI responses
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Rank</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">SOV %</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Mentions</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Recommended</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-48">SOV Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leagueTable.map((brand) => (
                <tr 
                  key={brand.id} 
                  className={`hover:bg-white/5 transition-colors ${
                    !brand.is_competitor ? 'bg-violet-500/5' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      brand.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      brand.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                      brand.rank === 3 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-white/5 text-slate-400'
                    }`}>
                      {brand.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${brand.is_competitor ? 'bg-orange-500' : 'bg-violet-500'}`} />
                      <span className="font-medium text-slate-50">{brand.name}</span>
                      {!brand.is_competitor && (
                        <span className="text-xs px-2 py-0.5 bg-violet-600/20 text-violet-400 rounded">Your Brand</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-lg font-bold ${brand.is_competitor ? 'text-orange-400' : 'text-violet-400'}`}>
                      {brand.sov.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">{brand.mentions}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lime-400">{brand.recommendations}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${brand.is_competitor ? 'bg-orange-500' : 'bg-violet-500'}`}
                        style={{ width: `${Math.max(brand.sov, 1)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {leagueTable.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No data yet. <Link href="/queries" className="text-violet-400 hover:underline">Run some queries</Link> to see SOV rankings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SOV Trend Chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">SOV Trends Over Time</h2>
            <p className="text-sm text-slate-400">Track how Share of Voice changes</p>
          </div>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as TimePeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  timePeriod === period
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Selector */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-400 mb-3">Select brands to compare:</label>
          <div className="flex flex-wrap gap-2">
            {leagueTable.map(brand => (
              <button
                key={brand.id}
                onClick={() => toggleBrandForChart(brand.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedBrandsForChart.includes(brand.id)
                    ? brand.is_competitor 
                      ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                      : 'bg-violet-600 text-white ring-2 ring-violet-400'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${brand.is_competitor ? 'bg-orange-400' : 'bg-violet-400'}`} />
                {brand.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {timeSeriesData.length > 0 ? (
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-slate-500">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-14 h-64 relative border-l border-b border-white/10">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <div 
                  key={y} 
                  className="absolute left-0 right-0 border-t border-white/5"
                  style={{ bottom: `${y}%` }}
                />
              ))}
              
              {/* Data points and lines */}
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                {selectedBrandsForChart.map((brandId, brandIndex) => {
                  const brand = brands.find(b => b.id === brandId)
                  if (!brand) return null
                  
                  const color = brand.is_competitor ? '#f97316' : '#8b5cf6'
                  const points = timeSeriesData.map((d, i) => {
                    const x = (i / (timeSeriesData.length - 1)) * 100
                    const y = 100 - (d[brandId] as number || 0)
                    return `${x}%,${y}%`
                  }).join(' ')
                  
                  return (
                    <g key={brandId}>
                      <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ vectorEffect: 'non-scaling-stroke' }}
                      />
                      {timeSeriesData.map((d, i) => {
                        const x = (i / (timeSeriesData.length - 1)) * 100
                        const y = 100 - (d[brandId] as number || 0)
                        return (
                          <circle
                            key={i}
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r="4"
                            fill={color}
                            className="hover:r-6 transition-all"
                          >
                            <title>{brand.name}: {(d[brandId] as number || 0).toFixed(1)}%</title>
                          </circle>
                        )
                      })}
                    </g>
                  )
                })}
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div className="ml-14 flex justify-between mt-2 text-xs text-slate-500">
              {timeSeriesData.map((d, i) => (
                <span key={i} className="text-center" style={{ width: `${100 / timeSeriesData.length}%` }}>
                  {d.label}
                </span>
              ))}
            </div>

            {/* Legend */}
            <div className="ml-14 mt-6 flex flex-wrap gap-4">
              {selectedBrandsForChart.map(brandId => {
                const brand = brands.find(b => b.id === brandId)
                if (!brand) return null
                return (
                  <div key={brandId} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${brand.is_competitor ? 'bg-orange-500' : 'bg-violet-500'}`} />
                    <span className="text-sm text-slate-300">{brand.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <p>Not enough data to show trends. Run more queries over time.</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-slate-50">{myBrands.length}</p>
          <p className="text-sm text-slate-400 mt-1">Your Brands</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-slate-50">{competitors.length}</p>
          <p className="text-sm text-slate-400 mt-1">Competitors</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-violet-400">
            {myBrands.reduce((sum, b) => sum + b.sov, 0).toFixed(1)}%
          </p>
          <p className="text-sm text-slate-400 mt-1">Your Total SOV</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-orange-400">
            {competitors.reduce((sum, b) => sum + b.sov, 0).toFixed(1)}%
          </p>
          <p className="text-sm text-slate-400 mt-1">Competitor SOV</p>
        </div>
      </div>

      {/* Info about limits */}
      <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4 text-center">
        <p className="text-sm text-slate-300">
          💡 You can track up to <span className="font-semibold text-violet-400">10 competitors</span> per brand on your current plan.
          <Link href="/brands/new?competitor=true" className="text-violet-400 hover:text-violet-300 ml-1">Add more competitors →</Link>
        </p>
      </div>
    </div>
  )
}

function formatPeriodLabel(period: string, type: TimePeriod): string {
  const date = new Date(period)
  
  if (type === 'daily') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else if (type === 'weekly') {
    return `W${getWeekNumber(date)}`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}
