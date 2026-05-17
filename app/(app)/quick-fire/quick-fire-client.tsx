"use client"

import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { applyRating as applyRatingAction } from "@/lib/actions/progress"
import { getNextQuickFireSentence, submitQuickFireAttempt } from "@/lib/actions/quick-fire"
import type { Sentence } from "@/lib/db/schema"
import { type DiffSegment, diff } from "@/lib/diff"
import { stageLabel } from "@/lib/progress"
import { type SttListener, isSttSupported, startJapaneseSTT } from "@/lib/speech"
import { cn } from "@/lib/utils"
import { ArrowRight, Check, Mic, MicOff, RotateCcw, Zap } from "lucide-react"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"

type Next = { sentence: Sentence; isReview: boolean; isUnlocked: boolean } | null
type Phase = "ready" | "counting" | "recording" | "submitted"

const COUNTDOWN_SEC = 5

interface Props {
  initial: Next
}

export function QuickFireClient({ initial }: Props) {
  const [current, setCurrent] = useState<Next>(initial)
  const [phase, setPhase] = useState<Phase>("ready")
  const [transcript, setTranscript] = useState("")
  const [elapsed, setElapsed] = useState(0) // seconds since recording started
  const [firstWordSec, setFirstWordSec] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{
    fluency: number
    accuracy: number
    total: number
    diffSegs: DiffSegment[]
    transcript: string
    rated: boolean
    ratingMessage?: string
  } | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sttSupported, setSttSupported] = useState(true)
  const [isPending, startTransition] = useTransition()

  const sttRef = useRef<SttListener | null>(null)
  const startTimeRef = useRef<number>(0)
  const firstWordRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTranscriptRef = useRef<string>("")

  useEffect(() => {
    setSttSupported(isSttSupported())
  }, [])

  useEffect(() => {
    return () => {
      sttRef.current?.abort()
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)
    }
  }, [])

  const finalizeAndScore = useCallback(
    (tx: string, firstWordTime: number | null) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current)
        safetyTimerRef.current = null
      }
      sttRef.current?.abort()
      sttRef.current = null

      const spokenWithinSec = firstWordTime !== null ? firstWordTime / 1000 : null

      startTransition(async () => {
        const s = current?.sentence
        if (!s) return
        const res = await submitQuickFireAttempt(s.id, tx, spokenWithinSec)
        setFeedback({
          fluency: res.fluencyScore,
          accuracy: res.accuracyScore,
          total: res.totalScore,
          diffSegs: diff(tx, s.japanese),
          transcript: tx,
          rated: false,
        })
        setPhase("submitted")
      })
    },
    [current],
  )

  const startRecording = useCallback(() => {
    if (!sttSupported) {
      setErrorMsg("浏览器不支持语音识别。建议用 Chrome 或 Safari。")
      return
    }
    setErrorMsg(null)
    setTranscript("")
    lastTranscriptRef.current = ""
    setElapsed(0)
    setFirstWordSec(null)
    firstWordRef.current = null
    startTimeRef.current = Date.now()
    setPhase("recording")

    sttRef.current = startJapaneseSTT({
      interimResults: true,
      onResult: (r) => {
        // First non-empty interim transcript = first word time.
        if (firstWordRef.current === null && r.transcript.trim().length > 0) {
          firstWordRef.current = Date.now() - startTimeRef.current
          setFirstWordSec(firstWordRef.current)
        }
        setTranscript(r.transcript)
        lastTranscriptRef.current = r.transcript
      },
      onEnd: () => {
        finalizeAndScore(lastTranscriptRef.current, firstWordRef.current)
      },
      onError: (msg) => {
        // If error happens before any speech, finalize with empty.
        if (msg !== "no-speech" && msg !== "aborted") {
          setErrorMsg(`识别错误：${msg}`)
        }
        finalizeAndScore(lastTranscriptRef.current, firstWordRef.current)
      },
    })

    if (!sttRef.current) return

    // Tick elapsed
    intervalRef.current = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000)
    }, 50)

    // Safety hard-stop at 15s
    safetyTimerRef.current = setTimeout(() => {
      sttRef.current?.abort()
    }, 15_000)
  }, [sttSupported, finalizeAndScore])

  function handleReady() {
    setPhase("counting")
    // Start STT immediately so timing is captured from the "Go" moment.
    startRecording()
  }

  function handleManualStop() {
    sttRef.current?.abort()
  }

  function handleRate(quality: 1 | 3 | 5) {
    const s = current?.sentence
    if (!s) return
    startTransition(async () => {
      const res = await applyRatingAction(s.id, 4, quality)
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
    if (!current) return
    const newCompleted = [...completedIds, current.sentence.id]
    setCompletedIds(newCompleted)
    setTranscript("")
    setFeedback(null)
    setErrorMsg(null)
    setElapsed(0)
    setFirstWordSec(null)
    firstWordRef.current = null
    setPhase("ready")
    startTransition(async () => {
      const next = await getNextQuickFireSentence(newCompleted)
      setCurrent(next)
    })
  }

  if (!current) return <EmptyState />

  const s = current.sentence
  const remainingCountdown = Math.max(0, COUNTDOWN_SEC - elapsed)
  const inCountdown = phase === "recording" && elapsed < COUNTDOWN_SEC

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col lg:min-h-screen">
      <div className="mx-auto w-full max-w-4xl shrink-0 px-4 pt-5 sm:px-6 lg:px-10 lg:pt-8">
        <header className="panel flex items-center justify-between rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-vermilion" strokeWidth={1.75} />
            <span className="text-vermilion font-semibold">Stage 4 · Quick-Fire</span>
            {current.isReview && <Badge variant="warning">复习</Badge>}
            {!current.isUnlocked && <Badge variant="outline">先到 Stage 3 效果更好</Badge>}
          </div>
          <div className="text-xs text-fg-tertiary tabular font-mono">
            本轮 {completedIds.length}
          </div>
        </header>
      </div>

      {/* Content area — centered while practicing, top-aligned post-submit */}
      <div
        className={cn(
          "mx-auto min-h-0 w-full max-w-4xl flex-1 px-4 pb-16 sm:px-6 lg:px-10 flex flex-col",
          phase === "submitted" ? "pt-10" : "justify-center gap-8",
        )}
      >
        <p className="text-sm text-fg-secondary text-center">
          5 秒内开口说出来。
          <span className="text-fg-tertiary">流畅 &gt; 准确。</span>
        </p>

        {/* Chinese prompt */}
        <section className="text-center py-4">
          <p lang="zh-CN" className="text-prompt font-sans text-fg leading-tight text-balance">
            {s.chinese}
          </p>
        </section>

        {/* Controls */}
        {phase === "ready" && (
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              onClick={handleReady}
              disabled={!sttSupported}
              className="!h-16 !px-12 !text-lg"
            >
              <Zap className="h-5 w-5" />
              准备好了（开始 5 秒倒计时）
            </Button>
            {!sttSupported && (
              <p className="text-xs text-fg-tertiary">
                浏览器不支持语音识别。建议 Chrome / Safari。
              </p>
            )}
          </div>
        )}

        {phase === "recording" && (
          <div className="flex flex-col items-center gap-6">
            {/* Big countdown / status circle */}
            <div className="relative h-48 w-48 grid place-items-center">
              <svg
                aria-hidden="true"
                className="absolute inset-0 -rotate-90 drop-shadow-sm"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(20,35,40,0.08)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={inCountdown ? "var(--vermilion)" : "var(--success)"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 46}`}
                  strokeDashoffset={`${
                    inCountdown ? 2 * Math.PI * 46 * (1 - remainingCountdown / COUNTDOWN_SEC) : 0
                  }`}
                  style={{ transition: "stroke-dashoffset 50ms linear" }}
                />
              </svg>
              <div className="flex flex-col items-center gap-1">
                {inCountdown ? (
                  <>
                    <p className="text-5xl font-bold tabular text-vermilion">
                      {remainingCountdown.toFixed(1)}
                    </p>
                    <p className="text-xs text-fg-tertiary">秒，开口</p>
                  </>
                ) : (
                  <>
                    <Mic
                      className="h-12 w-12 text-success animate-pulse-record"
                      strokeWidth={1.5}
                    />
                    <p className="text-xs text-success">已开口</p>
                  </>
                )}
              </div>
            </div>

            {/* Live transcript */}
            <p lang="ja" className="font-jp text-fg text-xl min-h-[2rem] text-center max-w-lg">
              {transcript || (
                <span className="text-fg-tertiary">{firstWordSec === null ? "…" : ""}</span>
              )}
            </p>

            <Button variant="destructive" onClick={handleManualStop} disabled={!sttRef.current}>
              <MicOff className="h-4 w-4" />
              提前结束
            </Button>

            {errorMsg && (
              <p className="text-sm text-danger text-center" role="alert">
                {errorMsg}
              </p>
            )}
          </div>
        )}

        {phase === "submitted" && feedback && (
          <section className="space-y-6 animate-fade-in">
            <Card>
              <CardContent className="p-6 space-y-5">
                {/* Score breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <ScoreTile
                    label="流畅度"
                    value={feedback.fluency}
                    hint={
                      firstWordSec === null ? "未开口" : `${(firstWordSec / 1000).toFixed(1)}s 起步`
                    }
                    weight="60%"
                    highlight
                  />
                  <ScoreTile
                    label="准确度"
                    value={feedback.accuracy}
                    hint="字符匹配"
                    weight="40%"
                  />
                  <ScoreTile label="总分" value={feedback.total} hint=" " weight="100%" big />
                </div>

                <div className="space-y-1.5 pt-3 border-t border-border">
                  <p className="text-xs text-fg-tertiary">浏览器听到</p>
                  <p lang="ja" className="font-jp text-fg text-2xl">
                    {feedback.transcript || (
                      <span className="text-fg-tertiary">（没听到声音）</span>
                    )}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-fg-tertiary">原句</p>
                  <p className="font-jp-serif text-fg text-3xl font-medium">
                    <FuriganaText text={s.japanese} tokens={s.tokens} showRuby={true} />
                  </p>
                </div>

                {feedback.diffSegs.length > 0 && feedback.accuracy < 100 && feedback.transcript && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-fg-tertiary">差异</p>
                    <p lang="ja" className="font-jp text-base leading-relaxed">
                      {feedback.diffSegs.map((seg, i) => (
                        <DiffSpan key={`${seg.op}-${seg.user}-${seg.target}-${i}`} segment={seg} />
                      ))}
                    </p>
                  </div>
                )}

                <p className="text-xs text-fg-tertiary leading-relaxed">
                  <span className="text-vermilion">说错也比沉默强。</span>5 秒内开口=流畅满分。这是
                  Quick-Fire 的核心。
                </p>
              </CardContent>
            </Card>

            {!feedback.rated && (
              <Card>
                <CardContent className="p-5 space-y-4">
                  <p className="text-sm text-fg">这次自评：</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="secondary"
                      className="!border-success/40 hover:!border-success"
                      onClick={() => handleRate(5)}
                      disabled={isPending}
                    >
                      <Check className="h-4 w-4 text-success" />
                      脱口而出
                    </Button>
                    <Button
                      variant="secondary"
                      className="!border-warning/40 hover:!border-warning"
                      onClick={() => handleRate(3)}
                      disabled={isPending}
                    >
                      <Check className="h-4 w-4 text-warning" />
                      勉强说了
                    </Button>
                    <Button
                      variant="secondary"
                      className="!border-danger/40 hover:!border-danger"
                      onClick={() => handleRate(1)}
                      disabled={isPending}
                    >
                      <RotateCcw className="h-4 w-4 text-danger" />
                      说不出来
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {feedback.rated && (
              <div className="rounded-xl border border-border bg-surface px-5 py-3 flex items-center gap-3 animate-fade-in">
                <Zap className="h-4 w-4 text-vermilion" strokeWidth={1.75} />
                <p className="text-sm text-fg-secondary flex-1">
                  进度更新：<span className="text-fg">{feedback.ratingMessage}</span>
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
    </div>
  )
}

function ScoreTile({
  label,
  value,
  hint,
  weight,
  big,
  highlight,
}: {
  label: string
  value: number
  hint: string
  weight: string
  big?: boolean
  highlight?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className={cn("text-xs", highlight ? "text-vermilion" : "text-fg-tertiary")}>{label}</p>
      <p
        className={cn(
          "font-bold tabular leading-none",
          big ? "text-5xl" : "text-3xl",
          value >= 80 ? "text-success" : value >= 50 ? "text-warning" : "text-fg-secondary",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-fg-tertiary h-3">{hint}</p>
      <p className="text-[10px] text-fg-tertiary font-mono">{weight}</p>
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

function EmptyState() {
  return (
    <div className="px-6 py-24 max-w-2xl mx-auto text-center space-y-4">
      <p className="text-2xl font-semibold tracking-tight">Quick-Fire 全过关 ⚡</p>
      <p className="text-fg-secondary">明天回来继续。</p>
      <Button asChild variant="secondary">
        <a href="/">回 Dashboard</a>
      </Button>
    </div>
  )
}
