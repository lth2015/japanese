"use client"

import {
  BookOpen,
  FileText,
  Headphones,
  Home,
  MessageSquare,
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
  hint?: string
  icon: typeof Home
  soon?: boolean
}

const PRIMARY: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
]

const TRAINING: NavItem[] = [
  { href: "/drill", label: "写作 Drill", hint: "Stage 2", icon: PencilLine },
  { href: "/read-aloud", label: "音読", hint: "Stage 2.5", icon: Volume2 },
  { href: "/listen-write", label: "听写", hint: "Stage 3", icon: Headphones },
  { href: "/quick-fire", label: "Quick-Fire", hint: "Stage 4", icon: Zap },
]

const LIBRARY: NavItem[] = [
  { href: "/passages", label: "短文", icon: FileText },
  { href: "/dialogues", label: "情景对话", icon: MessageSquare },
  { href: "/library", label: "场景库", icon: BookOpen },
  { href: "/display", label: "Display", icon: MonitorPlay },
]

const COMING: NavItem[] = [
  { href: "/talk", label: "AI 对话", icon: Sparkles, soon: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-bg-subtle/40">
      <div className="px-5 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-fg grid place-items-center text-fg-on-accent font-jp-serif font-bold text-sm">
            日
          </div>
          <span className="font-semibold tracking-tight text-fg">Nihongo Studio</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto py-2">
        <NavGroup pathname={pathname} items={PRIMARY} />
        <NavGroup pathname={pathname} items={TRAINING} title="训练" />
        <NavGroup pathname={pathname} items={LIBRARY} title="资源" />
        <NavGroup pathname={pathname} items={COMING} title="即将上线" />
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm",
            "text-fg-secondary hover:text-fg hover:bg-bg-subtle transition-colors",
          )}
        >
          <Settings className="h-4 w-4" strokeWidth={1.75} />
          <span>设置</span>
        </Link>
      </div>
    </aside>
  )
}

function NavGroup({
  pathname,
  items,
  title,
}: {
  pathname: string
  items: NavItem[]
  title?: string
}) {
  return (
    <div className="space-y-1">
      {title && (
        <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-fg-tertiary">
          {title}
        </p>
      )}
      {items.map(({ href, label, hint, icon: Icon, soon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
              active
                ? "bg-accent-soft text-accent font-medium"
                : "text-fg-secondary hover:text-fg hover:bg-bg-subtle",
              soon && "opacity-50 pointer-events-none",
            )}
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "")}
              strokeWidth={active ? 2 : 1.75}
            />
            <span className="flex-1">{label}</span>
            {hint && (
              <span
                className={cn(
                  "text-[10px] font-mono",
                  active ? "text-accent/70" : "text-fg-tertiary",
                )}
              >
                {hint}
              </span>
            )}
            {soon && <span className="text-[10px] font-mono text-fg-tertiary">soon</span>}
          </Link>
        )
      })}
    </div>
  )
}
