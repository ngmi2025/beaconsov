import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get counts
  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: brandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: queriesCount } = await supabase
    .from('queries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get recent projects
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-50 mb-2">Welcome back!</h1>
      <p className="text-slate-400 mb-8">Here's an overview of your SOV tracking.</p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-50 mb-1">{projectsCount || 0}</p>
          <p className="text-slate-400">Projects</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-lime-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-50 mb-1">{brandsCount || 0}</p>
          <p className="text-slate-400">Brands Tracked</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-50 mb-1">{queriesCount || 0}</p>
          <p className="text-slate-400">Queries</p>
        </div>
      </div>

      {/* New Projects Feature Highlight */}
      {(projectsCount || 0) === 0 && (
        <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/10 border border-violet-500/20 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-violet-600/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">🚀</span>
            </div>
            <div className="flex-1">
              <span className="inline-block px-2 py-1 bg-lime-500/20 text-lime-400 text-xs font-medium rounded mb-3">
                New Feature
              </span>
              <h2 className="text-xl font-bold text-slate-50 mb-2">
                Introducing Projects
              </h2>
              <p className="text-slate-400 mb-4">
                Projects help you organize SOV tracking by client. Each project has its own brand, competitors, and keywords — just like how Ahrefs or Semrush work!
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Project
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      {recentProjects && recentProjects.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-50">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-violet-400 hover:text-violet-300">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-violet-500/50 hover:bg-white/[0.07] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-violet-400">
                      {project.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">{project.name}</h3>
                    {project.website_url && (
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{project.website_url}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/projects/new"
            className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/50 hover:bg-white/[0.07] transition-all"
          >
            <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-300">New Project</span>
          </Link>

          <Link
            href="/brands/new"
            className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/50 hover:bg-white/[0.07] transition-all"
          >
            <div className="w-10 h-10 bg-lime-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-300">Add Brand</span>
          </Link>

          <Link
            href="/queries/new"
            className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/50 hover:bg-white/[0.07] transition-all"
          >
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-300">New Query</span>
          </Link>

          <Link
            href="/analytics"
            className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/50 hover:bg-white/[0.07] transition-all"
          >
            <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-300">Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
