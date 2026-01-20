import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { brandName, competitors, industry } = await request.json()

    if (!brandName) {
      return NextResponse.json({ keywords: [], error: 'Brand name is required' }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Return dummy suggestions for development
      console.log('OpenAI API key not configured, returning dummy suggestions')
      return NextResponse.json({
        keywords: [
          `What is the best ${industry || 'product'} to use?`,
          `${brandName} vs competitors comparison`,
          `Best ${industry || 'tool'} for small businesses`,
          `How to choose a ${industry || 'solution'}`,
          `Top ${industry || 'products'} ranked`,
          `${brandName} alternatives`,
          `Is ${brandName} worth it?`,
          `${brandName} review`,
        ],
      })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Given this brand and competitors:
Brand: ${brandName}
Competitors: ${competitors?.join(', ') || 'N/A'}
Industry: ${industry || 'N/A'}

Generate 10 natural questions that users might ask AI assistants (ChatGPT, Claude, Perplexity, Gemini) when looking for recommendations in this space.

These should be questions where the AI might mention or recommend brands like these.

Format as questions like:
- "What's the best X for Y?"
- "X vs Y comparison"
- "Top X tools/products for Y"
- "How to choose a X"
- "Is X worth it?"

Return ONLY a JSON object with a "keywords" array of strings.
Example: {"keywords": ["What's the best CRM for startups?", "HubSpot vs Salesforce comparison"]}`
      }],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    const suggestions = JSON.parse(content || '{"keywords":[]}')
    
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error suggesting keywords:', error)
    return NextResponse.json({ keywords: [], error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
