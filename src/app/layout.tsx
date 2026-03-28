import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AmbientBackground } from '@/components/common/AmbientBackground'
import '../styles.css'

export const metadata: Metadata = {
  title: 'EPOCH-X · 상황 맞춤 음악 추천',
  description:
    '지금 상황과 취향에 맞는 노래를 추천합니다. 문장으로 적거나 장르·분위기·템포를 고르면 규칙과 AI가 후보를 좁혀 드립니다.',
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
    <html lang="ko">
      <body className="font-sans antialiased min-h-dvh text-foreground">
        <AmbientBackground />
        <div className="relative z-10 min-h-dvh">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
