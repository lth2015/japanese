"use client"

import { ArrowRight, Check, Loader2, Mic, MicOff, Play, RotateCcw, Volume2 } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"
import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getNextReadAloudSentence,
  submitReadAloudAttempt,
} from "@/lib/actions/read-aloud"
import { applyRating as applyRatingAction } from "@/lib/actions/progress"
import { diff, type DiffSegment } from "@/lib/diff"
import type { Sentence } from "@/lib/db/schema"
import { stageLabel } from "@/lib/progress"
import {
  ensureVoicesLoaded,
  isSttSupported,
  speakJapanese,
  startJapaneseSTT,
  type SttListener,
} from "@/lib/speech"
import { cn } from "@/lib/utils"

type Next = { sentence: Sentence; isReview: boolean; isUnlocked: boolean } | null

type Phase = "idle" | "listening-tts" | "listening-stt" | "submitted"

interface Props {
  initial: Next
}

export function ReadAloudClient({ initial }: Props) {
  const [current, setCurrent] = useState<Next>(initial)
  const [phase, setPhase] = useState<Phase>("idle")
  const [transcript, setTranscript] = useState<string>("")
  const [feedback, setFeedback] = useState<{
    matchRatio: number
    diffSegs: DiffSegment[]
    rated: boolean
    ratingMessage?: string
  } | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [sttSupported, setSttSupported] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hideFurigana, setHideFurigana] = useState(false)
  const [isPending, startTransition] = useTransition()
  const sttRef = useRef<SttListener | null>(null)

  useEffect(() => {
    setSttSupported(isSttSupported())
    ensureVoicesLoaded()
  }, [])

  useEffect(() => {
    return () => {
      sttRef.current?.abort()
      if (typeof window !== "undefined") window.speechSynthesis.cancel()
    }
  }, [])

  if (!current) {
    return <EmptyState />
  }

  const s = current.sentence

  async function handlePlayTTS() {
    setErrorMsg(null)
    setPhase("listening-tts")
    try {
      await speakJapanese(s.japanese)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "TTS 播放失败")
    } finally {
      setPhase("idle")
    }
  }

  function handleStartRecord() {
    if (!sttSupported) {
      setErrorMsg("浏览器不支持语音识别。建议用 Chrome 或 Safari。")
      return
    }
    setErrorMsg(null)
    setTranscript("")
    setPhase("listening-stt")
    sttRef.current = startJapaneseSTT({
      onResult: (r) => {
        setTranscript(r.transcript)
      },
      onEnd: () => {
        startTransition(async () => {
          // Pull the latest transcript via setState callback; need to use a ref because
          // closure captures stale state. We use the already-set `transcript` via
          // setTranscript callback.
          setTranscript((tx) => {
            // Trigger submit asynchronously
            handleSubmit(tx)
            return tx
          })
        })
      },
      onError: (msg) => {
        setErrorMsg(`识别错误：${msg}`)
        setPhase("idle")
      },
    })
  }

  function handleStopRecord() {
    sttRef.current?.abort()
    sttRef.current = null
    setPhase("idle")
  }

  function handleSubmit(tx: string) {
    if (!tx.trim()) {
      setPhase("idle")
      return
    }
    startTransition(async () => {
      const res = await submitReadAloudAttempt(s.id, tx)
      setFeedback({
        matchRatio: res.matchRatio,
        diffSegs: diff(tx, s.japanese),
        rated: false,
      })
      setPhase("submitted")
    })
  }

  function handleRate(quality: 1 | 3 | 5) {
    startTransition(async () => {
      const res = await applyRatingAction(s.id, 25, quality)
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
    setTranscript("")
    setFeedback(null)
    setErrorMsg(null)
    setPhase("idle")
    startTransition(async () => {
      const next = await getNextReadAloudSentence(newCompleted)
      setCurrent(next)
    })
  }

  return (
    <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm lg:text-base text-fg-secondary">
          <Volume2 className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <span className="font-medium">Stage 2.5 · 音読</span>
          {current.isReview && <Badge variant="warning">复习</Badge>}
          {!current.isUnlocked && (
            <Badge variant="outline">先在 Drill 解锁到 Stage 2，效果更好</Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setHideFurigana((v) => !v)}
            className="text-sm text-fg-tertiary hover:text-fg transition-colors"
          >
            {hideFurigana ? "显示假名" : "隐藏假名"}
          </button>
          <span className="text-sm text-fg-tertiary tabular">本轮已完成 {completedIds.length}</span>
        </div>
      </header>

      {/* Sentence */}
      <section className="my-8 py-10 lg:py-14 border-y border-border text-center">
        <p className="font-jp-serif text-fg leading-[1.1] text-sentence font-medium">
          <FuriganaText text={s.japanese} tokens={s.tokens} showRuby={!hideFurigana} />
        </p>
        <p className="text-fg-secondary text-xl lg:text-2xl mt-10" lang="zh-CN">
          {s.chinese}
        </p>
      </section>

      {/* Controls */}
      <section className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={handlePlayTTS}
            disabled={phase === "listening-tts" || phase === "listening-stt"}
          >
            {phase === "listening-tts" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            播放标准发音
          </Button>

          {phase !== "listening-stt" ? (
            <Button
              size="lg"
              onClick={handleStartRecord}
              disabled={phase !== "idle" || !sttSupported}
              className={cn(
                "min-w-44",
                !sttSupported && "opacity-60",
              )}
            >
              <Mic className="h-4 w-4" />
              开始朗读
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={handleStopRecord}>
              <MicOff className="h-4 w-4 animate-pulse-record" />
              结束（正在听...）
            </Button>
          )}
        </div>

        {phase === "listening-stt" && (
          <p className="text-center text-sm text-fg-secondary">
            🎙 正在听... 朗读后浏览器会自动结束。
            {transcript && <span className="block font-jp text-fg mt-2">{transcript}</span>}
          </p>
        )}

        {errorMsg && (
          <p className="text-sm text-danger text-center" role="alert">
            {errorMsg}
          </p>
        )}

        {!sttSupported && (
          <p className="text-xs text-fg-tertiary text-center">
            你的浏览器不支持 Web Speech API。建议用 Chrome 或 macOS Safari。
          </p>
        )}
      </section>

      {/* Feedback */}
      {phase === "submitted" && feedback && (
        <section className="mt-10 space-y-6 animate-fade-in">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs text-fg-tertiary">浏览器识别到的</p>
                <p lang="ja" className="font-jp text-fg text-lg">
                  {transcript}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-fg-tertiary">原句</p>
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
                    匹配 {Math.round(feedback.matchRatio * 100)}%
                  </span>
                </div>
                <p className="font-jp-serif text-fg text-xl">
                  <FuriganaText text={s.japanese} tokens={s.tokens} showRuby={true} />
                </p>
              </div>

              {feedback.matchRatio < 1 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-fg-tertiary">差异</p>
                  <p lang="ja" className="font-jp text-base leading-relaxed">
                    {feedback.diffSegs.map((seg, i) => (
                      <DiffSpan key={i} segment={seg} />
                    ))}
                  </p>
                </div>
              )}

              <p className="text-xs text-fg-tertiary leading-relaxed">
                注：浏览器 STT 不完美，识别错≠你读错。**自评才是真实信号**——感觉自己读出来了就给"完美"。
              </p>
            </CardContent>
          </Card>

          {!feedback.rated && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="text-sm text-fg">这次自己感觉：</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    className="!border-success/40 hover:!border-success"
                    onClick={() => handleRate(5)}
                    disabled={isPending}
                  >
                    <Check className="h-4 w-4 text-success" />
                    顺畅
                  </Button>
                  <Button
                    variant="secondary"
                    className="!border-warning/40 hover:!border-warning"
                    onClick={() => handleRate(3)}
                    disabled={isPending}
                  >
                    <Check className="h-4 w-4 text-warning" />
                    勉强
                  </Button>
                  <Button
                    variant="secondary"
                    className="!border-danger/40 hover:!border-danger"
                    onClick={() => handleRate(1)}
                    disabled={isPending}
                  >
                    <RotateCcw className="h-4 w-4 text-danger" />
                    需要再练
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {feedback.rated && (
            <div className="rounded-xl border border-border bg-surface px-5 py-3 flex items-center gap-3 animate-fade-in">
              <Volume2 className="h-4 w-4 text-accent" strokeWidth={1.75} />
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
      <p className="text-2xl font-semibold tracking-tight">音読任务都做完了 🎤</p>
      <p className="text-fg-secondary">明天回来继续。或者去 Drill 解锁更多句子到 Stage 2。</p>
      <Button asChild variant="secondary">
        <a href="/">回 Dashboard</a>
      </Button>
    </div>
  )
}
