"use client"

import { cn } from "@/lib/utils"
import { BookOpen, Home, PencilLine, Volume2, Zap } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/82 shadow-lg backdrop-blur-2xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-16 grid-cols-5 px-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "my-1 flex flex-col items-center justify-center gap-0.5 rounded-lg text-xs transition-colors",
                active ? "bg-accent-soft text-accent" : "text-fg-tertiary",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
              <span className={cn(active && "font-medium")}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
