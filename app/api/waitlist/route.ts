import { NextResponse } from 'next/server'

// Simple in-memory store for development
// In production, you'd want to use a database or email service
const waitlistEmails: string[] = []

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    // Log to console (visible in Vercel Function Logs)
    console.log('🚀 New waitlist signup:', email, new Date().toISOString())
    
    // Store in memory (for development/demo)
    if (!waitlistEmails.includes(email)) {
      waitlistEmails.push(email)
    }
    
    // Optional: Send yourself an email notification
    // You can add this later with Resend, SendGrid, etc.
    
    return NextResponse.json({ 
      success: true, 
      message: 'Added to waitlist'
    })
    
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// GET endpoint to check waitlist (for your reference)
export async function GET() {
  return NextResponse.json({ 
    count: waitlistEmails.length,
    emails: waitlistEmails 
  })
}
