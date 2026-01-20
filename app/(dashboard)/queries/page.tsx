import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DeleteQueryButton } from './DeleteQueryButton'
import { RunQueryButton } from './RunQueryButton'

export default async function QueriesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: queries } = await supabase
    .from('queries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .eq('user_id', user.id)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Queries</h1>
          <p className="text-slate-400">
            Questions we ask AI systems to measure your Share of Voice.
          </p>
        </div>
        <Link
          href="/queries/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Query
        </Link>
      </div>

      {/* Queries list */}
      {!queries || queries.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-50 mb-2">No queries yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Queries are questions we ask AI systems to see which brands they recommend.
          </p>
          <Link
            href="/queries/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create your first query
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => (
            <div
              key={query.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        query.is_active ? 'bg-lime-500' : 'bg-slate-500'
                      }`}
                    />
                    <h3 className="text-slate-50 font-medium truncate">
                      {query.query_text}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {query.category && (
                      <span className="px-2 py-1 bg-violet-600/20 text-violet-400 rounded-lg text-xs">
                        {query.category}
                      </span>
                    )}
                    <span className="text-slate-500">
                      Created {new Date(query.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RunQueryButton queryId={query.id} brands={brands || []} />
                  <DeleteQueryButton queryId={query.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggested queries */}
      {queries && queries.length > 0 && queries.length < 5 && (
        <div className="mt-8 bg-gradient-to-br from-violet-600/10 to-violet-800/10 border border-violet-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-3">Suggested queries</h3>
          <p className="text-slate-400 text-sm mb-4">
            Try these common queries to get comprehensive SOV data:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "What's the best CRM for small businesses?",
              "What marketing automation tool do you recommend?",
              "Which project management software is best for agencies?",
              "What analytics platform should I use?",
            ].map((suggestion, i) => (
              <Link
                key={i}
                href={`/queries/new?text=${encodeURIComponent(suggestion)}`}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-lg transition-colors"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
