"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { SentenceCard } from "@/components/sentence-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Sentence } from "@/lib/db/schema"

const CATEGORIES = [
  { value: "all", label: "全部" },
  { value: "rescue", label: "救命" },
  { value: "progress", label: "进度" },
  { value: "request", label: "请求" },
  { value: "apology", label: "道歉" },
  { value: "smalltalk", label: "杂谈" },
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
          !(s.kana?.toLowerCase().includes(needle))
        ) {
          return false
        }
      }
      return true
    })
  }, [sentences, tab, q])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜日语 / 假名 / 中文"
            className="pl-9"
          />
        </div>
      </div>

      <p className="text-xs text-text-muted">{filtered.length} 句</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((s) => (
          <Card key={s.id} className="hover:border-border-strong transition-colors">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge>{categoryLabel(s.category)}</Badge>
                <span className="text-xs text-text-muted tabular">
                  {DIFF_LABEL[s.difficulty]}
                </span>
              </div>
              <SentenceCard
                sentence={s}
                size="sm"
                className="!items-start text-left"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-text-muted text-sm py-12 text-center">没有匹配的句子。</p>
      )}
    </div>
  )
}

function categoryLabel(c: string): string {
  return CATEGORIES.find((x) => x.value === c)?.label ?? c
}
