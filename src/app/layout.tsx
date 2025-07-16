import type { Metadata, Viewport } from 'next'
import { Inter, Roboto } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { StarredProvider } from '../contexts/StarredContext'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  display: 'swap'
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-roboto'
})

export const metadata: Metadata = {
  title: 'Refold Activity & Tool Library',
  description: 'Comprehensive library of language learning activities, techniques, and tools for the Refold method',
  keywords: ['language learning', 'refold', 'immersion', 'activities', 'techniques', 'tools'],
  authors: [{ name: 'Refold' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${roboto.variable}`}>
        <StarredProvider>
          {children}
        </StarredProvider>
        <Analytics />
      </body>
    </html>
  )
}