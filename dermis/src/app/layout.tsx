import type { Metadata } from 'next'
import './globals.css'
import { ClientProviders } from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: 'Dermis | AI-First Dermatology EMR',
  description: 'Modern dermatology practice management with AI-powered clinical documentation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
