"use client"

import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Dialogue } from "@/lib/db/schema"
import { ensureVoicesLoaded, speakJapanese } from "@/lib/speech"
import { cn } from "@/lib/utils"
import { ChevronLeft, Loader2, Play, Square, Volume2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

interface Props {
  dialogue: Dialogue
}

const SCENARIO_LABEL: Record<string, string> = {
  "1on1": "1on1",
  meeting: "会议",
  slack: "Slack",
  email: "邮件",
  phone: "电话",
}

export function DialogueReader({ dialogue }: Props) {
  const [showFurigana, setShowFurigana] = useState(true)
  const [playingTurnIdx, setPlayingTurnIdx] = useState<number | null>(null)
  const [playingAll, setPlayingAll] = useState(false)
  const abortRef = useRef(false)

  useEffect(() => {
    ensureVoicesLoaded()
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel()
    }
  }, [])

  async function playTurn(idx: number) {
    const turn = dialogue.turns[idx]
    if (!turn) return
    setPlayingTurnIdx(idx)
    try {
      await speakJapanese(turn.japanese, { rate: 0.95 })
    } catch {
      // ignore
    } finally {
      setPlayingTurnIdx((cur) => (cur === idx ? null : cur))
    }
  }

  async function playAll() {
    abortRef.current = false
    setPlayingAll(true)
    for (let i = 0; i < dialogue.turns.length; i++) {
      if (abortRef.current) break
      setPlayingTurnIdx(i)
      try {
        await speakJapanese(dialogue.turns[i].japanese, { rate: 0.95 })
      } catch {
        // continue to next
      }
      if (abortRef.current) break
      // brief pause between turns to feel like real conversation
      await new Promise((r) => setTimeout(r, 400))
    }
    setPlayingTurnIdx(null)
    setPlayingAll(false)
  }

  function stopAll() {
    abortRef.current = true
    if (typeof window !== "undefined") window.speechSynthesis.cancel()
    setPlayingTurnIdx(null)
    setPlayingAll(false)
  }

  return (
    <div className="page-container mx-auto max-w-4xl space-y-8">
      <div className="panel-solid rounded-lg p-5 sm:p-7">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/dialogues">
            <ChevronLeft className="h-4 w-4" />
            返回对话列表
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-jp-serif text-2xl font-medium text-fg" lang="ja">
            {dialogue.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Badge>{SCENARIO_LABEL[dialogue.scenario] ?? dialogue.scenario}</Badge>
            {dialogue.register && <Badge variant="outline">{dialogue.register}</Badge>}
          </div>
        </div>
        {dialogue.description && (
          <p className="text-sm text-fg-secondary mt-2" lang="zh-CN">
            {dialogue.description}
          </p>
        )}
      </div>

      <div className="panel flex items-center gap-2 rounded-lg p-2">
        {playingAll ? (
          <Button variant="secondary" size="sm" onClick={stopAll}>
            <Square className="h-4 w-4" />
            停止
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={playAll}>
            <Play className="h-4 w-4" />
            朗读全段
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowFurigana((v) => !v)}>
          <Volume2 className="h-4 w-4" />
          {showFurigana ? "隐藏" : "显示"}假名
        </Button>
      </div>

      <div className="space-y-4">
        {dialogue.turns.map((turn, i) => {
          const isCurrent = playingTurnIdx === i
          return (
            <Card
              key={`${turn.speaker}-${turn.japanese}`}
              className={cn(
                "transition-[box-shadow,border-color]",
                isCurrent && "border-accent ring-2 ring-accent/20 shadow-sm",
              )}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={i % 2 === 0 ? "accent" : "outline"}>{turn.speaker}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playTurn(i)}
                    disabled={playingAll || (isCurrent && !playingAll)}
                    aria-label="朗读此句"
                  >
                    {isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p lang="ja" className="font-jp-serif text-fg text-xl leading-relaxed">
                  <FuriganaText text={turn.japanese} tokens={turn.tokens} showRuby={showFurigana} />
                </p>
                <p className="text-sm text-fg-secondary" lang="zh-CN">
                  {turn.chinese}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
