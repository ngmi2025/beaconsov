'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { QueryInsert } from '@/types/database'

const categories = [
  'CRM',
  'Marketing',
  'Analytics',
  'Project Management',
  'Email Marketing',
  'Social Media',
  'E-commerce',
  'Customer Support',
  'Other',
]

export default function NewQueryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillText = searchParams.get('text') || ''

  const [queryText, setQueryText] = useState(prefillText)
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (prefillText) {
      setQueryText(prefillText)
    }
  }, [prefillText])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const insertData: QueryInsert = {
      user_id: user.id,
      query_text: queryText.trim(),
      category: category || null,
      is_active: true,
    }
    const { error: insertError } = await supabase.from('queries').insert(insertData)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/queries')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/queries"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-50 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to queries
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Create a Query</h1>
        <p className="text-slate-400">
          Add a question to ask AI systems. We'll track which brands they recommend.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Query text */}
          <div>
            <label htmlFor="queryText" className="block text-sm font-medium text-slate-300 mb-2">
              Query *
            </label>
            <textarea
              id="queryText"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
              placeholder="e.g., What's the best CRM for small businesses?"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Write it naturally, as if you were asking ChatGPT
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-[#1a1625]">Select a category (optional)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#1a1625]">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-50 mb-2">💡 Tips for good queries</h3>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• Be specific: "Best CRM for small businesses" vs "Best CRM"</li>
            <li>• Ask for recommendations: "Which tool do you recommend for..."</li>
            <li>• Include context: "...for a marketing agency"</li>
            <li>• Test variations: Same question worded differently</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Query'}
          </button>
          <Link
            href="/queries"
            className="px-6 py-3 text-slate-400 hover:text-slate-50 font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
