"use client"

import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  type DrillFeedbackResult,
  getNextDrillSentence,
  requestDrillFeedback,
  submitDrillAttempt,
} from "@/lib/actions/drill"
import { applyRating as applyRatingAction } from "@/lib/actions/progress"
import type { Sentence } from "@/lib/db/schema"
import { type DiffSegment, diff } from "@/lib/diff"
import { stageLabel } from "@/lib/progress"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  ArrowRight,
  BookmarkPlus,
  Check,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"

type Next = { sentence: Sentence; isReview: boolean } | null

interface Props {
  initial: Next
}

type Phase = "input" | "submitted"

type FeedbackState = {
  attemptId: string
  matchRatio: number
  edits: number
  diffSegments: DiffSegment[]
  rated: boolean
  ratingMessage?: string
}

type AiFeedbackState = { status: "loading" } | { status: "ok"; result: DrillFeedbackResult }

export function DrillClient({ initial }: Props) {
  const [current, setCurrent] = useState<Next>(initial)
  const [input, setInput] = useState("")
  const [phase, setPhase] = useState<Phase>("input")
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [aiFeedback, setAiFeedback] = useState<AiFeedbackState | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [isRating, startRatingTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (phase === "input") textareaRef.current?.focus()
    if (phase === "submitted") nextButtonRef.current?.focus()
  }, [phase])

  if (!current) {
    return <EmptyState />
  }

  const s = current.sentence

  function loadAiFeedback(attemptId: string) {
    setAiFeedback({ status: "loading" })
    requestDrillFeedback(attemptId)
      .then((result) => setAiFeedback({ status: "ok", result }))
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err)
        setAiFeedback({ status: "ok", result: { status: "error", message } })
      })
  }

  function handleSubmit() {
    if (!input.trim()) return
    startTransition(async () => {
      const res = await submitDrillAttempt(s.id, input)
      setFeedback({
        attemptId: res.attemptId,
        matchRatio: res.matchRatio,
        edits: res.edits,
        diffSegments: diff(input, s.japanese),
        rated: false,
      })
      setPhase("submitted")
      loadAiFeedback(res.attemptId)
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
      setAiFeedback(null)
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
      setAiFeedback(null)
      setPhase("input")
    })
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col lg:min-h-screen">
      <div className="mx-auto w-full max-w-4xl shrink-0 px-4 pt-5 sm:px-6 lg:px-10 lg:pt-8">
        <header className="panel flex items-center justify-between rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-fg-secondary">
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
            <span className="font-medium">Stage 2 · 写作 Drill</span>
            {current.isReview && <Badge variant="warning">复习</Badge>}
          </div>
          <div className="text-xs text-fg-tertiary tabular font-mono">
            本轮 {completedIds.length}
          </div>
        </header>
      </div>

      {/* Content area — vertical-centered in input phase, top-aligned post-submit */}
      <div
        className={cn(
          "mx-auto min-h-0 w-full max-w-4xl flex-1 px-4 pb-16 sm:px-6 lg:px-10",
          "flex flex-col",
          phase === "input" ? "justify-center" : "pt-10",
        )}
      >
        {/* Prompt */}
        <section className={cn(phase === "input" ? "mb-10" : "mb-8")}>
          <p className="text-xs text-fg-tertiary mb-5 text-center uppercase tracking-wider font-medium">
            把下面这句翻译成自然的工作日语
          </p>
          <div className="py-2">
            <p
              lang="zh-CN"
              className="text-prompt font-sans text-fg leading-tight text-center text-balance"
            >
              {s.chinese}
            </p>
          </div>
          {s.chunkPattern && (
            <p className="text-xs text-fg-tertiary mt-5 text-center">
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
              "w-full rounded-lg border border-border-input bg-white/82 px-4 py-3 shadow-sm",
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
                        <DiffSpan key={`${seg.op}-${seg.user}-${seg.target}-${i}`} segment={seg} />
                      ))}
                    </p>
                  </div>
                )}

                <p className="text-xs text-fg-tertiary leading-relaxed">
                  注：字符匹配只是粗信号——你的版本可能用词不同但意思一致也很好。**自评才是真实标准**。
                </p>
              </CardContent>
            </Card>

            {/* AI feedback */}
            {aiFeedback && (
              <AiFeedbackCard
                state={aiFeedback}
                onRetry={() => feedback && loadAiFeedback(feedback.attemptId)}
              />
            )}

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
              <div className="panel flex items-center gap-3 rounded-lg px-5 py-3 animate-fade-in">
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
      return <span className="bg-success-soft text-success rounded px-0.5">{segment.target}</span>
    case "replace":
      return (
        <span className="bg-warning-soft text-warning rounded px-0.5">
          <span className="line-through decoration-2 mr-1">{segment.user}</span>
          <span className="opacity-90">{segment.target}</span>
        </span>
      )
  }
}

function AiFeedbackCard({
  state,
  onRetry,
}: {
  state: AiFeedbackState
  onRetry: () => void
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <p className="text-xs text-fg-tertiary uppercase tracking-wider font-medium">
            AI 自然度反馈
          </p>
          <span className="text-xs text-fg-tertiary font-mono">gemini-2.5-flash</span>
        </div>

        {state.status === "loading" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-fg-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>正在分析...</span>
            </div>
            <div className="space-y-2">
              <div className="h-4 rounded bg-bg-subtle animate-pulse" />
              <div className="h-4 rounded bg-bg-subtle animate-pulse w-5/6" />
              <div className="h-4 rounded bg-bg-subtle animate-pulse w-4/6" />
            </div>
          </div>
        )}

        {state.status === "ok" && state.result.status === "not-configured" && (
          <div className="rounded-lg border border-dashed border-border bg-bg-subtle px-4 py-3 text-sm text-fg-secondary">
            未配置 <code className="font-mono text-xs text-fg">GEMINI_API_KEY</code>
            。在项目根目录的 <code className="font-mono text-xs text-fg">.env</code>
            里填入后重启 dev server 即可启用 AI 反馈。
          </div>
        )}

        {state.status === "ok" && state.result.status === "error" && (
          <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
            <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-danger">AI 反馈生成失败</p>
              <p className="text-xs text-fg-secondary break-words">{state.result.message}</p>
              <Button variant="secondary" size="sm" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" />
                重试
              </Button>
            </div>
          </div>
        )}

        {state.status === "ok" && state.result.status === "ok" && (
          <div className="space-y-4">
            <RegisterRow label="自然" text={state.result.feedback.naturalVersion} />
            <RegisterRow label="商务敬語" text={state.result.feedback.businessVersion} />
            <RegisterRow label="朋友口语" text={state.result.feedback.casualVersion} />
            <div className="border-t border-border pt-4 space-y-1.5">
              <p className="text-xs text-fg-tertiary">点评</p>
              <p className="text-sm leading-relaxed text-fg-secondary">
                {state.result.feedback.explanation}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RegisterRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-1.5">
      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
        {label}
      </Badge>
      <p lang="ja" className="font-jp text-xl text-fg leading-relaxed">
        {text}
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="px-6 py-24 max-w-2xl mx-auto text-center space-y-4">
      <p className="text-2xl font-semibold tracking-tight">今天的 Drill 都做完了 🎯</p>
      <p className="text-fg-secondary">没有待复习的句子，新句子也都过了一遍。明天回来继续。</p>
      <Button asChild variant="secondary">
        <a href="/">回 Dashboard</a>
      </Button>
    </div>
  )
}
