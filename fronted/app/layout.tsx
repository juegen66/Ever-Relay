import { Inter } from 'next/font/google'

import { QueryProvider } from '@/components/providers/query-provider'

import type { Metadata, Viewport } from 'next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CloudOS - Your Desktop in the Cloud',
  description: 'A beautiful web-based desktop environment. Access your workspace from any browser, anywhere.',
}

export const viewport: Viewport = {
  themeColor: '#faf8f5',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
