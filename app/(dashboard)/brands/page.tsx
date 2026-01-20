import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DeleteBrandButton } from './DeleteBrandButton'

export default async function BrandsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  const myBrands = brands?.filter(b => !b.is_competitor) || []
  const competitors = brands?.filter(b => b.is_competitor) || []

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Brands</h1>
          <p className="text-slate-400">
            Manage the brands and competitors you're tracking.
          </p>
        </div>
        <Link
          href="/brands/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] hover:bg-[#65a30d] text-black font-semibold rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Brand
        </Link>
      </div>

      {/* My Brands */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-violet-500 rounded-full" />
          My Brands
        </h2>
        
        {myBrands.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-4">No brands added yet</p>
            <Link
              href="/brands/new"
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              Add your first brand →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBrands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
                    <span className="text-violet-400 font-bold text-lg">
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                  <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
                </div>
                <h3 className="text-slate-50 font-semibold mb-1">{brand.name}</h3>
                {brand.website && (
                  <p className="text-sm text-slate-500 truncate">{brand.website}</p>
                )}
                {brand.aliases && brand.aliases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {brand.aliases.map((alias, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-white/5 text-slate-400 rounded-lg"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Competitors */}
      <div>
        <h2 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded-full" />
          Competitors
        </h2>
        
        {competitors.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-4">No competitors added yet</p>
            <Link
              href="/brands/new?competitor=true"
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              Add a competitor →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map((brand) => (
              <div
                key={brand.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
                    <span className="text-orange-400 font-bold text-lg">
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                  <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
                </div>
                <h3 className="text-slate-50 font-semibold mb-1">{brand.name}</h3>
                {brand.website && (
                  <p className="text-sm text-slate-500 truncate">{brand.website}</p>
                )}
                {brand.aliases && brand.aliases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {brand.aliases.map((alias, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-white/5 text-slate-400 rounded-lg"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
