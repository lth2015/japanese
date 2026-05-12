import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const notoJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-jp",
  display: "swap",
  weight: ["400", "500"],
})

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  variable: "--font-jp-serif",
  display: "swap",
  weight: ["500", "700"],
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400"],
})

export const metadata: Metadata = {
  title: "Nihongo Studio",
  description: "Personal Japanese speaking trainer for working professionals.",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B1020",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoJp.variable} ${notoSerifJp.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-dvh bg-bg-base text-text-primary antialiased">{children}</body>
    </html>
  )
}
