import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import '../styles.css'

export const metadata: Metadata = {
  title: 'MoodTune AI - Question-Based Music Recommendations',
  description: 'Discover your perfect soundtrack through AI-powered questions. MoodTune analyzes your mood, moment, and taste to recommend music that fits you right now.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
