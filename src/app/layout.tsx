import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Carbon Spelling",
  description: 'Carbon Spelling is a live multiplayer spelling bee game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
