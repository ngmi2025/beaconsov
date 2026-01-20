'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateLeaderboard, generateTrendData, generateKeywordSOV, type LeaderboardEntry, type TrendDataPoint, type KeywordSOV } from '@/lib/dummy-data'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Tab = 'leaderboard' | 'trends' | 'keywords' | 'responses'

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

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    const supabase = createClient()

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
      .select('brand_id, is_primary, brands(id, name)')
      .eq('project_id', projectId)

    if (projectBrands) {
      setBrands(
        projectBrands.map((pb: any) => ({
          id: pb.brands.id,
          name: pb.brands.name,
          is_primary: pb.is_primary,
        }))
      )
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
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
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
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-sm">
                + Add Keyword
              </button>
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Keyword</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Your SOV</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Leader</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Responses</th>
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
                    <td className="px-6 py-4 text-right text-slate-400">
                      {kw.totalResponses}
                    </td>
                  </tr>
                ))}
                {keywordSOVData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      No keywords yet. Add keywords to start tracking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
