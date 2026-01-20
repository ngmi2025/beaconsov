'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
          setFullName(data.full_name || '')
          setCompanyName(data.company_name || '')
        }
      }
      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage({ type: 'error', text: 'Not authenticated' })
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        company_name: companyName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Settings saved!' })
      router.refresh()
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Settings</h1>
        <p className="text-slate-400">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile section */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-50">Profile</h2>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-2">
              Company name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="Your company"
            />
          </div>
        </div>

        {message && (
          <div
            className={`px-4 py-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-lime-500/10 border border-lime-500/20 text-lime-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Plan section */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-50 font-medium capitalize">{profile?.plan || 'Free'} Plan</p>
            <p className="text-sm text-slate-400">
              {profile?.plan === 'free'
                ? '5 queries per month'
                : profile?.plan === 'starter'
                ? '50 queries per month'
                : profile?.plan === 'growth'
                ? '200 queries per month'
                : 'Unlimited queries'}
            </p>
          </div>
          <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
            Upgrade
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-slate-400 text-sm mb-4">
          Sign out of your account or delete it permanently.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-50 text-sm font-medium rounded-xl transition-colors"
          >
            Sign Out
          </button>
          <button className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
