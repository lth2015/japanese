"use client"

import {
  BookOpen,
  FileText,
  Headphones,
  Home,
  MonitorPlay,
  PencilLine,
  Settings,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: typeof Home
  soon?: boolean
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/display", label: "Display", icon: MonitorPlay },
  { href: "/drill", label: "写作 · Stage 2", icon: PencilLine },
  { href: "/read-aloud", label: "音読 · Stage 2.5", icon: Volume2 },
  { href: "/listen-write", label: "听写 · Stage 3", icon: Headphones },
  { href: "/quick-fire", label: "Quick-Fire · Stage 4", icon: Zap },
  { href: "/passages", label: "短文", icon: FileText },
  { href: "/talk", label: "对话", icon: Sparkles, soon: true },
  { href: "/library", label: "场景库", icon: BookOpen },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-bg-base">
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent/15 border border-accent/30 grid place-items-center text-accent font-jp-serif font-bold">
            日
          </div>
          <span className="font-semibold tracking-tight">Nihongo Studio</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon, soon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-bg-elevated text-text-primary border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {soon && (
                <span className="text-xs text-text-muted font-mono">soon</span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60 transition-colors"
        >
          <Settings className="h-4 w-4" strokeWidth={1.75} />
          <span>设置</span>
        </Link>
      </div>
    </aside>
  )
}
