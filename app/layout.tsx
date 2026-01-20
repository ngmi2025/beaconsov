import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BeaconSOV - AI Share of Voice Analytics for Agencies',
  description: 'Know exactly how AI recommends your clients — and how to improve it. Track brand visibility across ChatGPT, Claude, Perplexity, and more.',
  keywords: 'GEO, generative engine optimization, AI share of voice, ChatGPT visibility, AI search, brand monitoring',
  // Block search engines while in development
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'BeaconSOV - AI Share of Voice Analytics',
    description: 'Know exactly how AI recommends your clients — and how to improve it.',
    type: 'website',
    url: 'https://beaconsov.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeaconSOV - AI Share of Voice Analytics',
    description: 'Know exactly how AI recommends your clients — and how to improve it.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
