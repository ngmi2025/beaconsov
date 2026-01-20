'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateLeaderboard, generateTrendData, generateKeywordSOV, type LeaderboardEntry, type TrendDataPoint, type KeywordSOV } from '@/lib/dummy-data'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Tab = 'leaderboard' | 'trends' | 'keywords' | 'brands' | 'responses'

interface Project {
  id: string
  name: string
  website_url: string | null
  industry: string | null
}

interface Brand {
  id: string
  name: string
  is_primary: boolean
  aliases?: string[] | null
}

interface Keyword {
  id: string
  keyword: string
  is_active: boolean
}

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard')
  const [loading, setLoading] = useState(true)
  
  // AI Suggestions state
  const [suggestingCompetitors, setSuggestingCompetitors] = useState(false)
  const [suggestedCompetitors, setSuggestedCompetitors] = useState<string[]>([])
  const [selectedSuggestedCompetitors, setSelectedSuggestedCompetitors] = useState<Set<string>>(new Set())
  
  const [suggestingKeywords, setSuggestingKeywords] = useState(false)
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [selectedSuggestedKeywords, setSelectedSuggestedKeywords] = useState<Set<string>>(new Set())
  
  // Add forms state
  const [newCompetitor, setNewCompetitor] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [addingCompetitor, setAddingCompetitor] = useState(false)
  const [addingKeyword, setAddingKeyword] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    // Load project
    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectData) setProject(projectData)

    // Load brands linked to this project
    const { data: projectBrands } = await supabase
      .from('project_brands')
      .select('brand_id, is_primary, brands(id, name, aliases)')
      .eq('project_id', projectId)

    if (projectBrands) {
      // Deduplicate brands by ID
      const uniqueBrands = new Map<string, Brand>()
      projectBrands.forEach((pb: any) => {
        if (pb.brands && !uniqueBrands.has(pb.brands.id)) {
          uniqueBrands.set(pb.brands.id, {
            id: pb.brands.id,
            name: pb.brands.name,
            is_primary: pb.is_primary,
            aliases: pb.brands.aliases,
          })
        }
      })
      setBrands(Array.from(uniqueBrands.values()))
    }

    // Load keywords
    const { data: keywordData } = await supabase
      .from('keywords')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (keywordData) setKeywords(keywordData)

    setLoading(false)
  }

  // AI Suggestions handlers
  const handleSuggestCompetitors = async () => {
    const primaryBrand = brands.find(b => b.is_primary)
    if (!primaryBrand) return

    setSuggestingCompetitors(true)
    setSuggestedCompetitors([])
    setSelectedSuggestedCompetitors(new Set())

    try {
      const res = await fetch('/api/ai/suggest-competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: primaryBrand.name,
          websiteUrl: project?.website_url,
          industry: project?.industry,
        }),
      })
      const data = await res.json()
      
      // Filter out brands that are already added
      const existingNames = new Set(brands.map(b => b.name.toLowerCase()))
      const newSuggestions = (data.competitors || []).filter(
        (c: string) => !existingNames.has(c.toLowerCase())
      )
      setSuggestedCompetitors(newSuggestions)
    } catch (error) {
      console.error('Failed to get suggestions:', error)
    } finally {
      setSuggestingCompetitors(false)
    }
  }

  const handleSuggestKeywords = async () => {
    const primaryBrand = brands.find(b => b.is_primary)
    if (!primaryBrand) return

    setSuggestingKeywords(true)
    setSuggestedKeywords([])
    setSelectedSuggestedKeywords(new Set())

    try {
      const competitors = brands.filter(b => !b.is_primary).map(b => b.name)
      const res = await fetch('/api/ai/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: primaryBrand.name,
          competitors,
          industry: project?.industry,
        }),
      })
      const data = await res.json()
      
      // Filter out keywords that are already added
      const existingKeywords = new Set(keywords.map(k => k.keyword.toLowerCase()))
      const newSuggestions = (data.keywords || []).filter(
        (k: string) => !existingKeywords.has(k.toLowerCase())
      )
      setSuggestedKeywords(newSuggestions)
    } catch (error) {
      console.error('Failed to get keyword suggestions:', error)
    } finally {
      setSuggestingKeywords(false)
    }
  }

  const handleAddSelectedCompetitors = async () => {
    if (selectedSuggestedCompetitors.size === 0) return
    setAddingCompetitor(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      for (const name of selectedSuggestedCompetitors) {
        // Create brand
        const { data: brand } = await supabase
          .from('brands')
          .insert({ user_id: user.id, name, is_competitor: true })
          .select()
          .single()

        if (brand) {
          // Link to project
          await supabase.from('project_brands').insert({
            project_id: projectId,
            brand_id: brand.id,
            is_primary: false,
          })
        }
      }
      
      // Reload and clear
      await loadProjectData()
      setSuggestedCompetitors([])
      setSelectedSuggestedCompetitors(new Set())
    } finally {
      setAddingCompetitor(false)
    }
  }

  const handleAddSelectedKeywords = async () => {
    if (selectedSuggestedKeywords.size === 0) return
    setAddingKeyword(true)

    try {
      for (const keyword of selectedSuggestedKeywords) {
        await supabase.from('keywords').insert({
          project_id: projectId,
          keyword,
        })
      }
      
      // Reload and clear
      await loadProjectData()
      setSuggestedKeywords([])
      setSelectedSuggestedKeywords(new Set())
    } finally {
      setAddingKeyword(false)
    }
  }

  const handleAddCompetitor = async () => {
    if (!newCompetitor.trim()) return
    setAddingCompetitor(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data: brand } = await supabase
        .from('brands')
        .insert({ user_id: user.id, name: newCompetitor.trim(), is_competitor: true })
        .select()
        .single()

      if (brand) {
        await supabase.from('project_brands').insert({
          project_id: projectId,
          brand_id: brand.id,
          is_primary: false,
        })
      }

      setNewCompetitor('')
      await loadProjectData()
    } finally {
      setAddingCompetitor(false)
    }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return
    setAddingKeyword(true)

    try {
      await supabase.from('keywords').insert({
        project_id: projectId,
        keyword: newKeyword.trim(),
      })

      setNewKeyword('')
      await loadProjectData()
    } finally {
      setAddingKeyword(false)
    }
  }

  const handleRemoveCompetitor = async (brandId: string) => {
    // Remove from project_brands
    await supabase
      .from('project_brands')
      .delete()
      .eq('project_id', projectId)
      .eq('brand_id', brandId)

    await loadProjectData()
  }

  const handleRemoveKeyword = async (keywordId: string) => {
    await supabase.from('keywords').delete().eq('id', keywordId)
    await loadProjectData()
  }

  // Generate dummy data based on real brands and keywords
  const yourBrands = brands.filter(b => b.is_primary)
  const competitors = brands.filter(b => !b.is_primary)

  const leaderboardData = useMemo(() => {
    if (brands.length === 0) return []
    return generateLeaderboard(
      yourBrands.map(b => ({ id: b.id, name: b.name })),
      competitors.map(b => ({ id: b.id, name: b.name }))
    )
  }, [brands])

  const trendData = useMemo(() => {
    if (brands.length === 0) return []
    return generateTrendData(
      brands.map(b => ({ id: b.id, name: b.name, isYourBrand: b.is_primary })),
      8
    )
  }, [brands])

  const keywordSOVData = useMemo(() => {
    if (keywords.length === 0 || yourBrands.length === 0) return []
    return generateKeywordSOV(
      keywords.map(k => ({ id: k.id, keyword: k.keyword })),
      yourBrands[0]?.name || 'Your Brand',
      competitors.map(c => c.name)
    )
  }, [keywords, yourBrands, competitors])

  // Chart colors
  const brandColors: Record<string, string> = {}
  yourBrands.forEach((b, i) => {
    brandColors[b.name] = ['#84CC16', '#22C55E', '#10B981'][i] || '#84CC16'
  })
  competitors.forEach((b, i) => {
    brandColors[b.name] = ['#F97316', '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6'][i] || '#F97316'
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Project not found</p>
        <Link href="/projects" className="text-violet-400 hover:underline mt-2 inline-block">
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-400 mb-1 inline-block">
            ← All Projects
          </Link>
          <h1 className="text-3xl font-bold text-slate-50">{project.name}</h1>
          {project.website_url && (
            <p className="text-slate-400 text-sm mt-1">{project.website_url}</p>
          )}
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Run Analysis
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-violet-400">{yourBrands.length}</p>
          <p className="text-sm text-slate-400">Your Brands</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-orange-400">{competitors.length}</p>
          <p className="text-sm text-slate-400">Competitors</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-50">{keywords.length}</p>
          <p className="text-sm text-slate-400">Keywords</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-lime-400">
            {leaderboardData.find(b => b.isYourBrand)?.sov || 0}%
          </p>
          <p className="text-sm text-slate-400">Your SOV</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <div className="flex gap-1">
          {[
            { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
            { id: 'trends', label: 'Trends', icon: '📈' },
            { id: 'keywords', label: 'Keywords', icon: '🔑' },
            { id: 'brands', label: 'Brands', icon: '🏢' },
            { id: 'responses', label: 'Responses', icon: '💬' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-violet-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">SOV Leaderboard</h2>
                <p className="text-sm text-slate-400">Rankings based on {keywords.length} keywords across 4 AI platforms</p>
              </div>
            </div>
            
            {leaderboardData.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p>Add brands and keywords to see your SOV leaderboard.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-20">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Brand</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">SOV</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Mentions</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Trend</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase w-48"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboardData.map((entry) => (
                    <tr key={entry.brandId} className={`hover:bg-white/5 ${entry.isYourBrand ? 'bg-violet-500/5' : ''}`}>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                          entry.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                          entry.rank === 3 ? 'bg-orange-600/20 text-orange-400' :
                          'bg-white/5 text-slate-500'
                        }`}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${entry.isYourBrand ? 'bg-lime-500' : 'bg-orange-500'}`} />
                          <span className="font-medium text-slate-50">{entry.brand}</span>
                          {entry.isYourBrand && (
                            <span className="text-xs px-2 py-0.5 bg-lime-500/20 text-lime-400 rounded">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-bold ${entry.isYourBrand ? 'text-lime-400' : 'text-slate-50'}`}>
                          {entry.sov}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-300">
                        {entry.mentions}/{entry.totalResponses}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-medium ${
                          entry.trend === '↑' ? 'text-lime-400' :
                          entry.trend === '↓' ? 'text-red-400' :
                          'text-slate-400'
                        }`}>
                          {entry.trend} {entry.trendValue !== 0 && `${Math.abs(entry.trendValue)}%`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${entry.isYourBrand ? 'bg-lime-500' : 'bg-orange-500'}`}
                            style={{ width: `${entry.sov}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-50">SOV Over Time</h2>
              <p className="text-sm text-slate-400">Weekly Share of Voice trends</p>
            </div>

            {trendData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis 
                      dataKey="label" 
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1625', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f8fafc' }}
                      formatter={(value) => [`${(value as number)?.toFixed(1) ?? 0}%`, '']}
                    />
                    <Legend />
                    {brands.map((brand) => (
                      <Line
                        key={brand.id}
                        type="monotone"
                        dataKey={brand.name}
                        stroke={brandColors[brand.name]}
                        strokeWidth={brand.is_primary ? 3 : 2}
                        dot={{ fill: brandColors[brand.name], r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Add brands and run analysis to see trends
              </div>
            )}
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Keywords</h2>
                <p className="text-sm text-slate-400">{keywords.length} keywords tracked</p>
              </div>
              <button
                onClick={handleSuggestKeywords}
                disabled={suggestingKeywords || yourBrands.length === 0}
                className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {suggestingKeywords ? 'Generating...' : '✨ AI Suggest Keywords'}
              </button>
            </div>

            {/* AI Suggestions */}
            {suggestedKeywords.length > 0 && (
              <div className="px-6 py-4 bg-violet-600/10 border-b border-violet-500/20">
                <p className="text-sm font-medium text-violet-400 mb-3">💡 AI Suggested Keywords</p>
                <div className="space-y-2 mb-4">
                  {suggestedKeywords.map((kw) => (
                    <label key={kw} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSuggestedKeywords.has(kw)}
                        onChange={(e) => {
                          const next = new Set(selectedSuggestedKeywords)
                          e.target.checked ? next.add(kw) : next.delete(kw)
                          setSelectedSuggestedKeywords(next)
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-300">{kw}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleAddSelectedKeywords}
                  disabled={selectedSuggestedKeywords.size === 0 || addingKeyword}
                  className="px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addingKeyword ? 'Adding...' : `Add Selected (${selectedSuggestedKeywords.size})`}
                </button>
              </div>
            )}

            {/* Add keyword form */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="Add a keyword or question..."
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || addingKeyword}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Keywords table */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Keyword</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Your SOV</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Leader</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keywordSOVData.map((kw) => (
                  <tr key={kw.keywordId} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <span className="text-slate-50">{kw.keyword}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${kw.leader === 'You! 🎉' ? 'text-lime-400' : 'text-slate-50'}`}>
                        {kw.yourSOV}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={kw.leader === 'You! 🎉' ? 'text-lime-400' : 'text-orange-400'}>
                        {kw.leader} ({kw.leaderSOV}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveKeyword(kw.keywordId)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {keywords.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      No keywords yet. Add keywords or use AI suggestions to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Brands & Competitors</h2>
                <p className="text-sm text-slate-400">{yourBrands.length} brands, {competitors.length} competitors</p>
              </div>
              <button
                onClick={handleSuggestCompetitors}
                disabled={suggestingCompetitors || yourBrands.length === 0}
                className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {suggestingCompetitors ? 'Generating...' : '✨ AI Suggest Competitors'}
              </button>
            </div>

            {/* AI Suggestions */}
            {suggestedCompetitors.length > 0 && (
              <div className="px-6 py-4 bg-violet-600/10 border-b border-violet-500/20">
                <p className="text-sm font-medium text-violet-400 mb-3">💡 AI Suggested Competitors</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestedCompetitors.map((comp) => (
                    <label key={comp} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedSuggestedCompetitors.has(comp)}
                        onChange={(e) => {
                          const next = new Set(selectedSuggestedCompetitors)
                          e.target.checked ? next.add(comp) : next.delete(comp)
                          setSelectedSuggestedCompetitors(next)
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-300">{comp}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleAddSelectedCompetitors}
                  disabled={selectedSuggestedCompetitors.size === 0 || addingCompetitor}
                  className="px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addingCompetitor ? 'Adding...' : `Add Selected (${selectedSuggestedCompetitors.size})`}
                </button>
              </div>
            )}

            {/* Add competitor form */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                  placeholder="Add a competitor..."
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={handleAddCompetitor}
                  disabled={!newCompetitor.trim() || addingCompetitor}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Your Brands */}
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Brands</h3>
              <div className="space-y-2">
                {yourBrands.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-3 bg-lime-500/10 border border-lime-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-lime-500" />
                      <span className="font-medium text-slate-50">{brand.name}</span>
                      {brand.aliases && brand.aliases.length > 0 && (
                        <span className="text-xs text-slate-500">
                          ({brand.aliases.join(', ')})
                        </span>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 bg-lime-500/20 text-lime-400 rounded">Primary</span>
                  </div>
                ))}
                {yourBrands.length === 0 && (
                  <p className="text-slate-400 text-sm">No primary brand set.</p>
                )}
              </div>
            </div>

            {/* Competitors */}
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Competitors</h3>
              <div className="space-y-2">
                {competitors.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:border-orange-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="font-medium text-slate-50">{brand.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCompetitor(brand.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {competitors.length === 0 && (
                  <p className="text-slate-400 text-sm">No competitors yet. Add competitors or use AI suggestions.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-2">Raw LLM Responses</h2>
            <p className="text-slate-400 mb-6">Detailed responses from each AI platform</p>
            
            <div className="text-center py-12 text-slate-400">
              <p>Run an analysis to see detailed responses from each AI platform.</p>
              <button className="mt-4 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors">
                Run Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
