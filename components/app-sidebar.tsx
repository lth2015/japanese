"use client"

import { cn } from "@/lib/utils"
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  FlipHorizontal2,
  Headphones,
  Home,
  Layers,
  MessageSquare,
  Mic,
  MonitorPlay,
  PencilLine,
  Settings,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = {
  href: string
  label: string
  hint?: string
  icon: typeof Home
  soon?: boolean
}

const PRIMARY: NavItem[] = [{ href: "/", label: "总览", icon: Home }]

const TRAINING: NavItem[] = [
  { href: "/drill", label: "写作 Drill", hint: "Stage 2", icon: PencilLine },
  { href: "/read-aloud", label: "音読", hint: "Stage 2.5", icon: Volume2 },
  { href: "/listen-write", label: "听写", hint: "Stage 3", icon: Headphones },
  { href: "/quick-fire", label: "Quick-Fire", hint: "Stage 4", icon: Zap },
  { href: "/business-quiz", label: "商务测验", hint: "100句", icon: ClipboardCheck },
  { href: "/learning", label: "口语训练", hint: "口语", icon: Mic },
]

const LIBRARY: NavItem[] = [
  { href: "/passages", label: "短文", icon: FileText },
  { href: "/dialogues", label: "情景对话", icon: MessageSquare },
  { href: "/library", label: "场景库", icon: BookOpen },
  { href: "/display", label: "Display", icon: MonitorPlay },
  { href: "/verbs", label: "動詞変形", hint: "变形练习", icon: FlipHorizontal2 },
  { href: "/tango", label: "単語", hint: "高频词", icon: Layers },
]

const COMING: NavItem[] = [{ href: "/talk", label: "AI 对话", icon: Sparkles, soon: true }]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-white/50 backdrop-blur-2xl lg:flex lg:flex-col">
      <div className="px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg border border-border bg-white/70 p-3 shadow-xs transition-colors hover:bg-white"
        >
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-fg-on-accent shadow-sm">
            <span className="font-jp-serif text-xl font-bold leading-none">日</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-fg">Nihongo Studio</p>
            <p className="truncate text-xs text-fg-tertiary">Speaking trainer</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
        <NavGroup pathname={pathname} items={PRIMARY} />
        <NavGroup pathname={pathname} items={TRAINING} title="训练" />
        <NavGroup pathname={pathname} items={LIBRARY} title="资源" />
        <NavGroup pathname={pathname} items={COMING} title="即将上线" />
      </nav>

      <div className="border-t border-border/80 px-4 py-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
            "text-fg-secondary transition-colors hover:bg-white/65 hover:text-fg",
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
      {title && <p className="px-3 pb-1 text-xs font-semibold text-fg-tertiary">{title}</p>}
      {items.map(({ href, label, hint, icon: Icon, soon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[background-color,color,box-shadow] duration-150",
              active
                ? "bg-white text-accent font-semibold shadow-sm ring-1 ring-border"
                : "text-fg-secondary hover:bg-white/65 hover:text-fg",
              soon && "opacity-50 pointer-events-none",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-accent" : "text-fg-tertiary group-hover:text-fg-secondary",
              )}
              strokeWidth={active ? 2 : 1.75}
            />
            <span className="flex-1">{label}</span>
            {hint && (
              <span
                className={cn(
                  "rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]",
                  active ? "text-accent" : "text-fg-tertiary",
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
