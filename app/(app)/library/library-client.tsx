"use client"

import { SentenceCard } from "@/components/sentence-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Sentence } from "@/lib/db/schema"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"

const CATEGORIES = [
  { value: "all", label: "全部" },
  { value: "rescue", label: "救命" },
  { value: "progress", label: "进度" },
  { value: "request", label: "请求" },
  { value: "apology", label: "道歉" },
  { value: "smalltalk", label: "杂谈" },
  { value: "daily", label: "日常" },
  { value: "grammar", label: "语法" },
  { value: "custom", label: "自建" },
] as const

type Category = (typeof CATEGORIES)[number]["value"]

const DIFF_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"]

export function LibraryClient({ sentences }: { sentences: Sentence[] }) {
  const [tab, setTab] = useState<Category>("all")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    return sentences.filter((s) => {
      if (tab !== "all" && s.category !== tab) return false
      if (q.trim()) {
        const needle = q.trim().toLowerCase()
        if (
          !s.japanese.toLowerCase().includes(needle) &&
          !s.chinese.toLowerCase().includes(needle) &&
          !s.kana?.toLowerCase().includes(needle)
        ) {
          return false
        }
      }
      return true
    })
  }, [sentences, tab, q])

  return (
    <div className="space-y-6">
      <div className="panel flex flex-col-reverse gap-3 rounded-lg p-3 md:flex-row md:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Category)}>
          <TabsList className="overflow-x-auto whitespace-nowrap max-w-full">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value}>
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative md:ml-auto md:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-tertiary pointer-events-none"
            strokeWidth={2}
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜日语 / 假名 / 中文"
            className="pl-9"
          />
        </div>
      </div>

      <p className="font-mono text-xs text-fg-tertiary tabular">
        {filtered.length} / {sentences.length} 句
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className={cn("pressable group overflow-hidden")}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={categoryVariant(s.category)}>{categoryLabel(s.category)}</Badge>
                <span className="text-xs text-fg-tertiary tabular">{DIFF_LABEL[s.difficulty]}</span>
              </div>
              <SentenceCard sentence={s} size="sm" className="!items-start text-left" />
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-fg-tertiary text-sm py-16 text-center">没有匹配的句子。</p>
      )}
    </div>
  )
}

function categoryLabel(c: string): string {
  return CATEGORIES.find((x) => x.value === c)?.label ?? c
}

function categoryVariant(c: string): "default" | "accent" | "warning" | "danger" {
  // Subtle visual distinction via badge variant — same restrained palette.
  switch (c) {
    case "rescue":
      return "warning"
    case "apology":
      return "danger"
    case "request":
      return "accent"
    default:
      return "default"
  }
}
