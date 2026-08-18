"use client"

import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { GRAMMAR_POINT_BY_ID } from "@/lib/grammar/index"
import type { GrammarPoint } from "@/lib/grammar/types"
import { ensureVoicesLoaded, speakJapanese } from "@/lib/speech"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowLeftRight, Volume2 } from "lucide-react"
import Link from "next/link"

/**
 * 一个语法点 = 一张卡。固定五段结构，缺哪段都说明这个点没讲透：
 * 一句话规律 → 规律表 → 对照表 → 例句 → 易错点
 */
export function PointCard({ point }: { point: GrammarPoint }) {
  const speak = (text: string) => {
    ensureVoicesLoaded().then(() => speakJapanese(text, { rate: 0.9 }).catch(() => {}))
  }

  return (
    <section id={point.id} className="panel-solid scroll-mt-24 rounded-lg p-6 sm:p-8">
      <h3 className="text-xl font-semibold text-fg sm:text-2xl">{point.title}</h3>

      {/* 一句话规律 —— 整张卡的主角 */}
      <p className="mt-3 rounded-lg border-l-4 border-accent bg-accent-soft px-4 py-3 text-base leading-relaxed text-fg sm:text-lg">
        {point.oneLiner}
      </p>

      {/* 规律：什么时候 → 怎么变 → 长这样 */}
      {point.rules && point.rules.length > 0 && (
        <div className="mt-6 space-y-2">
          {point.rules.map((rule) => (
            <div
              key={`${rule.when}-${rule.sample}`}
              className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-baseline sm:gap-3"
            >
              <span className="shrink-0 font-mono text-xs text-fg-tertiary sm:w-44">
                {rule.when}
              </span>
              <span className="flex-1 text-sm text-fg-secondary">{rule.how}</span>
              <span lang="ja" className="font-jp-serif text-base font-medium text-fg">
                {rule.sample}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 对照表 */}
      {point.tables?.map((table) => (
        <div key={table.caption ?? table.headers.join()} className="mt-6">
          {table.caption && (
            <p className="mb-2 text-xs font-semibold text-fg-tertiary">{table.caption}</p>
          )}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-bg-subtle">
                  {table.headers.map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-border px-3 py-2 text-left text-xs font-semibold text-fg-secondary"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.join()} className="border-b border-border last:border-b-0">
                    {row.map((cell, i) => (
                      <td
                        key={`${row.join()}-${i}`}
                        lang="ja"
                        className={cn(
                          "whitespace-nowrap px-3 py-2",
                          i === 0
                            ? "font-mono text-xs text-fg-tertiary"
                            : "font-jp-serif text-fg tracking-wide",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* 例句 */}
      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold text-fg-tertiary">例句</p>
        {point.examples.map((e) => (
          <div key={e.japanese} className="rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-start gap-3">
              <p lang="ja" className="flex-1 font-jp-serif text-lg leading-relaxed text-fg">
                <FuriganaText text={e.japanese} tokens={e.tokens} />
              </p>
              <button
                type="button"
                onClick={() => speak(e.japanese)}
                aria-label="朗読"
                title="朗读"
                className="mt-1 shrink-0 rounded p-1 text-fg-tertiary transition-colors hover:bg-bg-subtle hover:text-fg"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
            <p lang="zh-CN" className="mt-1.5 text-sm text-fg-cn">
              {e.chinese}
            </p>
            <div className="mt-2 flex gap-1.5">
              <Badge variant="default" className="text-[10px]">
                {e.scene === "work" ? "職場" : "日常"}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-jp">
                {e.register}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* 易错点 */}
      <div className="mt-6 rounded-lg border border-warning bg-warning-soft px-4 py-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warning">
          <AlertTriangle className="h-3.5 w-3.5" />
          容易错的地方
        </p>
        <ul className="space-y-1.5">
          {point.pitfalls.map((p) => (
            <li key={p} className="text-sm leading-relaxed text-fg-secondary">
              · {p}
            </li>
          ))}
        </ul>
      </div>

      {/* 关联跳转 */}
      {(point.contrastWith?.length || point.relatedVerbs?.length) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {point.contrastWith?.length ? (
            <>
              <span className="flex items-center gap-1 text-fg-tertiary">
                <ArrowLeftRight className="h-3 w-3" />
                对比着记
              </span>
              {point.contrastWith.map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded border border-border bg-surface px-2 py-0.5 text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
                >
                  {GRAMMAR_POINT_BY_ID.get(id)?.title ?? id}
                </a>
              ))}
            </>
          ) : null}
          {point.relatedVerbs?.length ? (
            <Link
              href="/verbs"
              className="rounded border border-border bg-surface px-2 py-0.5 text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              到 /verbs 练这些动词的变形
            </Link>
          ) : null}
        </div>
      )}
    </section>
  )
}
