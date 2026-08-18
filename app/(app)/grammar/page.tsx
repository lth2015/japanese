import { Badge } from "@/components/ui/badge"
import { GRAMMAR_CHAPTERS } from "@/lib/grammar/index"
import { type GrammarLevel, LEVEL_LABEL } from "@/lib/grammar/types"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-static"

const LEVELS: GrammarLevel[] = [1, 2, 3, 4, 5]

export default function GrammarIndexPage() {
  const readyCount = GRAMMAR_CHAPTERS.filter((c) => c.ready).length
  const pointCount = GRAMMAR_CHAPTERS.reduce((n, c) => n + c.points.length, 0)

  return (
    <div className="page-container space-y-8">
      <header className="panel-solid rounded-lg p-6 sm:p-8">
        <p className="page-kicker">Grammar System</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-fg sm:text-4xl">语法体系</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-fg-secondary">
              13 章由浅入深。每个语法点固定五段：一句话规律 → 变形步骤 → 对照表 → 真实例句 →
              易错点。规律一律用大白话讲，术语只在必要时出现。
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-tint px-4 py-3">
            <p className="font-mono text-2xl font-semibold leading-none text-accent tabular">
              {pointCount}
            </p>
            <p className="mt-1 text-xs text-fg-tertiary">
              语法点 · {readyCount}/{GRAMMAR_CHAPTERS.length} 章
            </p>
          </div>
        </div>
      </header>

      {LEVELS.map((level) => {
        const chapters = GRAMMAR_CHAPTERS.filter((c) => c.level === level)
        if (chapters.length === 0) return null
        return (
          <section key={level} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg-tertiary">
              {LEVEL_LABEL[level]}
              <span className="h-px flex-1 bg-border" />
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {chapters.map((c) => (
                <ChapterCard key={c.id} chapter={c} />
              ))}
            </div>
          </section>
        )
      })}

      <section className="panel-solid rounded-lg p-6">
        <h2 className="text-lg font-semibold text-fg">关于这套材料</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
          内容按一张流传很广的「整个日语语法体系」手写图补全而来，但没有照抄——原图里有几处
          实质性错误（物主代词一栏抄成了人称代词、把「16 种时态」这套英语框架硬套到日语上、 把经验体
          ～たことがある 标成过去完成时）。这些都已改正，并单列了勘误对照。
        </p>
      </section>
    </div>
  )
}

function ChapterCard({ chapter }: { chapter: (typeof GRAMMAR_CHAPTERS)[number] }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-fg-tertiary">第 {chapter.no} 章</p>
          <h3 className="mt-1 text-base font-semibold text-fg">{chapter.title}</h3>
          <p lang="ja" className="mt-0.5 font-jp-serif text-xs text-fg-tertiary">
            {chapter.titleJa}
          </p>
        </div>
        {chapter.ready ? (
          <Badge variant="accent" className="shrink-0 text-[10px]">
            {chapter.points.length} 点
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            编写中
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{chapter.summaryZh}</p>
      {chapter.ready && (
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-accent">
          开始学 <ChevronRight className="h-3 w-3" />
        </p>
      )}
    </>
  )

  const className = cn(
    "block rounded-lg border p-4 transition-colors",
    chapter.ready
      ? "border-border bg-surface hover:bg-bg-subtle"
      : "border-dashed border-border bg-transparent opacity-60",
  )

  if (!chapter.ready) return <div className={className}>{inner}</div>
  return (
    <Link href={`/grammar/${chapter.id}`} className={className}>
      {inner}
    </Link>
  )
}
