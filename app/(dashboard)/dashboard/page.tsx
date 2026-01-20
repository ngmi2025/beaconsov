import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get counts
  const { count: brandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const { count: queriesCount } = await supabase
    .from('queries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-slate-400">
          Here's what's happening with your AI Share of Voice.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-xs text-slate-500">Brands</span>
          </div>
          <p className="text-3xl font-bold text-slate-50">{brandsCount || 0}</p>
          <p className="text-sm text-slate-400 mt-1">brands tracked</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-lime-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-slate-500">Queries</span>
          </div>
          <p className="text-3xl font-bold text-slate-50">{queriesCount || 0}</p>
          <p className="text-sm text-slate-400 mt-1">active queries</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xs text-slate-500">SOV</span>
          </div>
          <p className="text-3xl font-bold text-slate-50">--</p>
          <p className="text-sm text-slate-400 mt-1">avg. share of voice</p>
        </div>
      </div>

      {/* Getting started */}
      {(!brandsCount || brandsCount === 0) && (
        <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/20 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-50 mb-2">Get started with BeaconSOV</h2>
          <p className="text-slate-400 mb-6">
            Set up your first brand and query to start tracking your AI Share of Voice.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/brands/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first brand
            </Link>
            <Link
              href="/queries/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-50 font-semibold rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create a query
            </Link>
          </div>
        </div>
      )}

      {/* Recent activity placeholder */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Recent Activity</h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-400 mb-2">No recent activity</p>
          <p className="text-sm text-slate-500">
            Run your first query to see results here
          </p>
        </div>
      </div>
    </div>
  )
}
