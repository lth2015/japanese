"use client"

import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Passage } from "@/lib/db/schema"
import { ensureVoicesLoaded, speakJapanese } from "@/lib/speech"
import { cn } from "@/lib/utils"
import { ChevronLeft, Loader2, Play, Volume2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Props {
  passage: Passage
}

export function PassageReader({ passage }: Props) {
  const [showFurigana, setShowFurigana] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [playingQuestion, setPlayingQuestion] = useState<number | null>(null)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({})
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})

  useEffect(() => {
    ensureVoicesLoaded()
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel()
    }
  }, [])

  async function handlePlayAll() {
    setPlaying(true)
    try {
      await speakJapanese(passage.body, { rate: 0.95 })
    } catch {
      // ignore
    } finally {
      setPlaying(false)
    }
  }

  async function playQuestion(idx: number, text: string) {
    setPlayingQuestion(idx)
    try {
      await speakJapanese(text, { rate: 0.95 })
    } catch {
      // ignore
    } finally {
      setPlayingQuestion((cur) => (cur === idx ? null : cur))
    }
  }

  async function playWord(text: string) {
    try {
      await speakJapanese(text, { rate: 0.9 })
    } catch {
      // ignore
    }
  }

  const questions = passage.questions ?? []
  const vocabulary = passage.vocabulary ?? []

  return (
    <div className="page-container mx-auto max-w-4xl space-y-8">
      <div className="panel-solid rounded-lg p-5 sm:p-7">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/passages">
            <ChevronLeft className="h-4 w-4" />
            返回短文列表
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-jp-serif text-2xl font-medium text-fg" lang="ja">
            {passage.title}
          </h1>
          <Badge>{passage.source}</Badge>
        </div>
        {passage.description && (
          <p className="text-sm text-fg-secondary mt-2" lang="zh-CN">
            {passage.description}
          </p>
        )}
      </div>

      <div className="panel flex items-center gap-2 rounded-lg p-2">
        <Button variant="secondary" size="sm" onClick={handlePlayAll} disabled={playing}>
          {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          朗读全文
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowFurigana((v) => !v)}>
          <Volume2 className="h-4 w-4" />
          {showFurigana ? "隐藏" : "显示"}假名
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 lg:p-8">
          <article
            lang="ja"
            className="font-jp-serif text-fg text-lg leading-loose whitespace-pre-line"
            style={{ lineHeight: 2.2 }}
          >
            <FuriganaText text={passage.body} tokens={passage.tokens} showRuby={showFurigana} />
          </article>
        </CardContent>
      </Card>

      {/* Vocabulary */}
      {vocabulary.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-fg">关键词</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {vocabulary.map((v) => (
              <Card key={v.word} className="bg-white/64">
                <CardContent className="p-3 flex items-baseline gap-3">
                  <span className="font-jp-serif text-fg text-base shrink-0" lang="ja">
                    {v.word}
                  </span>
                  {v.kana && (
                    <span className="font-mono text-fg-tertiary text-xs tabular shrink-0" lang="ja">
                      {v.kana}
                    </span>
                  )}
                  <span className="text-fg-secondary text-sm flex-1" lang="zh-CN">
                    {v.meaning}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 -mr-1"
                    onClick={() => playWord(v.word)}
                    aria-label={`朗读 ${v.word}`}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-fg">问题（用日语回答）</h2>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const revealed = revealedAnswers[i] ?? false
              return (
                <Card key={`${q.type}-${q.q}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={q.type === "open" ? "accent" : "outline"}>
                        {q.type === "fact"
                          ? "细节"
                          : q.type === "open"
                            ? "开放"
                            : q.type === "summary"
                              ? "总结"
                              : "改写"}
                      </Badge>
                      <span className="text-xs text-fg-tertiary">问题 {i + 1}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <p lang="ja" className="font-jp text-fg flex-1">
                        {q.q}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 -mt-1 -mr-1"
                        onClick={() => playQuestion(i, q.q)}
                        disabled={playingQuestion === i}
                        aria-label="朗读问题"
                      >
                        {playingQuestion === i ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <textarea
                      value={userAnswers[i] ?? ""}
                      onChange={(e) => setUserAnswers((u) => ({ ...u, [i]: e.target.value }))}
                      placeholder="日本語で答えてください..."
                      lang="ja"
                      rows={2}
                      className={cn(
                        "w-full rounded-lg border border-border bg-white/82 px-3 py-2 shadow-sm",
                        "font-jp text-fg placeholder:text-fg-tertiary",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        "transition-colors duration-150 resize-none",
                      )}
                    />
                    {!revealed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevealedAnswers((r) => ({ ...r, [i]: true }))}
                      >
                        参考答案
                      </Button>
                    ) : (
                      <div className="space-y-1 pt-2 border-t border-border">
                        <p className="text-xs text-fg-tertiary">参考</p>
                        <p
                          lang={q.type === "open" || q.type === "summary" ? "zh-CN" : "ja"}
                          className={cn(
                            q.type === "open" || q.type === "summary"
                              ? "text-fg-secondary text-sm"
                              : "font-jp text-fg",
                          )}
                        >
                          {q.a}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
