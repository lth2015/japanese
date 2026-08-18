import { PointCard } from "@/components/grammar/point-card"
import { Badge } from "@/components/ui/badge"
import { GRAMMAR_CHAPTERS, getGrammarChapter } from "@/lib/grammar/index"
import { LEVEL_LABEL } from "@/lib/grammar/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-static"

export function generateStaticParams() {
  return GRAMMAR_CHAPTERS.filter((c) => c.ready).map((c) => ({ chapter: c.id }))
}

export default async function GrammarChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>
}) {
  const { chapter: chapterId } = await params
  const chapter = getGrammarChapter(chapterId)
  if (!chapter || !chapter.ready) notFound()

  const readyChapters = GRAMMAR_CHAPTERS.filter((c) => c.ready)
  const pos = readyChapters.findIndex((c) => c.id === chapter.id)
  const prev = pos > 0 ? readyChapters[pos - 1] : null
  const next = pos < readyChapters.length - 1 ? readyChapters[pos + 1] : null

  return (
    <div className="page-container space-y-6">
      <Link
        href="/grammar"
        className="inline-flex items-center gap-1 text-sm text-fg-tertiary transition-colors hover:text-fg"
      >
        <ChevronLeft className="h-4 w-4" />
        语法体系
      </Link>

      <header className="panel-solid rounded-lg p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent" className="text-[10px]">
            {LEVEL_LABEL[chapter.level]}
          </Badge>
          <span className="font-mono text-xs text-fg-tertiary">第 {chapter.no} 章</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-fg sm:text-3xl">{chapter.title}</h1>
        <p lang="ja" className="mt-1 font-jp-serif text-sm text-fg-tertiary">
          {chapter.titleJa}
        </p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-fg-secondary">
          {chapter.summaryZh}
        </p>

        {chapter.prerequisites.length > 0 && (
          <p className="mt-4 text-xs text-fg-tertiary">
            建议先看：
            {chapter.prerequisites.map((id) => {
              const pre = GRAMMAR_CHAPTERS.find((c) => c.id === id)
              if (!pre) return null
              return (
                <Link
                  key={id}
                  href={`/grammar/${id}`}
                  className="ml-1 text-accent underline-offset-2 hover:underline"
                >
                  第{pre.no}章 {pre.title}
                </Link>
              )
            })}
          </p>
        )}

        {/* 本章语法点跳转 */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {chapter.points.map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              {p.title}
            </a>
          ))}
        </div>
      </header>

      <div className="space-y-6">
        {chapter.points.map((p) => (
          <PointCard key={p.id} point={p} />
        ))}
      </div>

      <nav className="flex items-center justify-between gap-3 pt-2">
        {prev ? (
          <Link
            href={`/grammar/${prev.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
          >
            <ChevronLeft className="h-4 w-4" />第{prev.no}章 {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/grammar/${next.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
          >
            第{next.no}章 {next.title}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
