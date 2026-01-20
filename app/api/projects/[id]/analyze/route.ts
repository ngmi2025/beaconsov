import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLLMResponses } from '@/lib/dataforseo/llm-responses'

// Create a Supabase client with service role for server-side operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Detect if a brand is mentioned in the response text
function detectBrandMention(responseText: string, brandName: string, aliases: string[] = []): boolean {
  const textLower = responseText.toLowerCase()
  const names = [brandName, ...aliases].map(n => n.toLowerCase())
  
  return names.some(name => {
    // Check for exact word match (not part of another word)
    const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i')
    return regex.test(textLower)
  })
}

// Detect if a brand is recommended (positive sentiment)
function detectBrandRecommendation(responseText: string, brandName: string, aliases: string[] = []): boolean {
  const textLower = responseText.toLowerCase()
  const names = [brandName, ...aliases].map(n => n.toLowerCase())
  
  // Check for recommendation patterns
  const recommendPatterns = [
    'recommend',
    'suggest',
    'best',
    'top pick',
    'excellent',
    'great choice',
    'highly rated',
    'popular',
    'leading',
    'trusted',
  ]
  
  return names.some(name => {
    // Check if brand is mentioned
    if (!detectBrandMention(responseText, name)) return false
    
    // Check if mentioned in positive context (within ~200 chars)
    const nameIndex = textLower.indexOf(name.toLowerCase())
    if (nameIndex === -1) return false
    
    const contextStart = Math.max(0, nameIndex - 200)
    const contextEnd = Math.min(textLower.length, nameIndex + name.length + 200)
    const context = textLower.slice(contextStart, contextEnd)
    
    return recommendPatterns.some(pattern => context.includes(pattern))
  })
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = getSupabaseAdmin()

    // 1. Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 2. Get keywords for this project
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)

    if (keywordsError) {
      return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
    }

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: 'No keywords to analyze' }, { status: 400 })
    }

    // 3. Get brands linked to this project
    const { data: projectBrands, error: brandsError } = await supabase
      .from('project_brands')
      .select('brand_id, is_primary, brands(id, name, aliases)')
      .eq('project_id', projectId)

    if (brandsError) {
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
    }

    const brands = projectBrands?.map((pb: any) => ({
      id: pb.brands.id,
      name: pb.brands.name,
      aliases: pb.brands.aliases || [],
      isPrimary: pb.is_primary,
    })) || []

    if (brands.length === 0) {
      return NextResponse.json({ error: 'No brands to track' }, { status: 400 })
    }

    // 4. Run analysis for each keyword
    const results: any[] = []
    const errors: string[] = []
    const today = new Date().toISOString().split('T')[0]

    for (const keyword of keywords) {
      try {
        console.log(`Analyzing keyword: ${keyword.keyword}`)
        
        // Get LLM responses for this keyword
        const llmResponses = await getLLMResponses(keyword.keyword)

        // Process each response
        for (const response of llmResponses) {
          if (!response.response) continue

          // Check each brand for mentions
          for (const brand of brands) {
            const wasMentioned = detectBrandMention(response.response, brand.name, brand.aliases)
            const wasRecommended = wasMentioned && detectBrandRecommendation(response.response, brand.name, brand.aliases)

            // Store snapshot
            const { error: insertError } = await supabase
              .from('sov_snapshots')
              .insert({
                project_id: projectId,
                brand_id: brand.id,
                keyword_id: keyword.id,
                llm_provider: response.provider,
                was_mentioned: wasMentioned,
                was_recommended: wasRecommended,
                response_text: response.response,
                snapshot_date: today,
              })

            if (insertError) {
              console.error('Failed to insert snapshot:', insertError)
              errors.push(`Failed to save result for ${brand.name} in ${response.provider}`)
            } else {
              results.push({
                keyword: keyword.keyword,
                provider: response.provider,
                brand: brand.name,
                mentioned: wasMentioned,
                recommended: wasRecommended,
              })
            }
          }
        }
      } catch (err) {
        console.error(`Error analyzing keyword "${keyword.keyword}":`, err)
        errors.push(`Failed to analyze: ${keyword.keyword}`)
      }
    }

    // 5. Update project's updated_at
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({
      success: true,
      analyzed: keywords.length,
      brands: brands.length,
      results: results.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Analyzed ${keywords.length} keywords for ${brands.length} brands. ${results.length} snapshots created.`,
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
