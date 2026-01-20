'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { suggestedKeywords, suggestedCompetitors, detectIndustry } from '@/lib/dummy-data'

type Step = 1 | 2 | 3 | 4 | 5

interface WizardData {
  projectName: string
  websiteUrl: string
  brandName: string
  brandAliases: string
  competitors: { name: string; selected: boolean }[]
  customCompetitor: string
  keywords: { text: string; selected: boolean }[]
  customKeyword: string
}

export default function NewProjectWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [data, setData] = useState<WizardData>({
    projectName: '',
    websiteUrl: '',
    brandName: '',
    brandAliases: '',
    competitors: [],
    customCompetitor: '',
    keywords: [],
    customKeyword: '',
  })

  // Generate suggestions based on project name
  const industry = detectIndustry(data.brandName, data.websiteUrl)
  const competitorSuggestions = suggestedCompetitors[industry] || suggestedCompetitors.default
  const keywordSuggestions = suggestedKeywords[industry] || suggestedKeywords.default

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const initializeSuggestions = () => {
    if (data.competitors.length === 0) {
      updateData({
        competitors: competitorSuggestions.map(name => ({ name, selected: false })),
      })
    }
    if (data.keywords.length === 0) {
      updateData({
        keywords: keywordSuggestions.map(text => ({ text, selected: false })),
      })
    }
  }

  const toggleCompetitor = (index: number) => {
    const updated = [...data.competitors]
    updated[index].selected = !updated[index].selected
    updateData({ competitors: updated })
  }

  const addCustomCompetitor = () => {
    if (data.customCompetitor.trim()) {
      updateData({
        competitors: [...data.competitors, { name: data.customCompetitor.trim(), selected: true }],
        customCompetitor: '',
      })
    }
  }

  const toggleKeyword = (index: number) => {
    const updated = [...data.keywords]
    updated[index].selected = !updated[index].selected
    updateData({ keywords: updated })
  }

  const addCustomKeyword = () => {
    if (data.customKeyword.trim()) {
      updateData({
        keywords: [...data.keywords, { text: data.customKeyword.trim(), selected: true }],
        customKeyword: '',
      })
    }
  }

  const nextStep = () => {
    if (step === 1 && !data.projectName.trim()) {
      setError('Please enter a project name')
      return
    }
    if (step === 2 && !data.brandName.trim()) {
      setError('Please enter your brand name')
      return
    }
    setError(null)
    
    if (step === 2) {
      initializeSuggestions()
    }
    
    setStep((s) => Math.min(s + 1, 5) as Step)
  }

  const prevStep = () => {
    setError(null)
    setStep((s) => Math.max(s - 1, 1) as Step)
  }

  const createProject = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      // 1. Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: data.projectName.trim(),
          website_url: data.websiteUrl.trim() || null,
          industry: industry,
        })
        .select()
        .single()

      if (projectError || !project) {
        throw new Error(projectError?.message || 'Failed to create project')
      }

      // 2. Create the primary brand
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert({
          user_id: user.id,
          name: data.brandName.trim(),
          aliases: data.brandAliases.split(',').map(a => a.trim()).filter(Boolean),
          is_competitor: false,
        })
        .select()
        .single()

      if (brandError || !brand) {
        throw new Error(brandError?.message || 'Failed to create brand')
      }

      // Link primary brand to project
      await supabase.from('project_brands').insert({
        project_id: project.id,
        brand_id: brand.id,
        is_primary: true,
      })

      // 3. Create competitors and link them
      const selectedCompetitors = data.competitors.filter(c => c.selected)
      for (const comp of selectedCompetitors) {
        const { data: compBrand } = await supabase
          .from('brands')
          .insert({
            user_id: user.id,
            name: comp.name,
            is_competitor: true,
          })
          .select()
          .single()

        if (compBrand) {
          await supabase.from('project_brands').insert({
            project_id: project.id,
            brand_id: compBrand.id,
            is_primary: false,
          })
        }
      }

      // 4. Create keywords
      const selectedKeywords = data.keywords.filter(k => k.selected)
      for (const kw of selectedKeywords) {
        await supabase.from('keywords').insert({
          project_id: project.id,
          keyword: kw.text,
        })
      }

      // Navigate to the new project
      router.push(`/projects/${project.id}`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const selectedCompetitorCount = data.competitors.filter(c => c.selected).length
  const selectedKeywordCount = data.keywords.filter(k => k.selected).length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-50 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to projects
      </Link>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                s === step
                  ? 'bg-violet-600 text-white'
                  : s < step
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'bg-white/5 text-slate-500'
              }`}
            >
              {s < step ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 5 && (
              <div className={`w-12 h-0.5 mx-2 ${s < step ? 'bg-violet-600' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        {/* Step 1: Project Name */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-50 mb-2">Name Your Project</h2>
            <p className="text-slate-400 mb-8">
              What client or brand are you tracking Share of Voice for?
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={data.projectName}
                  onChange={(e) => updateData({ projectName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., Upgraded Points"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Website URL (optional)
                </label>
                <input
                  type="url"
                  value={data.websiteUrl}
                  onChange={(e) => updateData({ websiteUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="https://upgradedpoints.com"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Used to suggest relevant competitors and keywords
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Your Brand */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-50 mb-2">Add Your Brand</h2>
            <p className="text-slate-400 mb-8">
              This is the brand you're tracking Share of Voice for.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={data.brandName}
                  onChange={(e) => updateData({ brandName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., Upgraded Points"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Brand Aliases
                </label>
                <input
                  type="text"
                  value={data.brandAliases}
                  onChange={(e) => updateData({ brandAliases: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="UpgradedPoints, UP (comma separated)"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Alternative names or spellings AI might use
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Competitors */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-50 mb-2">Add Competitors</h2>
            <p className="text-slate-400 mb-6">
              Select competitors to track. You can add up to 10.
            </p>

            <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-300 mb-3">
                <span className="text-violet-400">💡 AI Suggestions</span> based on "{data.brandName}"
              </p>
              <div className="flex flex-wrap gap-2">
                {data.competitors.map((comp, index) => (
                  <button
                    key={index}
                    onClick={() => toggleCompetitor(index)}
                    disabled={!comp.selected && selectedCompetitorCount >= 10}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      comp.selected
                        ? 'bg-orange-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-50'
                    }`}
                  >
                    {comp.selected ? '✓ ' : '+ '}{comp.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={data.customCompetitor}
                onChange={(e) => updateData({ customCompetitor: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addCustomCompetitor()}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Add competitor manually"
                disabled={selectedCompetitorCount >= 10}
              />
              <button
                onClick={addCustomCompetitor}
                disabled={!data.customCompetitor.trim() || selectedCompetitorCount >= 10}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              {selectedCompetitorCount}/10 competitors selected
            </p>
          </div>
        )}

        {/* Step 4: Keywords */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-50 mb-2">Add Keywords</h2>
            <p className="text-slate-400 mb-6">
              These are the questions we'll ask AI systems to measure Share of Voice.
            </p>

            <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-300 mb-3">
                <span className="text-violet-400">💡 AI Suggestions</span> - people might ask:
              </p>
              <div className="space-y-2">
                {data.keywords.map((kw, index) => (
                  <button
                    key={index}
                    onClick={() => toggleKeyword(index)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                      kw.selected
                        ? 'bg-lime-600/20 text-lime-400 border border-lime-500/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    {kw.selected ? '✓ ' : '+ '}{kw.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={data.customKeyword}
                onChange={(e) => updateData({ customKeyword: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addCustomKeyword()}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Add keyword/question manually"
              />
              <button
                onClick={addCustomKeyword}
                disabled={!data.customKeyword.trim()}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              {selectedKeywordCount} keywords selected
            </p>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-50 mb-2">Ready to Track!</h2>
            <p className="text-slate-400 mb-8">
              Review your project setup and create it.
            </p>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-slate-400 mb-1">Project</p>
                <p className="text-lg font-semibold text-slate-50">{data.projectName}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-slate-400 mb-1">Your Brand</p>
                <p className="text-lg font-semibold text-violet-400">{data.brandName}</p>
                {data.brandAliases && (
                  <p className="text-sm text-slate-500 mt-1">Aliases: {data.brandAliases}</p>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-slate-400 mb-2">Competitors ({selectedCompetitorCount})</p>
                <div className="flex flex-wrap gap-2">
                  {data.competitors.filter(c => c.selected).map((c, i) => (
                    <span key={i} className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded text-sm">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-slate-400 mb-2">Keywords ({selectedKeywordCount})</p>
                <div className="space-y-1">
                  {data.keywords.filter(k => k.selected).slice(0, 5).map((k, i) => (
                    <p key={i} className="text-sm text-slate-300">• {k.text}</p>
                  ))}
                  {selectedKeywordCount > 5 && (
                    <p className="text-sm text-slate-500">...and {selectedKeywordCount - 5} more</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-5 py-2.5 text-slate-400 hover:text-slate-50 font-medium transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={createProject}
              disabled={loading || selectedKeywordCount === 0}
              className="px-6 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project & Start Tracking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
