import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'macOS Desktop',
  description: 'A web-based macOS desktop environment',
}

export const viewport: Viewport = {
  themeColor: '#1e1e1e',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased overflow-hidden">{children}</body>
    </html>
  )
}
