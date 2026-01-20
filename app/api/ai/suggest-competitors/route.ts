import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { brandName, websiteUrl, industry } = await request.json()

    if (!brandName) {
      return NextResponse.json({ competitors: [], error: 'Brand name is required' }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Return dummy suggestions for development
      console.log('OpenAI API key not configured, returning dummy suggestions')
      return NextResponse.json({
        competitors: [
          `${brandName} Competitor 1`,
          `${brandName} Competitor 2`,
          `${brandName} Competitor 3`,
          `Alternative to ${brandName}`,
          `${brandName} Alternative`,
        ],
      })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Given this brand:
Name: ${brandName}
Website: ${websiteUrl || 'N/A'}
Industry: ${industry || 'N/A'}

List 6-8 likely competitors in the same space. These should be real companies/brands that compete directly with this brand.

Return ONLY a JSON object with a "competitors" array of brand name strings, no explanations.
Example: {"competitors": ["Competitor A", "Competitor B", "Competitor C"]}`
      }],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    const suggestions = JSON.parse(content || '{"competitors":[]}')
    
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error suggesting competitors:', error)
    return NextResponse.json({ competitors: [], error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
