import { createClient } from '@/lib/supabase/server'
import { getLLMResponses } from '@/lib/dataforseo/llm-responses'
import { detectBrandsInText } from '@/lib/dataforseo/llm-mentions'
import { NextResponse } from 'next/server'
import type { Brand, ResultInsert } from '@/types/database'

export async function POST(request: Request) {
  try {
    const { queryId } = await request.json()

    if (!queryId) {
      return NextResponse.json({ error: 'Query ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the query
    const { data: query, error: queryError } = await supabase
      .from('queries')
      .select('*')
      .eq('id', queryId)
      .eq('user_id', user.id)
      .single()

    if (queryError || !query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    // Get user's brands
    const { data: brands } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)

    if (!brands || brands.length === 0) {
      return NextResponse.json(
        { error: 'Add some brands first before running queries' },
        { status: 400 }
      )
    }

    // Check for DataForSEO credentials
    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
      return NextResponse.json(
        { error: 'DataForSEO credentials not configured' },
        { status: 500 }
      )
    }

    // Get LLM responses via DataForSEO
    let llmResponses
    try {
      llmResponses = await getLLMResponses(query.query_text)
    } catch (error) {
      console.error('DataForSEO API error:', error)
      return NextResponse.json(
        { error: 'Failed to get LLM responses. Please try again.' },
        { status: 500 }
      )
    }

    if (llmResponses.length === 0) {
      return NextResponse.json(
        { error: 'No responses received from AI providers' },
        { status: 400 }
      )
    }

    // Process each response and detect brands
    const resultsToInsert: ResultInsert[] = llmResponses
      .filter(r => r.response && r.response.length > 0)
      .map(response => {
        // Detect brands mentioned in the response
        const detection = detectBrandsInText(response.response, brands as Brand[])

        return {
          query_id: queryId,
          llm_provider: response.provider as 'openai' | 'anthropic' | 'google' | 'perplexity',
          llm_model: response.model,
          response_text: response.response,
          brands_mentioned: detection.mentioned,
          brands_recommended: detection.recommended,
        }
      })

    if (resultsToInsert.length === 0) {
      return NextResponse.json(
        { error: 'No valid responses to save' },
        { status: 400 }
      )
    }

    // Save results
    const { error: insertError } = await supabase.from('results').insert(resultsToInsert)

    if (insertError) {
      console.error('Error saving results:', insertError)
      return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
    }

    // Calculate summary
    const allMentioned = new Set<string>()
    const allRecommended = new Set<string>()
    resultsToInsert.forEach(r => {
      r.brands_mentioned.forEach(id => allMentioned.add(id))
      r.brands_recommended.forEach(id => allRecommended.add(id))
    })

    return NextResponse.json({
      success: true,
      resultsCount: resultsToInsert.length,
      providers: resultsToInsert.map(r => r.llm_provider),
      summary: {
        brandsMentioned: allMentioned.size,
        brandsRecommended: allRecommended.size,
        totalResponses: resultsToInsert.length,
      }
    })
  } catch (error) {
    console.error('Run query error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
