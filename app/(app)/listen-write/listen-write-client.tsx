"use client"

import { ArrowRight, Check, Headphones, Loader2, Play, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"
import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { applyRating as applyRatingAction } from "@/lib/actions/progress"
import {
  getNextListenWriteSentence,
  submitListenWriteAttempt,
} from "@/lib/actions/listen-write"
import type { Sentence } from "@/lib/db/schema"
import { diff, type DiffSegment } from "@/lib/diff"
import { stageLabel } from "@/lib/progress"
import { ensureVoicesLoaded, speakJapanese } from "@/lib/speech"
import { cn } from "@/lib/utils"

type Next = { sentence: Sentence; isReview: boolean; isUnlocked: boolean } | null
type Phase = "ready" | "input" | "submitted"

const MAX_REPLAYS = 2 // initial play + 2 replays = 3 total

interface Props {
  initial: Next
}

export function ListenWriteClient({ initial }: Props) {
  const [current, setCurrent] = useState<Next>(initial)
  const [phase, setPhase] = useState<Phase>("ready")
  const [input, setInput] = useState("")
  const [replays, setReplays] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{
    matchRatio: number
    diffSegs: DiffSegment[]
    rated: boolean
    ratingMessage?: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ensureVoicesLoaded()
  }, [])

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (phase === "input") textareaRef.current?.focus()
  }, [phase, current?.sentence.id])

  if (!current) return <EmptyState />

  const s = current.sentence

  async function playAudio() {
    setPlaying(true)
    try {
      await speakJapanese(s.japanese)
    } catch {
      // browser may have ended speech; ignore
    } finally {
      setPlaying(false)
    }
  }

  async function handleFirstListen() {
    setPhase("input")
    await playAudio()
  }

  async function handleReplay() {
    if (replays >= MAX_REPLAYS) return
    setReplays((r) => r + 1)
    await playAudio()
  }

  function handleSubmit() {
    if (!input.trim()) return
    startTransition(async () => {
      const res = await submitListenWriteAttempt(s.id, input, replays)
      setFeedback({
        matchRatio: res.matchRatio,
        diffSegs: diff(input, s.japanese),
        rated: false,
      })
      setPhase("submitted")
    })
  }

  function handleRate(quality: 1 | 3 | 5) {
    startTransition(async () => {
      const res = await applyRatingAction(s.id, 3, quality)
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
    setInput("")
    setReplays(0)
    setFeedback(null)
    setPhase("ready")
    startTransition(async () => {
      const next = await getNextListenWriteSentence(newCompleted)
      setCurrent(next)
    })
  }

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-16 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10 lg:mb-14">
        <div className="flex items-center gap-2 text-sm lg:text-base text-text-secondary">
          <Headphones className="h-5 w-5 text-accent" strokeWidth={1.75} />
          <span className="font-medium">Stage 3 · 听写</span>
          {current.isReview && <Badge variant="warning">复习</Badge>}
          {!current.isUnlocked && (
            <Badge variant="outline">先解锁到 Stage 2.5 效果更好</Badge>
          )}
        </div>
        <div className="text-sm text-text-muted tabular">本轮已完成 {completedIds.length}</div>
      </header>

      {/* Ready state — show big "listen" button, no Japanese text */}
      {phase === "ready" && (
        <section className="my-20 lg:my-32 text-center space-y-10">
          <div className="space-y-4">
            <p className="text-2xl lg:text-3xl text-text-primary font-medium">
              准备好了就点播放
            </p>
            <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              不显示日文。听完后凭记忆写下来。最多重听 {MAX_REPLAYS} 次。
            </p>
          </div>
          <Button size="lg" onClick={handleFirstListen} disabled={playing} className="!h-14 !px-10 !text-base">
            {playing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            播放
          </Button>
        </section>
      )}

      {/* Input state — show replay + textarea */}
      {phase === "input" && (
        <section className="space-y-6">
          <div className="border-y border-border py-8 text-center">
            <div className="inline-flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={handleReplay}
                disabled={playing || replays >= MAX_REPLAYS}
              >
                {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                重听 ({MAX_REPLAYS - replays} 次剩余)
              </Button>
              <span className="text-xs text-text-muted">
                播放次数：{replays + 1} / {MAX_REPLAYS + 1}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-text-muted">把你听到的写下来：</p>
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
              placeholder="日本語で入力..."
              lang="ja"
              rows={3}
              className={cn(
                "w-full rounded-xl border border-border bg-bg-elevated px-4 py-3",
                "font-jp text-lg text-text-primary placeholder:text-text-muted",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-border-strong",
                "transition-colors duration-150 resize-none",
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleSubmit} disabled={!input.trim() || isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              提交
              <span className="ml-2 text-xs text-text-primary/60 hidden sm:inline">⌘ + ↵</span>
            </Button>
          </div>
        </section>
      )}

      {/* Submitted state — show feedback */}
      {phase === "submitted" && feedback && (
        <section className="mt-8 space-y-6 animate-fade-in">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs text-text-muted">你听到的</p>
                <p lang="ja" className="font-jp text-text-primary text-lg">
                  {input}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted">原句</p>
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
                    匹配 {Math.round(feedback.matchRatio * 100)}% · 重听 {replays} 次
                  </span>
                </div>
                <p className="font-jp-serif text-text-primary text-xl">
                  <FuriganaText text={s.japanese} tokens={s.tokens} showRuby={true} />
                </p>
                <p className="text-text-secondary text-sm mt-1" lang="zh-CN">
                  {s.chinese}
                </p>
              </div>

              {feedback.matchRatio < 1 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-text-muted">差异</p>
                  <p lang="ja" className="font-jp text-base leading-relaxed">
                    {feedback.diffSegs.map((seg, i) => (
                      <DiffSpan key={i} segment={seg} />
                    ))}
                  </p>
                </div>
              )}

              <p className="text-xs text-text-muted leading-relaxed">
                Stage 3 是把"听"接到"写"上。重听越少，分越实。
              </p>
            </CardContent>
          </Card>

          {!feedback.rated && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="text-sm text-text-primary">这次自评：</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    className="!border-success/40 hover:!border-success"
                    onClick={() => handleRate(5)}
                    disabled={isPending}
                  >
                    <Check className="h-4 w-4 text-success" />
                    全听准了
                  </Button>
                  <Button
                    variant="secondary"
                    className="!border-warning/40 hover:!border-warning"
                    onClick={() => handleRate(3)}
                    disabled={isPending}
                  >
                    <Check className="h-4 w-4 text-warning" />
                    大致对
                  </Button>
                  <Button
                    variant="secondary"
                    className="!border-danger/40 hover:!border-danger"
                    onClick={() => handleRate(1)}
                    disabled={isPending}
                  >
                    <RotateCcw className="h-4 w-4 text-danger" />
                    没听清
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {feedback.rated && (
            <div className="rounded-xl border border-border bg-bg-elevated px-5 py-3 flex items-center gap-3 animate-fade-in">
              <Headphones className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="text-sm text-text-secondary flex-1">
                进度更新：<span className="text-text-primary">{feedback.ratingMessage}</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleNext} disabled={isPending || !feedback.rated}>
              下一句 <ArrowRight className="h-4 w-4" />
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
      return <span className="text-text-primary">{segment.user}</span>
    case "delete":
      return (
        <span className="bg-danger/20 text-danger line-through decoration-2 rounded px-0.5">
          {segment.user}
        </span>
      )
    case "insert":
      return <span className="bg-success/20 text-success rounded px-0.5">{segment.target}</span>
    case "replace":
      return (
        <span className="bg-warning/20 text-warning rounded px-0.5">
          <span className="line-through decoration-2 mr-1">{segment.user}</span>
          <span className="opacity-90">{segment.target}</span>
        </span>
      )
  }
}

function EmptyState() {
  return (
    <div className="px-6 py-24 max-w-2xl mx-auto text-center space-y-4">
      <p className="text-2xl font-semibold tracking-tight">听写做完了 🎧</p>
      <p className="text-text-secondary">明天回来继续。</p>
      <Button asChild variant="secondary">
        <a href="/">回 Dashboard</a>
      </Button>
    </div>
  )
}
