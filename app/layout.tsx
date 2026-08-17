import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
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

export const metadata: Metadata = {
  title: "Sur Sansar - Music of Every State",
  description: "Explore the regional and folk music of India through an interactive map.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable}`}>
      <body className="bg-background-dark text-slate-200 font-sans min-h-screen selection:bg-gold-500/30">
        <header className="absolute top-0 w-full z-50 px-6 md:px-12 lg:px-24 py-8 flex items-center justify-between pointer-events-none">
          {/* Logo */}
          <div className="flex items-center gap-4 pointer-events-auto group cursor-pointer">
            <div className="w-10 h-10 text-[#D6A95B] group-hover:rotate-90 transition-transform duration-700 ease-in-out">
              {/* Intricate 8-pointed star/mandala SVG for the logo */}
              <svg viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 0L55 35L90 10L65 45L100 50L65 55L90 90L55 65L50 100L45 65L10 90L35 55L0 50L35 45L10 10L45 35Z" />
                <circle cx="50" cy="50" r="15" fill="#0a0a0a" stroke="currentColor" strokeWidth="3" />
                <circle cx="50" cy="50" r="5" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl tracking-[0.15em] text-[#D6A95B] font-medium leading-none mb-1">
                SUR <span className="text-[#D6A95B]/60 text-lg">•</span> SANSAR
              </span>
              <span className="text-[#D6A95B]/80 text-[10px] tracking-widest uppercase font-medium">
                Music of Every State
              </span>
            </div>
          </div>

          {/* Right Navigation / Slogan */}
          <div className="hidden md:flex flex-col items-center pointer-events-auto mr-4">
            <div className="font-display text-[#D6A95B] text-sm tracking-[0.2em] uppercase font-medium">
              DISCOVER <span className="text-[#D6A95B]/60 mx-2">•</span> LISTEN <span className="text-[#D6A95B]/60 mx-2">•</span> CONNECT
            </div>
            <div className="flex items-center gap-2 mt-2 opacity-60 w-full justify-center">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D6A95B]"></div>
              <div className="text-[#D6A95B]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D6A95B]"></div>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}
