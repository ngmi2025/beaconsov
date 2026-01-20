'use client'

import { useState, FormEvent } from 'react'
import { Logo } from './components/Logo'

// Feature card component - simplified with numbers
const FeatureCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="glass-card rounded-2xl p-8">
    <div className="text-5xl font-bold gradient-text mb-4">{number}</div>
    <h3 className="text-xl font-semibold text-slate-50 mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </div>
)

// Stat card - clean, no icons
const StatCard = ({ value, label, note }: { value: string; label: string; note?: string }) => (
  <div className="text-center">
    <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{value}</div>
    <div className="text-slate-400 text-sm">
      {label}
      {note && <span className="text-slate-500 text-xs block mt-1">{note}</span>}
    </div>
  </div>
)

// Social icons
const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

export default function Home() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setIsSubmitted(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Failed to submit. Please try again.')
    }
    
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0C0A1D]/80 backdrop-blur-xl border-b border-violet-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-slate-50 font-semibold text-xl tracking-tight">
              Beacon<span className="gradient-text-purple">SOV</span>
            </span>
          </div>
          <a
            href="#signup"
            className="btn-primary text-sm px-5 py-2.5 rounded-lg"
          >
            <span>Join Waitlist</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="signup" className="relative min-h-screen flex items-center pt-20 pb-12 px-6 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="gradient-orb top-[-200px] right-[-100px]" />
        <div className="gradient-orb-2 bottom-[100px] left-[-100px]" />
        
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern opacity-30" />
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-3xl">
            {/* Eyebrow badge */}
            <div className="badge mb-8 fade-in-up">
              <span className="badge-dot" />
              <span>Be first to get access</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-slate-50 mb-6 leading-[0.95] tracking-tight fade-in-up fade-in-up-delay-1">
              Know how AI<br />
              <span className="gradient-text">recommends your brand</span>
            </h1>

            {/* Subtext - one punchy line */}
            <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-xl fade-in-up fade-in-up-delay-2">
              Track your Share of Voice across ChatGPT, Claude, Perplexity & Gemini.
            </p>

            {/* Email Capture Form */}
            <div className="fade-in-up fade-in-up-delay-3">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    required
                    className="input-field flex-1 min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary-hero text-lg px-8 py-4 rounded-xl whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{isSubmitting ? 'Joining...' : 'Join the Waitlist →'}</span>
                  </button>
                </form>
              ) : (
                <div className="glass-card rounded-2xl p-6 max-w-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-lime-500/20 flex items-center justify-center">
                      <span className="text-lime-400 text-xl">✓</span>
                    </div>
                    <div>
                      <p className="text-slate-50 font-semibold">You're on the list!</p>
                      <p className="text-slate-400 text-sm">We'll be in touch soon with early access.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
              
              {/* Benefit text */}
              {!isSubmitted && (
                <p className="text-slate-400 text-sm mt-4">
                  🎁 Founding members get 25% off forever
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Clean */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-50 mb-4 tracking-tight">
              The shift is already happening
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Your clients rank #1 on Google—but AI recommends their competitors instead.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatCard value="800%" label="AI search traffic growth YoY" />
            <StatCard value="25%" label="Traditional search drop by 2026" />
            <StatCard value="2.5B" label="AI prompts processed daily" />
            <StatCard value="0%" label="Visibility in your current stack" note="*with traditional SEO tools" />
          </div>
        </div>
      </section>

      {/* How It Works - Numbered Features */}
      <section className="py-16 px-6 section-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-50 mb-4 tracking-tight">
              Finally, visibility into AI
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              BeaconSOV monitors what AI actually says about your brands
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            <FeatureCard
              number="1"
              title="Track any brand"
              description="Add your clients and competitors. We monitor mentions across ChatGPT, Claude, Perplexity, and Gemini—automatically."
            />
            <FeatureCard
              number="2"
              title="Measure Share of Voice"
              description="See exactly how often each brand gets recommended. Track trends over time. Benchmark against the competition."
            />
            <FeatureCard
              number="3"
              title="Report to clients"
              description="White-label reports your clients will actually understand. Show the value you're delivering in a metric that matters."
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-50 mb-4 tracking-tight">
            Agency-friendly pricing
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            No per-client fees. One price for all your brands.
          </p>

          <div className="glass-card rounded-3xl p-10 inline-block">
            <div className="text-slate-400 mb-3 text-sm uppercase tracking-wider">Early access pricing from</div>
            <div className="text-6xl md:text-7xl font-bold text-slate-50 mb-4 tracking-tight">
              $99<span className="text-2xl font-normal text-slate-500">/mo</span>
            </div>
            <div className="badge mb-6">
              <span className="badge-dot" />
              25% off for founding members
            </div>
            
            {/* Value bullets */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-slate-300 text-sm">
              <span className="flex items-center gap-2">
                <span className="text-lime-400">✓</span> Unlimited brands
              </span>
              <span className="flex items-center gap-2">
                <span className="text-lime-400">✓</span> All major AI platforms
              </span>
              <span className="flex items-center gap-2">
                <span className="text-lime-400">✓</span> White-label reports
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA Banner */}
      <section className="py-16 px-6 section-dark relative overflow-hidden">
        <div className="gradient-orb top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-50 mb-6 tracking-tight">
            Ready to see how AI talks about your clients?
          </h2>
          <a
            href="#signup"
            className="btn-primary-hero inline-block text-lg px-8 py-4 rounded-xl"
          >
            <span>Join the Waitlist →</span>
          </a>
        </div>
      </section>

      {/* FAQ Section - Minimal */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-10 text-center tracking-tight">
            Questions?
          </h2>

          <div className="space-y-4 stagger-children">
            {[
              {
                q: "What is AI Share of Voice?",
                a: "Share of Voice measures how often AI systems (like ChatGPT) recommend or mention your brand compared to competitors. It's the new metric that matters as users shift from Google to AI for recommendations."
              },
              {
                q: "Which AI platforms do you track?",
                a: "We track ChatGPT (GPT-4), Claude, Perplexity, Google Gemini, and Google AI Overviews. More platforms added based on user demand."
              },
              {
                q: "Is this different from regular SEO tools?",
                a: "Yes. SEO tools track Google search rankings. BeaconSOV tracks what AI systems actually say about your brand. Traditional SEO success doesn't guarantee AI visibility."
              },
              {
                q: "When will BeaconSOV launch?",
                a: "We're targeting Q1 2026 for early access. Waitlist members get first access and founding member pricing (25% off forever)."
              }
            ].map((faq, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-50 mb-2">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-violet-500/10">
        <div className="max-w-7xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div>
                <span className="text-slate-50 font-semibold tracking-tight block">
                  Beacon<span className="gradient-text-purple">SOV</span>
                </span>
                <span className="text-slate-500 text-xs">The AI visibility platform for agencies</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="text-slate-400 hover:text-slate-50 transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon />
              </a>
              <a 
                href="#" 
                className="text-slate-400 hover:text-slate-50 transition-colors"
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </a>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-violet-500/10">
            <div className="text-slate-500 text-sm">
              © 2026 BeaconSOV. All rights reserved.
            </div>
            <a 
              href="mailto:hello@beaconsov.com" 
              className="text-slate-400 text-sm hover:text-slate-50 transition-colors"
            >
              hello@beaconsov.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
