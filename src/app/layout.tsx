import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Armin's Spelling Bee",
  description: 'Live multiplayer spelling bee game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
