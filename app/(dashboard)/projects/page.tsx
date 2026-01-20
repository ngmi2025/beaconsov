'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  website_url: string | null
  industry: string | null
  created_at: string
  brand_count?: number
  keyword_count?: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      // Get counts for each project
      const projectsWithCounts = await Promise.all(
        data.map(async (project) => {
          const [brandsRes, keywordsRes] = await Promise.all([
            supabase.from('project_brands').select('id', { count: 'exact' }).eq('project_id', project.id),
            supabase.from('keywords').select('id', { count: 'exact' }).eq('project_id', project.id),
          ])
          return {
            ...project,
            brand_count: brandsRes.count || 0,
            keyword_count: keywordsRes.count || 0,
          }
        })
      )
      setProjects(projectsWithCounts)
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Projects</h1>
          <p className="text-slate-400">
            Each project tracks Share of Voice for one client or brand.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-50 mb-3">Create Your First Project</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Projects help you organize SOV tracking by client. Each project has its own brand, competitors, and keywords.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 hover:bg-white/[0.07] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-violet-400">
                    {project.name.charAt(0)}
                  </span>
                </div>
                <svg className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-50 mb-1">{project.name}</h3>
              {project.website_url && (
                <p className="text-sm text-slate-500 mb-4 truncate">{project.website_url}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {project.brand_count} brands
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  {project.keyword_count} keywords
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-xs text-slate-500">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}

          {/* Add New Project Card */}
          <Link
            href="/projects/new"
            className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-6 hover:border-violet-500/50 hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center min-h-[220px] group"
          >
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-violet-600/20 transition-colors">
              <svg className="w-6 h-6 text-slate-500 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-slate-400 group-hover:text-slate-300 font-medium">Add New Project</span>
          </Link>
        </div>
      )}
    </div>
  )
}
