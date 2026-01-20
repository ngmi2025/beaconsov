'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewBrandPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCompetitor = searchParams.get('competitor') === 'true'

  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [aliases, setAliases] = useState('')
  const [competitor, setCompetitor] = useState(isCompetitor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    const aliasArray = aliases
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0)

    const { error: insertError } = await supabase.from('brands').insert({
      user_id: user.id,
      name: name.trim(),
      website: website.trim() || null,
      aliases: aliasArray.length > 0 ? aliasArray : null,
      is_competitor: competitor,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/brands')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/brands"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-50 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to brands
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Add a Brand</h1>
        <p className="text-slate-400">
          Add a brand or competitor to track in AI conversations.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Brand name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="e.g., HubSpot"
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-slate-300 mb-2">
              Website
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="https://hubspot.com"
            />
          </div>

          {/* Aliases */}
          <div>
            <label htmlFor="aliases" className="block text-sm font-medium text-slate-300 mb-2">
              Aliases
            </label>
            <input
              id="aliases"
              type="text"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="Hub Spot, Hubspot CRM (comma separated)"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Alternative names or spellings to look for
            </p>
          </div>

          {/* Competitor toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={competitor}
                  onChange={(e) => setCompetitor(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-violet-600 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-slate-300">This is a competitor</span>
            </label>
          </div>
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
            {loading ? 'Adding...' : 'Add Brand'}
          </button>
          <Link
            href="/brands"
            className="px-6 py-3 text-slate-400 hover:text-slate-50 font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
