import type { Metadata } from "next"
import { Inter, Playfair_Display, Great_Vibes, Rozha_One } from "next/font/google"
import { Search } from "lucide-react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
})

const rozha = Rozha_One({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-rozha",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Sur Sansar - Music of Every State",
  description: "Explore the regional and folk music of India through an interactive map.",
}

import { AuthProvider } from "@/components/auth/AuthProvider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable} ${greatVibes.variable} ${rozha.variable}`}>
      <body className="bg-background-dark text-slate-200 font-sans min-h-screen selection:bg-gold-500/30">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
