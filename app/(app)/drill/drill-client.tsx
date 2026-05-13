"use client"

import { ArrowRight, BookmarkPlus, Check, Loader2, RotateCcw, Sparkles } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"
import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { diff, type DiffSegment } from "@/lib/diff"
import { getNextDrillSentence, submitDrillAttempt } from "@/lib/actions/drill"
import { applyRating as applyRatingAction } from "@/lib/actions/progress"
import type { Sentence } from "@/lib/db/schema"
import { stageLabel } from "@/lib/progress"
import { cn } from "@/lib/utils"

type Next = { sentence: Sentence; isReview: boolean } | null

interface Props {
  initial: Next
}

type Phase = "input" | "submitted"

type FeedbackState = {
  matchRatio: number
  edits: number
  diffSegments: DiffSegment[]
  rated: boolean
  ratingMessage?: string
}

export function DrillClient({ initial }: Props) {
  const [current, setCurrent] = useState<Next>(initial)
  const [input, setInput] = useState("")
  const [phase, setPhase] = useState<Phase>("input")
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [isRating, startRatingTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (phase === "input") textareaRef.current?.focus()
    if (phase === "submitted") nextButtonRef.current?.focus()
  }, [phase, current?.sentence.id])

  if (!current) {
    return <EmptyState />
  }

  const s = current.sentence

  function handleSubmit() {
    if (!input.trim()) return
    startTransition(async () => {
      const res = await submitDrillAttempt(s.id, input)
      setFeedback({
        matchRatio: res.matchRatio,
        edits: res.edits,
        diffSegments: diff(input, s.japanese),
        rated: false,
      })
      setPhase("submitted")
    })
  }

  function handleRate(quality: 1 | 3 | 5) {
    startRatingTransition(async () => {
      const res = await applyRatingAction(s.id, 2, quality)
      setFeedback((f) =>
        f
          ? {
              ...f,
              rated: true,
              ratingMessage: `${stageLabel(res.previousStage)} → ${stageLabel(res.newStage)}`,
            }
          : f,
      )
    })
  }

  function handleNext() {
    const newCompleted = [...completedIds, s.id]
    setCompletedIds(newCompleted)
    startTransition(async () => {
      const next = await getNextDrillSentence(newCompleted)
      setCurrent(next)
      setInput("")
      setFeedback(null)
      setPhase("input")
    })
  }

  function handleSkip() {
    const newCompleted = [...completedIds, s.id]
    setCompletedIds(newCompleted)
    startTransition(async () => {
      const next = await getNextDrillSentence(newCompleted)
      setCurrent(next)
      setInput("")
      setFeedback(null)
      setPhase("input")
    })
  }

  return (
    <div className="px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm text-fg-secondary">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <span className="font-medium">Stage 2 · 写作 Drill</span>
          {current.isReview && <Badge variant="warning">复习</Badge>}
        </div>
        <div className="text-xs text-fg-tertiary tabular font-mono">
          本轮 {completedIds.length}
        </div>
      </header>

      {/* Prompt */}
      <section className="mb-8">
        <p className="text-xs text-fg-tertiary mb-4 text-center uppercase tracking-wider font-medium">
          把下面这句翻译成自然的工作日语
        </p>
        <div className="border-y border-border py-8 lg:py-10">
          <p
            lang="zh-CN"
            className="text-prompt font-sans text-fg leading-tight text-center"
          >
            {s.chinese}
          </p>
        </div>
        {s.chunkPattern && (
          <p className="text-xs text-fg-tertiary mt-4 text-center">
            提示 · <span className="font-jp text-fg-secondary">{s.chunkPattern}</span>
          </p>
        )}
      </section>

      {/* Input */}
      <section className="space-y-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          disabled={phase === "submitted"}
          placeholder="日本語で入力..."
          lang="ja"
          rows={3}
          className={cn(
            "w-full rounded-md border border-border-input bg-surface px-4 py-3",
            "font-jp text-xl text-fg placeholder:text-fg-tertiary",
            "focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-focus",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "transition-[border-color,box-shadow] duration-150 resize-none",
          )}
        />
        <div className="flex items-center justify-end gap-2">
          {phase === "input" && (
            <>
              <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isPending}>
                跳过
              </Button>
              <Button onClick={handleSubmit} disabled={!input.trim() || isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                提交
                <span className="ml-2 text-xs opacity-60 hidden sm:inline">⌘↵</span>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Feedback */}
      {phase === "submitted" && feedback && (
        <section className="mt-8 space-y-6 animate-fade-in">
          <Card>
            <CardContent className="p-6 space-y-5">
              {/* Your input */}
              <div className="space-y-1.5">
                <p className="text-xs text-fg-tertiary">你的版本</p>
                <p lang="ja" className="font-jp text-fg text-2xl">
                  {input}
                </p>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-fg-tertiary">参考版本（其中一种自然说法）</p>
                  <span
                    className={cn(
                      "text-xs tabular font-mono",
                      feedback.matchRatio >= 0.85
                        ? "text-success"
                        : feedback.matchRatio >= 0.6
                          ? "text-warning"
                          : "text-danger",
                    )}
                  >
                    字符匹配 {Math.round(feedback.matchRatio * 100)}%
                  </span>
                </div>
                <p className="font-jp-serif text-fg text-3xl font-medium">
                  <FuriganaText text={s.japanese} tokens={s.tokens} showRuby={true} />
                </p>
              </div>

              {/* Diff highlight */}
              {feedback.matchRatio < 1 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-fg-tertiary">差异（红=多出，黄=替换，绿=缺失）</p>
                  <p lang="ja" className="font-jp text-base leading-relaxed">
                    {feedback.diffSegments.map((seg, i) => (
                      <DiffSpan key={i} segment={seg} />
                    ))}
                  </p>
                </div>
              )}

              <p className="text-xs text-fg-tertiary leading-relaxed">
                注：字符匹配只是粗信号——你的版本可能用词不同但意思一致也很好。**自评才是真实标准**。
              </p>
            </CardContent>
          </Card>

          {/* Self-rating */}
          {!feedback.rated && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="text-sm text-fg">这次你的表现：</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    className="!border-success/40 hover:!border-success"
                    onClick={() => handleRate(5)}
                    disabled={isRating}
                  >
                    <Check className="h-4 w-4 text-success" />
                    <span>完美</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="!border-warning/40 hover:!border-warning"
                    onClick={() => handleRate(3)}
                    disabled={isRating}
                  >
                    <Check className="h-4 w-4 text-warning" />
                    <span>可接受</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="!border-danger/40 hover:!border-danger"
                    onClick={() => handleRate(1)}
                    disabled={isRating}
                  >
                    <RotateCcw className="h-4 w-4 text-danger" />
                    <span>需要复习</span>
                  </Button>
                </div>
                <p className="text-xs text-fg-tertiary">
                  自评是 SM-2 间隔重复的输入。诚实评分=系统能精准安排你的下次复习。
                </p>
              </CardContent>
            </Card>
          )}

          {feedback.rated && (
            <div className="rounded-xl border border-border bg-surface px-5 py-3 flex items-center gap-3 animate-fade-in">
              <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="text-sm text-fg-secondary flex-1">
                进度更新：<span className="text-fg">{feedback.ratingMessage}</span>
              </p>
            </div>
          )}

          {/* Next */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={isPending}>
              <BookmarkPlus className="h-4 w-4" />
              加入复习
            </Button>
            <Button
              ref={nextButtonRef}
              onClick={handleNext}
              disabled={isPending || !feedback.rated}
            >
              下一题 <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

function DiffSpan({ segment }: { segment: DiffSegment }) {
  switch (segment.op) {
    case "match":
      return <span className="text-fg">{segment.user}</span>
    case "delete":
      return (
        <span className="bg-danger-soft text-danger line-through decoration-2 rounded px-0.5">
          {segment.user}
        </span>
      )
    case "insert":
      return (
        <span className="bg-success-soft text-success rounded px-0.5">{segment.target}</span>
      )
    case "replace":
      return (
        <span className="bg-warning-soft text-warning rounded px-0.5">
          <span className="line-through decoration-2 mr-1">{segment.user}</span>
          <span className="opacity-90">{segment.target}</span>
        </span>
      )
  }
}

function EmptyState() {
  return (
    <div className="px-6 py-24 max-w-2xl mx-auto text-center space-y-4">
      <p className="text-2xl font-semibold tracking-tight">今天的 Drill 都做完了 🎯</p>
      <p className="text-fg-secondary">
        没有待复习的句子，新句子也都过了一遍。明天回来继续。
      </p>
      <Button asChild variant="secondary">
        <a href="/">回 Dashboard</a>
      </Button>
    </div>
  )
}
