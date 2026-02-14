import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SnapBooks - Invoice Generator for Indian SMBs',
  description: 'Telegram bot that generates GST-compliant invoices from photos of handwritten bills',
  keywords: ['invoice', 'GST', 'India', 'SMB', 'Telegram', 'Hindi', 'billing'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  )
}
