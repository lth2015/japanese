"use client"

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FuriganaText } from "@/components/furigana-text"
import { Button } from "@/components/ui/button"
import type { Sentence } from "@/lib/db/schema"
import { cn } from "@/lib/utils"
import {
  FONT_SIZE_CLASS,
  useDisplaySettings,
} from "@/store/display-settings"
import { DisplaySettingsSheet } from "./display-settings"

type Props = { sentences: Sentence[] }

export function DisplayTicker({ sentences }: Props) {
  const [settings] = useDisplaySettings()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showChrome, setShowChrome] = useState(true)
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Filter sentences by source
  const queue = useMemo(() => {
    if (settings.source === "all") return sentences
    return sentences.filter((s) => s.category === settings.source)
  }, [sentences, settings.source])

  const current = queue[index % Math.max(queue.length, 1)]

  // Autoplay
  useEffect(() => {
    if (paused || queue.length <= 1) return
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % queue.length)
    }, settings.intervalSec * 1000)
    return () => clearTimeout(timer)
  }, [paused, settings.intervalSec, queue.length, index])

  // Reset index if queue shrinks
  useEffect(() => {
    if (index >= queue.length) setIndex(0)
  }, [queue.length, index])

  // Wake lock — keep screen on
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const request = async () => {
      try {
        if ("wakeLock" in navigator) {
          // biome-ignore lint/suspicious/noExplicitAny: wakeLock typing
          lock = await (navigator as any).wakeLock.request("screen")
        }
      } catch {
        // user may deny; silent
      }
    }
    request()
    const onVisibility = () => {
      if (document.visibilityState === "visible") request()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      lock?.release().catch(() => {})
    }
  }, [])

  // Auto-hide chrome after inactivity
  const bumpChrome = useCallback(() => {
    if (settings.focusMode) {
      setShowChrome(false)
      return
    }
    setShowChrome(true)
    if (chromeTimer.current) clearTimeout(chromeTimer.current)
    chromeTimer.current = setTimeout(() => setShowChrome(false), 3000)
  }, [settings.focusMode])

  useEffect(() => {
    bumpChrome()
    return () => {
      if (chromeTimer.current) clearTimeout(chromeTimer.current)
    }
  }, [bumpChrome])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setIndex((i) => (i + 1) % queue.length)
        bumpChrome()
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => (i - 1 + queue.length) % queue.length)
        bumpChrome()
      } else if (e.code === "Space") {
        e.preventDefault()
        setPaused((p) => !p)
        bumpChrome()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [queue.length, bumpChrome])

  if (queue.length === 0) {
    return (
      <main className="fixed inset-0 grid place-items-center bg-bg-deep">
        <p className="text-text-secondary">这个分类还没有句子。换一个分类或添加几句。</p>
      </main>
    )
  }

  return (
    <main
      className="fixed inset-0 bg-bg-deep text-text-primary overflow-hidden"
      onMouseMove={bumpChrome}
      onTouchStart={bumpChrome}
    >
      {/* Top-right chrome: settings + exit */}
      <div
        className={cn(
          "absolute top-4 right-4 z-10 flex items-center gap-2 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <DisplaySettingsSheet />
        <Button asChild variant="ghost" size="sm" className="text-text-muted hover:text-text-primary">
          <a href="/">退出</a>
        </Button>
      </div>

      {/* Content */}
      <div className="h-full grid place-items-center px-8 lg:px-20">
        <div
          key={current.id}
          className="flex flex-col items-center gap-7 sm:gap-9 lg:gap-12 animate-fade-in text-center max-w-[88vw]"
        >
          <p
            className={cn(
              "font-jp-serif text-text-primary tracking-wide font-medium leading-[1.08]",
              FONT_SIZE_CLASS[settings.fontSize],
            )}
          >
            <FuriganaText
              text={current.japanese}
              tokens={current.tokens}
              showRuby={settings.showKana}
            />
          </p>
          {/* Fallback: kana line when tokens unavailable */}
          {settings.showKana && !current.tokens?.length && current.kana && (
            <p
              lang="ja"
              className="font-mono text-text-muted text-xl sm:text-2xl lg:text-3xl tracking-widest"
            >
              {current.kana}
            </p>
          )}
          {settings.showChinese && (
            <p
              lang="zh-CN"
              className="text-text-secondary text-xl sm:text-2xl lg:text-3xl tracking-wide"
            >
              {current.chinese}
            </p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={cn(
          "absolute bottom-6 inset-x-0 z-10 flex items-center justify-between px-6 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Progress dots */}
        <div className="hidden sm:flex items-center gap-1.5 max-w-[40vw] overflow-hidden">
          {queue.slice(0, 24).map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === index % queue.length ? "bg-text-primary" : "bg-text-muted/30",
              )}
            />
          ))}
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIndex((i) => (i - 1 + queue.length) % queue.length)}
            aria-label="上一句"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "播放" : "暂停"}
          >
            {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIndex((i) => (i + 1) % queue.length)}
            aria-label="下一句"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Counter */}
        <div className="hidden sm:block text-xs text-text-muted tabular">
          {(index % queue.length) + 1} / {queue.length}
        </div>
      </div>
    </main>
  )
}
