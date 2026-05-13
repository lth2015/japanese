"use client"

import { BookOpen, Home, PencilLine, Volume2, Zap } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "首页", icon: Home },
  { href: "/drill", label: "写", icon: PencilLine },
  { href: "/read-aloud", label: "读", icon: Volume2 },
  { href: "/quick-fire", label: "说", icon: Zap },
  { href: "/library", label: "库", icon: BookOpen },
] as const

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-bg-base/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 h-16">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                active ? "text-accent" : "text-text-muted",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
